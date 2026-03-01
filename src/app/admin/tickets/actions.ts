"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { generateShortCode, signTicketCode } from "@/lib/ticketUtils";
import { getTicketSheetSettings, saveTicketSheetSettings, syncTicketsToGoogleSheets } from "@/lib/ticketSheetSync";
import { revalidatePath } from "next/cache";

// ── Auth Helper ────────────────────────────────────────────────
async function verifyTicketsAdmin() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		return { authorized: false as const, message: "Unauthorized" };
	}

	const user = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: { isTicketsAdmin: true },
	});

	if (!user?.isTicketsAdmin) {
		return { authorized: false as const, message: "Tickets admin access required" };
	}

	return { authorized: true as const, userId: session.user.id };
}

// ── TicketEvent CRUD ───────────────────────────────────────────

export async function createTicketEvent(data: {
	name: string;
	description?: string;
	isActive: boolean;
	date?: string;
}) {
	try {
		const authResult = await verifyTicketsAdmin();
		if (!authResult.authorized) return { success: false, message: authResult.message };

		const event = await prisma.ticketEvent.create({
			data: {
				name: data.name,
				description: data.description || null,
				isActive: data.isActive,
				date: data.date ? new Date(data.date) : null,
			},
		});

		revalidatePath("/admin/tickets");
		return { success: true, message: "Event created", event };
	} catch (error) {
		console.error("Error creating ticket event:", error);
		return { success: false, message: "Failed to create ticket event" };
	}
}

export async function updateTicketEvent(
	id: string,
	data: {
		name: string;
		description?: string;
		isActive: boolean;
		date?: string;
	},
) {
	try {
		const authResult = await verifyTicketsAdmin();
		if (!authResult.authorized) return { success: false, message: authResult.message };

		const event = await prisma.ticketEvent.update({
			where: { id },
			data: {
				name: data.name,
				description: data.description || null,
				isActive: data.isActive,
				date: data.date ? new Date(data.date) : null,
			},
		});

		revalidatePath("/admin/tickets");
		return { success: true, message: "Event updated", event };
	} catch (error) {
		console.error("Error updating ticket event:", error);
		return { success: false, message: "Failed to update ticket event" };
	}
}

export async function deleteTicketEvent(id: string) {
	try {
		const authResult = await verifyTicketsAdmin();
		if (!authResult.authorized) return { success: false, message: authResult.message };

		await prisma.ticketEvent.delete({ where: { id } });

		revalidatePath("/admin/tickets");
		return { success: true, message: "Event deleted" };
	} catch (error) {
		console.error("Error deleting ticket event:", error);
		return { success: false, message: "Failed to delete ticket event" };
	}
}

// ── Bulk Ticket Generation ─────────────────────────────────────

function parseEmailCsv(raw: string): { email: string; count: number }[] {
	return raw
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter(Boolean)
		.map((line) => {
			const parts = line.split(/[,\t]/).map((s) => s.trim());
			const email = parts[0] || "";
			const count = parseInt(parts[1] ?? "1", 10);
			// Basic email validation
			if (!email || !email.includes("@")) return null;
			return { email, count: isNaN(count) || count < 1 ? 1 : Math.min(count, 50) };
		})
		.filter((entry): entry is { email: string; count: number } => entry !== null);
}

export async function bulkGenerateTickets(ticketEventId: string, csvText: string) {
	try {
		const authResult = await verifyTicketsAdmin();
		if (!authResult.authorized) return { success: false, message: authResult.message };

		// Verify event exists
		const event = await prisma.ticketEvent.findUnique({ where: { id: ticketEventId } });
		if (!event) return { success: false, message: "Ticket event not found" };

		const entries = parseEmailCsv(csvText);
		if (entries.length === 0) {
			return { success: false, message: "No valid entries found. Format: email, count (one per line)" };
		}

		// Generate tickets with unique short codes
		const ticketsToCreate: { email: string; ticketEventId: string; shortCode: string }[] = [];

		for (const { email, count } of entries) {
			for (let i = 0; i < count; i++) {
				let shortCode: string;
				let attempts = 0;
				do {
					shortCode = generateShortCode();
					const existing = await prisma.ticket.findUnique({ where: { shortCode } });
					if (!existing) break;
					attempts++;
				} while (attempts < 5);

				ticketsToCreate.push({ email, ticketEventId, shortCode });
			}
		}

		await prisma.ticket.createMany({ data: ticketsToCreate });

		revalidatePath("/admin/tickets");
		return {
			success: true,
			message: `Generated ${ticketsToCreate.length} ticket${ticketsToCreate.length !== 1 ? "s" : ""} for ${entries.length} email${entries.length !== 1 ? "s" : ""}`,
			count: ticketsToCreate.length,
		};
	} catch (error) {
		console.error("Error generating tickets:", error);
		return { success: false, message: "Failed to generate tickets" };
	}
}

export async function getTicketsForEvent(ticketEventId: string) {
	try {
		const authResult = await verifyTicketsAdmin();
		if (!authResult.authorized) return { success: false, message: authResult.message, tickets: [] };

		const tickets = await prisma.ticket.findMany({
			where: { ticketEventId },
			include: {
				scannedBy: { select: { name: true, email: true } },
			},
			orderBy: { createdAt: "desc" },
		});

		return { success: true, tickets };
	} catch (error) {
		console.error("Error fetching tickets:", error);
		return { success: false, message: "Failed to fetch tickets", tickets: [] };
	}
}

export async function deleteTickets(ticketIds: string[]) {
	try {
		const authResult = await verifyTicketsAdmin();
		if (!authResult.authorized) return { success: false, message: authResult.message };

		await prisma.ticket.deleteMany({ where: { id: { in: ticketIds } } });

		revalidatePath("/admin/tickets");
		return { success: true, message: `Deleted ${ticketIds.length} ticket${ticketIds.length !== 1 ? "s" : ""}` };
	} catch (error) {
		console.error("Error deleting tickets:", error);
		return { success: false, message: "Failed to delete tickets" };
	}
}

// ── Reset Ticket Scans ────────────────────────────────────────

export async function resetTicketScans(ticketIds: string[]) {
	try {
		const authResult = await verifyTicketsAdmin();
		if (!authResult.authorized) return { success: false, message: authResult.message };

		await prisma.ticket.updateMany({
			where: { id: { in: ticketIds } },
			data: { scanned: false, scannedAt: null, scannedById: null },
		});

		revalidatePath("/admin/tickets");
		return {
			success: true,
			message: `Reset ${ticketIds.length} ticket${ticketIds.length !== 1 ? "s" : ""}`,
		};
	} catch (error) {
		console.error("Error resetting ticket scans:", error);
		return { success: false, message: "Failed to reset ticket scans" };
	}
}

// ── Signed QR URL ──────────────────────────────────────────────

export async function getSignedQrUrl(shortCode: string) {
	try {
		const authResult = await verifyTicketsAdmin();
		if (!authResult.authorized) return { success: false, message: authResult.message, url: "" };

		const sig = signTicketCode(shortCode);
		const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
		const url = `${baseUrl}/api/tickets/qr?id=${shortCode}&sig=${sig}`;

		return { success: true, url };
	} catch (error) {
		console.error("Error generating signed QR URL:", error);
		return { success: false, message: "Failed to generate QR URL. Is TICKET_HMAC_SECRET set?", url: "" };
	}
}

export async function exportTicketsForMailMerge(ticketEventId: string) {
	try {
		const authResult = await verifyTicketsAdmin();
		if (!authResult.authorized) return { success: false, message: authResult.message, data: [] };

		const tickets = await prisma.ticket.findMany({
			where: { ticketEventId },
			select: { email: true, shortCode: true },
			orderBy: { email: "asc" },
		});

		const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
		const data = tickets.map((t) => {
			const sig = signTicketCode(t.shortCode);
			return {
				email: t.email,
				shortCode: t.shortCode,
				qrImageUrl: `${baseUrl}/api/tickets/qr?id=${t.shortCode}&sig=${sig}`,
				verifyUrl: `${baseUrl}/ticket-verify?t=${t.shortCode}`,
			};
		});

		return { success: true, data };
	} catch (error) {
		console.error("Error exporting tickets:", error);
		return { success: false, message: "Failed to export tickets", data: [] };
	}
}

// ── Verifier Management ────────────────────────────────────────

export async function searchUsers(query: string) {
	try {
		const authResult = await verifyTicketsAdmin();
		if (!authResult.authorized) return { success: false, message: authResult.message, users: [] };

		if (!query || query.length < 2) return { success: true, users: [] };

		const users = await prisma.user.findMany({
			where: {
				OR: [
					{ email: { contains: query, mode: "insensitive" } },
					{ name: { contains: query, mode: "insensitive" } },
				],
			},
			select: { id: true, email: true, name: true, image: true },
			take: 10,
		});

		return { success: true, users };
	} catch (error) {
		console.error("Error searching users:", error);
		return { success: false, message: "Failed to search users", users: [] };
	}
}

export async function addTicketVerifier(ticketEventId: string, userId: string) {
	try {
		const authResult = await verifyTicketsAdmin();
		if (!authResult.authorized) return { success: false, message: authResult.message };

		await prisma.ticketVerifier.create({
			data: { ticketEventId, userId },
		});

		revalidatePath("/admin/tickets");
		return { success: true, message: "Verifier added" };
	} catch (error) {
		// Handle duplicate
		if ((error as { code?: string }).code === "P2002") {
			return { success: false, message: "User is already a verifier for this event" };
		}
		console.error("Error adding verifier:", error);
		return { success: false, message: "Failed to add verifier" };
	}
}

export async function removeTicketVerifier(ticketEventId: string, userId: string) {
	try {
		const authResult = await verifyTicketsAdmin();
		if (!authResult.authorized) return { success: false, message: authResult.message };

		await prisma.ticketVerifier.delete({
			where: { userId_ticketEventId: { userId, ticketEventId } },
		});

		revalidatePath("/admin/tickets");
		return { success: true, message: "Verifier removed" };
	} catch (error) {
		console.error("Error removing verifier:", error);
		return { success: false, message: "Failed to remove verifier" };
	}
}

// ── Google Sheets Settings & Sync ──────────────────────────────

export async function getTicketGSheetSettings() {
	try {
		const authResult = await verifyTicketsAdmin();
		if (!authResult.authorized) return { success: false, message: authResult.message, settings: null };

		const settings = await getTicketSheetSettings();
		return { success: true, settings };
	} catch (error) {
		console.error("Error getting ticket sheet settings:", error);
		return { success: false, message: "Failed to get settings", settings: null };
	}
}

export async function saveTicketGSheetSettings(data: { spreadsheetId: string; sheetName: string }) {
	try {
		const authResult = await verifyTicketsAdmin();
		if (!authResult.authorized) return { success: false, message: authResult.message };

		if (!data.spreadsheetId.trim()) {
			return { success: false, message: "Spreadsheet ID is required" };
		}

		await saveTicketSheetSettings(
			{
				spreadsheetId: data.spreadsheetId.trim(),
				sheetName: data.sheetName.trim() || "Tickets",
			},
			authResult.userId,
		);

		return { success: true, message: "Settings saved" };
	} catch (error) {
		console.error("Error saving ticket sheet settings:", error);
		return { success: false, message: "Failed to save settings" };
	}
}

export async function syncTicketsToSheet(ticketEventId: string) {
	try {
		const authResult = await verifyTicketsAdmin();
		if (!authResult.authorized) return { success: false, message: authResult.message };

		const result = await syncTicketsToGoogleSheets(ticketEventId);
		return result;
	} catch (error) {
		console.error("Error syncing tickets:", error);
		return { success: false, message: "Failed to sync tickets" };
	}
}
