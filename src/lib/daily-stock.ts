"use server";

import { prisma } from "./prisma";

type DailyStockOverrides = Record<string, number | null>; // date string => max orders (null = blocked)

/**
 * Get the daily stock limit for a specific event product on a specific date
 * Returns null if date is blocked, otherwise returns the max orders allowed
 */
export async function getDailyStockLimit(
	eventProductId: string,
	date: Date,
): Promise<number | null> {
	const eventProduct = await prisma.eventProduct.findUnique({
		where: { id: eventProductId },
		select: {
			hasDailyStockLimit: true,
			defaultMaxOrdersPerDay: true,
			dailyStockOverrides: true,
		},
	});

	if (!eventProduct || !eventProduct.hasDailyStockLimit) {
		return null; // No limit
	}

	const dateString = date.toISOString().split("T")[0]; // YYYY-MM-DD
	const overrides = (eventProduct.dailyStockOverrides as DailyStockOverrides | null) || {};

	// Check if there's an override for this date
	if (dateString in overrides) {
		return overrides[dateString]; // null = blocked, number = custom limit
	}

	// Return default limit
	return eventProduct.defaultMaxOrdersPerDay ?? null;
}

/**
 * Count the number of orders for a specific event product on a specific date
 * Counts both delivery and pickup orders for this date
 */
export async function getOrderCountForDate(eventProductId: string, date: Date): Promise<number> {
	const dateString = date.toISOString().split("T")[0];
	const startOfDay = new Date(dateString + "T00:00:00Z");
	const endOfDay = new Date(dateString + "T23:59:59Z");

	// Get the event product to find product/package ID
	const eventProduct = await prisma.eventProduct.findUnique({
		where: { id: eventProductId },
		select: {
			productId: true,
			packageId: true,
			eventId: true,
		},
	});

	if (!eventProduct) {
		return 0;
	}

	// Count orders with this product/package and delivery date
	const count = await prisma.order.count({
		where: {
			eventId: eventProduct.eventId,
			deliveryDate: {
				gte: startOfDay,
				lte: endOfDay,
			},
			status: {
				notIn: ["cancelled"], // Don't count cancelled orders
			},
			orderItems: {
				some: eventProduct.productId
					? { productId: eventProduct.productId }
					: { packageId: eventProduct.packageId },
			},
		},
	});

	return count;
}

/**
 * Get remaining stock for a specific event product on a specific date
 * Returns null if no limit, -1 if blocked, or the number of remaining slots
 */
export async function getRemainingStock(
	eventProductId: string,
	date: Date,
): Promise<number | null> {
	const limit = await getDailyStockLimit(eventProductId, date);

	if (limit === null) {
		return null; // No limit
	}

	if (limit === 0) {
		return -1; // Blocked
	}

	const orderCount = await getOrderCountForDate(eventProductId, date);
	const remaining = limit - orderCount;

	return Math.max(0, remaining); // Never return negative
}

/**
 * Get all available dates for an event product within a date range
 * Returns an array of dates with their remaining stock
 */
export async function getAvailableDates(
	eventProductId: string,
	startDate: Date,
	endDate: Date,
): Promise<Array<{ date: Date; remaining: number | null }>> {
	const dates: Array<{ date: Date; remaining: number | null }> = [];
	const currentDate = new Date(startDate);

	while (currentDate <= endDate) {
		const remaining = await getRemainingStock(eventProductId, new Date(currentDate));

		// Only include dates that are not blocked (remaining !== -1)
		if (remaining !== -1) {
			dates.push({
				date: new Date(currentDate),
				remaining,
			});
		}

		currentDate.setDate(currentDate.getDate() + 1);
	}

	return dates;
}

/**
 * Check if a date is blocked for an event product
 */
export async function isDateBlocked(eventProductId: string, date: Date): Promise<boolean> {
	const remaining = await getRemainingStock(eventProductId, date);
	return remaining === -1 || remaining === 0;
}

/**
 * Validate that all cart items can be ordered for a specific delivery date
 * Returns { valid: true } or { valid: false, errors: [...] }
 */
export async function validateDailyStockForCart(
	cartItems: Array<{
		eventProductId?: string;
		productId?: string;
		packageId?: string;
		quantity: number;
	}>,
	deliveryDate: Date,
	eventId?: string,
): Promise<{ valid: boolean; errors: string[] }> {
	const errors: string[] = [];

	// Find event products with daily stock limits
	for (const item of cartItems) {
		let eventProductId = item.eventProductId;

		// If not provided, try to find it
		if (!eventProductId && eventId) {
			const eventProduct = await prisma.eventProduct.findFirst({
				where: {
					eventId,
					...(item.productId ? { productId: item.productId } : { packageId: item.packageId }),
				},
				select: {
					id: true,
					hasDailyStockLimit: true,
					product: { select: { name: true } },
					package: { select: { name: true } },
				},
			});

			if (!eventProduct || !eventProduct.hasDailyStockLimit) {
				continue; // No daily limit for this item
			}

			eventProductId = eventProduct.id;
		}

		if (!eventProductId) {
			continue;
		}

		const remaining = await getRemainingStock(eventProductId, deliveryDate);

		if (remaining === -1) {
			// Get product name
			const eventProduct = await prisma.eventProduct.findUnique({
				where: { id: eventProductId },
				include: {
					product: { select: { name: true } },
					package: { select: { name: true } },
				},
			});

			const name = eventProduct?.product?.name || eventProduct?.package?.name || "This item";
			errors.push(`${name} is not available for delivery on this date.`);
		} else if (remaining !== null && remaining === 0) {
			// Get product name
			const eventProduct = await prisma.eventProduct.findUnique({
				where: { id: eventProductId },
				include: {
					product: { select: { name: true } },
					package: { select: { name: true } },
				},
			});

			const name = eventProduct?.product?.name || eventProduct?.package?.name || "This item";
			errors.push(`${name} is sold out for this date. Only ${remaining} slots remaining.`);
		}
	}

	return {
		valid: errors.length === 0,
		errors,
	};
}

/**
 * Get all products/packages in cart that have daily stock limits
 * Returns product names with their daily stock notes
 */
export async function getCartItemsWithDailyLimits(
	cartItems: Array<{
		productId?: string;
		packageId?: string;
	}>,
	eventId?: string,
): Promise<
	Array<{
		name: string;
		note: string | null;
		eventProductId: string;
	}>
> {
	if (!eventId) {
		return [];
	}

	const itemsWithLimits: Array<{
		name: string;
		note: string | null;
		eventProductId: string;
	}> = [];

	for (const item of cartItems) {
		const eventProduct = await prisma.eventProduct.findFirst({
			where: {
				eventId,
				...(item.productId ? { productId: item.productId } : { packageId: item.packageId }),
				hasDailyStockLimit: true,
			},
			select: {
				id: true,
				dailyStockNote: true,
				product: { select: { name: true } },
				package: { select: { name: true } },
			},
		});

		if (eventProduct) {
			itemsWithLimits.push({
				name: eventProduct.product?.name || eventProduct.package?.name || "Unknown",
				note: eventProduct.dailyStockNote || null,
				eventProductId: eventProduct.id,
			});
		}
	}

	return itemsWithLimits;
}
