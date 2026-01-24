/**
 * Google Sheets Integration for Order Sync
 *
 * This module handles syncing Flower Fest orders to Google Sheets
 * so non-developers can view and manage orders.
 *
 * Setup:
 * 1. Create a Google Cloud project
 * 2. Enable Google Sheets API
 * 3. Create a service account and download credentials JSON
 * 4. Share the target spreadsheet with the service account email
 * 5. Set environment variables (see .env.example)
 */

import { google } from "googleapis";
import { prisma } from "@/lib/prisma";

// Types for order data
type FlowerFestOrderRow = {
	orderId: string;
	orderDate: string;
	status: string;
	customerName: string;
	customerEmail: string;
	customerPhone: string;
	recipientName: string;
	fulfillmentType: string;
	deliveryLocation1: string;
	deliveryTime1: string;
	deliveryLocation2: string;
	deliveryTime2: string;
	deliveryLocation3: string;
	deliveryTime3: string;
	preferredOption: string;
	cardMessage: string;
	isAnonymous: string;
	senderNameOnCard: string;
	items: string;
	totalAmount: string;
	gcashRefNo: string;
	specialInstructions: string;
	deliveryDate: string;
	deliveryTimeSlot: string;
};

// Header row for the spreadsheet
const SHEET_HEADERS: (keyof FlowerFestOrderRow)[] = [
	"orderId",
	"orderDate",
	"status",
	"customerName",
	"customerEmail",
	"customerPhone",
	"recipientName",
	"fulfillmentType",
	"deliveryLocation1",
	"deliveryTime1",
	"deliveryLocation2",
	"deliveryTime2",
	"deliveryLocation3",
	"deliveryTime3",
	"preferredOption",
	"cardMessage",
	"isAnonymous",
	"senderNameOnCard",
	"items",
	"totalAmount",
	"gcashRefNo",
	"specialInstructions",
	"deliveryDate",
	"deliveryTimeSlot",
];

// Friendly header names for display
const HEADER_DISPLAY_NAMES: Record<keyof FlowerFestOrderRow, string> = {
	orderId: "Order ID",
	orderDate: "Order Date",
	status: "Status",
	customerName: "Customer Name",
	customerEmail: "Customer Email",
	customerPhone: "Customer Phone",
	recipientName: "Recipient Name",
	fulfillmentType: "Pickup/Delivery",
	deliveryLocation1: "Delivery Location 1",
	deliveryTime1: "Delivery Time 1",
	deliveryLocation2: "Delivery Location 2",
	deliveryTime2: "Delivery Time 2",
	deliveryLocation3: "Delivery Location 3",
	deliveryTime3: "Delivery Time 3",
	preferredOption: "Preferred Option",
	cardMessage: "Card Message",
	isAnonymous: "Anonymous?",
	senderNameOnCard: "Sender Name on Card",
	items: "Items",
	totalAmount: "Total Amount",
	gcashRefNo: "GCash Ref No",
	specialInstructions: "Special Instructions",
	deliveryDate: "Delivery Date",
	deliveryTimeSlot: "Delivery Time Slot",
};

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

	const auth = new google.auth.GoogleAuth({
		credentials: credentialsJson,
		scopes: ["https://www.googleapis.com/auth/spreadsheets"],
	});

	const sheets = google.sheets({ version: "v4", auth });
	return sheets;
}

/**
 * Get the spreadsheet ID from environment
 */
function getSpreadsheetId(): string {
	const spreadsheetId = process.env.FLOWER_FEST_SPREADSHEET_ID;
	if (!spreadsheetId) {
		throw new Error("FLOWER_FEST_SPREADSHEET_ID environment variable is not set");
	}
	return spreadsheetId;
}

/**
 * Convert order to row data
 */
function orderToRow(order: Awaited<ReturnType<typeof getFlowerFestOrders>>[number]): string[] {
	// Extract event data (custom Flower Fest fields stored as JSON)
	const eventData = (order.eventData as Record<string, unknown>) || {};

	// Parse delivery options from eventData
	const fulfillmentType = (eventData.fulfillmentType as string) || "pickup";
	const deliveryOptions =
		(eventData.deliveryOptions as Array<{
			location?: string;
			timeSlot?: string;
		}>) || [];
	const preferredOption = (eventData.preferredOption as number) || 1;

	// Get items summary
	const items = order.orderItems
		.map((item) => {
			const name = item.product?.name || item.package?.name || "Unknown";
			const size = item.size ? ` (${item.size})` : "";
			return `${item.quantity}x ${name}${size}`;
		})
		.join(", ");

	const row: FlowerFestOrderRow = {
		orderId: order.id,
		orderDate: order.createdAt.toISOString(),
		status: order.status,
		customerName:
			order.user?.name ||
			`${order.user?.firstName || ""} ${order.user?.lastName || ""}`.trim() ||
			"Unknown",
		customerEmail: order.user?.email || "",
		customerPhone: (eventData.senderPhone as string) || "",
		recipientName: (eventData.recipientName as string) || "",
		fulfillmentType: fulfillmentType,
		deliveryLocation1: deliveryOptions[0]?.location || "",
		deliveryTime1: deliveryOptions[0]?.timeSlot || "",
		deliveryLocation2: deliveryOptions[1]?.location || "",
		deliveryTime2: deliveryOptions[1]?.timeSlot || "",
		deliveryLocation3: deliveryOptions[2]?.location || "",
		deliveryTime3: deliveryOptions[2]?.timeSlot || "",
		preferredOption: fulfillmentType === "delivery" ? `Option ${preferredOption}` : "N/A",
		cardMessage: (eventData.cardMessage as string) || "",
		isAnonymous: (eventData.isAnonymous as boolean) ? "Yes" : "No",
		senderNameOnCard: (eventData.senderName as string) || "",
		items: items,
		totalAmount: `₱${order.totalAmount.toFixed(2)}`,
		gcashRefNo: order.gcashReferenceNumber || "",
		specialInstructions: (eventData.specialInstructions as string) || order.deliveryNotes || "",
		deliveryDate: order.deliveryDate?.toLocaleDateString("en-PH") || "",
		deliveryTimeSlot: order.deliveryTimeSlot || "",
	};

	return SHEET_HEADERS.map((key) => row[key]);
}

/**
 * Fetch Flower Fest orders from database
 */
async function getFlowerFestOrders() {
	// Find the Flower Fest event
	const event = await prisma.shopEvent.findUnique({
		where: { slug: "flower-fest-2026" },
	});

	if (!event) {
		return [];
	}

	// Get all orders for this event
	const orders = await prisma.order.findMany({
		where: { eventId: event.id },
		include: {
			user: true,
			orderItems: {
				include: {
					product: true,
					package: true,
				},
			},
		},
		orderBy: { createdAt: "desc" },
	});

	return orders;
}

/**
 * Sync orders to Google Sheets
 * This will clear the sheet and rewrite all data (simple approach)
 */
export async function syncOrdersToGoogleSheets(): Promise<{
	success: boolean;
	message: string;
	syncedCount?: number;
}> {
	try {
		const sheets = await getGoogleSheetsClient();
		const spreadsheetId = getSpreadsheetId();
		const sheetName = process.env.FLOWER_FEST_SHEET_NAME || "Orders";

		// Fetch orders
		const orders = await getFlowerFestOrders();

		// Prepare data with headers
		const headerRow = SHEET_HEADERS.map((key) => HEADER_DISPLAY_NAMES[key]);
		const dataRows = orders.map(orderToRow);
		const allRows = [headerRow, ...dataRows];

		// Clear existing data
		await sheets.spreadsheets.values.clear({
			spreadsheetId,
			range: `${sheetName}!A:Z`,
		});

		// Write new data
		await sheets.spreadsheets.values.update({
			spreadsheetId,
			range: `${sheetName}!A1`,
			valueInputOption: "USER_ENTERED",
			requestBody: {
				values: allRows,
			},
		});

		// Format header row (make it bold)
		await sheets.spreadsheets.batchUpdate({
			spreadsheetId,
			requestBody: {
				requests: [
					{
						repeatCell: {
							range: {
								sheetId: 0, // Assumes first sheet
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
								sheetId: 0,
								dimension: "COLUMNS",
								startIndex: 0,
								endIndex: SHEET_HEADERS.length,
							},
						},
					},
				],
			},
		});

		// Update last sync timestamp in a metadata cell
		const syncTimestamp = new Date().toISOString();
		await sheets.spreadsheets.values.update({
			spreadsheetId,
			range: `${sheetName}!AA1`,
			valueInputOption: "USER_ENTERED",
			requestBody: {
				values: [["Last Synced:", syncTimestamp]],
			},
		});

		return {
			success: true,
			message: `Successfully synced ${orders.length} orders to Google Sheets`,
			syncedCount: orders.length,
		};
	} catch (error) {
		console.error("Google Sheets sync error:", error);
		return {
			success: false,
			message: error instanceof Error ? error.message : "Unknown error during sync",
		};
	}
}

/**
 * Check if Google Sheets is configured
 */
export function isGoogleSheetsConfigured(): boolean {
	return !!(process.env.GOOGLE_SHEETS_CREDENTIALS && process.env.FLOWER_FEST_SPREADSHEET_ID);
}

/**
 * Get sync status information
 */
export async function getSyncStatus(): Promise<{
	configured: boolean;
	lastSync?: string;
	orderCount?: number;
}> {
	const configured = isGoogleSheetsConfigured();

	if (!configured) {
		return { configured: false };
	}

	try {
		const sheets = await getGoogleSheetsClient();
		const spreadsheetId = getSpreadsheetId();
		const sheetName = process.env.FLOWER_FEST_SHEET_NAME || "Orders";

		// Get last sync timestamp
		const response = await sheets.spreadsheets.values.get({
			spreadsheetId,
			range: `${sheetName}!AA1:AB1`,
		});

		const lastSync = response.data.values?.[0]?.[1] || undefined;

		// Count orders
		const orders = await getFlowerFestOrders();

		return {
			configured: true,
			lastSync,
			orderCount: orders.length,
		};
	} catch (error) {
		console.error("Error getting sync status:", error);
		return { configured: true };
	}
}
