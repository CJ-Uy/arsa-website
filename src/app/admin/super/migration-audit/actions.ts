"use server";

import { db } from "@/lib/db";
import { event, eventShop, eventTickets, ticketEvent, ticket, ticketVerifier } from "@/db/schema";
import { eq, sql, notExists } from "drizzle-orm";

export type AuditRow = {
	eventId: string;
	slug: string;
	name: string;
	status: string;
	hasShopRow: boolean;
	hasTicketsRow: boolean;
};

export async function getAuditData(): Promise<{
	events: AuditRow[];
	unmatchedTicketEvents: { id: string; name: string }[];
}> {
	const rows = await db
		.select({
			id: event.id,
			slug: event.slug,
			name: event.name,
			status: event.status,
			shopEventId: eventShop.eventId,
			ticketsEventId: eventTickets.eventId,
		})
		.from(event)
		.leftJoin(eventShop, eq(event.id, eventShop.eventId))
		.leftJoin(eventTickets, eq(event.id, eventTickets.eventId))
		.orderBy(event.createdAt);

	const unmatched = await db
		.select({ id: ticketEvent.id, name: ticketEvent.name })
		.from(ticketEvent)
		.where(
			notExists(
				db.select({ one: sql<number>`1` }).from(eventTickets).where(eq(eventTickets.eventId, ticketEvent.id)),
			),
		);

	return {
		events: rows.map((r) => ({
			eventId: r.id,
			slug: r.slug,
			name: r.name,
			status: r.status,
			hasShopRow: r.shopEventId != null,
			hasTicketsRow: r.ticketsEventId != null,
		})),
		unmatchedTicketEvents: unmatched,
	};
}

export async function mergeTicketEventIntoEvent(ticketEventId: string, targetEventId: string) {
	await db
		.insert(eventTickets)
		.values({ eventId: targetEventId, enabled: false, defaultActive: true, sheetSyncEnabled: false })
		.onConflictDoNothing();
	await db.update(ticket).set({ ticketEventId: targetEventId }).where(eq(ticket.ticketEventId, ticketEventId));
	await db
		.update(ticketVerifier)
		.set({ ticketEventId: targetEventId })
		.where(eq(ticketVerifier.ticketEventId, ticketEventId));
}

export async function renameEventSlug(eventId: string, newSlug: string) {
	await db.update(event).set({ slug: newSlug }).where(eq(event.id, eventId));
}
