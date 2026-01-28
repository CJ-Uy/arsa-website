"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

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

		await prisma.order.delete({
			where: { id: orderId },
		});

		revalidatePath("/admin/orders");
		return { success: true };
	} catch (error: any) {
		return { success: false, message: error.message || "Failed to delete order" };
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
					"Order Date": new Date(order.createdAt).toLocaleString(),
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
					// Only show GCash ref on first item
					"GCash Ref No": index === 0 ? order.gcashReferenceNumber || "N/A" : "",
					Notes: order.notes || "",
					// Delivery scheduling (only on first item)
					"Delivery Date": index === 0 ? order.deliveryDate || "N/A" : "",
					"Delivery Time": index === 0 ? order.deliveryTime || "N/A" : "",
					// Event info (only on first item)
					Event: index === 0 ? order.event?.name || "N/A" : "",
					// Only show receipt URL on first item
					"Receipt URL": index === 0 ? order.receiptImageUrl || "" : "",
				};

				// Add event-specific custom field data (only on first item)
				// Parse checkout config to properly expand repeater fields
				if (index === 0 && order.eventData && order.event?.checkoutConfig) {
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
