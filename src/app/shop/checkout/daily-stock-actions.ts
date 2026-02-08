"use server";

import { prisma } from "@/lib/prisma";
import {
	getCartItemsWithDailyLimits,
	getRemainingStock,
	validateDailyStockForCart,
} from "@/lib/daily-stock";

/**
 * Get daily stock information for items in the user's cart
 * Returns items that have daily limits and their notes
 */
export async function getCartDailyStockInfo(userId: string, eventId?: string) {
	try {
		// Get cart items
		const cartItems = await prisma.cartItem.findMany({
			where: { userId },
			select: {
				productId: true,
				packageId: true,
				quantity: true,
			},
		});

		if (cartItems.length === 0 || !eventId) {
			return {
				hasLimitedItems: false,
				items: [],
			};
		}

		// Get items with daily limits
		const limitedItems = await getCartItemsWithDailyLimits(cartItems, eventId);

		return {
			hasLimitedItems: limitedItems.length > 0,
			items: limitedItems,
		};
	} catch (error) {
		console.error("Failed to get cart daily stock info:", error);
		return {
			hasLimitedItems: false,
			items: [],
		};
	}
}

/**
 * Get available dates with remaining stock for a date range
 * Returns dates that are not blocked and their remaining slots per product
 */
export async function getAvailableDatesForCart(
	userId: string,
	eventId: string,
	startDate: Date,
	endDate: Date,
): Promise<
	Array<{
		date: string;
		remaining: number;
		productStocks: Array<{ productName: string; remaining: number; limit: number }>;
	}>
> {
	try {
		// Get cart items
		const cartItems = await prisma.cartItem.findMany({
			where: { userId },
			select: {
				productId: true,
				packageId: true,
			},
		});

		if (cartItems.length === 0) {
			return [];
		}

		// Find event products with daily limits for cart items
		const eventProducts = await prisma.eventProduct.findMany({
			where: {
				eventId,
				hasDailyStockLimit: true,
				OR: [
					{ productId: { in: cartItems.filter((i) => i.productId).map((i) => i.productId!) } },
					{ packageId: { in: cartItems.filter((i) => i.packageId).map((i) => i.packageId!) } },
				],
			},
			select: {
				id: true,
				productId: true,
				packageId: true,
				defaultMaxOrdersPerDay: true,
				dailyStockOverrides: true,
			},
		});

		if (eventProducts.length === 0) {
			// No limited items, all dates available
			return [];
		}

		// OPTIMIZED: Batch query all order counts at once
		// Get order counts grouped by date for all event products
		const orderCountsByDateAndProduct = new Map<string, Map<string, number>>();

		for (const eventProduct of eventProducts) {
			// Get all orders for this product in this event (extract dates from eventData)
			const ordersForProduct = await prisma.order.findMany({
				where: {
					eventId,
					status: {
						notIn: ["cancelled"],
					},
					orderItems: {
						some: eventProduct.productId
							? { productId: eventProduct.productId }
							: { packageId: eventProduct.packageId },
					},
				},
				select: {
					id: true,
					eventData: true,
				},
			});

			// Extract dates from eventData and count per date
			const countsByDate = new Map<string, number>();

			for (const order of ordersForProduct) {
				try {
					const eventData = order.eventData as any;
					if (!eventData?.fields) continue;

					const fields = eventData.fields;
					let deliveryDate: string | null = null;

					// Look for delivery/pickup fields
					for (const [fieldName, fieldValue] of Object.entries(fields)) {
						const lowerFieldName = fieldName.toLowerCase();
						const isDeliveryField =
							lowerFieldName.includes("delivery") || lowerFieldName.includes("pickup");

						if (!isDeliveryField) continue;

						// Check if it's a repeater field (array)
						if (Array.isArray(fieldValue) && fieldValue.length > 0) {
							// IMPORTANT: Use first row only for stock counting
							// Multiple rows = multiple delivery times, but stock is taken on the FIRST delivery date
							const firstRow = fieldValue[0];
							if (typeof firstRow === "object" && firstRow !== null) {
								// Find the date column
								for (const colValue of Object.values(firstRow)) {
									if (typeof colValue === "string" && colValue.includes("-")) {
										const parsedDate = new Date(colValue);
										if (!isNaN(parsedDate.getTime())) {
											deliveryDate = colValue.split("T")[0]; // YYYY-MM-DD
											break;
										}
									}
								}
							}
						} else if (typeof fieldValue === "string" && lowerFieldName.includes("date")) {
							// Simple field
							const parsedDate = new Date(fieldValue);
							if (!isNaN(parsedDate.getTime())) {
								deliveryDate = fieldValue.split("T")[0];
							}
						}

						if (deliveryDate) break;
					}

					// Count this order for the date
					if (deliveryDate) {
						// Check if date is in range
						const orderDate = new Date(deliveryDate);
						if (orderDate >= startDate && orderDate <= endDate) {
							const currentCount = countsByDate.get(deliveryDate) || 0;
							countsByDate.set(deliveryDate, currentCount + 1);
						}
					}
				} catch (error) {
					console.error(`Error parsing order ${order.id} for daily stock:`, error);
				}
			}

			orderCountsByDateAndProduct.set(eventProduct.id, countsByDate);
		}

		// Build a map of dates with per-product stock information
		const dateStockMap = new Map<
			string,
			{
				minStock: number | null;
				productStocks: Array<{ productName: string; remaining: number; limit: number }>;
			}
		>();
		const currentDate = new Date(startDate);

		// Get product names for display
		const productNames = new Map<string, string>();
		for (const eventProduct of eventProducts) {
			const name = await prisma.eventProduct.findUnique({
				where: { id: eventProduct.id },
				select: {
					product: { select: { name: true } },
					package: { select: { name: true } },
				},
			});
			productNames.set(
				eventProduct.id,
				name?.product?.name || name?.package?.name || "Unknown Product",
			);
		}

		while (currentDate <= endDate) {
			const dateString = currentDate.toISOString().split("T")[0];
			let minStock: number | null = null;
			const productStocks: Array<{ productName: string; remaining: number; limit: number }> = [];

			for (const eventProduct of eventProducts) {
				// Get limit for this date
				const overrides =
					(eventProduct.dailyStockOverrides as Record<string, number | null> | null) || {};
				let limit: number | null = null;

				if (dateString in overrides) {
					limit = overrides[dateString];
				} else {
					limit = eventProduct.defaultMaxOrdersPerDay ?? null;
				}

				// If limit is null (no limit), continue
				if (limit === null) {
					continue;
				}

				// If limit is 0, date is blocked
				if (limit === 0) {
					minStock = -1;
					break;
				}

				// Get order count for this date and product
				const orderCount = orderCountsByDateAndProduct.get(eventProduct.id)?.get(dateString) || 0;
				const remaining = Math.max(0, limit - orderCount);

				// Add to product stocks array
				productStocks.push({
					productName: productNames.get(eventProduct.id) || "Unknown",
					remaining,
					limit,
				});

				// If no stock remaining, mark as sold out
				if (remaining === 0) {
					minStock = 0;
					// Don't break - continue to collect all product stocks
				} else {
					// Track minimum stock across all products
					minStock = minStock === null ? remaining : Math.min(minStock, remaining);
				}
			}

			dateStockMap.set(dateString, { minStock, productStocks });
			currentDate.setDate(currentDate.getDate() + 1);
		}

		// Convert to array of available dates
		const availableDates = Array.from(dateStockMap.entries())
			.filter(([_, data]) => data.minStock !== -1 && data.minStock !== 0 && data.minStock !== null) // Filter out blocked and sold out
			.map(([dateString, data]) => ({
				date: dateString,
				remaining: data.minStock!,
				productStocks: data.productStocks,
			}));

		return availableDates;
	} catch (error) {
		console.error("Failed to get available dates:", error);
		return [];
	}
}

/**
 * Validate that the cart can be ordered for a specific delivery date
 * Returns validation result with errors if any
 */
export async function validateCartForDeliveryDate(
	userId: string,
	eventId: string,
	deliveryDate: Date,
) {
	try {
		// Get cart items
		const cartItems = await prisma.cartItem.findMany({
			where: { userId },
			select: {
				productId: true,
				packageId: true,
				quantity: true,
			},
		});

		if (cartItems.length === 0) {
			return {
				valid: false,
				errors: ["Your cart is empty"],
			};
		}

		// Find event products for cart items
		const eventProducts = await prisma.eventProduct.findMany({
			where: {
				eventId,
				OR: [
					{ productId: { in: cartItems.filter((i) => i.productId).map((i) => i.productId!) } },
					{ packageId: { in: cartItems.filter((i) => i.packageId).map((i) => i.packageId!) } },
				],
			},
			select: {
				id: true,
				productId: true,
				packageId: true,
				hasDailyStockLimit: true,
			},
		});

		// Build cart items with event product IDs
		const cartWithEventProducts = cartItems.map((item) => {
			const eventProduct = eventProducts.find(
				(ep) =>
					(item.productId && ep.productId === item.productId) ||
					(item.packageId && ep.packageId === item.packageId),
			);

			return {
				...item,
				eventProductId: eventProduct?.id,
			};
		});

		// Validate daily stock
		return await validateDailyStockForCart(cartWithEventProducts, deliveryDate, eventId);
	} catch (error) {
		console.error("Failed to validate cart for delivery date:", error);
		return {
			valid: false,
			errors: ["Failed to validate order"],
		};
	}
}
