"use server";

import { revalidatePath } from "next/cache";
import { and, desc, eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { banner } from "@/db/schema";

function parseManilaDatetime(datetimeStr: string): Date | null {
	if (!datetimeStr) return null;
	const manilaDateStr = `${datetimeStr}:00+08:00`;
	return new Date(manilaDateStr);
}

export async function getActiveBanner() {
	try {
		const row = await db.query.banner.findFirst({
			where: eq(banner.isActive, true),
			orderBy: [desc(banner.updatedAt)],
		});
		return { success: true, banner: row };
	} catch (error) {
		console.error("Error fetching active banner:", error);
		return { success: false, message: "Failed to fetch banner" };
	}
}

export async function getAllBanners() {
	try {
		const banners = await db.query.banner.findMany({
			orderBy: [desc(banner.updatedAt)],
		});
		return { success: true, banners };
	} catch (error) {
		console.error("Error fetching banners:", error);
		return { success: false, message: "Failed to fetch banners" };
	}
}

export async function createBanner(formData: FormData) {
	try {
		const message = formData.get("message") as string;
		const deadlineStr = formData.get("deadline") as string;
		const isActive = formData.get("isActive") === "true";

		if (!message) return { success: false, message: "Message is required" };

		if (isActive) {
			await db.update(banner).set({ isActive: false }).where(eq(banner.isActive, true));
		}

		const deadline = parseManilaDatetime(deadlineStr);
		const inserted = await db
			.insert(banner)
			.values({ message, deadline, isActive })
			.returning();

		revalidatePath("/");
		revalidatePath("/admin/banner");
		return { success: true, message: "Banner created successfully", banner: inserted[0] };
	} catch (error) {
		console.error("Error creating banner:", error);
		return { success: false, message: "Failed to create banner" };
	}
}

export async function updateBanner(formData: FormData) {
	try {
		const id = formData.get("id") as string;
		const message = formData.get("message") as string;
		const deadlineStr = formData.get("deadline") as string;
		const isActive = formData.get("isActive") === "true";

		if (!id || !message) return { success: false, message: "ID and message are required" };

		if (isActive) {
			await db
				.update(banner)
				.set({ isActive: false })
				.where(and(eq(banner.isActive, true), ne(banner.id, id)));
		}

		const deadline = parseManilaDatetime(deadlineStr);
		const updated = await db
			.update(banner)
			.set({ message, deadline, isActive })
			.where(eq(banner.id, id))
			.returning();

		revalidatePath("/");
		revalidatePath("/admin/banner");
		return { success: true, message: "Banner updated successfully", banner: updated[0] };
	} catch (error) {
		console.error("Error updating banner:", error);
		return { success: false, message: "Failed to update banner" };
	}
}

export async function deleteBanner(id: string) {
	try {
		await db.delete(banner).where(eq(banner.id, id));
		revalidatePath("/");
		revalidatePath("/admin/banner");
		return { success: true, message: "Banner deleted successfully" };
	} catch (error) {
		console.error("Error deleting banner:", error);
		return { success: false, message: "Failed to delete banner" };
	}
}

export async function toggleBannerStatus(id: string, isActive: boolean) {
	try {
		if (isActive) {
			await db
				.update(banner)
				.set({ isActive: false })
				.where(and(eq(banner.isActive, true), ne(banner.id, id)));
		}
		const updated = await db
			.update(banner)
			.set({ isActive })
			.where(eq(banner.id, id))
			.returning();
		revalidatePath("/");
		revalidatePath("/admin/banner");
		return { success: true, message: "Banner status updated", banner: updated[0] };
	} catch (error) {
		console.error("Error toggling banner status:", error);
		return { success: false, message: "Failed to update banner status" };
	}
}
