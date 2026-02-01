/**
 * Google Sheets Integration for Order Sync
 *
 * This module handles syncing orders to Google Sheets
 * so non-developers can view and manage orders.
 *
 * Setup:
 * 1. Create a Google Cloud project
 * 2. Enable Google Sheets API and Google Drive API
 * 3. Create a service account and download credentials JSON
 * 4. Share the target spreadsheet with the service account email (Editor access)
 * 5. Set environment variables (see .env.example)
 */

import { google } from "googleapis";
import { prisma } from "@/lib/prisma";
import { Readable } from "stream";

// Types imported from src/app/admin/events/actions.ts for checkout config structure
type CheckoutFieldType =
	| "text"
	| "textarea"
	| "select"
	| "checkbox"
	| "date"
	| "time"
	| "number"
	| "email"
	| "phone"
	| "radio"
	| "repeater"
	| "message"
	| "toggle";

type RepeaterColumn = {
	id: string;
	label: string;
	type: "text" | "textarea" | "number" | "date" | "time" | "select" | "checkbox";
	placeholder?: string;
	options?: string[];
	width?: "sm" | "md" | "lg";
	min?: number;
	max?: number;
	step?: number;
	minDate?: string;
	maxDate?: string;
	disabledDates?: string[];
	minDateOffset?: number;
	maxDateOffset?: number;
	minTime?: string;
	maxTime?: string;
	blockedTimes?: string[];
};

type FieldCondition = {
	fieldId: string;
	value: string | string[];
};

type CheckoutField = {
	id: string;
	label: string;
	type: CheckoutFieldType;
	required: boolean;
	placeholder?: string;
	options?: string[];
	maxLength?: number;
	min?: number;
	max?: number;
	step?: number;
	minDate?: string;
	maxDate?: string;
	disabledDates?: string[];
	minDateOffset?: number;
	maxDateOffset?: number;
	disabledTimeSlots?: { date: string; times: string[] }[];
	minTime?: string;
	maxTime?: string;
	blockedTimes?: string[];
	showWhen?: FieldCondition;
	messageContent?: string;
	toggleOffMessage?: string;
	toggleOnMessage?: string;
	description?: string;
	columns?: RepeaterColumn[];
	minRows?: number;
	maxRows?: number;
	defaultRows?: number;
	rowLabel?: string;
	autoSortByDateTime?: boolean;
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
		scopes: [
			"https://www.googleapis.com/auth/spreadsheets",
			"https://www.googleapis.com/auth/drive.file",
		],
	});

	return auth;
}

/**
 * Get Google Sheets settings from database or environment
 */
async function getGoogleSheetsSettings(): Promise<{ spreadsheetId: string; sheetName: string }> {
	// First, try to get settings from database
	try {
		const settings = await prisma.shopSettings.findUnique({
			where: { key: "googleSheets" },
		});

		if (settings && settings.value) {
			const data = settings.value as { spreadsheetId: string; sheetName: string };
			if (data.spreadsheetId) {
				return {
					spreadsheetId: data.spreadsheetId,
					sheetName: data.sheetName || "Orders",
				};
			}
		}
	} catch (error) {
		console.error("Failed to get settings from database:", error);
	}

	// Fall back to environment variables
	const spreadsheetId = process.env.SHOP_SPREADSHEET_ID || process.env.FLOWER_FEST_SPREADSHEET_ID;
	if (!spreadsheetId) {
		throw new Error(
			"Google Sheets is not configured. Please configure it in the admin settings or set environment variables.",
		);
	}

	return {
		spreadsheetId,
		sheetName: process.env.SHOP_SHEET_NAME || process.env.FLOWER_FEST_SHEET_NAME || "Orders",
	};
}

/**
 * Convert column number to Excel-style column name (A, B, ..., Z, AA, AB, etc.)
 */
function getColumnName(columnNumber: number): string {
	let columnName = "";
	let num = columnNumber;

	while (num > 0) {
		const remainder = (num - 1) % 26;
		columnName = String.fromCharCode(65 + remainder) + columnName;
		num = Math.floor((num - 1) / 26);
	}

	return columnName;
}

/**
 * Format complex values (arrays, objects) into human-readable strings
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatComplexValue(value: any): string {
	if (Array.isArray(value)) {
		// Format arrays as comma-separated values
		return value
			.map((item) => {
				if (typeof item === "object" && item !== null) {
					// For objects in array, join all values with spaces
					return Object.values(item).join(" ");
				}
				return String(item);
			})
			.join(", ");
	} else if (typeof value === "object" && value !== null) {
		// Format objects as comma-separated values
		return Object.values(value).join(", ");
	}
	return String(value);
}

/**
 * Fetch orders from database with optional event filter
 */
async function getOrdersForSync(eventId?: string) {
	const orders = await prisma.order.findMany({
		where: eventId ? { eventId } : undefined,
		include: {
			user: {
				select: {
					id: true,
					name: true,
					email: true,
					studentId: true,
					firstName: true,
					lastName: true,
				},
			},
			event: {
				select: {
					id: true,
					name: true,
					checkoutConfig: true,
					products: {
						select: {
							productId: true,
							packageId: true,
							categoryId: true,
							category: {
								select: {
									name: true,
								},
							},
						},
					},
				},
			},
			orderItems: {
				include: {
					product: {
						select: {
							name: true,
							description: true,
						},
					},
					package: {
						select: {
							name: true,
							description: true,
						},
					},
				},
			},
		},
		orderBy: { createdAt: "desc" },
	});

	return orders;
}

/**
 * Parse checkout config to get field definitions with proper labels
 */
function parseCheckoutConfig(
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	checkoutConfig: any,
): Map<string, CheckoutField> {
	const fieldMap = new Map<string, CheckoutField>();

	if (!checkoutConfig?.additionalFields) return fieldMap;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	checkoutConfig.additionalFields.forEach((field: CheckoutField) => {
		// Use the field label as the key (that's what's stored in order.eventData.fields)
		fieldMap.set(field.label, field);
	});

	return fieldMap;
}

/**
 * Convert orders to rows for Google Sheets
 * Properly expands repeater fields into numbered columns
 */
function ordersToRows(orders: Awaited<ReturnType<typeof getOrdersForSync>>) {
	// Base columns that should appear first
	const baseColumns = [
		"Order ID",
		"Order Date",
		"Customer Name",
		"First Name",
		"Last Name",
		"Customer Email",
		"Student ID",
		"Product Name",
		"Product Description",
		"Category",
		"Size",
		"Quantity",
		"Purchase Code",
		"Unit Price",
		"Item Total",
		"Order Total",
		"Order Status",
		"GCash Ref No",
		"Notes",
		"Delivery Date",
		"Delivery Time",
		"Event",
		"Receipt URL",
	];

	// Collect all event-specific columns by parsing checkout configs
	const eventColumnsMap = new Map<string, number>(); // Map of field label to max count for repeaters

	orders.forEach((order) => {
		if (order.eventData && order.event?.checkoutConfig) {
			const fieldMap = parseCheckoutConfig(order.event.checkoutConfig);
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const eventDataWrapper = order.eventData as any;
			const eventData = eventDataWrapper.fields || eventDataWrapper; // Handle both .fields and direct structure

			Object.keys(eventData).forEach((key) => {
				const fieldDef = fieldMap.get(key);
				const value = eventData[key];

				if (fieldDef?.type === "repeater" && Array.isArray(value)) {
					// For repeater fields, track the maximum count
					let currentMax = eventColumnsMap.get(key) || 0;

					// Check if this repeater field contains both 'date' and 'time' columns,
					// which suggests it's a delivery details repeater.
					const hasDateColumn = fieldDef.columns?.some((col) => col.type === "date");
					const hasTimeColumn = fieldDef.columns?.some((col) => col.type === "time");

					if (hasDateColumn && hasTimeColumn) {
						// Ensure there are always at least 5 slots for delivery details
						currentMax = Math.max(currentMax, value.length, 5);
					} else {
						currentMax = Math.max(currentMax, value.length);
					}
					eventColumnsMap.set(key, currentMax);
				} else {
					// For simple fields, just track that it exists
					if (!eventColumnsMap.has(key)) {
						eventColumnsMap.set(key, 0);
					}
				}
			});
		}
	});

	// Build ordered column list
	const eventColumns: string[] = [];

	// Process each event field in order to build column headers
	orders.forEach((order) => {
		if (order.event?.checkoutConfig) {
			const fieldMap = parseCheckoutConfig(order.event.checkoutConfig);

			fieldMap.forEach((fieldDef, fieldLabel) => {
				if (fieldDef.type === "repeater") {
					const maxCount = eventColumnsMap.get(fieldLabel) || 0;
					// Create numbered columns for each repeater instance
					for (let i = 1; i <= maxCount; i++) {
						// For each column in the repeater
						if (fieldDef.columns) {
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							fieldDef.columns.forEach((column: any) => {
								const colName = `${column.label} ${i}`;
								if (!eventColumns.includes(colName) && !baseColumns.includes(colName)) {
									eventColumns.push(colName);
								}
							});
						}
					}
				} else if (fieldDef.type !== "message") {
					// Simple field (skip message fields as they're not data fields)
					if (!eventColumns.includes(fieldDef.label) && !baseColumns.includes(fieldDef.label)) {
						eventColumns.push(fieldDef.label);
					}
				}
			});
		}
	});

	const orderedColumns = [...baseColumns, ...eventColumns];

	// Convert orders to rows
	const dataRows = orders.flatMap((order) =>
		order.orderItems.map((item, index) => {
			// Look up category from event products
			const eventProducts = order.event?.products as
				| {
						productId: string | null;
						packageId: string | null;
						category: { name: string } | null;
				  }[]
				| undefined;
			const eventProduct = eventProducts?.find(
				(ep) =>
					(item.productId && ep.productId === item.productId) ||
					(item.packageId && ep.packageId === item.packageId),
			);
			const categoryName = eventProduct?.category?.name || "N/A";

			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			const baseData: Record<string, any> = {
				"Order ID": order.id,
				"Order Date": new Date(order.createdAt).toLocaleString("en-US", {
					timeZone: "Asia/Manila",
				}),
				"Customer Name": order.user.name || "N/A",
				"First Name": order.user.firstName || "N/A",
				"Last Name": order.user.lastName || "N/A",
				"Customer Email": order.user.email,
				"Student ID": order.user.studentId || "N/A",
				"Product Name": item.product?.name || item.package?.name || "Unknown",
				"Product Description": item.product?.description || item.package?.description || "",
				Category: categoryName,
				Size: item.size || "N/A",
				Quantity: item.quantity,
				"Purchase Code": item.purchaseCode || "N/A",
				"Unit Price": item.price,
				"Item Total": item.price * item.quantity,
				"Order Total": index === 0 ? order.totalAmount : "",
				"Order Status": order.status,
				"GCash Ref No": index === 0 ? order.gcashReferenceNumber || "Needs Manual Checking" : "",
				Notes: order.notes || "",
				"Delivery Date":
					index === 0 && order.deliveryDate
						? new Date(order.deliveryDate).toLocaleDateString("en-US", { timeZone: "Asia/Manila" })
						: "",
				"Delivery Time": index === 0 ? order.deliveryTimeSlot || "N/A" : "",
				Event: index === 0 ? order.event?.name || "N/A" : "",
				"Receipt URL": index === 0 ? order.receiptImageUrl || "" : "",
			};

			// Add event-specific custom field data (only on first item)
			if (index === 0 && order.eventData && order.event?.checkoutConfig) {
				const fieldMap = parseCheckoutConfig(order.event.checkoutConfig);
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const eventDataWrapper = order.eventData as any;
				const eventData = eventDataWrapper.fields || eventDataWrapper; // Handle both .fields and direct structure

				Object.keys(eventData).forEach((key) => {
					// Skip eventName or other metadata fields
					if (key === "eventName") return;

					const fieldDef = fieldMap.get(key);
					const value = eventData[key];

					if (!fieldDef) {
						// Unknown field, skip
						return;
					}

					if (fieldDef.type === "repeater" && Array.isArray(value)) {
						// Expand repeater into numbered columns
						value.forEach((item, i) => {
							if (typeof item === "object" && item !== null && fieldDef.columns) {
								// eslint-disable-next-line @typescript-eslint/no-explicit-any
								fieldDef.columns.forEach((column: any) => {
									const colName = `${column.label} ${i + 1}`;
									// Access value using column ID (like "col-1769270063141")
									const subValue = item[column.id];
									baseData[colName] = subValue || "N/A";
								});
							}
						});
					} else if (fieldDef.type !== "message") {
						// Simple field (skip message fields)
						if (value === null || value === undefined) {
							baseData[fieldDef.label] = "N/A";
						} else if (typeof value === "object") {
							baseData[fieldDef.label] = formatComplexValue(value);
						} else {
							baseData[fieldDef.label] = value;
						}
					}
				});
			}

			// Convert to ordered array matching column order
			return orderedColumns.map((col) => baseData[col] || "");
		}),
	);

	return { headers: orderedColumns, dataRows };
}

/**
 * Upload image to Google Drive and return public URL
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function uploadImageToDrive(imageUrl: string, auth: any): Promise<string | null> {
	try {
		const drive = google.drive({ version: "v3", auth });

		// Fetch the image
		const response = await fetch(imageUrl);
		if (!response.ok) return null;

		const arrayBuffer = await response.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		// Determine mime type
		const contentType = response.headers.get("content-type") || "image/jpeg";

		// Upload to Drive
		const fileMetadata = {
			name: `receipt_${Date.now()}.jpg`,
			parents: [], // Optional: specify a folder ID if needed
		};

		const media = {
			mimeType: contentType,
			body: Readable.from(buffer),
		};

		const file = await drive.files.create({
			requestBody: fileMetadata,
			media: media,
			fields: "id, webViewLink, thumbnailLink",
		});

		// Make the file publicly accessible (optional, for easier viewing)
		await drive.permissions.create({
			fileId: file.data.id!,
			requestBody: {
				role: "reader",
				type: "anyone",
			},
		});

		return file.data.thumbnailLink || file.data.webViewLink || null;
	} catch (error) {
		console.error("Error uploading image to Drive:", error);
		return null;
	}
}

/**
 * Sync orders to Google Sheets
 * This will clear the sheet and rewrite all data
 */
export async function syncOrdersToGoogleSheets(eventId?: string): Promise<{
	success: boolean;
	message: string;
	syncedCount?: number;
}> {
	try {
		const auth = await getGoogleSheetsClient();
		const sheets = google.sheets({ version: "v4", auth });
		const settings = await getGoogleSheetsSettings();
		const spreadsheetId = settings.spreadsheetId;
		const sheetName = settings.sheetName;

		// Fetch orders
		const orders = await getOrdersForSync(eventId);

		if (orders.length === 0) {
			return {
				success: true,
				message: "No orders found to sync",
				syncedCount: 0,
			};
		}

		// Convert to rows
		const { headers, dataRows } = ordersToRows(orders);

		// Note: Google Drive image upload is disabled because service accounts don't have storage quota
		// Service accounts would need to use Shared Drives or OAuth delegation
		// For now, receipt URLs are included as clickable links
		// if (includeImages) {
		// 	const receiptUrlIndex = headers.indexOf("Receipt URL");
		// 	if (receiptUrlIndex !== -1) {
		// 		for (let i = 0; i < dataRows.length; i++) {
		// 			const receiptUrl = dataRows[i][receiptUrlIndex];
		// 			if (receiptUrl && receiptUrl !== "" && receiptUrl !== "N/A") {
		// 				const driveUrl = await uploadImageToDrive(receiptUrl, auth);
		// 				if (driveUrl) {
		// 					dataRows[i][receiptUrlIndex] = `=IMAGE("${driveUrl}")`;
		// 				}
		// 			}
		// 		}
		// 	}
		// }

		const allRows = [headers, ...dataRows];

		// Clear existing data (expand range to handle more columns)
		await sheets.spreadsheets.values.clear({
			spreadsheetId,
			range: `${sheetName}!A:ZZ`,
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

		// Format header row and auto-resize columns
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
								endIndex: headers.length,
							},
						},
					},
				],
			},
		});

		// Update last sync timestamp in a metadata area
		const syncTimestamp = new Date().toLocaleString("en-US", {
			timeZone: "Asia/Manila", // UTC+8
			year: "numeric",
			month: "2-digit",
			day: "2-digit",
			hour: "2-digit",
			minute: "2-digit",
			second: "2-digit",
			hour12: true,
		});
		const metadataColumn = getColumnName(headers.length + 3); // 2 columns after data (column numbers start at 1)
		await sheets.spreadsheets.values.update({
			spreadsheetId,
			range: `${sheetName}!${metadataColumn}1:${metadataColumn}2`,
			valueInputOption: "USER_ENTERED",
			requestBody: {
				values: [["Last Synced:"], [syncTimestamp]],
			},
		});

		return {
			success: true,
			message: `Successfully synced ${dataRows.length} order items from ${orders.length} orders to Google Sheets`,
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
export async function isGoogleSheetsConfigured(): Promise<boolean> {
	const hasCreds = !!process.env.GOOGLE_SHEETS_CREDENTIALS;

	// Check database settings
	try {
		const settings = await prisma.shopSettings.findUnique({
			where: { key: "googleSheets" },
		});

		if (settings && settings.value) {
			const data = settings.value as { spreadsheetId: string; sheetName: string };
			if (data.spreadsheetId) {
				return hasCreds && true;
			}
		}
	} catch {
		// Fall through to check environment variables
	}

	// Fall back to environment variables
	const hasSpreadsheet = !!(
		process.env.SHOP_SPREADSHEET_ID || process.env.FLOWER_FEST_SPREADSHEET_ID
	);
	return hasCreds && hasSpreadsheet;
}

/**
 * Get sync status information
 */
export async function getSyncStatus(): Promise<{
	configured: boolean;
	lastSync?: string;
	orderCount?: number;
}> {
	const configured = await isGoogleSheetsConfigured();

	if (!configured) {
		return { configured: false };
	}

	try {
		const auth = await getGoogleSheetsClient();
		const sheets = google.sheets({ version: "v4", auth });
		const settings = await getGoogleSheetsSettings();
		const spreadsheetId = settings.spreadsheetId;
		const sheetName = settings.sheetName;

		// Try to get headers to determine column count
		const headerResponse = await sheets.spreadsheets.values.get({
			spreadsheetId,
			range: `${sheetName}!A1:ZZ1`,
		});

		const columnCount = headerResponse.data.values?.[0]?.length || 0;
		const metadataColumn = getColumnName(columnCount + 3); // 2 columns after data

		// Get last sync timestamp
		const response = await sheets.spreadsheets.values.get({
			spreadsheetId,
			range: `${sheetName}!${metadataColumn}1:${metadataColumn}2`,
		});

		const lastSync = response.data.values?.[1]?.[0] || undefined;

		// Count orders in database
		const orders = await getOrdersForSync();

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
