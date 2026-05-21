"use server";

import { and, between, count, eq, inArray, not, or } from "drizzle-orm";
import { db } from "./db";
import { eventProduct, order, orderItem } from "@/db/schema";

type DailyStockOverrides = Record<string, number | null>;

export async function getDailyStockLimit(
	eventProductId: string,
	date: Date,
): Promise<number | null> {
	const ep = await db.query.eventProduct.findFirst({
		where: eq(eventProduct.id, eventProductId),
		columns: {
			hasDailyStockLimit: true,
			defaultMaxOrdersPerDay: true,
			dailyStockOverrides: true,
		},
	});

	if (!ep || !ep.hasDailyStockLimit) return null;

	const dateString = date.toISOString().split("T")[0];
	const overrides = (ep.dailyStockOverrides as DailyStockOverrides | null) || {};
	if (dateString in overrides) return overrides[dateString];
	return ep.defaultMaxOrdersPerDay ?? null;
}

export async function getOrderCountForDate(eventProductId: string, date: Date): Promise<number> {
	const dateString = date.toISOString().split("T")[0];
	const startOfDay = new Date(dateString + "T00:00:00Z");
	const endOfDay = new Date(dateString + "T23:59:59Z");

	const ep = await db.query.eventProduct.findFirst({
		where: eq(eventProduct.id, eventProductId),
		columns: { productId: true, packageId: true, eventId: true },
	});
	if (!ep) return 0;

	// Find matching orderItem rows then count distinct orders matching date + event.
	const itemFilter = ep.productId
		? eq(orderItem.productId, ep.productId)
		: eq(orderItem.packageId, ep.packageId!);

	const rows = await db
		.select({ orderId: orderItem.orderId })
		.from(orderItem)
		.innerJoin(order, eq(orderItem.orderId, order.id))
		.where(
			and(
				itemFilter,
				eq(order.eventId, ep.eventId),
				between(order.deliveryDate, startOfDay, endOfDay),
				not(eq(order.status, "cancelled")),
			),
		);

	const unique = new Set(rows.map((r) => r.orderId));
	return unique.size;
}

export async function getRemainingStock(
	eventProductId: string,
	date: Date,
): Promise<number | null> {
	const limit = await getDailyStockLimit(eventProductId, date);
	if (limit === null) return null;
	if (limit === 0) return -1;

	const orderCount = await getOrderCountForDate(eventProductId, date);
	return Math.max(0, limit - orderCount);
}

export async function getAvailableDates(
	eventProductId: string,
	startDate: Date,
	endDate: Date,
): Promise<Array<{ date: Date; remaining: number | null }>> {
	const dates: Array<{ date: Date; remaining: number | null }> = [];
	const currentDate = new Date(startDate);

	while (currentDate <= endDate) {
		const remaining = await getRemainingStock(eventProductId, new Date(currentDate));
		if (remaining !== -1) {
			dates.push({ date: new Date(currentDate), remaining });
		}
		currentDate.setDate(currentDate.getDate() + 1);
	}

	return dates;
}

export async function isDateBlocked(eventProductId: string, date: Date): Promise<boolean> {
	const remaining = await getRemainingStock(eventProductId, date);
	return remaining === -1 || remaining === 0;
}

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

	for (const item of cartItems) {
		let eventProductId = item.eventProductId;

		if (!eventProductId && eventId) {
			const ep = await db.query.eventProduct.findFirst({
				where: and(
					eq(eventProduct.eventId, eventId),
					item.productId
						? eq(eventProduct.productId, item.productId)
						: eq(eventProduct.packageId, item.packageId!),
				),
				columns: { id: true, hasDailyStockLimit: true },
				with: {
					product: { columns: { name: true } },
					package: { columns: { name: true } },
				},
			});

			if (!ep || !ep.hasDailyStockLimit) continue;
			eventProductId = ep.id;
		}

		if (!eventProductId) continue;

		const remaining = await getRemainingStock(eventProductId, deliveryDate);

		if (remaining === -1) {
			const ep = await db.query.eventProduct.findFirst({
				where: eq(eventProduct.id, eventProductId),
				with: {
					product: { columns: { name: true } },
					package: { columns: { name: true } },
				},
			});
			const name = ep?.product?.name || ep?.package?.name || "This item";
			errors.push(`${name} is not available for delivery on this date.`);
		} else if (remaining !== null && remaining === 0) {
			const ep = await db.query.eventProduct.findFirst({
				where: eq(eventProduct.id, eventProductId),
				with: {
					product: { columns: { name: true } },
					package: { columns: { name: true } },
				},
			});
			const name = ep?.product?.name || ep?.package?.name || "This item";
			errors.push(`${name} is sold out for this date. Only ${remaining} slots remaining.`);
		}
	}

	return { valid: errors.length === 0, errors };
}

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
	if (!eventId) return [];

	const itemsWithLimits: Array<{
		name: string;
		note: string | null;
		eventProductId: string;
	}> = [];

	for (const item of cartItems) {
		const ep = await db.query.eventProduct.findFirst({
			where: and(
				eq(eventProduct.eventId, eventId),
				eq(eventProduct.hasDailyStockLimit, true),
				item.productId
					? eq(eventProduct.productId, item.productId)
					: eq(eventProduct.packageId, item.packageId!),
			),
			columns: { id: true, dailyStockNote: true },
			with: {
				product: { columns: { name: true } },
				package: { columns: { name: true } },
			},
		});

		if (ep) {
			itemsWithLimits.push({
				name: ep.product?.name || ep.package?.name || "Unknown",
				note: ep.dailyStockNote || null,
				eventProductId: ep.id,
			});
		}
	}

	return itemsWithLimits;
}
