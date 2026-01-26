"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { isValidDeliveryDate } from "@/lib/deliveryScheduling";
import type { DeliveryOption, FulfillmentType } from "./types";
import {
	validatePhoneNumber,
	validateGCashReference,
	validateMessage,
	validateDeliveryOptions,
	MESSAGE_MAX_LENGTH,
} from "./types";

// Order data structure matching the checkout form
type FlowerFestOrderInput = {
	eventId: string;

	// Sender (buyer) info
	sender: {
		name: string;
		contactNumber: string;
	};

	// Recipient info
	recipient: {
		name: string;
		contactNumber?: string;
	};

	// Fulfillment
	fulfillment: {
		type: FulfillmentType;
		deliveryOptions?: DeliveryOption[];
		preferredOption?: 1 | 2 | 3;
	};

	// Message card
	messageCard: {
		message: string;
		isAnonymous: boolean;
		includeSenderName: boolean;
	};

	// Payment
	payment: {
		receiptUrl: string;
		gcashReferenceNumber: string;
		amount: number;
	};

	// Optional
	specialInstructions?: string;

	// Delivery scheduling (for delivery orders)
	deliveryDate?: Date;
};

export async function createFlowerFestOrder(data: FlowerFestOrderInput) {
	try {
		// Auth check
		const session = await auth.api.getSession({
			headers: await headers(),
		});
		if (!session?.user) {
			return { success: false, message: "Not authenticated" };
		}

		// Get event for validation
		const event = await prisma.shopEvent.findUnique({
			where: { id: data.eventId },
		});

		if (!event) {
			return { success: false, message: "Event not found" };
		}

		// Check if event is active
		const now = new Date();
		if (now < event.startDate || now > event.endDate || !event.isActive) {
			return { success: false, message: "Event is not currently active" };
		}

		// Check if shop is closed
		if (event.isShopClosed) {
			return {
				success: false,
				message: event.closureMessage || "Event shop is currently closed",
			};
		}

		// Validate sender info
		if (!data.sender.name?.trim()) {
			return { success: false, message: "Please enter your name" };
		}
		if (!validatePhoneNumber(data.sender.contactNumber)) {
			return {
				success: false,
				message: "Please enter a valid Philippine mobile number (09XX XXX XXXX)",
			};
		}

		// Validate recipient info
		if (!data.recipient.name?.trim()) {
			return { success: false, message: "Please enter recipient name" };
		}

		// Validate fulfillment
		if (data.fulfillment.type === "delivery") {
			if (!data.fulfillment.deliveryOptions) {
				return { success: false, message: "Please provide delivery options" };
			}
			const deliveryValidation = validateDeliveryOptions(data.fulfillment.deliveryOptions);
			if (!deliveryValidation.valid) {
				return { success: false, message: deliveryValidation.error };
			}

			// Validate delivery date for delivery orders
			if (data.deliveryDate) {
				const dateValidation = isValidDeliveryDate(data.deliveryDate, event);
				if (!dateValidation.valid) {
					return { success: false, message: dateValidation.error };
				}
			}
		}

		// Validate message card
		if (data.messageCard.message && !validateMessage(data.messageCard.message)) {
			return {
				success: false,
				message: `Message must be ${MESSAGE_MAX_LENGTH} characters or less`,
			};
		}

		// Validate payment
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

		// Check for duplicate reference number
		const existingOrder = await prisma.order.findFirst({
			where: {
				gcashReferenceNumber: refNumberClean,
			},
		});

		if (existingOrder) {
			return {
				success: false,
				message: `This GCash reference number was already used for Order #${existingOrder.id}`,
			};
		}

		// Get user's cart items
		const cartItems = await prisma.cartItem.findMany({
			where: { userId: session.user.id },
			include: {
				product: true,
				package: {
					include: {
						items: { include: { product: true } },
						pools: { include: { options: { include: { product: true } } } },
					},
				},
			},
		});

		if (cartItems.length === 0) {
			return { success: false, message: "Cart is empty" };
		}

		// Check stock availability for all items
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

		// Calculate total
		const totalAmount = cartItems.reduce((sum, item) => {
			const price = item.product?.price || item.package?.price || 0;
			return sum + price * item.quantity;
		}, 0);

		// Use transaction to ensure stock decrement and order creation are atomic
		const order = await prisma.$transaction(async (tx) => {
			// Decrement stock for all products
			for (const item of cartItems) {
				if (item.product && item.product.stock !== null) {
					await tx.product.update({
						where: { id: item.product.id },
						data: {
							stock: {
								decrement: item.quantity,
							},
						},
					});
				}
			}

			// Build delivery time slot string from preferred option
			let deliveryTimeSlot: string | null = null;
			if (
				data.fulfillment.type === "delivery" &&
				data.fulfillment.deliveryOptions &&
				data.fulfillment.preferredOption
			) {
				const preferredIdx = data.fulfillment.preferredOption - 1;
				const preferred = data.fulfillment.deliveryOptions[preferredIdx];
				if (preferred) {
					deliveryTimeSlot = preferred.timeSlot;
				}
			}

			// Create order
			const newOrder = await tx.order.create({
				data: {
					userId: session.user.id,
					eventId: data.eventId,
					totalAmount,
					status: "pending",
					receiptImageUrl: data.payment.receiptUrl,
					gcashReferenceNumber: refNumberClean,

					// Delivery scheduling
					deliveryDate: data.deliveryDate || null,
					deliveryTimeSlot,
					deliveryNotes: data.specialInstructions || null,

					// Custom event data (stored as JSON for Google Sheets sync)
					eventData: {
						// Sender info
						senderName: data.sender.name,
						senderPhone: data.sender.contactNumber,

						// Recipient info
						recipientName: data.recipient.name,
						recipientPhone: data.recipient.contactNumber || null,

						// Fulfillment details
						fulfillmentType: data.fulfillment.type,
						deliveryOptions:
							data.fulfillment.type === "delivery" ? data.fulfillment.deliveryOptions : null,
						preferredOption:
							data.fulfillment.type === "delivery" ? data.fulfillment.preferredOption : null,

						// Card message
						cardMessage: data.messageCard.message,
						isAnonymous: data.messageCard.isAnonymous,
						includeSenderName: data.messageCard.includeSenderName,

						// Additional notes
						specialInstructions: data.specialInstructions || null,

						// Payment amount for reference
						paymentAmount: data.payment.amount,
					},

					// Order items
					orderItems: {
						create: cartItems.map((item) => ({
							productId: item.productId,
							packageId: item.packageId,
							quantity: item.quantity,
							price: item.product?.price || item.package?.price || 0,
							size: item.size,
							packageSelections: item.packageSelections ?? undefined,
						})),
					},
				},
			});

			return newOrder;
		});

		// Create analytics record (outside transaction is fine)
		await prisma.shopPurchase.create({
			data: {
				orderId: order.id,
				eventId: data.eventId,
				totalAmount,
				itemCount: cartItems.reduce((sum, item) => sum + item.quantity, 0),
			},
		});

		// Clear cart
		await prisma.cartItem.deleteMany({
			where: { userId: session.user.id },
		});

		return { success: true, orderId: order.id };
	} catch (error) {
		console.error("Flower Fest order creation error:", error);
		return {
			success: false,
			message: "Failed to create order. Please try again.",
		};
	}
}

/**
 * Get stock status for a product
 */
export async function getProductStock(productId: string) {
	const product = await prisma.product.findUnique({
		where: { id: productId },
		select: { stock: true, name: true },
	});

	if (!product) {
		return { success: false, message: "Product not found" };
	}

	return {
		success: true,
		stock: product.stock,
		available: product.stock === null || product.stock > 0,
	};
}
