"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// Helper to convert datetime-local input (assumed PHT) to UTC Date
function parseManilaDatetime(datetimeStr: string): Date | null {
	if (!datetimeStr) return null;
	// datetime-local gives us format: "2024-01-15T14:30"
	// We need to interpret this as Manila time (UTC+8)
	// Append +08:00 timezone offset to parse as Manila time
	const manilaDateStr = `${datetimeStr}:00+08:00`;
	return new Date(manilaDateStr);
}

export async function getActiveBanner() {
	try {
		const banner = await prisma.banner.findFirst({
			where: { isActive: true },
			orderBy: { updatedAt: "desc" },
		});
		return { success: true, banner };
	} catch (error) {
		console.error("Error fetching active banner:", error);
		return { success: false, message: "Failed to fetch banner" };
	}
}

export async function getAllBanners() {
	try {
		const banners = await prisma.banner.findMany({
			orderBy: { updatedAt: "desc" },
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

		if (!message) {
			return { success: false, message: "Message is required" };
		}

		// If creating an active banner, deactivate all others
		if (isActive) {
			await prisma.banner.updateMany({
				where: { isActive: true },
				data: { isActive: false },
			});
		}

		// Parse deadline as Manila time (UTC+8)
		const deadline = parseManilaDatetime(deadlineStr);

		const banner = await prisma.banner.create({
			data: {
				message,
				deadline,
				isActive,
			},
		});

		revalidatePath("/");
		revalidatePath("/admin/banner");

		return { success: true, message: "Banner created successfully", banner };
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

		if (!id || !message) {
			return { success: false, message: "ID and message are required" };
		}

		// If activating this banner, deactivate all others
		if (isActive) {
			await prisma.banner.updateMany({
				where: { isActive: true, NOT: { id } },
				data: { isActive: false },
			});
		}

		// Parse deadline as Manila time (UTC+8)
		const deadline = parseManilaDatetime(deadlineStr);

		const banner = await prisma.banner.update({
			where: { id },
			data: {
				message,
				deadline,
				isActive,
			},
		});

		revalidatePath("/");
		revalidatePath("/admin/banner");

		return { success: true, message: "Banner updated successfully", banner };
	} catch (error) {
		console.error("Error updating banner:", error);
		return { success: false, message: "Failed to update banner" };
	}
}

export async function deleteBanner(id: string) {
	try {
		await prisma.banner.delete({
			where: { id },
		});

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
		// If activating this banner, deactivate all others
		if (isActive) {
			await prisma.banner.updateMany({
				where: { isActive: true, NOT: { id } },
				data: { isActive: false },
			});
		}

		const banner = await prisma.banner.update({
			where: { id },
			data: { isActive },
		});

		revalidatePath("/");
		revalidatePath("/admin/banner");

		return { success: true, message: "Banner status updated", banner };
	} catch (error) {
		console.error("Error toggling banner status:", error);
		return { success: false, message: "Failed to update banner status" };
	}
}
