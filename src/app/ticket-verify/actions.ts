"use server";

import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user, ticket, ticketVerifier } from "@/db/schema";

async function getVerifierSession() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) return null;
	return session;
}

export async function scanTicket(shortCode: string) {
	const session = await getVerifierSession();
	if (!session)
		return { success: false, message: "Please log in to verify tickets", code: "UNAUTHORIZED" };

	const u = await db.query.user.findFirst({
		where: eq(user.id, session.user.id),
		columns: { isTicketsAdmin: true },
	});
	if (!u) return { success: false, message: "User not found", code: "UNAUTHORIZED" };

	const verifiers = await db.query.ticketVerifier.findMany({
		where: eq(ticketVerifier.userId, session.user.id),
		columns: { ticketEventId: true },
	});

	const hasAnyAccess = u.isTicketsAdmin || verifiers.length > 0;
	if (!hasAnyAccess) {
		return {
			success: false,
			message: "You are not assigned as a ticket verifier",
			code: "FORBIDDEN",
		};
	}

	const code = shortCode.toUpperCase().trim();
	const found = await db.query.ticket.findFirst({
		where: eq(ticket.shortCode, code),
		with: {
			ticketEvent: { columns: { id: true, name: true } },
			scannedBy: { columns: { name: true, email: true } },
		},
	});

	if (!found) {
		return { success: false, message: "Ticket not found", code: "NOT_FOUND" };
	}

	const hasEventAccess =
		u.isTicketsAdmin || verifiers.some((v) => v.ticketEventId === found.ticketEventId);
	if (!hasEventAccess) {
		return {
			success: false,
			message: "You are not authorized to verify tickets for this event",
			code: "FORBIDDEN",
		};
	}

	if (found.scanned) {
		return {
			success: false,
			message: "Ticket already scanned",
			code: "ALREADY_SCANNED",
			ticket: {
				shortCode: found.shortCode,
				email: found.email,
				eventName: found.ticketEvent.name,
				scannedAt: found.scannedAt?.toISOString() || null,
				scannedBy: found.scannedBy
					? { name: found.scannedBy.name, email: found.scannedBy.email }
					: null,
			},
		};
	}

	await db
		.update(ticket)
		.set({ scanned: true, scannedAt: new Date(), scannedById: session.user.id })
		.where(eq(ticket.shortCode, code));

	const updated = await db.query.ticket.findFirst({
		where: eq(ticket.shortCode, code),
		with: {
			ticketEvent: { columns: { name: true } },
			scannedBy: { columns: { name: true, email: true } },
		},
	});

	return {
		success: true,
		message: "Ticket verified successfully",
		code: "VALID",
		ticket: {
			shortCode: updated!.shortCode,
			email: updated!.email,
			eventName: updated!.ticketEvent.name,
			scannedAt: updated!.scannedAt?.toISOString() || null,
			scannedBy: updated!.scannedBy
				? { name: updated!.scannedBy.name, email: updated!.scannedBy.email }
				: null,
		},
	};
}
