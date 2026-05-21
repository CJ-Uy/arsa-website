"use server";

import { and, eq, inArray, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { cartItem, eventProduct } from "@/db/schema";
import {
	getCartItemsWithDailyLimits,
	validateDailyStockForCart,
} from "@/lib/daily-stock";

export async function getCartDailyStockInfo(userId: string, eventId?: string) {
	try {
		const cartItems = await db.query.cartItem.findMany({
			where: eq(cartItem.userId, userId),
			columns: { productId: true, packageId: true, quantity: true },
		});

		if (cartItems.length === 0 || !eventId) {
			return { hasLimitedItems: false, items: [] };
		}

		const limitedItems = await getCartItemsWithDailyLimits(
			cartItems.map((i) => ({
				productId: i.productId ?? undefined,
				packageId: i.packageId ?? undefined,
			})),
			eventId,
		);
		return { hasLimitedItems: limitedItems.length > 0, items: limitedItems };
	} catch (error) {
		console.error("Failed to get cart daily stock info:", error);
		return { hasLimitedItems: false, items: [] };
	}
}

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
		const cartItems = await db.query.cartItem.findMany({
			where: eq(cartItem.userId, userId),
			columns: { productId: true, packageId: true },
		});

		if (cartItems.length === 0) return [];

		const productIds = cartItems.filter((i) => i.productId).map((i) => i.productId!);
		const packageIds = cartItems.filter((i) => i.packageId).map((i) => i.packageId!);

		const filters = [eq(eventProduct.eventId, eventId), eq(eventProduct.hasDailyStockLimit, true)];
		const orParts = [];
		if (productIds.length > 0) orParts.push(inArray(eventProduct.productId, productIds));
		if (packageIds.length > 0) orParts.push(inArray(eventProduct.packageId, packageIds));
		if (orParts.length === 0) return [];
		filters.push(or(...orParts)!);

		const eventProducts = await db.query.eventProduct.findMany({
			where: and(...filters),
			columns: {
				id: true,
				productId: true,
				packageId: true,
				defaultMaxOrdersPerDay: true,
				dailyStockOverrides: true,
			},
			with: {
				product: { columns: { name: true } },
				package: { columns: { name: true } },
			},
		});

		if (eventProducts.length === 0) return [];

		const orderCountsByDateAndProduct = new Map<string, Map<string, number>>();
		const productNames = new Map<string, string>();

		for (const ep of eventProducts) {
			productNames.set(ep.id, ep.product?.name || ep.package?.name || "Unknown Product");

			const itemFilter = ep.productId
				? { productId: ep.productId }
				: { packageId: ep.packageId };

			// Find orders in this event with this product/package via Drizzle: pull the matching
			// orderItems then dedupe by orderId.
			const matchOrders = await db.query.order.findMany({
				where: (o, { eq }) => eq(o.eventId, eventId),
				columns: { id: true, eventData: true, status: true },
				with: {
					orderItems: {
						columns: { productId: true, packageId: true },
					},
				},
			});

			const matched = matchOrders.filter(
				(o) =>
					o.status !== "cancelled" &&
					o.orderItems.some((oi) =>
						itemFilter.productId
							? oi.productId === itemFilter.productId
							: oi.packageId === itemFilter.packageId,
					),
			);

			const countsByDate = new Map<string, number>();

			for (const o of matched) {
				try {
					const eventData = o.eventData as any;
					if (!eventData?.fields) continue;

					const fields = eventData.fields;
					let deliveryDate: string | null = null;

					for (const [fieldName, fieldValue] of Object.entries(fields)) {
						const lowerFieldName = fieldName.toLowerCase();
						const isDeliveryField =
							lowerFieldName.includes("delivery") || lowerFieldName.includes("pickup");
						if (!isDeliveryField) continue;

						if (Array.isArray(fieldValue) && fieldValue.length > 0) {
							const firstRow = fieldValue[0];
							if (typeof firstRow === "object" && firstRow !== null) {
								for (const colValue of Object.values(firstRow)) {
									if (typeof colValue === "string" && colValue.includes("-")) {
										const parsedDate = new Date(colValue);
										if (!isNaN(parsedDate.getTime())) {
											deliveryDate = colValue.split("T")[0];
											break;
										}
									}
								}
							}
						} else if (typeof fieldValue === "string" && lowerFieldName.includes("date")) {
							const parsedDate = new Date(fieldValue);
							if (!isNaN(parsedDate.getTime())) {
								deliveryDate = fieldValue.split("T")[0];
							}
						}
						if (deliveryDate) break;
					}

					if (deliveryDate) {
						const orderDate = new Date(deliveryDate);
						if (orderDate >= startDate && orderDate <= endDate) {
							const currentCount = countsByDate.get(deliveryDate) || 0;
							countsByDate.set(deliveryDate, currentCount + 1);
						}
					}
				} catch (error) {
					console.error(`Error parsing order ${o.id} for daily stock:`, error);
				}
			}

			orderCountsByDateAndProduct.set(ep.id, countsByDate);
		}

		const dateStockMap = new Map<
			string,
			{
				minStock: number | null;
				productStocks: Array<{ productName: string; remaining: number; limit: number }>;
			}
		>();
		const currentDate = new Date(startDate);

		while (currentDate <= endDate) {
			const dateString = currentDate.toISOString().split("T")[0];
			let minStock: number | null = null;
			const productStocks: Array<{ productName: string; remaining: number; limit: number }> = [];

			for (const ep of eventProducts) {
				const overrides =
					(ep.dailyStockOverrides as Record<string, number | null> | null) || {};
				let limit: number | null = null;
				if (dateString in overrides) limit = overrides[dateString];
				else limit = ep.defaultMaxOrdersPerDay ?? null;

				if (limit === null) continue;
				if (limit === 0) {
					minStock = -1;
					break;
				}

				const orderCount = orderCountsByDateAndProduct.get(ep.id)?.get(dateString) || 0;
				const remaining = Math.max(0, limit - orderCount);

				productStocks.push({
					productName: productNames.get(ep.id) || "Unknown",
					remaining,
					limit,
				});

				if (remaining === 0) minStock = 0;
				else minStock = minStock === null ? remaining : Math.min(minStock, remaining);
			}

			dateStockMap.set(dateString, { minStock, productStocks });
			currentDate.setDate(currentDate.getDate() + 1);
		}

		return Array.from(dateStockMap.entries())
			.filter(
				([_, data]) => data.minStock !== -1 && data.minStock !== 0 && data.minStock !== null,
			)
			.map(([dateString, data]) => ({
				date: dateString,
				remaining: data.minStock!,
				productStocks: data.productStocks,
			}));
	} catch (error) {
		console.error("Failed to get available dates:", error);
		return [];
	}
}

export async function validateCartForDeliveryDate(
	userId: string,
	eventId: string,
	deliveryDate: Date,
) {
	try {
		const cartItems = await db.query.cartItem.findMany({
			where: eq(cartItem.userId, userId),
			columns: { productId: true, packageId: true, quantity: true },
		});

		if (cartItems.length === 0) {
			return { valid: false, errors: ["Your cart is empty"] };
		}

		const productIds = cartItems.filter((i) => i.productId).map((i) => i.productId!);
		const packageIds = cartItems.filter((i) => i.packageId).map((i) => i.packageId!);

		const orParts = [];
		if (productIds.length > 0) orParts.push(inArray(eventProduct.productId, productIds));
		if (packageIds.length > 0) orParts.push(inArray(eventProduct.packageId, packageIds));

		const eventProducts =
			orParts.length === 0
				? []
				: await db.query.eventProduct.findMany({
						where: and(eq(eventProduct.eventId, eventId), or(...orParts)!),
						columns: {
							id: true,
							productId: true,
							packageId: true,
							hasDailyStockLimit: true,
						},
					});

		const cartWithEventProducts = cartItems.map((item) => {
			const ep = eventProducts.find(
				(e) =>
					(item.productId && e.productId === item.productId) ||
					(item.packageId && e.packageId === item.packageId),
			);
			return {
				productId: item.productId ?? undefined,
				packageId: item.packageId ?? undefined,
				quantity: item.quantity,
				eventProductId: ep?.id,
			};
		});

		return await validateDailyStockForCart(cartWithEventProducts, deliveryDate, eventId);
	} catch (error) {
		console.error("Failed to validate cart for delivery date:", error);
		return { valid: false, errors: ["Failed to validate order"] };
	}
}
