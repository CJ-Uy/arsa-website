import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { eventRoleGrant, user as userTable, event } from "@/db/schema";

export type EventRole = "overseer" | "shop_admin" | "tickets_admin" | "content_admin";

export type ResolvedRoles = {
	roles: EventRole[];
	fromGlobal: boolean;
	fromGrant: boolean;
};

export async function getUserEventRoles(userId: string, eventId: string): Promise<ResolvedRoles> {
	const u = await db.query.user.findFirst({
		where: eq(userTable.id, userId),
		columns: {
			isSuperAdmin: true,
			isShopAdmin: true,
			isEventsAdmin: true,
			isTicketsAdmin: true,
		},
	});

	const implicit: EventRole[] = [];
	if (u?.isSuperAdmin || u?.isShopAdmin || u?.isEventsAdmin) implicit.push("overseer");
	if (u?.isTicketsAdmin) implicit.push("tickets_admin");

	const grants = await db.query.eventRoleGrant.findMany({
		where: and(eq(eventRoleGrant.userId, userId), eq(eventRoleGrant.eventId, eventId)),
		columns: { role: true },
	});

	const explicit = grants.map((g) => g.role as EventRole);

	return {
		roles: Array.from(new Set([...implicit, ...explicit])),
		fromGlobal: implicit.length > 0,
		fromGrant: explicit.length > 0,
	};
}

export async function getUserAccessibleEvents(userId: string): Promise<Map<string, EventRole[]>> {
	const u = await db.query.user.findFirst({
		where: eq(userTable.id, userId),
		columns: {
			isSuperAdmin: true,
			isShopAdmin: true,
			isEventsAdmin: true,
			isTicketsAdmin: true,
		},
	});

	const grants = await db.query.eventRoleGrant.findMany({
		where: eq(eventRoleGrant.userId, userId),
		columns: { eventId: true, role: true },
	});

	const map = new Map<string, EventRole[]>();
	for (const g of grants) {
		const list = map.get(g.eventId) ?? [];
		list.push(g.role as EventRole);
		map.set(g.eventId, list);
	}

	if (u?.isSuperAdmin || u?.isShopAdmin || u?.isEventsAdmin || u?.isTicketsAdmin) {
		const allEvents = await db.query.event.findMany({ columns: { id: true } });
		for (const e of allEvents) {
			const existing = map.get(e.id) ?? [];
			const implicit: EventRole[] = [];
			if (u.isSuperAdmin || u.isShopAdmin || u.isEventsAdmin) implicit.push("overseer");
			if (u.isTicketsAdmin) implicit.push("tickets_admin");
			map.set(e.id, Array.from(new Set([...existing, ...implicit])));
		}
	}

	return map;
}

export class ForbiddenError extends Error {
	constructor() {
		super("forbidden");
	}
}

export async function requireEventRole(
	userId: string,
	eventId: string,
	allowed: EventRole[],
): Promise<void> {
	const { roles } = await getUserEventRoles(userId, eventId);
	if (roles.includes("overseer")) return;
	if (!roles.some((r) => allowed.includes(r))) throw new ForbiddenError();
}
