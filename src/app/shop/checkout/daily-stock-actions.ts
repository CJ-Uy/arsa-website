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
 * Returns dates that are not blocked and their remaining slots
 */
export async function getAvailableDatesForCart(
	userId: string,
	eventId: string,
	startDate: Date,
	endDate: Date,
) {
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
			// Query all orders for this product within the date range
			const orders = await prisma.order.groupBy({
				by: ["deliveryDate"],
				where: {
					eventId,
					deliveryDate: {
						gte: startDate,
						lte: endDate,
					},
					status: {
						notIn: ["cancelled"],
					},
					orderItems: {
						some: eventProduct.productId
							? { productId: eventProduct.productId }
							: { packageId: eventProduct.packageId },
					},
				},
				_count: {
					id: true,
				},
			});

			// Store counts by date
			const countsByDate = new Map<string, number>();
			for (const order of orders) {
				if (order.deliveryDate) {
					const dateString = order.deliveryDate.toISOString().split("T")[0];
					countsByDate.set(dateString, order._count.id);
				}
			}
			orderCountsByDateAndProduct.set(eventProduct.id, countsByDate);
		}

		// Build a map of dates to minimum remaining stock across all limited items
		const dateStockMap = new Map<string, number | null>();
		const currentDate = new Date(startDate);

		while (currentDate <= endDate) {
			const dateString = currentDate.toISOString().split("T")[0];
			let minStock: number | null = null;

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

				// If no stock remaining, mark as sold out
				if (remaining === 0) {
					minStock = 0;
					break;
				}

				// Track minimum stock across all products
				minStock = minStock === null ? remaining : Math.min(minStock, remaining);
			}

			dateStockMap.set(dateString, minStock);
			currentDate.setDate(currentDate.getDate() + 1);
		}

		// Convert to array of available dates
		const availableDates = Array.from(dateStockMap.entries())
			.filter(([_, stock]) => stock !== -1 && stock !== 0 && stock !== null) // Filter out blocked and sold out
			.map(([dateString, stock]) => ({
				date: dateString,
				remaining: stock,
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
