"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { and, asc, desc, eq, inArray, like, or } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user, ticket, ticketEvent, ticketVerifier } from "@/db/schema";
import { generateShortCode, signTicketCode } from "@/lib/ticketUtils";
import {
	getTicketSheetSettings,
	saveTicketSheetSettings,
	syncTicketsToGoogleSheets,
} from "@/lib/ticketSheetSync";

async function verifyTicketsAdmin() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) return { authorized: false as const, message: "Unauthorized" };

	const u = await db.query.user.findFirst({
		where: eq(user.id, session.user.id),
		columns: { isTicketsAdmin: true },
	});
	if (!u?.isTicketsAdmin) return { authorized: false as const, message: "Tickets admin access required" };

	return { authorized: true as const, userId: session.user.id };
}

export async function createTicketEvent(data: {
	name: string;
	description?: string;
	isActive: boolean;
	date?: string;
}) {
	try {
		const authResult = await verifyTicketsAdmin();
		if (!authResult.authorized) return { success: false, message: authResult.message };

		const inserted = await db
			.insert(ticketEvent)
			.values({
				name: data.name,
				description: data.description || null,
				isActive: data.isActive,
				date: data.date ? new Date(data.date) : null,
			})
			.returning();

		revalidatePath("/admin/tickets");
		return { success: true, message: "Event created", event: inserted[0] };
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

		const updated = await db
			.update(ticketEvent)
			.set({
				name: data.name,
				description: data.description || null,
				isActive: data.isActive,
				date: data.date ? new Date(data.date) : null,
			})
			.where(eq(ticketEvent.id, id))
			.returning();

		revalidatePath("/admin/tickets");
		return { success: true, message: "Event updated", event: updated[0] };
	} catch (error) {
		console.error("Error updating ticket event:", error);
		return { success: false, message: "Failed to update ticket event" };
	}
}

export async function deleteTicketEvent(id: string) {
	try {
		const authResult = await verifyTicketsAdmin();
		if (!authResult.authorized) return { success: false, message: authResult.message };

		await db.delete(ticketEvent).where(eq(ticketEvent.id, id));
		revalidatePath("/admin/tickets");
		return { success: true, message: "Event deleted" };
	} catch (error) {
		console.error("Error deleting ticket event:", error);
		return { success: false, message: "Failed to delete ticket event" };
	}
}

function parseEmailCsv(raw: string): { email: string; count: number }[] {
	return raw
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter(Boolean)
		.map((line) => {
			const parts = line.split(/[,\t]/).map((s) => s.trim());
			const email = parts[0] || "";
			const count = parseInt(parts[1] ?? "1", 10);
			if (!email || !email.includes("@")) return null;
			return { email, count: isNaN(count) || count < 1 ? 1 : Math.min(count, 50) };
		})
		.filter((entry): entry is { email: string; count: number } => entry !== null);
}

export async function bulkGenerateTickets(ticketEventId: string, csvText: string) {
	try {
		const authResult = await verifyTicketsAdmin();
		if (!authResult.authorized) return { success: false, message: authResult.message };

		const event = await db.query.ticketEvent.findFirst({
			where: eq(ticketEvent.id, ticketEventId),
		});
		if (!event) return { success: false, message: "Ticket event not found" };

		const entries = parseEmailCsv(csvText);
		if (entries.length === 0) {
			return {
				success: false,
				message: "No valid entries found. Format: email, count (one per line)",
			};
		}

		const ticketsToCreate: { email: string; ticketEventId: string; shortCode: string }[] = [];

		for (const { email, count } of entries) {
			for (let i = 0; i < count; i++) {
				let shortCode: string;
				let attempts = 0;
				do {
					shortCode = generateShortCode();
					const existing = await db.query.ticket.findFirst({
						where: eq(ticket.shortCode, shortCode),
					});
					if (!existing) break;
					attempts++;
				} while (attempts < 5);

				ticketsToCreate.push({ email, ticketEventId, shortCode: shortCode! });
			}
		}

		if (ticketsToCreate.length > 0) {
			await db.insert(ticket).values(ticketsToCreate);
		}

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

		const tickets = await db.query.ticket.findMany({
			where: eq(ticket.ticketEventId, ticketEventId),
			with: { scannedBy: { columns: { name: true, email: true } } },
			orderBy: [desc(ticket.createdAt)],
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

		await db.delete(ticket).where(inArray(ticket.id, ticketIds));
		revalidatePath("/admin/tickets");
		return {
			success: true,
			message: `Deleted ${ticketIds.length} ticket${ticketIds.length !== 1 ? "s" : ""}`,
		};
	} catch (error) {
		console.error("Error deleting tickets:", error);
		return { success: false, message: "Failed to delete tickets" };
	}
}

export async function resetTicketScans(ticketIds: string[]) {
	try {
		const authResult = await verifyTicketsAdmin();
		if (!authResult.authorized) return { success: false, message: authResult.message };

		await db
			.update(ticket)
			.set({ scanned: false, scannedAt: null, scannedById: null })
			.where(inArray(ticket.id, ticketIds));

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
		return {
			success: false,
			message: "Failed to generate QR URL. Is TICKET_HMAC_SECRET set?",
			url: "",
		};
	}
}

export async function exportTicketsForMailMerge(ticketEventId: string) {
	try {
		const authResult = await verifyTicketsAdmin();
		if (!authResult.authorized) return { success: false, message: authResult.message, data: [] };

		const tickets = await db.query.ticket.findMany({
			where: eq(ticket.ticketEventId, ticketEventId),
			columns: { email: true, shortCode: true },
			orderBy: [asc(ticket.email)],
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

export async function searchUsers(query: string) {
	try {
		const authResult = await verifyTicketsAdmin();
		if (!authResult.authorized) return { success: false, message: authResult.message, users: [] };

		if (!query || query.length < 2) return { success: true, users: [] };

		const q = `%${query.toLowerCase()}%`;
		const users = await db.query.user.findMany({
			where: or(like(user.email, q), like(user.name, q)),
			columns: { id: true, email: true, name: true, image: true },
			limit: 10,
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

		try {
			await db.insert(ticketVerifier).values({ ticketEventId, userId });
		} catch (error: any) {
			if (
				typeof error?.message === "string" &&
				error.message.includes("UNIQUE constraint failed")
			) {
				return { success: false, message: "User is already a verifier for this event" };
			}
			throw error;
		}

		revalidatePath("/admin/tickets");
		return { success: true, message: "Verifier added" };
	} catch (error) {
		console.error("Error adding verifier:", error);
		return { success: false, message: "Failed to add verifier" };
	}
}

export async function removeTicketVerifier(ticketEventId: string, userId: string) {
	try {
		const authResult = await verifyTicketsAdmin();
		if (!authResult.authorized) return { success: false, message: authResult.message };

		await db
			.delete(ticketVerifier)
			.where(
				and(
					eq(ticketVerifier.userId, userId),
					eq(ticketVerifier.ticketEventId, ticketEventId),
				),
			);

		revalidatePath("/admin/tickets");
		return { success: true, message: "Verifier removed" };
	} catch (error) {
		console.error("Error removing verifier:", error);
		return { success: false, message: "Failed to remove verifier" };
	}
}

export async function getTicketGSheetSettings() {
	try {
		const authResult = await verifyTicketsAdmin();
		if (!authResult.authorized)
			return { success: false, message: authResult.message, settings: null };

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
