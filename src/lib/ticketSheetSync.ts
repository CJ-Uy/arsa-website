/**
 * Google Sheets Integration for Ticket Sync
 *
 * Unlike the order sync which clears and rewrites the sheet,
 * this sync appends new tickets and removes deleted ones incrementally.
 * This prevents flickering and preserves any manual edits in the sheet.
 */

import { google } from "googleapis";
import { prisma } from "@/lib/prisma";
import { signTicketCode } from "@/lib/ticketUtils";

const SETTINGS_KEY = "ticketGoogleSheets";

/**
 * Get authenticated Google Sheets client
 */
async function getGoogleSheetsClient() {
	const credentials = process.env.GOOGLE_SHEETS_CREDENTIALS;
	if (!credentials) {
		throw new Error("GOOGLE_SHEETS_CREDENTIALS environment variable is not set");
	}

	let credentialsJson;
	try {
		credentialsJson = JSON.parse(credentials);
	} catch {
		throw new Error("Invalid GOOGLE_SHEETS_CREDENTIALS JSON format");
	}

	return new google.auth.GoogleAuth({
		credentials: credentialsJson,
		scopes: ["https://www.googleapis.com/auth/spreadsheets"],
	});
}

/**
 * Get ticket Google Sheets settings from database
 */
export async function getTicketSheetSettings(): Promise<{
	spreadsheetId: string;
	sheetName: string;
} | null> {
	try {
		const settings = await prisma.shopSettings.findUnique({
			where: { key: SETTINGS_KEY },
		});

		if (settings?.value) {
			const data = settings.value as { spreadsheetId: string; sheetName: string };
			if (data.spreadsheetId) {
				return {
					spreadsheetId: data.spreadsheetId,
					sheetName: data.sheetName || "Tickets",
				};
			}
		}
	} catch (error) {
		console.error("Failed to get ticket sheet settings:", error);
	}

	return null;
}

/**
 * Save ticket Google Sheets settings to database
 */
export async function saveTicketSheetSettings(
	settings: { spreadsheetId: string; sheetName: string },
	userId: string,
) {
	await prisma.shopSettings.upsert({
		where: { key: SETTINGS_KEY },
		update: {
			value: settings,
			updatedBy: userId,
		},
		create: {
			key: SETTINGS_KEY,
			value: settings,
			updatedBy: userId,
		},
	});
}

const TICKET_HEADERS = [
	"Short Code",
	"Email",
	"Event",
	"Status",
	"Scanned At",
	"Scanned By",
	"Created At",
	"QR Image URL",
	"Verify URL",
];

/**
 * Sync tickets for an event to Google Sheets (append-only).
 *
 * On first sync: writes headers + all tickets.
 * On subsequent syncs: reads existing short codes from column A,
 * then appends only new tickets that aren't already in the sheet.
 */
export async function syncTicketsToGoogleSheets(ticketEventId: string): Promise<{
	success: boolean;
	message: string;
	appendedCount?: number;
}> {
	try {
		const sheetSettings = await getTicketSheetSettings();
		if (!sheetSettings) {
			return {
				success: false,
				message: "Google Sheets not configured for tickets. Go to Settings tab to configure.",
			};
		}

		const auth = await getGoogleSheetsClient();
		const sheets = google.sheets({ version: "v4", auth });
		const { spreadsheetId, sheetName } = sheetSettings;

		// Fetch the event name
		const event = await prisma.ticketEvent.findUnique({
			where: { id: ticketEventId },
			select: { name: true },
		});
		if (!event) return { success: false, message: "Ticket event not found" };

		// Fetch all tickets for this event
		const tickets = await prisma.ticket.findMany({
			where: { ticketEventId },
			include: {
				scannedBy: { select: { name: true, email: true } },
				ticketEvent: { select: { name: true } },
			},
			orderBy: { createdAt: "asc" },
		});

		if (tickets.length === 0) {
			// No tickets in DB — clean up any remaining rows in the sheet
			const emptySet = new Set<string>();
			const removed = await removeDeletedRows(sheets, spreadsheetId, sheetName, emptySet);
			return {
				success: true,
				message:
					removed > 0
						? `Removed ${removed} deleted ticket${removed !== 1 ? "s" : ""} from sheet`
						: "No tickets to sync",
				appendedCount: 0,
			};
		}

		const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

		// Check if the sheet already has data by reading column A (short codes)
		let existingCodes = new Set<string>();
		let sheetHasHeaders = false;

		try {
			const existing = await sheets.spreadsheets.values.get({
				spreadsheetId,
				range: `${sheetName}!A:A`,
			});

			const rows = existing.data.values || [];
			if (rows.length > 0) {
				// Check if first row is headers
				if (rows[0]?.[0] === TICKET_HEADERS[0]) {
					sheetHasHeaders = true;
					// Collect all existing short codes (skip header row)
					for (let i = 1; i < rows.length; i++) {
						if (rows[i]?.[0]) {
							existingCodes.add(rows[i][0]);
						}
					}
				}
			}
		} catch {
			// Sheet might be empty or not exist — that's fine, we'll write headers
		}

		// Build rows for tickets that aren't already in the sheet
		const newTickets = tickets.filter((t) => !existingCodes.has(t.shortCode));

		// Remove rows for tickets that were deleted from the database
		const dbShortCodes = new Set(tickets.map((t) => t.shortCode));
		let removedCount = 0;
		if (sheetHasHeaders && existingCodes.size > 0) {
			removedCount = await removeDeletedRows(sheets, spreadsheetId, sheetName, dbShortCodes);
		}

		if (newTickets.length === 0 && sheetHasHeaders) {
			// No new tickets, but we should still update scan statuses
			// Read all existing rows and update status columns in place
			const result = await updateExistingRows(
				sheets,
				spreadsheetId,
				sheetName,
				tickets,
				event.name,
				baseUrl,
			);
			if (removedCount > 0) {
				result.message += `, removed ${removedCount} deleted ticket${removedCount !== 1 ? "s" : ""}`;
			}
			return result;
		}

		const newRows = newTickets.map((ticket) => {
			const sig = signTicketCode(ticket.shortCode);
			return [
				ticket.shortCode,
				ticket.email,
				ticket.ticketEvent.name,
				ticket.scanned ? "Scanned" : "Unused",
				ticket.scannedAt
					? new Date(ticket.scannedAt).toLocaleString("en-US", { timeZone: "Asia/Manila" })
					: "",
				ticket.scannedBy ? ticket.scannedBy.name || ticket.scannedBy.email : "",
				new Date(ticket.createdAt).toLocaleString("en-US", { timeZone: "Asia/Manila" }),
				`${baseUrl}/api/tickets/qr?id=${ticket.shortCode}&sig=${sig}`,
				`${baseUrl}/ticket-verify?t=${ticket.shortCode}`,
			];
		});

		if (!sheetHasHeaders) {
			// First sync — write headers + all rows
			await sheets.spreadsheets.values.update({
				spreadsheetId,
				range: `${sheetName}!A1`,
				valueInputOption: "USER_ENTERED",
				requestBody: {
					values: [TICKET_HEADERS, ...newRows],
				},
			});

			// Format header row
			try {
				// Get sheetId for the target sheet
				const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
				const sheet = spreadsheet.data.sheets?.find((s) => s.properties?.title === sheetName);
				const sheetId = sheet?.properties?.sheetId ?? 0;

				await sheets.spreadsheets.batchUpdate({
					spreadsheetId,
					requestBody: {
						requests: [
							{
								repeatCell: {
									range: {
										sheetId,
										startRowIndex: 0,
										endRowIndex: 1,
									},
									cell: {
										userEnteredFormat: {
											textFormat: { bold: true },
											backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 },
										},
									},
									fields: "userEnteredFormat(textFormat,backgroundColor)",
								},
							},
							{
								autoResizeDimensions: {
									dimensions: {
										sheetId,
										dimension: "COLUMNS",
										startIndex: 0,
										endIndex: TICKET_HEADERS.length,
									},
								},
							},
						],
					},
				});
			} catch {
				// Formatting is non-critical
			}

			return {
				success: true,
				message: `Synced ${newRows.length} tickets to Google Sheets`,
				appendedCount: newRows.length,
			};
		}

		// Append only new rows
		if (newRows.length > 0) {
			await sheets.spreadsheets.values.append({
				spreadsheetId,
				range: `${sheetName}!A:A`,
				valueInputOption: "USER_ENTERED",
				insertDataOption: "INSERT_ROWS",
				requestBody: {
					values: newRows,
				},
			});
		}

		// Also update scan statuses for existing rows
		await updateExistingRows(sheets, spreadsheetId, sheetName, tickets, event.name, baseUrl);

		const parts: string[] = [];
		if (newRows.length > 0) {
			parts.push(`Appended ${newRows.length} new ticket${newRows.length !== 1 ? "s" : ""}`);
		}
		if (removedCount > 0) {
			parts.push(`removed ${removedCount} deleted ticket${removedCount !== 1 ? "s" : ""}`);
		}
		parts.push("updated statuses");

		return {
			success: true,
			message: parts.join(", ").replace(/^./, (c) => c.toUpperCase()),
			appendedCount: newRows.length,
		};
	} catch (error) {
		console.error("Ticket Google Sheets sync error:", error);
		return {
			success: false,
			message: error instanceof Error ? error.message : "Unknown error during sync",
		};
	}
}

/**
 * Remove rows from the sheet whose short codes no longer exist in the database.
 * Deletes rows from bottom to top to preserve row indices.
 * Returns the number of rows removed.
 */
async function removeDeletedRows(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	sheets: any,
	spreadsheetId: string,
	sheetName: string,
	dbShortCodes: Set<string>,
): Promise<number> {
	try {
		// Read column A to find all short codes in the sheet
		const existing = await sheets.spreadsheets.values.get({
			spreadsheetId,
			range: `${sheetName}!A:A`,
		});

		const rows = existing.data.values || [];
		if (rows.length <= 1) return 0; // Only header or empty

		// Find row indices (0-based) of codes not in the database (skip header at index 0)
		const rowsToDelete: number[] = [];
		for (let i = 1; i < rows.length; i++) {
			const code = rows[i]?.[0];
			if (code && !dbShortCodes.has(code)) {
				rowsToDelete.push(i);
			}
		}

		if (rowsToDelete.length === 0) return 0;

		// Get the sheetId for the target sheet
		const spreadsheet = await sheets.spreadsheets.get({ spreadsheetId });
		const sheet = spreadsheet.data.sheets?.find(
			(s: { properties?: { title?: string } }) => s.properties?.title === sheetName,
		);
		const sheetId = sheet?.properties?.sheetId ?? 0;

		// Delete rows from bottom to top so indices stay valid
		const requests = rowsToDelete
			.sort((a, b) => b - a)
			.map((rowIndex) => ({
				deleteDimension: {
					range: {
						sheetId,
						dimension: "ROWS",
						startIndex: rowIndex,
						endIndex: rowIndex + 1,
					},
				},
			}));

		await sheets.spreadsheets.batchUpdate({
			spreadsheetId,
			requestBody: { requests },
		});

		return rowsToDelete.length;
	} catch (error) {
		console.error("Error removing deleted ticket rows:", error);
		return 0;
	}
}

/**
 * Update the Status, Scanned At, and Scanned By columns for existing rows
 * without touching other columns or rewriting the sheet.
 */
async function updateExistingRows(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	sheets: any,
	spreadsheetId: string,
	sheetName: string,
	tickets: {
		shortCode: string;
		scanned: boolean;
		scannedAt: Date | null;
		scannedBy: { name: string | null; email: string } | null;
		ticketEvent: { name: string };
	}[],
	_eventName: string,
	_baseUrl: string,
): Promise<{ success: boolean; message: string; appendedCount?: number }> {
	try {
		// Read all existing rows to find which ones need status updates
		const existing = await sheets.spreadsheets.values.get({
			spreadsheetId,
			range: `${sheetName}!A:F`, // Columns A through F (Short Code through Scanned By)
		});

		const rows = existing.data.values || [];
		if (rows.length <= 1) {
			return { success: true, message: "No existing rows to update", appendedCount: 0 };
		}

		// Build a map of shortCode -> ticket data for quick lookup
		const ticketMap = new Map(tickets.map((t) => [t.shortCode, t]));

		// Collect batch updates for status columns (D, E, F = Status, Scanned At, Scanned By)
		const updates: { range: string; values: string[][] }[] = [];

		for (let i = 1; i < rows.length; i++) {
			const shortCode = rows[i]?.[0];
			if (!shortCode) continue;

			const ticket = ticketMap.get(shortCode);
			if (!ticket) continue;

			const currentStatus = rows[i]?.[3]; // Column D
			const newStatus = ticket.scanned ? "Scanned" : "Unused";

			// Only update if status changed
			if (currentStatus !== newStatus) {
				const rowNum = i + 1; // 1-indexed
				updates.push({
					range: `${sheetName}!D${rowNum}:F${rowNum}`,
					values: [
						[
							newStatus,
							ticket.scannedAt
								? new Date(ticket.scannedAt).toLocaleString("en-US", { timeZone: "Asia/Manila" })
								: "",
							ticket.scannedBy ? ticket.scannedBy.name || ticket.scannedBy.email : "",
						],
					],
				});
			}
		}

		if (updates.length > 0) {
			await sheets.spreadsheets.values.batchUpdate({
				spreadsheetId,
				requestBody: {
					valueInputOption: "USER_ENTERED",
					data: updates,
				},
			});
		}

		return {
			success: true,
			message:
				updates.length > 0
					? `Updated ${updates.length} ticket status${updates.length !== 1 ? "es" : ""}`
					: "All statuses up to date",
			appendedCount: 0,
		};
	} catch (error) {
		console.error("Error updating existing rows:", error);
		return {
			success: true,
			message: "Synced new tickets (status update failed)",
			appendedCount: 0,
		};
	}
}
