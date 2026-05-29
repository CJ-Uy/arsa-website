"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { event, eventRoleGrant, user as userTable } from "@/db/schema";
import { ForbiddenError, getUserEventRoles } from "@/lib/eventPermissions";

const RESERVED_SLUGS = new Set([
	"shop", "admin", "api", "about", "calendar", "publications", "merch",
	"resources", "contact", "redirects", "ticket-verify", "faq", "home",
	"bridges", "sign-in", "sign-out", "_next", "favicon.ico", "robots.txt",
	"sitemap.xml", "_custom", "events",
]);

export async function createEvent(form: {
	name: string;
	slug: string;
	description: string | null;
}) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) throw new ForbiddenError();

	const u = await db.query.user.findFirst({
		where: eq(userTable.id, session.user.id),
		columns: { isSuperAdmin: true, isShopAdmin: true, isEventsAdmin: true },
	});
	if (!(u?.isSuperAdmin || u?.isShopAdmin || u?.isEventsAdmin)) throw new ForbiddenError();

	const cleanSlug = form.slug.trim().toLowerCase();
	if (!/^[a-z0-9-]+$/.test(cleanSlug)) throw new Error("Slug must contain only lowercase letters, numbers, and hyphens");
	if (RESERVED_SLUGS.has(cleanSlug)) throw new Error("Reserved slug");

	const collision = await db.query.event.findFirst({ where: eq(event.slug, cleanSlug), columns: { id: true } });
	if (collision) throw new Error("Slug already taken");

	const id = crypto.randomUUID();
	await db.insert(event).values({
		id,
		name: form.name.trim(),
		slug: cleanSlug,
		description: form.description ?? null,
		status: "draft",
		priority: 0,
		heroImages: [],
	});

	await db.insert(eventRoleGrant).values({
		id: crypto.randomUUID(),
		eventId: id,
		userId: session.user.id,
		role: "overseer",
		grantedBy: session.user.id,
	});

	revalidatePath("/admin/events");
	return { id, slug: cleanSlug };
}

export async function deleteEvent(eventId: string) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) throw new ForbiddenError();

	const { roles } = await getUserEventRoles(session.user.id, eventId);
	if (!roles.includes("overseer")) throw new ForbiddenError();

	await db.delete(event).where(eq(event.id, eventId));
	revalidatePath("/admin/events");
}
