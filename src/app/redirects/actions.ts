"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

async function checkRedirectsAdmin() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		throw new Error("Unauthorized");
	}

	const user = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: { isRedirectsAdmin: true },
	});

	if (!user?.isRedirectsAdmin) {
		throw new Error("Forbidden: Redirects admin access required");
	}

	return session;
}

// Actions for CRUD operations on Redirects
const redirectSchema = z.object({
	id: z.string().optional(),
	newURL: z.string().url("Must be a valid URL"),
	redirectCode: z.string().min(1, "Short Code is required"),
});

export async function createRedirect(formData: FormData) {
	try {
		await checkRedirectsAdmin();
		const data = redirectSchema.parse(Object.fromEntries(formData));
		await prisma.redirects.create({
			data: {
				newURL: data.newURL,
				redirectCode: data.redirectCode,
			},
		});
		revalidatePath("/redirects");
		return { success: true, message: "Redirect created successfully." };
	} catch (error) {
		return { success: false, message: "Failed to create redirect." };
	}
}

export async function updateRedirect(formData: FormData) {
	try {
		await checkRedirectsAdmin();
		const data = redirectSchema.parse(Object.fromEntries(formData));
		if (!data.id) throw new Error("ID is required for update.");

		await prisma.redirects.update({
			where: { id: data.id },
			data: { newURL: data.newURL, redirectCode: data.redirectCode },
		});
		revalidatePath("/redirects");
		return { success: true, message: "Redirect updated successfully." };
	} catch (error) {
		return { success: false, message: "Failed to update redirect." };
	}
}

export async function deleteRedirect(id: string) {
	try {
		await checkRedirectsAdmin();
		await prisma.redirects.delete({ where: { id } });
		revalidatePath("/redirects");
		return { success: true, message: "Redirect deleted successfully." };
	} catch (error) {
		return { success: false, message: "Failed to delete redirect." };
	}
}

export type TimeRange = "24h" | "7d" | "30d";

export type ClickAnalytics = {
	date: string;
	clicks: number;
};

export type RedirectAnalytics = {
	redirect: {
		id: string;
		redirectCode: string;
		newURL: string;
		clicks: number;
		createdAt: Date;
	};
	clickData: ClickAnalytics[];
	totalClicks: number;
	avgClicks: number;
	peakPeriod: { date: string; clicks: number } | null;
	timeRange: TimeRange;
};

export async function getRedirectAnalytics(
	redirectId: string,
	timeRange: TimeRange = "7d",
): Promise<{ success: true; data: RedirectAnalytics } | { success: false; message: string }> {
	try {
		await checkRedirectsAdmin();

		const redirect = await prisma.redirects.findUnique({
			where: { id: redirectId },
		});

		if (!redirect) {
			return { success: false, message: "Redirect not found." };
		}

		const now = new Date();
		const startDate = new Date();

		// Calculate start date and interval based on time range
		let intervalCount: number;
		let groupByHour = false;

		switch (timeRange) {
			case "24h":
				startDate.setHours(startDate.getHours() - 24);
				intervalCount = 24;
				groupByHour = true;
				break;
			case "7d":
				startDate.setDate(startDate.getDate() - 7);
				startDate.setHours(0, 0, 0, 0);
				intervalCount = 7;
				break;
			case "30d":
			default:
				startDate.setDate(startDate.getDate() - 30);
				startDate.setHours(0, 0, 0, 0);
				intervalCount = 30;
				break;
		}

		const clicks = await prisma.redirectClick.findMany({
			where: {
				redirectId,
				clickedAt: {
					gte: startDate,
				},
			},
			orderBy: {
				clickedAt: "asc",
			},
		});

		// Group clicks by interval
		const clicksByInterval = new Map<string, number>();

		if (groupByHour) {
			// Initialize all 24 hours
			for (let i = 0; i < intervalCount; i++) {
				const date = new Date(now);
				date.setHours(date.getHours() - (intervalCount - 1 - i));
				date.setMinutes(0, 0, 0);
				const key = date.toISOString().slice(0, 13); // YYYY-MM-DDTHH
				clicksByInterval.set(key, 0);
			}
			// Count clicks
			clicks.forEach((click) => {
				const key = click.clickedAt.toISOString().slice(0, 13);
				if (clicksByInterval.has(key)) {
					clicksByInterval.set(key, (clicksByInterval.get(key) || 0) + 1);
				}
			});
		} else {
			// Initialize all days
			for (let i = 0; i < intervalCount; i++) {
				const date = new Date();
				date.setDate(date.getDate() - (intervalCount - 1 - i));
				const dateStr = date.toISOString().split("T")[0];
				clicksByInterval.set(dateStr, 0);
			}
			// Count clicks
			clicks.forEach((click) => {
				const dateStr = click.clickedAt.toISOString().split("T")[0];
				if (clicksByInterval.has(dateStr)) {
					clicksByInterval.set(dateStr, (clicksByInterval.get(dateStr) || 0) + 1);
				}
			});
		}

		// Convert to array for chart
		const clickData: ClickAnalytics[] = Array.from(clicksByInterval.entries()).map(
			([date, clicks]) => ({
				date,
				clicks,
			}),
		);

		// Calculate stats
		const totalClicks = clicks.length;
		const avgClicks = totalClicks / intervalCount;
		const peakPeriod = clickData.reduce<{ date: string; clicks: number } | null>((max, item) => {
			if (!max || item.clicks > max.clicks) {
				return item;
			}
			return max;
		}, null);

		return {
			success: true,
			data: {
				redirect,
				clickData,
				totalClicks,
				avgClicks,
				peakPeriod,
				timeRange,
			},
		};
	} catch (error) {
		return { success: false, message: "Failed to fetch analytics." };
	}
}

export async function cleanupOldClicks(): Promise<{ success: boolean; message: string }> {
	try {
		await checkRedirectsAdmin();

		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

		const result = await prisma.redirectClick.deleteMany({
			where: {
				clickedAt: {
					lt: thirtyDaysAgo,
				},
			},
		});

		return {
			success: true,
			message: `Cleaned up ${result.count} old click records.`,
		};
	} catch (error) {
		return { success: false, message: "Failed to cleanup old clicks." };
	}
}
