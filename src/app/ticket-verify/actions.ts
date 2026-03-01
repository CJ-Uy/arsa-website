"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

async function getVerifierSession() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});
	if (!session?.user) return null;
	return session;
}

async function getVerifierAccess(userId: string) {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: {
			isTicketsAdmin: true,
			ticketVerifiers: { select: { ticketEventId: true } },
		},
	});
	return user;
}

export async function scanTicket(shortCode: string) {
	const session = await getVerifierSession();
	if (!session) return { success: false, message: "Please log in to verify tickets", code: "UNAUTHORIZED" };

	const user = await getVerifierAccess(session.user.id);
	if (!user) return { success: false, message: "User not found", code: "UNAUTHORIZED" };

	const hasAnyAccess = user.isTicketsAdmin || user.ticketVerifiers.length > 0;
	if (!hasAnyAccess) {
		return { success: false, message: "You are not assigned as a ticket verifier", code: "FORBIDDEN" };
	}

	// Find the ticket
	const ticket = await prisma.ticket.findUnique({
		where: { shortCode: shortCode.toUpperCase().trim() },
		include: {
			ticketEvent: { select: { id: true, name: true } },
			scannedBy: { select: { name: true, email: true } },
		},
	});

	if (!ticket) {
		return { success: false, message: "Ticket not found", code: "NOT_FOUND" };
	}

	// Check the verifier has access to this event
	const hasEventAccess =
		user.isTicketsAdmin ||
		user.ticketVerifiers.some((v) => v.ticketEventId === ticket.ticketEventId);

	if (!hasEventAccess) {
		return {
			success: false,
			message: "You are not authorized to verify tickets for this event",
			code: "FORBIDDEN",
		};
	}

	// Already scanned?
	if (ticket.scanned) {
		return {
			success: false,
			message: "Ticket already scanned",
			code: "ALREADY_SCANNED",
			ticket: {
				shortCode: ticket.shortCode,
				email: ticket.email,
				eventName: ticket.ticketEvent.name,
				scannedAt: ticket.scannedAt?.toISOString() || null,
				scannedBy: ticket.scannedBy
					? { name: ticket.scannedBy.name, email: ticket.scannedBy.email }
					: null,
			},
		};
	}

	// Mark as scanned
	const updated = await prisma.ticket.update({
		where: { shortCode: shortCode.toUpperCase().trim() },
		data: {
			scanned: true,
			scannedAt: new Date(),
			scannedById: session.user.id,
		},
		include: {
			ticketEvent: { select: { name: true } },
			scannedBy: { select: { name: true, email: true } },
		},
	});

	return {
		success: true,
		message: "Ticket verified successfully",
		code: "VALID",
		ticket: {
			shortCode: updated.shortCode,
			email: updated.email,
			eventName: updated.ticketEvent.name,
			scannedAt: updated.scannedAt?.toISOString() || null,
			scannedBy: updated.scannedBy
				? { name: updated.scannedBy.name, email: updated.scannedBy.email }
				: null,
		},
	};
}
