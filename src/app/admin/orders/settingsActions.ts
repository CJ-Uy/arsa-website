"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

async function checkShopAdmin() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		throw new Error("Unauthorized");
	}

	const user = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: { isShopAdmin: true },
	});

	if (!user?.isShopAdmin) {
		throw new Error("Forbidden: Shop admin access required");
	}

	return session;
}

export type GoogleSheetsSettings = {
	spreadsheetId: string;
	sheetName: string;
};

export async function getGoogleSheetsSettings() {
	try {
		await checkShopAdmin();

		const settings = await prisma.shopSettings.findUnique({
			where: { key: "googleSheets" },
		});

		if (!settings) {
			// Return defaults from environment variables if no DB settings exist
			return {
				success: true,
				data: {
					spreadsheetId:
						process.env.SHOP_SPREADSHEET_ID || process.env.FLOWER_FEST_SPREADSHEET_ID || "",
					sheetName: process.env.SHOP_SHEET_NAME || process.env.FLOWER_FEST_SHEET_NAME || "Orders",
				} as GoogleSheetsSettings,
			};
		}

		return {
			success: true,
			data: settings.value as GoogleSheetsSettings,
		};
	} catch (error: any) {
		return { success: false, message: error.message || "Failed to get settings" };
	}
}

export async function saveGoogleSheetsSettings(settings: GoogleSheetsSettings) {
	try {
		const session = await checkShopAdmin();

		await prisma.shopSettings.upsert({
			where: { key: "googleSheets" },
			update: {
				value: settings,
				updatedBy: session.user.id,
			},
			create: {
				key: "googleSheets",
				value: settings,
				updatedBy: session.user.id,
			},
		});

		return { success: true };
	} catch (error: any) {
		return { success: false, message: error.message || "Failed to save settings" };
	}
}
