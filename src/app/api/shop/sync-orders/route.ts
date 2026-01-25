/**
 * API Route: Sync Orders to Google Sheets
 *
 * POST /api/shop/sync-orders
 *
 * This endpoint syncs Flower Fest orders to Google Sheets.
 * Can be called:
 * - Manually by admin (requires authentication)
 * - By cron service (requires CRON_SECRET header)
 *
 * For automated 10-minute sync, set up a cron job service like:
 * - Vercel Cron Jobs
 * - GitHub Actions scheduled workflow
 * - External cron service (cron-job.org, etc.)
 */

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
	syncOrdersToGoogleSheets,
	isGoogleSheetsConfigured,
	getSyncStatus,
} from "@/lib/googleSheets";
import { headers } from "next/headers";

// POST - Trigger sync
export async function POST(request: NextRequest) {
	try {
		// Check if Google Sheets is configured
		const isConfigured = await isGoogleSheetsConfigured();
		if (!isConfigured) {
			return NextResponse.json(
				{
					success: false,
					message:
						"Google Sheets is not configured. Please configure it in the admin settings or set GOOGLE_SHEETS_CREDENTIALS and SHOP_SPREADSHEET_ID environment variables.",
				},
				{ status: 503 },
			);
		}

		// Get query parameters
		const searchParams = request.nextUrl.searchParams;
		const eventId = searchParams.get("eventId") || undefined;

		// Check authorization
		const headersList = await headers();
		const cronSecret = headersList.get("x-cron-secret");
		const expectedCronSecret = process.env.CRON_SECRET;

		// If cron secret is provided and matches, allow sync
		if (cronSecret && expectedCronSecret && cronSecret === expectedCronSecret) {
			const result = await syncOrdersToGoogleSheets(eventId);
			return NextResponse.json(result, { status: result.success ? 200 : 500 });
		}

		// Otherwise, check for admin authentication
		const session = await auth.api.getSession({
			headers: await headers(),
		});
		if (!session?.user) {
			return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
		}

		// Check if user is shop admin
		// Note: You may want to also check for event-specific admin access
		const isAdmin = (session.user as { isShopAdmin?: boolean }).isShopAdmin;
		if (!isAdmin) {
			return NextResponse.json(
				{ success: false, message: "Admin access required" },
				{ status: 403 },
			);
		}

		// Perform sync
		const result = await syncOrdersToGoogleSheets(eventId);
		return NextResponse.json(result, { status: result.success ? 200 : 500 });
	} catch (error) {
		console.error("Sync endpoint error:", error);
		return NextResponse.json(
			{
				success: false,
				message: error instanceof Error ? error.message : "Internal server error",
			},
			{ status: 500 },
		);
	}
}

// GET - Check sync status
export async function GET() {
	try {
		// Check if Google Sheets is configured
		const isConfigured = await isGoogleSheetsConfigured();
		if (!isConfigured) {
			return NextResponse.json({
				configured: false,
				message: "Google Sheets is not configured",
			});
		}

		const status = await getSyncStatus();
		return NextResponse.json(status);
	} catch (error) {
		console.error("Sync status error:", error);
		return NextResponse.json(
			{
				configured: false,
				message: error instanceof Error ? error.message : "Error checking status",
			},
			{ status: 500 },
		);
	}
}
