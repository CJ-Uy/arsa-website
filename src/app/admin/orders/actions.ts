"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user, order, shopEvent, shopPurchase } from "@/db/schema";

async function checkShopAdmin() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) throw new Error("Unauthorized");

	const u = await db.query.user.findFirst({
		where: eq(user.id, session.user.id),
		columns: { isShopAdmin: true },
	});
	if (!u?.isShopAdmin) throw new Error("Forbidden: Shop admin access required");
	return session;
}

const updateEventDataSchema = z.object({
	orderId: z.string().min(1, "Order ID is required"),
	eventData: z
		.string()
		.transform((str, ctx) => {
			if (str.trim() === "") return null;
			try {
				const parsed = JSON.parse(str);
				if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
					ctx.addIssue({
						code: z.ZodIssueCode.custom,
						message: "Event data must be a valid JSON object or null",
					});
					return z.NEVER;
				}
				return parsed;
			} catch {
				ctx.addIssue({
					code: z.ZodIssueCode.custom,
					message: "Invalid JSON format for event data",
				});
				return z.NEVER;
			}
		})
		.nullable(),
});

export async function updateEventData(formData: FormData) {
	try {
		await checkShopAdmin();

		const rawEventData = formData.get("eventData");
		const validatedFields = updateEventDataSchema.safeParse({
			orderId: formData.get("orderId"),
			eventData: rawEventData === null ? "" : String(rawEventData),
		});

		if (!validatedFields.success) {
			const errors = validatedFields.error.flatten().fieldErrors;
			return {
				success: false,
				message: errors.eventData?.join(", ") || errors.orderId?.join(", ") || "Invalid input",
			};
		}

		const { orderId, eventData } = validatedFields.data;
		await db.update(order).set({ eventData }).where(eq(order.id, orderId));

		revalidatePath("/admin/orders");
		return { success: true };
	} catch (error: any) {
		console.error("Error updating event data:", error);
		return { success: false, message: error.message || "Failed to update event data" };
	}
}

function formatComplexValue(value: any): string {
	if (Array.isArray(value)) {
		return value
			.map((item) => {
				if (typeof item === "object" && item !== null) return Object.values(item).join(" ");
				return String(item);
			})
			.join(", ");
	} else if (typeof value === "object" && value !== null) {
		return Object.values(value).join(", ");
	}
	return String(value);
}

function parseCheckoutConfig(
	checkoutConfig: any,
): Map<string, { label: string; type: string; columns?: any[] }> {
	const fieldMap = new Map();
	if (!checkoutConfig?.additionalFields) return fieldMap;
	checkoutConfig.additionalFields.forEach((field: any) => {
		fieldMap.set(field.label, {
			label: field.label,
			type: field.type,
			columns: field.columns,
		});
	});
	return fieldMap;
}

export async function updateOrderStatus(orderId: string, status: string) {
	try {
		await checkShopAdmin();
		await db.update(order).set({ status }).where(eq(order.id, orderId));
		revalidatePath("/admin/orders");
		return { success: true };
	} catch (error: any) {
		return { success: false, message: error.message || "Failed to update order" };
	}
}

export async function deleteOrder(orderId: string) {
	try {
		await checkShopAdmin();
		await db.delete(shopPurchase).where(eq(shopPurchase.orderId, orderId));
		await db.delete(order).where(eq(order.id, orderId));
		revalidatePath("/admin/orders");
		return { success: true };
	} catch (error: any) {
		return { success: false, message: error.message || "Failed to delete order" };
	}
}

export async function toggleConfirmationEmailSent(orderId: string, sent: boolean) {
	try {
		await checkShopAdmin();
		await db
			.update(order)
			.set({ confirmationEmailSent: sent })
			.where(eq(order.id, orderId));
		revalidatePath("/admin/orders");
		return { success: true };
	} catch (error: any) {
		return { success: false, message: error.message || "Failed to update email status" };
	}
}

export async function exportOrdersData(eventId?: string) {
	try {
		await checkShopAdmin();

		const orders = await db.query.order.findMany({
			where: eventId ? eq(order.eventId, eventId) : undefined,
			with: {
				user: {
					columns: {
						id: true,
						name: true,
						email: true,
						studentId: true,
						firstName: true,
						lastName: true,
					},
				},
				event: {
					columns: { id: true, name: true, checkoutConfig: true },
					with: {
						products: {
							columns: { productId: true, packageId: true, categoryId: true },
							with: { category: { columns: { name: true } } },
						},
					},
				},
				orderItems: {
					with: {
						product: { columns: { name: true, description: true } },
						package: { columns: { name: true, description: true } },
					},
				},
			},
			orderBy: [desc(order.createdAt)],
		});

		const exportData = orders.flatMap((o) =>
			o.orderItems.map((item, index) => {
				const ep = o.event?.products?.find(
					(p) =>
						(item.productId && p.productId === item.productId) ||
						(item.packageId && p.packageId === item.packageId),
				);
				const categoryName = ep?.category?.name || "N/A";

				const baseData: Record<string, any> = {
					"Order ID": o.id,
					"Order Date": new Date(o.createdAt).toLocaleString("en-US", { timeZone: "Asia/Manila" }),
					"Customer Name": o.user.name || "N/A",
					"First Name": o.user.firstName || "N/A",
					"Last Name": o.user.lastName || "N/A",
					"Customer Email": o.user.email,
					"Student ID": o.user.studentId || "N/A",
					"Product Name": item.product?.name || item.package?.name || "Unknown",
					"Product Description":
						item.product?.description || item.package?.description || "",
					Category: categoryName,
					Size: item.size || "N/A",
					Quantity: item.quantity,
					"Purchase Code": item.purchaseCode || "N/A",
					"Unit Price": item.price,
					"Item Total": item.price * item.quantity,
					"Order Total": index === 0 ? o.totalAmount : "",
					"Order Status": o.status,
					"GCash Ref No": o.gcashReferenceNumber || "N/A",
					Notes: o.notes || "",
					"Delivery Date": o.deliveryDate || "N/A",
					"Delivery Time": o.deliveryTimeSlot || "N/A",
					Event: o.event?.name || "N/A",
					"Receipt URL": o.receiptImageUrl || "",
				};

				if (o.eventData && o.event?.checkoutConfig) {
					const fieldMap = parseCheckoutConfig(o.event.checkoutConfig);
					const eventDataWrapper = o.eventData as any;
					const eventData = eventDataWrapper.fields || eventDataWrapper;

					Object.keys(eventData).forEach((key) => {
						if (key === "eventName") return;
						const fieldDef = fieldMap.get(key);
						const value = eventData[key];
						if (!fieldDef) return;

						if (fieldDef.type === "repeater" && Array.isArray(value)) {
							value.forEach((repItem, i) => {
								if (typeof repItem === "object" && repItem !== null && fieldDef.columns) {
									fieldDef.columns.forEach((column: any) => {
										const colName = `${column.label} ${i + 1}`;
										const subValue = repItem[column.id];
										baseData[colName] = subValue || "N/A";
									});
								}
							});
						} else if (fieldDef.type !== "message") {
							if (value === null || value === undefined) {
								baseData[fieldDef.label] = "N/A";
							} else if (typeof value === "object") {
								baseData[fieldDef.label] = formatComplexValue(value);
							} else {
								baseData[fieldDef.label] = value;
							}
						}
					});
				}

				return baseData;
			}),
		);

		return { success: true, data: exportData };
	} catch (error: any) {
		console.error("Error exporting orders:", error);
		return { success: false, message: error.message || "Failed to export orders" };
	}
}

export async function getEventsForExport() {
	try {
		await checkShopAdmin();
		const events = await db.query.shopEvent.findMany({
			columns: { id: true, name: true, slug: true },
			orderBy: [desc(shopEvent.createdAt)],
		});
		return { success: true, data: events };
	} catch (error: any) {
		return { success: false, message: error.message || "Failed to fetch events" };
	}
}

export async function sendOrderConfirmationEmailAction(orderId: string) {
	try {
		await checkShopAdmin();
		const { sendOrderConfirmationEmail } = await import("@/lib/email");

		const o = await db.query.order.findFirst({
			where: eq(order.id, orderId),
			with: {
				user: {
					columns: { name: true, email: true, firstName: true, lastName: true },
				},
				event: { columns: { name: true } },
				orderItems: {
					with: {
						product: { columns: { name: true } },
						package: { columns: { name: true } },
					},
				},
			},
		});

		if (!o) return { success: false, message: "Order not found" };
		if (!o.user.email) return { success: false, message: "Customer email not available" };

		const items = o.orderItems.map((item) => ({
			name: item.product?.name || item.package?.name || "Unknown Item",
			size: item.size,
			quantity: item.quantity,
			price: item.price,
			purchaseCode: item.purchaseCode,
		}));

		const customerName =
			o.user.firstName && o.user.lastName
				? `${o.user.firstName} ${o.user.lastName}`
				: o.user.name || "Valued Customer";

		const result = await sendOrderConfirmationEmail({
			orderId: o.id,
			customerName,
			customerEmail: o.user.email,
			items,
			totalAmount: o.totalAmount,
			eventName: o.event?.name,
			orderDate: o.createdAt,
			eventData: o.eventData as any,
		});

		if (result.success) {
			await db
				.update(order)
				.set({ confirmationEmailSent: true })
				.where(eq(order.id, orderId));
			revalidatePath("/admin/orders");
		}

		return result;
	} catch (error: any) {
		console.error("Error sending confirmation email:", error);
		return { success: false, message: error.message || "Failed to send confirmation email" };
	}
}
