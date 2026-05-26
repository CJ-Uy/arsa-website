"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { event, eventShop, eventTickets, eventLanding, redirects, eventRoleGrant } from "@/db/schema";
import { requireEventRole, ForbiddenError, type EventRole } from "@/lib/eventPermissions";

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
