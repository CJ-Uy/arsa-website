"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { cache } from "@/lib/cache";

// Get current session and verify admin access (either shop admin or events admin)
async function verifyEventsAdminAccess() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		return { authorized: false, message: "Unauthorized" };
	}

	const user = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: { isShopAdmin: true, isEventsAdmin: true },
	});

	if (!user?.isShopAdmin && !user?.isEventsAdmin) {
		return { authorized: false, message: "Events admin access required" };
	}

	return { authorized: true, userId: session.user.id };
}

/**
 * Update daily stock settings for a specific EventProduct
 * This allows immediate saving from the daily stock dialog
 */
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
		const auth = await verifyEventsAdminAccess();
		if (!auth.authorized) {
			return { success: false, message: auth.message };
		}

		// Update the EventProduct
		await prisma.eventProduct.update({
			where: { id: eventProductId },
			data: {
				hasDailyStockLimit: dailyStockConfig.hasDailyStockLimit,
				defaultMaxOrdersPerDay: dailyStockConfig.defaultMaxOrdersPerDay,
				dailyStockOverrides: dailyStockConfig.dailyStockOverrides as Prisma.JsonValue,
				dailyStockNote: dailyStockConfig.dailyStockNote,
			},
		});

		// Clear cache
		cache.delete("events");

		return { success: true, message: "Daily stock settings updated successfully" };
	} catch (error) {
		console.error("Error updating event product daily stock:", error);
		return { success: false, message: "Failed to update daily stock settings" };
	}
}

// Types for event data
export type CheckoutFieldType =
	| "text" // Single line text input
	| "textarea" // Multi-line text area
	| "select" // Dropdown selection
	| "checkbox" // Single checkbox (yes/no)
	| "date" // Date picker
	| "time" // Time picker
	| "number" // Numeric input
	| "email" // Email with validation
	| "phone" // Phone number
	| "radio" // Radio button group
	| "repeater" // Multiple rows table
	| "message" // Display-only informational message
	| "toggle"; // Toggle switch with custom on/off messages

export type RepeaterColumn = {
	id: string;
	label: string;
	type: "text" | "textarea" | "number" | "date" | "time" | "select" | "checkbox";
	placeholder?: string;
	options?: string[];
	width?: "sm" | "md" | "lg";
	// Number constraints (for type: "number")
	min?: number;
	max?: number;
	step?: number;
	// Date constraints (for type: "date")
	minDate?: string;
	maxDate?: string;
	disabledDates?: string[];
	// Date offset constraints (relative to today)
	minDateOffset?: number; // Days from today (e.g., 1 = tomorrow, -1 = yesterday)
	maxDateOffset?: number; // Days from today
	// Time constraints (for type: "time")
	minTime?: string;
	maxTime?: string;
	blockedTimes?: string[];
};

// Conditional visibility for fields
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
	options?: string[]; // For select, radio types
	maxLength?: number;
	// Number field constraints
	min?: number;
	max?: number;
	step?: number;
	// Date field constraints
	minDate?: string; // ISO date string for minimum selectable date
	maxDate?: string; // ISO date string for maximum selectable date
	disabledDates?: string[]; // Array of ISO date strings to disable
	// Date offset constraints (relative to today)
	minDateOffset?: number; // Days from today (e.g., 1 = tomorrow)
	maxDateOffset?: number; // Days from today
	// Time field constraints
	minTime?: string; // Time string for earliest selectable time (HH:MM format)
	maxTime?: string; // Time string for latest selectable time (HH:MM format)
	blockedTimes?: string[]; // Array of time strings to disable (HH:MM format)
	// Conditional display
	showWhen?: FieldCondition;
	// Message field content
	messageContent?: string;
	// Description for any field type
	description?: string; // Optional description/help text shown below the field
	// Repeater-specific fields
	columns?: RepeaterColumn[];
	minRows?: number;
	maxRows?: number;
	defaultRows?: number;
	rowLabel?: string; // Custom row label prefix (e.g., "Attempt" for "Attempt #1")
	autoSortByDateTime?: boolean; // Auto-sort rows by date and time columns
	// Toggle field properties
	toggleOffMessage?: string; // Message shown when toggle is off
	toggleOnMessage?: string; // Message shown when toggle is on
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
	date: string; // ISO date string (YYYY-MM-DD)
	timeSlot?: string; // Optional time slot (e.g., "Morning", "Afternoon", "9:00 AM")
	reason?: string; // Optional reason (e.g., "Fully booked", "Holiday")
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
	checkoutConfig: string | null; // JSON-serialized CheckoutConfig (pre-serialized on client to avoid RSC Flight issues with deeply nested objects)
	products: EventProductInput[];
	categories: EventCategoryInput[];
	// Delivery control
	minDeliveryDate?: string; // ISO date string
	maxDeliveryDate?: string; // ISO date string
	blockedDeliverySlots?: BlockedDeliverySlot[]; // Array of blocked slots
};

// Get all events with their products and categories
export async function getEvents() {
	try {
		const events = await prisma.shopEvent.findMany({
			include: {
				products: {
					include: {
						product: true,
						package: true,
					},
					orderBy: { sortOrder: "asc" },
				},
				categories: {
					orderBy: { displayOrder: "asc" },
				},
				_count: {
					select: { orders: true },
				},
			},
			orderBy: { createdAt: "desc" },
		});

		return { success: true, events };
	} catch (error) {
		console.error("Get events error:", error);
		return { success: false, events: [], message: "Failed to fetch events" };
	}
}

// Get active events for shop display
export async function getActiveEvents() {
	try {
		const now = new Date();
		const events = await prisma.shopEvent.findMany({
			where: {
				isActive: true,
				startDate: { lte: now },
				endDate: { gte: now },
			},
			include: {
				products: {
					include: {
						product: true,
						package: true,
					},
					orderBy: { sortOrder: "asc" },
				},
			},
			orderBy: [{ isPriority: "desc" }, { tabOrder: "asc" }],
		});

		return { success: true, events };
	} catch (error) {
		console.error("Get active events error:", error);
		return { success: false, events: [], message: "Failed to fetch active events" };
	}
}

// Get single event by slug
export async function getEventBySlug(slug: string) {
	try {
		const event = await prisma.shopEvent.findUnique({
			where: { slug },
			include: {
				products: {
					include: {
						product: true,
						package: true,
					},
					orderBy: { sortOrder: "asc" },
				},
			},
		});

		return { success: true, event };
	} catch (error) {
		console.error("Get event error:", error);
		return { success: false, event: null, message: "Failed to fetch event" };
	}
}

// Create a new event
export async function createEvent(data: EventFormData) {
	try {
		const authResult = await verifyEventsAdminAccess();
		if (!authResult.authorized) {
			return { success: false, message: authResult.message };
		}

		// Validate slug is unique
		const existingEvent = await prisma.shopEvent.findUnique({
			where: { slug: data.slug },
		});

		if (existingEvent) {
			return { success: false, message: "An event with this slug already exists" };
		}

		// Parse pre-serialized checkoutConfig (serialized on client to avoid RSC Flight issues)
		const parsedCheckoutConfig = data.checkoutConfig ? JSON.parse(data.checkoutConfig) : null;

		// Use transaction to create event with categories, then products
		const event = await prisma.$transaction(async (tx) => {
			// Create event with categories first
			const newEvent = await tx.shopEvent.create({
				data: {
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
					themeConfig: data.themeConfig
						? (data.themeConfig as Prisma.InputJsonValue)
						: Prisma.JsonNull,
					checkoutConfig: parsedCheckoutConfig
						? (parsedCheckoutConfig as Prisma.InputJsonValue)
						: Prisma.JsonNull,
					minDeliveryDate: data.minDeliveryDate ? new Date(data.minDeliveryDate) : null,
					maxDeliveryDate: data.maxDeliveryDate ? new Date(data.maxDeliveryDate) : null,
					blockedDeliverySlots: data.blockedDeliverySlots
						? (data.blockedDeliverySlots as Prisma.InputJsonValue)
						: Prisma.JsonNull,
					categories: {
						create: data.categories.map((c) => ({
							name: c.name,
							displayOrder: c.displayOrder,
							color: c.color || null,
						})),
					},
				},
				include: {
					categories: true,
				},
			});

			// Build category name to ID mapping for products
			const categoryNameToId = new Map<string, string>();
			newEvent.categories.forEach((cat) => {
				categoryNameToId.set(cat.name, cat.id);
			});

			// Create products with category references
			if (data.products.length > 0) {
				await tx.eventProduct.createMany({
					data: data.products.map((p) => {
						// Resolve categoryId - could be a name (for new categories)
						let resolvedCategoryId: string | null = null;
						if (p.categoryId) {
							resolvedCategoryId = categoryNameToId.get(p.categoryId) || null;
						}
						return {
							eventId: newEvent.id,
							productId: p.productId || null,
							packageId: p.packageId || null,
							sortOrder: p.sortOrder,
							eventPrice: p.eventPrice || null,
							productCode: p.productCode || null,
							categoryId: resolvedCategoryId,
							hasDailyStockLimit: p.hasDailyStockLimit || false,
							defaultMaxOrdersPerDay: p.defaultMaxOrdersPerDay || null,
							dailyStockOverrides: p.dailyStockOverrides || null,
						};
					}),
				});
			}

			return newEvent;
		});

		// Invalidate cache
		cache.deletePattern("events:");

		// Return minimal data to avoid RSC serialization issues with large JSON payloads
		return { success: true, eventId: event.id };
	} catch (error) {
		console.error("Create event error:", error);
		return { success: false, message: "Failed to create event" };
	}
}

// Update an existing event
export async function updateEvent(id: string, data: EventFormData) {
	try {
		const authResult = await verifyEventsAdminAccess();
		if (!authResult.authorized) {
			return { success: false, message: authResult.message };
		}

		// Check if slug is being changed and if new slug is unique
		const existingEvent = await prisma.shopEvent.findUnique({
			where: { slug: data.slug },
		});

		if (existingEvent && existingEvent.id !== id) {
			return { success: false, message: "An event with this slug already exists" };
		}

		// Parse pre-serialized checkoutConfig (serialized on client to avoid RSC Flight issues)
		const parsedCheckoutConfig = data.checkoutConfig ? JSON.parse(data.checkoutConfig) : null;

		// Use transaction to update event, categories, and products
		const event = await prisma.$transaction(async (tx) => {
			// Delete existing products and categories (will be recreated)
			await tx.eventProduct.deleteMany({ where: { eventId: id } });
			await tx.eventCategory.deleteMany({ where: { eventId: id } });

			// Update event and create categories
			const updatedEvent = await tx.shopEvent.update({
				where: { id },
				data: {
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
					themeConfig: data.themeConfig
						? (data.themeConfig as Prisma.InputJsonValue)
						: Prisma.JsonNull,
					checkoutConfig: parsedCheckoutConfig
						? (parsedCheckoutConfig as Prisma.InputJsonValue)
						: Prisma.JsonNull,
					minDeliveryDate: data.minDeliveryDate ? new Date(data.minDeliveryDate) : null,
					maxDeliveryDate: data.maxDeliveryDate ? new Date(data.maxDeliveryDate) : null,
					blockedDeliverySlots: data.blockedDeliverySlots
						? (data.blockedDeliverySlots as Prisma.InputJsonValue)
						: Prisma.JsonNull,
					categories: {
						create: data.categories.map((c) => ({
							name: c.name,
							displayOrder: c.displayOrder,
							color: c.color || null,
						})),
					},
				},
				include: {
					categories: true,
				},
			});

			// Build category name to ID mapping for products
			// Map both by name and by old ID (in case category already existed)
			const categoryNameToId = new Map<string, string>();
			updatedEvent.categories.forEach((cat) => {
				categoryNameToId.set(cat.name, cat.id);
			});

			// Also map old category IDs if they were provided in the input
			data.categories.forEach((inputCat, index) => {
				if (inputCat.id && updatedEvent.categories[index]) {
					categoryNameToId.set(inputCat.id, updatedEvent.categories[index].id);
				}
			});

			// Create products with category references
			if (data.products.length > 0) {
				await tx.eventProduct.createMany({
					data: data.products.map((p) => {
						// Resolve categoryId - could be a name, an old ID, or a new ID
						let resolvedCategoryId: string | null = null;
						if (p.categoryId) {
							// Try to find in our mapping (handles both name and old ID)
							resolvedCategoryId = categoryNameToId.get(p.categoryId) || null;
						}
						return {
							eventId: id,
							productId: p.productId || null,
							packageId: p.packageId || null,
							sortOrder: p.sortOrder,
							eventPrice: p.eventPrice || null,
							productCode: p.productCode || null,
							categoryId: resolvedCategoryId,
							hasDailyStockLimit: p.hasDailyStockLimit || false,
							defaultMaxOrdersPerDay: p.defaultMaxOrdersPerDay || null,
							dailyStockOverrides: p.dailyStockOverrides || null,
						};
					}),
				});
			}

			return updatedEvent;
		});

		// Invalidate cache
		cache.deletePattern("events:");

		// Return minimal data to avoid RSC serialization issues with large JSON payloads
		return { success: true, eventId: event.id };
	} catch (error) {
		console.error("Update event error:", error);
		return { success: false, message: "Failed to update event" };
	}
}

// Delete an event
export async function deleteEvent(id: string) {
	try {
		const authResult = await verifyEventsAdminAccess();
		if (!authResult.authorized) {
			return { success: false, message: authResult.message };
		}

		await prisma.shopEvent.delete({ where: { id } });

		// Invalidate cache
		cache.deletePattern("events:");

		return { success: true };
	} catch (error) {
		console.error("Delete event error:", error);
		return { success: false, message: "Failed to delete event" };
	}
}

// Get analytics data for events with different time ranges
export type AnalyticsTimeRange = "24h" | "7d" | "30d" | "all";

export async function getEventAnalytics(
	eventId: string,
	timeRange: AnalyticsTimeRange = "7d",
	eventStartDate?: Date,
	eventEndDate?: Date,
) {
	try {
		const authResult = await verifyEventsAdminAccess();
		if (!authResult.authorized) {
			return { success: false, message: authResult.message };
		}

		// Calculate date range
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
				// Use event start date if provided, otherwise 1 year ago
				startDate = eventStartDate || new Date();
				if (!eventStartDate) {
					startDate.setFullYear(startDate.getFullYear() - 1);
				}
				break;
		}

		// Get raw click data within the range
		const rawClicks = await prisma.shopClick.findMany({
			where: {
				clickedAt: { gte: startDate, lte: endDate },
				eventId,
			},
			select: {
				clickedAt: true,
			},
			orderBy: { clickedAt: "asc" },
		});

		// Get raw purchase data within the range
		const rawPurchases = await prisma.shopPurchase.findMany({
			where: {
				purchasedAt: { gte: startDate, lte: endDate },
				eventId,
			},
			select: {
				purchasedAt: true,
				totalAmount: true,
				itemCount: true,
			},
			orderBy: { purchasedAt: "asc" },
		});

		// Group data by appropriate interval (hourly for 24h, daily for others)
		const isHourly = timeRange === "24h";
		const clicksByPeriod: Record<string, number> = {};
		const purchasesByPeriod: Record<string, { count: number; revenue: number; items: number }> = {};

		// Initialize periods
		const periods: string[] = [];
		const current = new Date(startDate);
		while (current <= endDate) {
			const key = isHourly
				? current.toISOString().slice(0, 13) // YYYY-MM-DDTHH
				: current.toISOString().slice(0, 10); // YYYY-MM-DD
			periods.push(key);
			clicksByPeriod[key] = 0;
			purchasesByPeriod[key] = { count: 0, revenue: 0, items: 0 };

			if (isHourly) {
				current.setHours(current.getHours() + 1);
			} else {
				current.setDate(current.getDate() + 1);
			}
		}

		// Aggregate click data
		for (const click of rawClicks) {
			const key = isHourly
				? click.clickedAt.toISOString().slice(0, 13)
				: click.clickedAt.toISOString().slice(0, 10);
			if (clicksByPeriod[key] !== undefined) {
				clicksByPeriod[key]++;
			}
		}

		// Aggregate purchase data
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

		// Convert to arrays for charting
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

		// Calculate totals
		const totalClicks = rawClicks.length;
		const totalOrders = rawPurchases.length;
		const totalRevenue = rawPurchases.reduce((sum, p) => sum + p.totalAmount, 0);
		const totalItems = rawPurchases.reduce((sum, p) => sum + p.itemCount, 0);

		// Calculate conversion rate (purchases / clicks * 100)
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

// Get sales data grouped by item and day for Excel export
export async function getEventSalesByDay(eventId: string) {
	try {
		const authResult = await verifyEventsAdminAccess();
		if (!authResult.authorized) {
			return { success: false, message: authResult.message };
		}

		const orders = await prisma.order.findMany({
			where: {
				eventId,
				status: { not: "cancelled" },
			},
			select: {
				createdAt: true,
				orderItems: {
					select: {
						quantity: true,
						price: true,
						size: true,
						product: { select: { name: true } },
						package: { select: { name: true } },
					},
				},
			},
			orderBy: { createdAt: "asc" },
		});

		// Pivot: itemKey -> date -> { qty, revenue }
		const itemsByDate: Record<string, Record<string, { qty: number; revenue: number }>> = {};
		const allDates = new Set<string>();
		const itemMeta: Record<string, { name: string; size: string }> = {};

		for (const order of orders) {
			const dateKey = order.createdAt.toISOString().slice(0, 10);
			allDates.add(dateKey);

			for (const item of order.orderItems) {
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

// ============================================
// Event Admin Management
// ============================================

// Get all users (for adding event admins)
export async function searchUsers(query: string) {
	try {
		const authResult = await verifyEventsAdminAccess();
		if (!authResult.authorized) {
			return { success: false, message: authResult.message };
		}

		// Only shop admins can manage event admins
		const currentUser = await prisma.user.findUnique({
			where: { id: authResult.userId },
			select: { isShopAdmin: true },
		});

		if (!currentUser?.isShopAdmin) {
			return { success: false, message: "Only shop admins can manage event admins" };
		}

		const users = await prisma.user.findMany({
			where: {
				OR: [
					{ email: { contains: query, mode: "insensitive" } },
					{ name: { contains: query, mode: "insensitive" } },
				],
			},
			select: {
				id: true,
				email: true,
				name: true,
				image: true,
			},
			take: 10,
		});

		return { success: true, users };
	} catch (error) {
		console.error("Search users error:", error);
		return { success: false, message: "Failed to search users" };
	}
}

// Get event admins for an event
export async function getEventAdmins(eventId: string) {
	try {
		const authResult = await verifyEventsAdminAccess();
		if (!authResult.authorized) {
			return { success: false, message: authResult.message };
		}

		const admins = await prisma.eventAdmin.findMany({
			where: { eventId },
			include: {
				user: {
					select: {
						id: true,
						email: true,
						name: true,
						image: true,
					},
				},
			},
		});

		return { success: true, admins };
	} catch (error) {
		console.error("Get event admins error:", error);
		return { success: false, message: "Failed to fetch event admins" };
	}
}

// Add event admin
export async function addEventAdmin(eventId: string, userId: string) {
	try {
		const authResult = await verifyEventsAdminAccess();
		if (!authResult.authorized) {
			return { success: false, message: authResult.message };
		}

		// Only shop admins can add event admins
		const currentUser = await prisma.user.findUnique({
			where: { id: authResult.userId },
			select: { isShopAdmin: true },
		});

		if (!currentUser?.isShopAdmin) {
			return { success: false, message: "Only shop admins can manage event admins" };
		}

		// Check if already an admin
		const existing = await prisma.eventAdmin.findUnique({
			where: {
				eventId_userId: { eventId, userId },
			},
		});

		if (existing) {
			return { success: false, message: "User is already an admin for this event" };
		}

		await prisma.eventAdmin.create({
			data: { eventId, userId },
		});

		return { success: true };
	} catch (error) {
		console.error("Add event admin error:", error);
		return { success: false, message: "Failed to add event admin" };
	}
}

// Remove event admin
export async function removeEventAdmin(eventId: string, userId: string) {
	try {
		const authResult = await verifyEventsAdminAccess();
		if (!authResult.authorized) {
			return { success: false, message: authResult.message };
		}

		// Only shop admins can remove event admins
		const currentUser = await prisma.user.findUnique({
			where: { id: authResult.userId },
			select: { isShopAdmin: true },
		});

		if (!currentUser?.isShopAdmin) {
			return { success: false, message: "Only shop admins can manage event admins" };
		}

		await prisma.eventAdmin.delete({
			where: {
				eventId_userId: { eventId, userId },
			},
		});

		return { success: true };
	} catch (error) {
		console.error("Remove event admin error:", error);
		return { success: false, message: "Failed to remove event admin" };
	}
}

// Get events that the current user can admin (for non-shop admins)
export async function getMyEvents() {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session?.user) {
			return { success: false, message: "Unauthorized" };
		}

		const user = await prisma.user.findUnique({
			where: { id: session.user.id },
			select: {
				isShopAdmin: true,
				isEventsAdmin: true,
				eventAdmins: {
					include: {
						event: true,
					},
				},
			},
		});

		if (!user) {
			return { success: false, message: "User not found" };
		}

		// Shop admins can see all events
		if (user.isShopAdmin) {
			const events = await prisma.shopEvent.findMany({
				orderBy: { createdAt: "desc" },
			});
			return { success: true, events, isShopAdmin: true };
		}

		// Event admins or event-specific admins can see their assigned events
		if (user.isEventsAdmin) {
			const events = await prisma.shopEvent.findMany({
				orderBy: { createdAt: "desc" },
			});
			return { success: true, events, isShopAdmin: false };
		}

		// Get events this user is specifically assigned to
		const events = user.eventAdmins.map((ea) => ea.event);
		return { success: true, events, isShopAdmin: false };
	} catch (error) {
		console.error("Get my events error:", error);
		return { success: false, message: "Failed to fetch events" };
	}
}
