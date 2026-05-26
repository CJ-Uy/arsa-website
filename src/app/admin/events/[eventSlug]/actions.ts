"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { and, asc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { event, eventShop, eventTickets, eventLanding, eventPage, redirects, eventRoleGrant, eventCategory, ticketVerifier } from "@/db/schema";
import { requireEventRole, ForbiddenError, type EventRole } from "@/lib/eventPermissions";
import {
	bulkGenerateTickets as _bulkGenerateTickets,
	getTicketsForEvent as _getTicketsForEvent,
	deleteTickets as _deleteTickets,
	resetTicketScans as _resetTicketScans,
	exportTicketsForMailMerge as _exportTicketsForMailMerge,
	addTicketVerifier as _addTicketVerifier,
	removeTicketVerifier as _removeTicketVerifier,
	searchUsers as _searchUsers,
	syncTicketsToSheet as _syncTicketsToSheet,
} from "@/app/admin/tickets/actions";

const RESERVED_SLUGS = new Set([
	"shop", "admin", "api", "about", "calendar", "publications", "merch",
	"resources", "contact", "redirects", "ticket-verify", "faq", "home",
	"bridges", "sign-in", "sign-out", "_next", "favicon.ico", "robots.txt",
	"sitemap.xml", "_custom", "events",
]);

export type EventSettingsForm = {
	name: string;
	slug: string;
	description: string | null;
	status: "draft" | "active" | "archived";
	startDate: number | null;
	endDate: number | null;
	priority: number;
	tabLabel: string | null;
	ogImage: string | null;
	metaTitle: string | null;
	metaDescription: string | null;
};

async function authedUserId(): Promise<string> {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) throw new ForbiddenError();
	return session.user.id;
}

export async function updateEventSettings(eventId: string, form: EventSettingsForm) {
	const userId = await authedUserId();
	// requireEventRole with empty allowed array only passes for overseer (guard short-circuits on overseer)
	await requireEventRole(userId, eventId, ["overseer"]);

	if (RESERVED_SLUGS.has(form.slug)) throw new Error("Slug is reserved");
	const collision = await db.query.event.findFirst({ where: eq(event.slug, form.slug), columns: { id: true } });
	if (collision && collision.id !== eventId) throw new Error("Slug already in use");

	const current = await db.query.event.findFirst({ where: eq(event.id, eventId) });
	if (!current) throw new Error("Event not found");

	// If slug changed, write a Redirects row so the old URL keeps working
	if (current.slug !== form.slug) {
		await db.insert(redirects).values({
			newURL: `/${form.slug}`,
			redirectCode: current.slug,
		}).onConflictDoNothing();
	}

	await db.update(event).set({
		name: form.name,
		slug: form.slug,
		description: form.description,
		status: form.status,
		startDate: form.startDate ? new Date(form.startDate) : null,
		endDate: form.endDate ? new Date(form.endDate) : null,
		priority: form.priority,
		tabLabel: form.tabLabel,
		ogImage: form.ogImage,
		metaTitle: form.metaTitle,
		metaDescription: form.metaDescription,
		updatedAt: new Date(),
	}).where(eq(event.id, eventId));

	revalidatePath(`/admin/events/${form.slug}`);
}

export async function toggleModule(
	eventId: string,
	module: "shop" | "tickets" | "landing",
	enabled: boolean,
) {
	const userId = await authedUserId();
	const guardRoles =
		module === "shop" ? (["shop_admin"] as const) :
		module === "tickets" ? (["tickets_admin"] as const) :
		(["content_admin"] as const);
	await requireEventRole(userId, eventId, [...guardRoles]);

	const now = new Date();
	if (module === "shop") {
		await db.update(eventShop).set({ enabled, lastToggledBy: userId, lastToggledAt: now }).where(eq(eventShop.eventId, eventId));
	} else if (module === "tickets") {
		await db.update(eventTickets).set({ enabled, lastToggledBy: userId, lastToggledAt: now }).where(eq(eventTickets.eventId, eventId));
	} else {
		await db.update(eventLanding).set({ published: enabled, lastToggledBy: userId, lastToggledAt: now }).where(eq(eventLanding.eventId, eventId));
	}

	const e = await db.query.event.findFirst({ where: eq(event.id, eventId), columns: { slug: true } });
	if (e) revalidatePath(`/admin/events/${e.slug}`);
}

export async function listGrants(eventId: string) {
	const userId = await authedUserId();
	await requireEventRole(userId, eventId, ["overseer"]);
	return db.query.eventRoleGrant.findMany({
		where: eq(eventRoleGrant.eventId, eventId),
		with: { user: true },
	});
}

export async function grantRole(
	eventId: string,
	targetUserId: string,
	role: EventRole,
) {
	const userId = await authedUserId();
	await requireEventRole(userId, eventId, ["overseer"]);
	await db.insert(eventRoleGrant).values({
		eventId,
		userId: targetUserId,
		role,
		grantedBy: userId,
	}).onConflictDoNothing();
	const e = await db.query.event.findFirst({ where: eq(event.id, eventId), columns: { slug: true } });
	if (e) revalidatePath(`/admin/events/${e.slug}/admins`);
}

export async function revokeRole(eventId: string, grantId: string) {
	const userId = await authedUserId();
	await requireEventRole(userId, eventId, ["overseer"]);
	await db.delete(eventRoleGrant).where(eq(eventRoleGrant.id, grantId));
	const e = await db.query.event.findFirst({ where: eq(event.id, eventId), columns: { slug: true } });
	if (e) revalidatePath(`/admin/events/${e.slug}/admins`);
}

export async function searchUsersForGrant(query: string) {
	await authedUserId();
	if (query.length < 2) return [];
	return db.query.user.findMany({
		where: (u, { or, like }) => or(like(u.email, `%${query}%`), like(u.name, `%${query}%`)),
		columns: { id: true, name: true, email: true, image: true },
		limit: 10,
	});
}

export async function saveLanding(
	eventId: string,
	body: unknown,
	codePath: string | null,
	publish: boolean,
) {
	const userId = await authedUserId();
	await requireEventRole(userId, eventId, ["content_admin"]);

	const existing = await db.query.eventLanding.findFirst({
		where: eq(eventLanding.eventId, eventId),
	});

	const now = new Date();
	if (existing) {
		await db
			.update(eventLanding)
			.set({
				body,
				codePath,
				updatedAt: now,
				...(publish !== existing.published
					? { published: publish, lastToggledBy: userId, lastToggledAt: now }
					: {}),
			})
			.where(eq(eventLanding.eventId, eventId));
	} else {
		await db.insert(eventLanding).values({
			eventId,
			body,
			codePath,
			published: publish,
			lastToggledBy: publish ? userId : null,
			lastToggledAt: publish ? now : null,
			createdAt: now,
			updatedAt: now,
		});
	}

	const e = await db.query.event.findFirst({
		where: eq(event.id, eventId),
		columns: { slug: true },
	});
	if (e) revalidatePath(`/admin/events/${e.slug}/landing`);
}

// ─── Event Page CRUD ────────────────────────────────────────────────────────

export async function listPages(eventId: string) {
	const userId = await authedUserId();
	await requireEventRole(userId, eventId, ["content_admin"]);
	return db.query.eventPage.findMany({
		where: eq(eventPage.eventId, eventId),
		orderBy: (p, { asc }) => [asc(p.sortOrder), asc(p.title)],
	});
}

export async function createPage(eventId: string, pageSlug: string, title: string) {
	const userId = await authedUserId();
	await requireEventRole(userId, eventId, ["content_admin"]);

	const cleanSlug = pageSlug.trim().toLowerCase();
	if (!/^[a-z0-9-]+$/.test(cleanSlug)) throw new Error("Slug must contain only lowercase letters, numbers, and hyphens");
	const conflict = await db.query.eventPage.findFirst({
		where: and(eq(eventPage.eventId, eventId), eq(eventPage.pageSlug, cleanSlug)),
		columns: { id: true },
	});
	if (conflict) throw new Error("A page with this slug already exists");

	const id = crypto.randomUUID();
	const now = new Date();
	await db.insert(eventPage).values({
		id,
		eventId,
		pageSlug: cleanSlug,
		title,
		body: null,
		published: false,
		sortOrder: 0,
		createdAt: now,
		updatedAt: now,
	});
	const e = await db.query.event.findFirst({ where: eq(event.id, eventId), columns: { slug: true } });
	if (e) revalidatePath(`/admin/events/${e.slug}/pages`);
	return { id, pageSlug: cleanSlug };
}

export async function updatePage(
	pageId: string,
	body: unknown,
	title: string,
	codePath: string | null,
	published: boolean,
	sortOrder: number,
) {
	const userId = await authedUserId();
	const p = await db.query.eventPage.findFirst({ where: eq(eventPage.id, pageId) });
	if (!p) throw new Error("Page not found");
	await requireEventRole(userId, p.eventId, ["content_admin"]);
	const now = new Date();
	await db
		.update(eventPage)
		.set({
			title,
			body,
			codePath,
			sortOrder,
			updatedAt: now,
			...(published !== p.published
				? { published, lastToggledBy: userId, lastToggledAt: now }
				: {}),
		})
		.where(eq(eventPage.id, pageId));
	const e = await db.query.event.findFirst({
		where: eq(event.id, p.eventId),
		columns: { slug: true },
	});
	if (e) revalidatePath(`/admin/events/${e.slug}/pages`);
}

export async function deletePage(pageId: string) {
	const userId = await authedUserId();
	const p = await db.query.eventPage.findFirst({ where: eq(eventPage.id, pageId) });
	if (!p) throw new Error("Page not found");
	await requireEventRole(userId, p.eventId, ["content_admin"]);
	await db.delete(eventPage).where(eq(eventPage.id, pageId));
	const e = await db.query.event.findFirst({
		where: eq(event.id, p.eventId),
		columns: { slug: true },
	});
	if (e) revalidatePath(`/admin/events/${e.slug}/pages`);
}

export async function getPageBySlug(eventId: string, pageSlug: string) {
	const userId = await authedUserId();
	await requireEventRole(userId, eventId, ["content_admin"]);
	return db.query.eventPage.findFirst({
		where: and(eq(eventPage.eventId, eventId), eq(eventPage.pageSlug, pageSlug)),
	});
}

// ─── Shop Config ────────────────────────────────────────────────────────────

export type ShopConfigForm = {
	isShopClosed: boolean;
	closureMessage: string | null;
	codePath: string | null;
	allowScheduledDelivery: boolean;
	deliveryLeadDays: number;
	dailyCutoffTime: string | null;
	hasCustomCheckout: boolean;
};

export async function saveShopConfig(eventId: string, form: ShopConfigForm) {
	const userId = await authedUserId();
	await requireEventRole(userId, eventId, ["shop_admin"]);
	await db
		.update(eventShop)
		.set({
			isShopClosed: form.isShopClosed,
			closureMessage: form.closureMessage,
			codePath: form.codePath,
			allowScheduledDelivery: form.allowScheduledDelivery,
			deliveryLeadDays: form.deliveryLeadDays,
			dailyCutoffTime: form.dailyCutoffTime,
			hasCustomCheckout: form.hasCustomCheckout,
		})
		.where(eq(eventShop.eventId, eventId));
	const e = await db.query.event.findFirst({ where: eq(event.id, eventId), columns: { slug: true } });
	if (e) revalidatePath(`/admin/events/${e.slug}/shop`);
}

// ─── Categories ─────────────────────────────────────────────────────────────

export async function listCategories(eventId: string) {
	const userId = await authedUserId();
	await requireEventRole(userId, eventId, ["shop_admin"]);
	return db
		.select()
		.from(eventCategory)
		.where(eq(eventCategory.eventId, eventId))
		.orderBy(asc(eventCategory.displayOrder));
}

export async function createCategory(eventId: string, name: string, color: string | null) {
	const userId = await authedUserId();
	await requireEventRole(userId, eventId, ["shop_admin"]);
	const existing = await db
		.select({ displayOrder: eventCategory.displayOrder })
		.from(eventCategory)
		.where(eq(eventCategory.eventId, eventId));
	const maxOrder = existing.reduce((m, c) => Math.max(m, c.displayOrder), -1);
	const catId = crypto.randomUUID();
	await db.insert(eventCategory).values({ id: catId, eventId, name, displayOrder: maxOrder + 1, color });
	const e = await db.query.event.findFirst({ where: eq(event.id, eventId), columns: { slug: true } });
	if (e) revalidatePath(`/admin/events/${e.slug}/shop/categories`);
	return catId;
}

export async function updateCategory(categoryId: string, name: string, color: string | null) {
	const userId = await authedUserId();
	const cat = await db.query.eventCategory.findFirst({ where: eq(eventCategory.id, categoryId) });
	if (!cat) throw new Error("Category not found");
	await requireEventRole(userId, cat.eventId, ["shop_admin"]);
	await db.update(eventCategory).set({ name, color }).where(eq(eventCategory.id, categoryId));
	const e = await db.query.event.findFirst({ where: eq(event.id, cat.eventId), columns: { slug: true } });
	if (e) revalidatePath(`/admin/events/${e.slug}/shop/categories`);
}

export async function deleteCategory(categoryId: string) {
	const userId = await authedUserId();
	const cat = await db.query.eventCategory.findFirst({ where: eq(eventCategory.id, categoryId) });
	if (!cat) throw new Error("Category not found");
	await requireEventRole(userId, cat.eventId, ["shop_admin"]);
	await db.delete(eventCategory).where(eq(eventCategory.id, categoryId));
	const e = await db.query.event.findFirst({ where: eq(event.id, cat.eventId), columns: { slug: true } });
	if (e) revalidatePath(`/admin/events/${e.slug}/shop/categories`);
}

export async function reorderCategory(categoryId: string, newOrder: number) {
	const userId = await authedUserId();
	const cat = await db.query.eventCategory.findFirst({ where: eq(eventCategory.id, categoryId) });
	if (!cat) throw new Error("Category not found");
	await requireEventRole(userId, cat.eventId, ["shop_admin"]);
	await db.update(eventCategory).set({ displayOrder: newOrder }).where(eq(eventCategory.id, categoryId));
	const e = await db.query.event.findFirst({ where: eq(event.id, cat.eventId), columns: { slug: true } });
	if (e) revalidatePath(`/admin/events/${e.slug}/shop/categories`);
}

// ─── Ticket wrappers ────────────────────────────────────────────────────────

export async function getEventTickets(eventId: string) {
	const userId = await authedUserId();
	await requireEventRole(userId, eventId, ["tickets_admin"]);
	return _getTicketsForEvent(eventId);
}

export async function generateTickets(eventId: string, csvText: string) {
	const userId = await authedUserId();
	await requireEventRole(userId, eventId, ["tickets_admin"]);
	return _bulkGenerateTickets(eventId, csvText);
}

export async function deleteEventTickets(eventId: string, ticketIds: string[]) {
	const userId = await authedUserId();
	await requireEventRole(userId, eventId, ["tickets_admin"]);
	return _deleteTickets(ticketIds);
}

export async function resetEventTicketScans(eventId: string, ticketIds: string[]) {
	const userId = await authedUserId();
	await requireEventRole(userId, eventId, ["tickets_admin"]);
	return _resetTicketScans(ticketIds);
}

export async function exportTicketsCsv(eventId: string) {
	const userId = await authedUserId();
	await requireEventRole(userId, eventId, ["tickets_admin"]);
	return _exportTicketsForMailMerge(eventId);
}

export async function syncEventTicketsToSheet(eventId: string) {
	const userId = await authedUserId();
	await requireEventRole(userId, eventId, ["tickets_admin"]);
	return _syncTicketsToSheet(eventId);
}

export async function addEventTicketVerifier(eventId: string, targetUserId: string) {
	const userId = await authedUserId();
	await requireEventRole(userId, eventId, ["tickets_admin"]);
	return _addTicketVerifier(eventId, targetUserId);
}

export async function removeEventTicketVerifier(eventId: string, targetUserId: string) {
	const userId = await authedUserId();
	await requireEventRole(userId, eventId, ["tickets_admin"]);
	return _removeTicketVerifier(eventId, targetUserId);
}

export async function searchUsersForTickets(query: string) {
	await authedUserId();
	return _searchUsers(query);
}

export async function listEventVerifiers(eventId: string) {
	const userId = await authedUserId();
	await requireEventRole(userId, eventId, ["tickets_admin"]);
	return db.query.ticketVerifier.findMany({
		where: eq(ticketVerifier.ticketEventId, eventId),
		with: { user: { columns: { id: true, name: true, email: true, image: true } } },
	});
}

export async function saveTicketConfig(eventId: string, config: { sheetSyncEnabled: boolean }) {
	const userId = await authedUserId();
	await requireEventRole(userId, eventId, ["tickets_admin"]);
	await db
		.update(eventTickets)
		.set({
			sheetSyncEnabled: config.sheetSyncEnabled,
			lastToggledBy: userId,
			lastToggledAt: new Date(),
		})
		.where(eq(eventTickets.eventId, eventId));
	const e = await db.query.event.findFirst({ where: eq(event.id, eventId), columns: { slug: true } });
	if (e) revalidatePath(`/admin/events/${e.slug}/tickets`);
}
