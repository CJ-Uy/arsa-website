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
	| "message"; // Display-only informational message

export type RepeaterColumn = {
	id: string;
	label: string;
	type: "text" | "date" | "time" | "select";
	placeholder?: string;
	options?: string[];
	width?: "sm" | "md" | "lg";
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
	// Conditional display
	showWhen?: FieldCondition;
	// Message field content
	messageContent?: string;
	// Repeater-specific fields
	columns?: RepeaterColumn[];
	minRows?: number;
	maxRows?: number;
	defaultRows?: number;
};

export type CheckoutConfig = {
	headerMessage?: string;
	additionalFields: CheckoutField[];
	termsMessage?: string;
	confirmationMessage?: string;
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
	checkoutConfig: CheckoutConfig | null;
	products: EventProductInput[];
};

// Get all events with their products
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

		const event = await prisma.shopEvent.create({
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
				startDate: new Date(data.startDate),
				endDate: new Date(data.endDate),
				componentPath: data.componentPath || null,
				themeConfig: data.themeConfig
					? (data.themeConfig as Prisma.InputJsonValue)
					: Prisma.JsonNull,
				checkoutConfig: data.checkoutConfig
					? (data.checkoutConfig as Prisma.InputJsonValue)
					: Prisma.JsonNull,
				products: {
					create: data.products.map((p) => ({
						productId: p.productId || null,
						packageId: p.packageId || null,
						sortOrder: p.sortOrder,
						eventPrice: p.eventPrice || null,
					})),
				},
			},
		});

		// Invalidate cache
		cache.deletePattern("events:");

		return { success: true, event };
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

		// Delete existing event products (will be recreated)
		await prisma.eventProduct.deleteMany({ where: { eventId: id } });

		const event = await prisma.shopEvent.update({
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
				startDate: new Date(data.startDate),
				endDate: new Date(data.endDate),
				componentPath: data.componentPath || null,
				themeConfig: data.themeConfig
					? (data.themeConfig as Prisma.InputJsonValue)
					: Prisma.JsonNull,
				checkoutConfig: data.checkoutConfig
					? (data.checkoutConfig as Prisma.InputJsonValue)
					: Prisma.JsonNull,
				products: {
					create: data.products.map((p) => ({
						productId: p.productId || null,
						packageId: p.packageId || null,
						sortOrder: p.sortOrder,
						eventPrice: p.eventPrice || null,
					})),
				},
			},
		});

		// Invalidate cache
		cache.deletePattern("events:");

		return { success: true, event };
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

// Get analytics data for events
export async function getEventAnalytics(eventId?: string, days: number = 30) {
	try {
		const authResult = await verifyEventsAdminAccess();
		if (!authResult.authorized) {
			return { success: false, message: authResult.message };
		}

		const startDate = new Date();
		startDate.setDate(startDate.getDate() - days);

		// Get click data
		const clicks = await prisma.shopClick.groupBy({
			by: ["clickedAt"],
			where: {
				clickedAt: { gte: startDate },
				...(eventId && { eventId }),
			},
			_count: true,
		});

		// Get purchase data
		const purchases = await prisma.shopPurchase.groupBy({
			by: ["purchasedAt"],
			where: {
				purchasedAt: { gte: startDate },
				...(eventId && { eventId }),
			},
			_count: true,
			_sum: {
				totalAmount: true,
				itemCount: true,
			},
		});

		// Get totals
		const totalClicks = await prisma.shopClick.count({
			where: {
				clickedAt: { gte: startDate },
				...(eventId && { eventId }),
			},
		});

		const purchaseStats = await prisma.shopPurchase.aggregate({
			where: {
				purchasedAt: { gte: startDate },
				...(eventId && { eventId }),
			},
			_count: true,
			_sum: {
				totalAmount: true,
				itemCount: true,
			},
		});

		return {
			success: true,
			analytics: {
				clicks,
				purchases,
				totals: {
					clicks: totalClicks,
					orders: purchaseStats._count,
					revenue: purchaseStats._sum.totalAmount || 0,
					items: purchaseStats._sum.itemCount || 0,
				},
			},
		};
	} catch (error) {
		console.error("Get analytics error:", error);
		return { success: false, message: "Failed to fetch analytics" };
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
