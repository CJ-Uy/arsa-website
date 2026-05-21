"use server";

import { headers } from "next/headers";
import { and, asc, desc, eq, gte, lte, like, not, or } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
	user,
	shopEvent,
	eventProduct,
	eventCategory,
	eventAdmin,
	order,
	shopClick,
	shopPurchase,
} from "@/db/schema";
import { cache } from "@/lib/cache";

async function verifyEventsAdminAccess() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) return { authorized: false, message: "Unauthorized" } as const;

	const u = await db.query.user.findFirst({
		where: eq(user.id, session.user.id),
		columns: { isShopAdmin: true, isEventsAdmin: true },
	});
	if (!u?.isShopAdmin && !u?.isEventsAdmin) {
		return { authorized: false, message: "Events admin access required" } as const;
	}
	return { authorized: true as const, userId: session.user.id };
}

export async function updateEventProductDailyStock(
	eventProductId: string,
	dailyStockConfig: {
		hasDailyStockLimit: boolean;
		defaultMaxOrdersPerDay?: number;
		dailyStockOverrides?: Record<string, number | null>;
		dailyStockNote?: string;
	},
) {
	try {
		const a = await verifyEventsAdminAccess();
		if (!a.authorized) return { success: false, message: a.message };

		await db
			.update(eventProduct)
			.set({
				hasDailyStockLimit: dailyStockConfig.hasDailyStockLimit,
				defaultMaxOrdersPerDay: dailyStockConfig.defaultMaxOrdersPerDay,
				dailyStockOverrides: dailyStockConfig.dailyStockOverrides,
				dailyStockNote: dailyStockConfig.dailyStockNote,
			})
			.where(eq(eventProduct.id, eventProductId));

		await cache.delete("events");
		return { success: true, message: "Daily stock settings updated successfully" };
	} catch (error) {
		console.error("Error updating event product daily stock:", error);
		return { success: false, message: "Failed to update daily stock settings" };
	}
}

export type CheckoutFieldType =
	| "text"
	| "textarea"
	| "select"
	| "checkbox"
	| "date"
	| "time"
	| "number"
	| "email"
	| "phone"
	| "radio"
	| "repeater"
	| "message"
	| "toggle";

export type RepeaterColumn = {
	id: string;
	label: string;
	type: "text" | "textarea" | "number" | "date" | "time" | "select" | "checkbox";
	placeholder?: string;
	options?: string[];
	width?: "sm" | "md" | "lg";
	min?: number;
	max?: number;
	step?: number;
	minDate?: string;
	maxDate?: string;
	disabledDates?: string[];
	minDateOffset?: number;
	maxDateOffset?: number;
	minTime?: string;
	maxTime?: string;
	blockedTimes?: string[];
};

export type FieldCondition = {
	fieldId: string;
	value: string | string[];
};

export type CheckoutField = {
	id: string;
	label: string;
	type: CheckoutFieldType;
	required: boolean;
	placeholder?: string;
	options?: string[];
	maxLength?: number;
	min?: number;
	max?: number;
	step?: number;
	minDate?: string;
	maxDate?: string;
	disabledDates?: string[];
	minDateOffset?: number;
	maxDateOffset?: number;
	minTime?: string;
	maxTime?: string;
	blockedTimes?: string[];
	showWhen?: FieldCondition;
	messageContent?: string;
	description?: string;
	columns?: RepeaterColumn[];
	minRows?: number;
	maxRows?: number;
	defaultRows?: number;
	rowLabel?: string;
	autoSortByDateTime?: boolean;
	toggleOffMessage?: string;
	toggleOnMessage?: string;
};

export type CheckoutConfig = {
	headerMessage?: string;
	additionalFields: CheckoutField[];
	termsMessage?: string;
	confirmationMessage?: string;
	cutoffTime?: string;
	cutoffMessage?: string;
	cutoffDaysOffset?: number;
	paymentOptions?: { id: string; title: string; instructions: string; imageUrl?: string }[];
};

export type ThemeConfig = {
	primaryColor?: string;
	secondaryColor?: string;
	animation?: "confetti" | "hearts" | "snow" | "sparkles" | "petals" | "none";
	backgroundPattern?: string;
	tabGlow?: boolean;
	headerText?: string;
};

export type EventProductInput = {
	productId?: string;
	packageId?: string;
	sortOrder: number;
	eventPrice?: number;
	productCode?: string;
	categoryId?: string;
	hasDailyStockLimit?: boolean;
	defaultMaxOrdersPerDay?: number;
	dailyStockOverrides?: Record<string, number | null>;
};

export type EventCategoryInput = {
	id?: string;
	name: string;
	displayOrder: number;
	color?: string;
};

export type BlockedDeliverySlot = {
	date: string;
	timeSlot?: string;
	reason?: string;
};

export type EventFormData = {
	name: string;
	slug: string;
	description: string;
	heroImage: string;
	heroImageUrls: string[];
	isActive: boolean;
	isPriority: boolean;
	tabOrder: number;
	tabLabel: string;
	startDate: string;
	endDate: string;
	componentPath: string;
	themeConfig: ThemeConfig | null;
	checkoutConfig: string | null;
	products: EventProductInput[];
	categories: EventCategoryInput[];
	minDeliveryDate?: string;
	maxDeliveryDate?: string;
	blockedDeliverySlots?: BlockedDeliverySlot[];
};

export async function getEvents() {
	try {
		const events = await db.query.shopEvent.findMany({
			with: {
				products: {
					with: { product: true, package: true },
					orderBy: [asc(eventProduct.sortOrder)],
				},
				categories: { orderBy: [asc(eventCategory.displayOrder)] },
				orders: { columns: { id: true } },
			},
			orderBy: [desc(shopEvent.createdAt)],
		});

		const decorated = events.map((e) => ({
			...e,
			_count: { orders: e.orders.length },
		}));

		return { success: true, events: decorated };
	} catch (error) {
		console.error("Get events error:", error);
		return { success: false, events: [], message: "Failed to fetch events" };
	}
}

export async function getActiveEvents() {
	try {
		const now = new Date();
		const events = await db.query.shopEvent.findMany({
			where: and(
				eq(shopEvent.isActive, true),
				lte(shopEvent.startDate, now),
				gte(shopEvent.endDate, now),
			),
			with: {
				products: {
					with: { product: true, package: true },
					orderBy: [asc(eventProduct.sortOrder)],
				},
			},
			orderBy: [desc(shopEvent.isPriority), asc(shopEvent.tabOrder)],
		});

		return { success: true, events };
	} catch (error) {
		console.error("Get active events error:", error);
		return { success: false, events: [], message: "Failed to fetch active events" };
	}
}

export async function getEventBySlug(slug: string) {
	try {
		const event = await db.query.shopEvent.findFirst({
			where: eq(shopEvent.slug, slug),
			with: {
				products: {
					with: { product: true, package: true },
					orderBy: [asc(eventProduct.sortOrder)],
				},
			},
		});
		return { success: true, event };
	} catch (error) {
		console.error("Get event error:", error);
		return { success: false, event: null, message: "Failed to fetch event" };
	}
}

export async function createEvent(data: EventFormData) {
	try {
		const a = await verifyEventsAdminAccess();
		if (!a.authorized) return { success: false, message: a.message };

		const existing = await db.query.shopEvent.findFirst({
			where: eq(shopEvent.slug, data.slug),
		});
		if (existing) return { success: false, message: "An event with this slug already exists" };

		const parsedCheckoutConfig = data.checkoutConfig ? JSON.parse(data.checkoutConfig) : null;

		const createdId = await db.transaction(async (tx) => {
			const inserted = await tx
				.insert(shopEvent)
				.values({
					name: data.name,
					slug: data.slug,
					description: data.description,
					heroImage: data.heroImage || null,
					heroImageUrls: data.heroImageUrls,
					isActive: data.isActive,
					isPriority: data.isPriority,
					tabOrder: data.tabOrder,
					tabLabel: data.tabLabel || null,
					startDate: new Date(data.startDate + ":00+08:00"),
					endDate: new Date(data.endDate + ":00+08:00"),
					componentPath: data.componentPath || null,
					themeConfig: data.themeConfig ?? null,
					checkoutConfig: parsedCheckoutConfig ?? null,
					minDeliveryDate: data.minDeliveryDate ? new Date(data.minDeliveryDate) : null,
					maxDeliveryDate: data.maxDeliveryDate ? new Date(data.maxDeliveryDate) : null,
					blockedDeliverySlots: data.blockedDeliverySlots ?? null,
				})
				.returning();
			const eventId = inserted[0].id;

			const categoryNameToId = new Map<string, string>();
			if (data.categories.length > 0) {
				const catRows = await tx
					.insert(eventCategory)
					.values(
						data.categories.map((c) => ({
							eventId,
							name: c.name,
							displayOrder: c.displayOrder,
							color: c.color || null,
						})),
					)
					.returning();
				catRows.forEach((cat) => categoryNameToId.set(cat.name, cat.id));
			}

			if (data.products.length > 0) {
				await tx.insert(eventProduct).values(
					data.products.map((p) => {
						let resolvedCategoryId: string | null = null;
						if (p.categoryId) {
							resolvedCategoryId = categoryNameToId.get(p.categoryId) || null;
						}
						return {
							eventId,
							productId: p.productId || null,
							packageId: p.packageId || null,
							sortOrder: p.sortOrder,
							eventPrice: p.eventPrice ?? null,
							productCode: p.productCode || null,
							categoryId: resolvedCategoryId,
							hasDailyStockLimit: p.hasDailyStockLimit || false,
							defaultMaxOrdersPerDay: p.defaultMaxOrdersPerDay ?? null,
							dailyStockOverrides: p.dailyStockOverrides || null,
						};
					}),
				);
			}

			return eventId;
		});

		await cache.deletePattern("events:");
		return { success: true, eventId: createdId };
	} catch (error) {
		console.error("Create event error:", error);
		return { success: false, message: "Failed to create event" };
	}
}

export async function updateEvent(id: string, data: EventFormData) {
	try {
		const a = await verifyEventsAdminAccess();
		if (!a.authorized) return { success: false, message: a.message };

		const existing = await db.query.shopEvent.findFirst({
			where: eq(shopEvent.slug, data.slug),
		});
		if (existing && existing.id !== id) {
			return { success: false, message: "An event with this slug already exists" };
		}

		const parsedCheckoutConfig = data.checkoutConfig ? JSON.parse(data.checkoutConfig) : null;

		await db.transaction(async (tx) => {
			await tx.delete(eventProduct).where(eq(eventProduct.eventId, id));
			await tx.delete(eventCategory).where(eq(eventCategory.eventId, id));

			await tx
				.update(shopEvent)
				.set({
					name: data.name,
					slug: data.slug,
					description: data.description,
					heroImage: data.heroImage || null,
					heroImageUrls: data.heroImageUrls,
					isActive: data.isActive,
					isPriority: data.isPriority,
					tabOrder: data.tabOrder,
					tabLabel: data.tabLabel || null,
					startDate: new Date(data.startDate + ":00+08:00"),
					endDate: new Date(data.endDate + ":00+08:00"),
					componentPath: data.componentPath || null,
					themeConfig: data.themeConfig ?? null,
					checkoutConfig: parsedCheckoutConfig ?? null,
					minDeliveryDate: data.minDeliveryDate ? new Date(data.minDeliveryDate) : null,
					maxDeliveryDate: data.maxDeliveryDate ? new Date(data.maxDeliveryDate) : null,
					blockedDeliverySlots: data.blockedDeliverySlots ?? null,
				})
				.where(eq(shopEvent.id, id));

			const categoryNameToId = new Map<string, string>();
			if (data.categories.length > 0) {
				const catRows = await tx
					.insert(eventCategory)
					.values(
						data.categories.map((c) => ({
							eventId: id,
							name: c.name,
							displayOrder: c.displayOrder,
							color: c.color || null,
						})),
					)
					.returning();
				catRows.forEach((cat) => categoryNameToId.set(cat.name, cat.id));

				data.categories.forEach((inputCat, index) => {
					if (inputCat.id && catRows[index]) {
						categoryNameToId.set(inputCat.id, catRows[index].id);
					}
				});
			}

			if (data.products.length > 0) {
				await tx.insert(eventProduct).values(
					data.products.map((p) => {
						let resolvedCategoryId: string | null = null;
						if (p.categoryId) {
							resolvedCategoryId = categoryNameToId.get(p.categoryId) || null;
						}
						return {
							eventId: id,
							productId: p.productId || null,
							packageId: p.packageId || null,
							sortOrder: p.sortOrder,
							eventPrice: p.eventPrice ?? null,
							productCode: p.productCode || null,
							categoryId: resolvedCategoryId,
							hasDailyStockLimit: p.hasDailyStockLimit || false,
							defaultMaxOrdersPerDay: p.defaultMaxOrdersPerDay ?? null,
							dailyStockOverrides: p.dailyStockOverrides || null,
						};
					}),
				);
			}
		});

		await cache.deletePattern("events:");
		return { success: true, eventId: id };
	} catch (error) {
		console.error("Update event error:", error);
		return { success: false, message: "Failed to update event" };
	}
}

export async function deleteEvent(id: string) {
	try {
		const a = await verifyEventsAdminAccess();
		if (!a.authorized) return { success: false, message: a.message };

		await db.delete(shopEvent).where(eq(shopEvent.id, id));
		await cache.deletePattern("events:");
		return { success: true };
	} catch (error) {
		console.error("Delete event error:", error);
		return { success: false, message: "Failed to delete event" };
	}
}

export type AnalyticsTimeRange = "24h" | "7d" | "30d" | "all";

export async function getEventAnalytics(
	eventId: string,
	timeRange: AnalyticsTimeRange = "7d",
	eventStartDate?: Date,
	eventEndDate?: Date,
) {
	try {
		const a = await verifyEventsAdminAccess();
		if (!a.authorized) return { success: false, message: a.message };

		let startDate: Date;
		const endDate = new Date();

		switch (timeRange) {
			case "24h":
				startDate = new Date();
				startDate.setHours(startDate.getHours() - 24);
				break;
			case "7d":
				startDate = new Date();
				startDate.setDate(startDate.getDate() - 7);
				break;
			case "30d":
				startDate = new Date();
				startDate.setDate(startDate.getDate() - 30);
				break;
			case "all":
				startDate = eventStartDate || new Date();
				if (!eventStartDate) startDate.setFullYear(startDate.getFullYear() - 1);
				break;
		}

		const rawClicks = await db.query.shopClick.findMany({
			where: and(
				eq(shopClick.eventId, eventId),
				gte(shopClick.clickedAt, startDate),
				lte(shopClick.clickedAt, endDate),
			),
			columns: { clickedAt: true },
			orderBy: [asc(shopClick.clickedAt)],
		});

		const rawPurchases = await db.query.shopPurchase.findMany({
			where: and(
				eq(shopPurchase.eventId, eventId),
				gte(shopPurchase.purchasedAt, startDate),
				lte(shopPurchase.purchasedAt, endDate),
			),
			columns: { purchasedAt: true, totalAmount: true, itemCount: true },
			orderBy: [asc(shopPurchase.purchasedAt)],
		});

		const isHourly = timeRange === "24h";
		const clicksByPeriod: Record<string, number> = {};
		const purchasesByPeriod: Record<
			string,
			{ count: number; revenue: number; items: number }
		> = {};

		const periods: string[] = [];
		const current = new Date(startDate);
		while (current <= endDate) {
			const key = isHourly ? current.toISOString().slice(0, 13) : current.toISOString().slice(0, 10);
			periods.push(key);
			clicksByPeriod[key] = 0;
			purchasesByPeriod[key] = { count: 0, revenue: 0, items: 0 };

			if (isHourly) current.setHours(current.getHours() + 1);
			else current.setDate(current.getDate() + 1);
		}

		for (const click of rawClicks) {
			const key = isHourly
				? click.clickedAt.toISOString().slice(0, 13)
				: click.clickedAt.toISOString().slice(0, 10);
			if (clicksByPeriod[key] !== undefined) clicksByPeriod[key]++;
		}

		for (const purchase of rawPurchases) {
			const key = isHourly
				? purchase.purchasedAt.toISOString().slice(0, 13)
				: purchase.purchasedAt.toISOString().slice(0, 10);
			if (purchasesByPeriod[key] !== undefined) {
				purchasesByPeriod[key].count++;
				purchasesByPeriod[key].revenue += purchase.totalAmount;
				purchasesByPeriod[key].items += purchase.itemCount;
			}
		}

		const clicksData = periods.map((period) => ({
			period,
			label: isHourly
				? new Date(period + ":00:00Z").toLocaleTimeString("en-US", {
						timeZone: "Asia/Manila",
						hour: "numeric",
						hour12: true,
					})
				: new Date(period + "T00:00:00Z").toLocaleDateString("en-US", {
						timeZone: "Asia/Manila",
						month: "short",
						day: "numeric",
					}),
			clicks: clicksByPeriod[period] || 0,
		}));

		const purchasesData = periods.map((period) => ({
			period,
			label: isHourly
				? new Date(period + ":00:00Z").toLocaleTimeString("en-US", {
						timeZone: "Asia/Manila",
						hour: "numeric",
						hour12: true,
					})
				: new Date(period + "T00:00:00Z").toLocaleDateString("en-US", {
						timeZone: "Asia/Manila",
						month: "short",
						day: "numeric",
					}),
			orders: purchasesByPeriod[period]?.count || 0,
			revenue: purchasesByPeriod[period]?.revenue || 0,
			items: purchasesByPeriod[period]?.items || 0,
		}));

		const totalClicks = rawClicks.length;
		const totalOrders = rawPurchases.length;
		const totalRevenue = rawPurchases.reduce((sum, p) => sum + p.totalAmount, 0);
		const totalItems = rawPurchases.reduce((sum, p) => sum + p.itemCount, 0);
		const conversionRate =
			totalClicks > 0 ? ((totalOrders / totalClicks) * 100).toFixed(2) : "0.00";

		return {
			success: true,
			analytics: {
				timeRange,
				startDate: startDate.toISOString(),
				endDate: endDate.toISOString(),
				clicksData,
				purchasesData,
				totals: {
					clicks: totalClicks,
					orders: totalOrders,
					revenue: totalRevenue,
					items: totalItems,
					conversionRate: parseFloat(conversionRate),
				},
			},
		};
	} catch (error) {
		console.error("Get analytics error:", error);
		return { success: false, message: "Failed to fetch analytics" };
	}
}

export async function getEventSalesByDay(eventId: string) {
	try {
		const a = await verifyEventsAdminAccess();
		if (!a.authorized) return { success: false, message: a.message };

		const orders = await db.query.order.findMany({
			where: and(eq(order.eventId, eventId), not(eq(order.status, "cancelled"))),
			columns: { createdAt: true },
			with: {
				orderItems: {
					columns: { quantity: true, price: true, size: true },
					with: {
						product: { columns: { name: true } },
						package: { columns: { name: true } },
					},
				},
			},
			orderBy: [asc(order.createdAt)],
		});

		const itemsByDate: Record<string, Record<string, { qty: number; revenue: number }>> = {};
		const allDates = new Set<string>();
		const itemMeta: Record<string, { name: string; size: string }> = {};

		for (const o of orders) {
			const dateKey = o.createdAt.toISOString().slice(0, 10);
			allDates.add(dateKey);

			for (const item of o.orderItems) {
				const itemName = item.product?.name ?? item.package?.name ?? "Unknown";
				const size = item.size ?? "-";
				const itemKey = `${itemName}|||${size}`;

				if (!itemsByDate[itemKey]) {
					itemsByDate[itemKey] = {};
					itemMeta[itemKey] = { name: itemName, size };
				}
				if (!itemsByDate[itemKey][dateKey]) {
					itemsByDate[itemKey][dateKey] = { qty: 0, revenue: 0 };
				}
				itemsByDate[itemKey][dateKey].qty += item.quantity;
				itemsByDate[itemKey][dateKey].revenue += item.price * item.quantity;
			}
		}

		const sortedDates = Array.from(allDates).sort();
		const rows = Object.entries(itemsByDate).map(([key, dateData]) => {
			const meta = itemMeta[key];
			const dayQty: Record<string, number> = {};
			const dayRevenue: Record<string, number> = {};
			let totalQty = 0;
			let totalRevenue = 0;
			for (const date of sortedDates) {
				const d = dateData[date] ?? { qty: 0, revenue: 0 };
				dayQty[date] = d.qty;
				dayRevenue[date] = d.revenue;
				totalQty += d.qty;
				totalRevenue += d.revenue;
			}
			return { name: meta.name, size: meta.size, dayQty, dayRevenue, totalQty, totalRevenue };
		});

		rows.sort((a, b) => a.name.localeCompare(b.name) || a.size.localeCompare(b.size));

		return { success: true as const, data: { dates: sortedDates, rows } };
	} catch (error) {
		console.error("Get sales by day error:", error);
		return { success: false, message: "Failed to fetch sales data" };
	}
}

export async function searchUsers(query: string) {
	try {
		const a = await verifyEventsAdminAccess();
		if (!a.authorized) return { success: false, message: a.message };

		const currentUser = await db.query.user.findFirst({
			where: eq(user.id, a.userId),
			columns: { isShopAdmin: true },
		});
		if (!currentUser?.isShopAdmin) {
			return { success: false, message: "Only shop admins can manage event admins" };
		}

		const q = `%${query.toLowerCase()}%`;
		const users = await db.query.user.findMany({
			where: or(like(user.email, q), like(user.name, q)),
			columns: { id: true, email: true, name: true, image: true },
			limit: 10,
		});

		return { success: true, users };
	} catch (error) {
		console.error("Search users error:", error);
		return { success: false, message: "Failed to search users" };
	}
}

export async function getEventAdmins(eventId: string) {
	try {
		const a = await verifyEventsAdminAccess();
		if (!a.authorized) return { success: false, message: a.message };

		const admins = await db.query.eventAdmin.findMany({
			where: eq(eventAdmin.eventId, eventId),
			with: {
				user: { columns: { id: true, email: true, name: true, image: true } },
			},
		});

		return { success: true, admins };
	} catch (error) {
		console.error("Get event admins error:", error);
		return { success: false, message: "Failed to fetch event admins" };
	}
}

export async function addEventAdmin(eventId: string, userId: string) {
	try {
		const a = await verifyEventsAdminAccess();
		if (!a.authorized) return { success: false, message: a.message };

		const currentUser = await db.query.user.findFirst({
			where: eq(user.id, a.userId),
			columns: { isShopAdmin: true },
		});
		if (!currentUser?.isShopAdmin) {
			return { success: false, message: "Only shop admins can manage event admins" };
		}

		const existing = await db.query.eventAdmin.findFirst({
			where: and(eq(eventAdmin.eventId, eventId), eq(eventAdmin.userId, userId)),
		});
		if (existing) return { success: false, message: "User is already an admin for this event" };

		await db.insert(eventAdmin).values({ eventId, userId });
		return { success: true };
	} catch (error) {
		console.error("Add event admin error:", error);
		return { success: false, message: "Failed to add event admin" };
	}
}

export async function removeEventAdmin(eventId: string, userId: string) {
	try {
		const a = await verifyEventsAdminAccess();
		if (!a.authorized) return { success: false, message: a.message };

		const currentUser = await db.query.user.findFirst({
			where: eq(user.id, a.userId),
			columns: { isShopAdmin: true },
		});
		if (!currentUser?.isShopAdmin) {
			return { success: false, message: "Only shop admins can manage event admins" };
		}

		await db
			.delete(eventAdmin)
			.where(and(eq(eventAdmin.eventId, eventId), eq(eventAdmin.userId, userId)));
		return { success: true };
	} catch (error) {
		console.error("Remove event admin error:", error);
		return { success: false, message: "Failed to remove event admin" };
	}
}

export async function getMyEvents() {
	try {
		const session = await auth.api.getSession({ headers: await headers() });
		if (!session?.user) return { success: false, message: "Unauthorized" };

		const u = await db.query.user.findFirst({
			where: eq(user.id, session.user.id),
			columns: { isShopAdmin: true, isEventsAdmin: true },
		});
		if (!u) return { success: false, message: "User not found" };

		const eventAdmins = await db.query.eventAdmin.findMany({
			where: eq(eventAdmin.userId, session.user.id),
			with: { event: true },
		});

		if (u.isShopAdmin) {
			const events = await db.query.shopEvent.findMany({
				orderBy: [desc(shopEvent.createdAt)],
			});
			return { success: true, events, isShopAdmin: true };
		}

		if (u.isEventsAdmin) {
			const events = await db.query.shopEvent.findMany({
				orderBy: [desc(shopEvent.createdAt)],
			});
			return { success: true, events, isShopAdmin: false };
		}

		const events = eventAdmins.map((ea) => ea.event);
		return { success: true, events, isShopAdmin: false };
	} catch (error) {
		console.error("Get my events error:", error);
		return { success: false, message: "Failed to fetch events" };
	}
}
