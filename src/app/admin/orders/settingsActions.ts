"use server";

import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user, shopSettings } from "@/db/schema";

async function checkShopAdmin() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) throw new Error("Unauthorized");

	const u = await db.query.user.findFirst({
		where: eq(user.id, session.user.id),
		columns: { isShopAdmin: true },
	});
	if (!u?.isShopAdmin) throw new Error("Forbidden: Shop admin access required");
	return session;
}

export type GoogleSheetsSettings = {
	spreadsheetId: string;
	sheetName: string;
};

export async function getGoogleSheetsSettings() {
	try {
		await checkShopAdmin();
		const settings = await db.query.shopSettings.findFirst({
			where: eq(shopSettings.key, "googleSheets"),
		});

		if (!settings) {
			return {
				success: true,
				data: {
					spreadsheetId:
						process.env.SHOP_SPREADSHEET_ID || process.env.FLOWER_FEST_SPREADSHEET_ID || "",
					sheetName:
						process.env.SHOP_SHEET_NAME || process.env.FLOWER_FEST_SHEET_NAME || "Orders",
				} as GoogleSheetsSettings,
			};
		}

		return { success: true, data: settings.value as GoogleSheetsSettings };
	} catch (error: any) {
		return { success: false, message: error.message || "Failed to get settings" };
	}
}

export async function saveGoogleSheetsSettings(settings: GoogleSheetsSettings) {
	try {
		const session = await checkShopAdmin();

		const existing = await db.query.shopSettings.findFirst({
			where: eq(shopSettings.key, "googleSheets"),
		});

		if (existing) {
			await db
				.update(shopSettings)
				.set({ value: settings, updatedBy: session.user.id })
				.where(eq(shopSettings.key, "googleSheets"));
		} else {
			await db.insert(shopSettings).values({
				key: "googleSheets",
				value: settings,
				updatedBy: session.user.id,
			});
		}

		return { success: true };
	} catch (error: any) {
		return { success: false, message: error.message || "Failed to save settings" };
	}
}
