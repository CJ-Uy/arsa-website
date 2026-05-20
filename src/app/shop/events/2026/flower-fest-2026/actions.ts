"use server";

import { headers } from "next/headers";
import { eq, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
	cartItem,
	order,
	orderItem,
	product as productTable,
	shopEvent,
	shopPurchase,
} from "@/db/schema";
import { isValidDeliveryDate } from "@/lib/deliveryScheduling";
import type { DeliveryOption, FulfillmentType } from "./types";
import {
	validatePhoneNumber,
	validateGCashReference,
	validateMessage,
	validateDeliveryOptions,
	MESSAGE_MAX_LENGTH,
} from "./types";

type FlowerFestOrderInput = {
	eventId: string;
	sender: { name: string; contactNumber: string };
	recipient: { name: string; contactNumber?: string };
	fulfillment: {
		type: FulfillmentType;
		deliveryOptions?: DeliveryOption[];
		preferredOption?: 1 | 2 | 3;
	};
	messageCard: {
		message: string;
		isAnonymous: boolean;
		includeSenderName: boolean;
	};
	payment: {
		receiptUrl: string;
		gcashReferenceNumber: string;
		amount: number;
	};
	specialInstructions?: string;
	deliveryDate?: Date;
};

export async function createFlowerFestOrder(data: FlowerFestOrderInput) {
	try {
		const session = await auth.api.getSession({ headers: await headers() });
		if (!session?.user) return { success: false, message: "Not authenticated" };

		const event = await db.query.shopEvent.findFirst({
			where: eq(shopEvent.id, data.eventId),
		});
		if (!event) return { success: false, message: "Event not found" };

		const now = new Date();
		if (now < event.startDate || now > event.endDate || !event.isActive) {
			return { success: false, message: "Event is not currently active" };
		}

		if (event.isShopClosed) {
			return {
				success: false,
				message: event.closureMessage || "Event shop is currently closed",
			};
		}

		if (!data.sender.name?.trim()) {
			return { success: false, message: "Please enter your name" };
		}
		if (!validatePhoneNumber(data.sender.contactNumber)) {
			return {
				success: false,
				message: "Please enter a valid Philippine mobile number (09XX XXX XXXX)",
			};
		}

		if (!data.recipient.name?.trim()) {
			return { success: false, message: "Please enter recipient name" };
		}

		if (data.fulfillment.type === "delivery") {
			if (!data.fulfillment.deliveryOptions) {
				return { success: false, message: "Please provide delivery options" };
			}
			const deliveryValidation = validateDeliveryOptions(data.fulfillment.deliveryOptions);
			if (!deliveryValidation.valid) {
				return { success: false, message: deliveryValidation.error };
			}

			if (data.deliveryDate) {
				const dateValidation = isValidDeliveryDate(data.deliveryDate, event);
				if (!dateValidation.valid) {
					return { success: false, message: dateValidation.error };
				}
			}
		}

		if (data.messageCard.message && !validateMessage(data.messageCard.message)) {
			return {
				success: false,
				message: `Message must be ${MESSAGE_MAX_LENGTH} characters or less`,
			};
		}

		if (!data.payment.receiptUrl) {
			return { success: false, message: "Please upload your GCash receipt" };
		}

		const refNumberClean = data.payment.gcashReferenceNumber.replace(/\D/g, "");
		if (!validateGCashReference(refNumberClean)) {
			return {
				success: false,
				message: "Please enter a valid 13-digit GCash reference number",
			};
		}

		const existingOrder = await db.query.order.findFirst({
			where: eq(order.gcashReferenceNumber, refNumberClean),
		});
		if (existingOrder) {
			return {
				success: false,
				message: `This GCash reference number was already used for Order #${existingOrder.id}`,
			};
		}

		const cartItems = await db.query.cartItem.findMany({
			where: eq(cartItem.userId, session.user.id),
			with: {
				product: true,
				package: {
					with: {
						items: { with: { product: true } },
						pools: { with: { options: { with: { product: true } } } },
					},
				},
			},
		});

		if (cartItems.length === 0) return { success: false, message: "Cart is empty" };

		for (const item of cartItems) {
			if (item.product) {
				if (item.product.stock !== null && item.product.stock < item.quantity) {
					return {
						success: false,
						message: `Sorry, "${item.product.name}" only has ${item.product.stock} items left in stock`,
					};
				}
			}
		}

		const totalAmount = cartItems.reduce((sum, item) => {
			const price = item.product?.price || item.package?.price || 0;
			return sum + price * item.quantity;
		}, 0);

		// Build delivery time slot
		let deliveryTimeSlot: string | null = null;
		if (
			data.fulfillment.type === "delivery" &&
			data.fulfillment.deliveryOptions &&
			data.fulfillment.preferredOption
		) {
			const preferredIdx = data.fulfillment.preferredOption - 1;
			const preferred = data.fulfillment.deliveryOptions[preferredIdx];
			if (preferred) deliveryTimeSlot = preferred.timeSlot;
		}

		// Atomic-ish: SQLite via D1 doesn't support nested updates inside a single statement.
		// Decrement stocks first, then create order; D1's local transaction model serializes these.
		const createdOrder = await db.transaction(async (tx) => {
			for (const item of cartItems) {
				if (item.product && item.product.stock !== null) {
					await tx
						.update(productTable)
						.set({ stock: sql`${productTable.stock} - ${item.quantity}` })
						.where(eq(productTable.id, item.product.id));
				}
			}

			const orderRows = await tx
				.insert(order)
				.values({
					userId: session.user.id,
					eventId: data.eventId,
					totalAmount,
					status: "pending",
					receiptImageUrl: data.payment.receiptUrl,
					gcashReferenceNumber: refNumberClean,
					deliveryDate: data.deliveryDate || null,
					deliveryTimeSlot,
					deliveryNotes: data.specialInstructions || null,
					eventData: {
						senderName: data.sender.name,
						senderPhone: data.sender.contactNumber,
						recipientName: data.recipient.name,
						recipientPhone: data.recipient.contactNumber || null,
						fulfillmentType: data.fulfillment.type,
						deliveryOptions:
							data.fulfillment.type === "delivery" ? data.fulfillment.deliveryOptions : null,
						preferredOption:
							data.fulfillment.type === "delivery" ? data.fulfillment.preferredOption : null,
						cardMessage: data.messageCard.message,
						isAnonymous: data.messageCard.isAnonymous,
						includeSenderName: data.messageCard.includeSenderName,
						specialInstructions: data.specialInstructions || null,
						paymentAmount: data.payment.amount,
					},
				})
				.returning();

			const newOrder = orderRows[0];

			if (cartItems.length > 0) {
				await tx.insert(orderItem).values(
					cartItems.map((item) => ({
						orderId: newOrder.id,
						productId: item.productId,
						packageId: item.packageId,
						quantity: item.quantity,
						price: item.product?.price || item.package?.price || 0,
						size: item.size,
						packageSelections: item.packageSelections ?? null,
					})),
				);
			}

			return newOrder;
		});

		await db.insert(shopPurchase).values({
			orderId: createdOrder.id,
			eventId: data.eventId,
			totalAmount,
			itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
		});

		await db.delete(cartItem).where(eq(cartItem.userId, session.user.id));

		return { success: true, orderId: createdOrder.id };
	} catch (error) {
		console.error("Flower Fest order creation error:", error);
		return { success: false, message: "Failed to create order. Please try again." };
	}
}

export async function getProductStock(productId: string) {
	const p = await db.query.product.findFirst({
		where: eq(productTable.id, productId),
		columns: { stock: true, name: true },
	});

	if (!p) return { success: false, message: "Product not found" };

	return {
		success: true,
		stock: p.stock,
		available: p.stock === null || p.stock > 0,
	};
}
