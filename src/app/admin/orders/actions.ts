"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod"; // Add this import

async function checkShopAdmin() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		throw new Error("Unauthorized");
	}

	const user = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: { isShopAdmin: true },
	});

	if (!user?.isShopAdmin) {
		throw new Error("Forbidden: Shop admin access required");
	}

	return session;
}

const updateEventDataSchema = z.object({
	orderId: z.string().min(1, "Order ID is required"),
	eventData: z
		.string()
		.transform((str, ctx) => {
			if (str.trim() === "") return null; // Treat empty string as null
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
			} catch (e) {
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

		// Validate raw input string (can be empty string, which our transform handles as null)
		const validatedFields = updateEventDataSchema.safeParse({
			orderId: formData.get("orderId"),
			eventData: rawEventData === null ? "" : String(rawEventData), // Convert null to empty string for consistent parsing
		});

		if (!validatedFields.success) {
			const errors = validatedFields.error.flatten().fieldErrors;
			return {
				success: false,
				message: errors.eventData?.join(", ") || errors.orderId?.join(", ") || "Invalid input",
			};
		}

		const { orderId, eventData } = validatedFields.data;

		await prisma.order.update({
			where: { id: orderId },
			data: { eventData },
		});

		revalidatePath("/admin/orders");
		return { success: true };
	} catch (error: any) {
		console.error("Error updating event data:", error);
		return { success: false, message: error.message || "Failed to update event data" };
	}
}

/**
 * Format complex values (arrays, objects) into human-readable strings
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatComplexValue(value: any): string {
	if (Array.isArray(value)) {
		// Format arrays as comma-separated values
		return value
			.map((item) => {
				if (typeof item === "object" && item !== null) {
					// For objects in array, join all values with spaces
					return Object.values(item).join(" ");
				}
				return String(item);
			})
			.join(", ");
	} else if (typeof value === "object" && value !== null) {
		// Format objects as comma-separated values
		return Object.values(value).join(", ");
	}
	return String(value);
}

/**
 * Parse checkout config to get field definitions with proper labels
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseCheckoutConfig(
	checkoutConfig: any,
): Map<string, { label: string; type: string; columns?: any[] }> {
	const fieldMap = new Map();

	if (!checkoutConfig?.additionalFields) return fieldMap;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	checkoutConfig.additionalFields.forEach((field: any) => {
		// Use the field label as the key (that's what's stored in order.eventData.fields)
		fieldMap.set(field.label, {
			label: field.label,
			type: field.type,
			columns: field.columns, // For repeater fields
		});
	});

	return fieldMap;
}

export async function updateOrderStatus(orderId: string, status: string) {
	try {
		await checkShopAdmin();

		await prisma.order.update({
			where: { id: orderId },
			data: { status },
		});

		revalidatePath("/admin/orders");
		return { success: true };
	} catch (error: any) {
		return { success: false, message: error.message || "Failed to update order" };
	}
}

export async function deleteOrder(orderId: string) {
	try {
		await checkShopAdmin();

		// Delete associated ShopPurchase record
		await prisma.shopPurchase.deleteMany({
			where: { orderId: orderId },
		});

		await prisma.order.delete({
			where: { id: orderId },
		});

		revalidatePath("/admin/orders");
		return { success: true };
	} catch (error: any) {
		return { success: false, message: error.message || "Failed to delete order" };
	}
}

export async function toggleConfirmationEmailSent(orderId: string, sent: boolean) {
	try {
		await checkShopAdmin();

		await prisma.order.update({
			where: { id: orderId },
			data: { confirmationEmailSent: sent },
		});

		revalidatePath("/admin/orders");
		return { success: true };
	} catch (error: any) {
		return { success: false, message: error.message || "Failed to update email status" };
	}
}

export async function exportOrdersData(eventId?: string) {
	try {
		await checkShopAdmin();

		const orders = await prisma.order.findMany({
			where: eventId ? { eventId } : undefined,
			include: {
				user: {
					select: {
						id: true,
						name: true,
						email: true,
						studentId: true,
						firstName: true,
						lastName: true,
					},
				},
				event: {
					select: {
						id: true,
						name: true,
						checkoutConfig: true,
						products: {
							select: {
								productId: true,
								packageId: true,
								categoryId: true,
								category: {
									select: {
										name: true,
									},
								},
							},
						},
					},
				},
				orderItems: {
					include: {
						product: {
							select: {
								name: true,
								description: true,
							},
						},
						package: {
							select: {
								name: true,
								description: true,
							},
						},
					},
				},
			},
			orderBy: { createdAt: "desc" },
		});

		// Transform data for export - include ALL event data with proper column expansion
		const exportData = orders.flatMap((order) =>
			order.orderItems.map((item, index) => {
				// Look up category from event products
				const eventProduct = order.event?.products?.find(
					(ep) =>
						(item.productId && ep.productId === item.productId) ||
						(item.packageId && ep.packageId === item.packageId),
				);
				const categoryName = eventProduct?.category?.name || "N/A";

				const baseData: Record<string, any> = {
					"Order ID": order.id,
					"Order Date": new Date(order.createdAt).toLocaleString("en-US", {
						timeZone: "Asia/Manila",
					}),
					"Customer Name": order.user.name || "N/A",
					"First Name": order.user.firstName || "N/A",
					"Last Name": order.user.lastName || "N/A",
					"Customer Email": order.user.email,
					"Student ID": order.user.studentId || "N/A",
					"Product Name": item.product?.name || item.package?.name || "Unknown",
					"Product Description": item.product?.description || item.package?.description || "",
					Category: categoryName,
					Size: item.size || "N/A",
					Quantity: item.quantity,
					"Purchase Code": item.purchaseCode || "N/A",
					"Unit Price": item.price,
					"Item Total": item.price * item.quantity,
					// Only show order total on first item
					"Order Total": index === 0 ? order.totalAmount : "",
					"Order Status": order.status,
					// Copy GCash ref and claiming details to all rows for complete info per item
					"GCash Ref No": order.gcashReferenceNumber || "N/A",
					Notes: order.notes || "",
					"Delivery Date": order.deliveryDate || "N/A",
					"Delivery Time": order.deliveryTimeSlot || "N/A",
					Event: order.event?.name || "N/A",
					"Receipt URL": order.receiptImageUrl || "",
				};

				// Add event-specific custom field data to all rows for complete info per item
				// Parse checkout config to properly expand repeater fields
				if (order.eventData && order.event?.checkoutConfig) {
					const fieldMap = parseCheckoutConfig(order.event.checkoutConfig);
					const eventDataWrapper = order.eventData as any;
					const eventData = eventDataWrapper.fields || eventDataWrapper; // Handle both .fields and direct structure

					Object.keys(eventData).forEach((key) => {
						// Skip eventName or other metadata fields
						if (key === "eventName") return;

						const fieldDef = fieldMap.get(key);
						const value = eventData[key];

						if (!fieldDef) {
							// Unknown field, skip
							return;
						}

						if (fieldDef.type === "repeater" && Array.isArray(value)) {
							// Expand repeater into numbered columns like Google Forms
							value.forEach((item, i) => {
								if (typeof item === "object" && item !== null && fieldDef.columns) {
									// eslint-disable-next-line @typescript-eslint/no-explicit-any
									fieldDef.columns.forEach((column: any) => {
										const colName = `${column.label} ${i + 1}`;
										// Access value using column ID (like "col-1769270063141")
										const subValue = item[column.id];
										baseData[colName] = subValue || "N/A";
									});
								}
							});
						} else if (fieldDef.type !== "message") {
							// Simple field - use the label from config (skip message fields)
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

// Get all events for export filtering
export async function getEventsForExport() {
	try {
		await checkShopAdmin();

		const events = await prisma.shopEvent.findMany({
			select: {
				id: true,
				name: true,
				slug: true,
			},
			orderBy: { createdAt: "desc" },
		});

		return { success: true, data: events };
	} catch (error: any) {
		return { success: false, message: error.message || "Failed to fetch events" };
	}
}

// Send confirmation email for an existing order (manual trigger)
export async function sendOrderConfirmationEmailAction(orderId: string) {
	try {
		await checkShopAdmin();

		// Import the email function
		const { sendOrderConfirmationEmail } = await import("@/lib/email");

		// Fetch order with all necessary data
		const order = await prisma.order.findUnique({
			where: { id: orderId },
			include: {
				user: {
					select: {
						name: true,
						email: true,
						firstName: true,
						lastName: true,
					},
				},
				event: {
					select: {
						name: true,
					},
				},
				orderItems: {
					include: {
						product: {
							select: {
								name: true,
							},
						},
						package: {
							select: {
								name: true,
							},
						},
					},
				},
			},
		});

		if (!order) {
			return { success: false, message: "Order not found" };
		}

		if (!order.user.email) {
			return { success: false, message: "Customer email not available" };
		}

		// Format order items for email
		const items = order.orderItems.map((item) => ({
			name: item.product?.name || item.package?.name || "Unknown Item",
			size: item.size,
			quantity: item.quantity,
			price: item.price,
			purchaseCode: item.purchaseCode,
		}));

		// Determine customer name
		const customerName =
			order.user.firstName && order.user.lastName
				? `${order.user.firstName} ${order.user.lastName}`
				: order.user.name || "Valued Customer";

		// Send the email
		const result = await sendOrderConfirmationEmail({
			orderId: order.id,
			customerName,
			customerEmail: order.user.email,
			items,
			totalAmount: order.totalAmount,
			eventName: order.event?.name,
			orderDate: order.createdAt,
			eventData: order.eventData as any, // Pass eventData here
		});

		// If email was sent successfully, mark confirmationEmailSent as true
		if (result.success) {
			await prisma.order.update({
				where: { id: orderId },
				data: { confirmationEmailSent: true },
			});
			revalidatePath("/admin/orders");
		}

		return result;
	} catch (error: any) {
		console.error("Error sending confirmation email:", error);
		return { success: false, message: error.message || "Failed to send confirmation email" };
	}
}
