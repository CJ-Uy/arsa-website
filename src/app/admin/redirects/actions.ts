"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { and, asc, eq, gte, lt, ne } from "drizzle-orm";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
	user,
	redirects,
	redirectClick,
	redirectTag,
	redirectTagAssignment,
} from "@/db/schema";

async function checkRedirectsAdmin() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) throw new Error("Unauthorized");

	const u = await db.query.user.findFirst({
		where: eq(user.id, session.user.id),
		columns: { isRedirectsAdmin: true },
	});
	if (!u?.isRedirectsAdmin) throw new Error("Forbidden: Redirects admin access required");
	return session;
}

export type RedirectTagData = {
	id: string;
	name: string;
	color: string;
};

export async function getTags(): Promise<RedirectTagData[]> {
	await checkRedirectsAdmin();
	return db.query.redirectTag.findMany({ orderBy: [asc(redirectTag.name)] });
}

export async function createTag(name: string, color: string) {
	try {
		await checkRedirectsAdmin();
		const inserted = await db
			.insert(redirectTag)
			.values({ name: name.trim().toLowerCase(), color })
			.returning();
		revalidatePath("/admin/redirects");
		return { success: true, tag: inserted[0] } as const;
	} catch {
		return { success: false, message: "Failed to create tag. It may already exist." } as const;
	}
}

export async function updateTag(id: string, name: string, color: string) {
	try {
		await checkRedirectsAdmin();
		const updated = await db
			.update(redirectTag)
			.set({ name: name.trim().toLowerCase(), color })
			.where(eq(redirectTag.id, id))
			.returning();
		revalidatePath("/admin/redirects");
		return { success: true, tag: updated[0] } as const;
	} catch {
		return { success: false, message: "Failed to update tag." } as const;
	}
}

export async function deleteTag(id: string) {
	try {
		await checkRedirectsAdmin();
		await db.delete(redirectTag).where(eq(redirectTag.id, id));
		revalidatePath("/admin/redirects");
		return { success: true, message: "Tag deleted." } as const;
	} catch {
		return { success: false, message: "Failed to delete tag." } as const;
	}
}

export async function assignTagsToRedirect(redirectId: string, tagIds: string[]) {
	try {
		await checkRedirectsAdmin();
		await db
			.delete(redirectTagAssignment)
			.where(eq(redirectTagAssignment.redirectId, redirectId));
		if (tagIds.length > 0) {
			await db
				.insert(redirectTagAssignment)
				.values(tagIds.map((tagId) => ({ redirectId, tagId })));
		}
		revalidatePath("/admin/redirects");
		return { success: true, message: "Tags updated." } as const;
	} catch {
		return { success: false, message: "Failed to assign tags." } as const;
	}
}

const redirectSchema = z.object({
	id: z.string().optional(),
	newURL: z.string().url("Must be a valid URL"),
	redirectCode: z.string().min(1, "Short Code is required"),
	tagIds: z.string().optional(),
});

function parseTagIds(tagIdsStr: string | undefined): string[] {
	if (!tagIdsStr) return [];
	return tagIdsStr.split(",").filter(Boolean);
}

export async function createRedirect(formData: FormData) {
	try {
		await checkRedirectsAdmin();
		const data = redirectSchema.parse(Object.fromEntries(formData));
		const tagIds = parseTagIds(data.tagIds);

		const inserted = await db
			.insert(redirects)
			.values({ newURL: data.newURL, redirectCode: data.redirectCode })
			.returning();
		const redirectId = inserted[0].id;

		if (tagIds.length > 0) {
			await db
				.insert(redirectTagAssignment)
				.values(tagIds.map((tagId) => ({ redirectId, tagId })));
		}

		revalidatePath("/admin/redirects");
		return { success: true, message: "Redirect created successfully." };
	} catch {
		return { success: false, message: "Failed to create redirect." };
	}
}

export async function updateRedirect(formData: FormData) {
	try {
		await checkRedirectsAdmin();
		const data = redirectSchema.parse(Object.fromEntries(formData));
		if (!data.id) throw new Error("ID is required for update.");
		const tagIds = parseTagIds(data.tagIds);

		await db
			.update(redirects)
			.set({ newURL: data.newURL, redirectCode: data.redirectCode })
			.where(eq(redirects.id, data.id));

		await db
			.delete(redirectTagAssignment)
			.where(eq(redirectTagAssignment.redirectId, data.id));
		if (tagIds.length > 0) {
			await db
				.insert(redirectTagAssignment)
				.values(tagIds.map((tagId) => ({ redirectId: data.id!, tagId })));
		}

		revalidatePath("/admin/redirects");
		return { success: true, message: "Redirect updated successfully." };
	} catch {
		return { success: false, message: "Failed to update redirect." };
	}
}

export async function deleteRedirect(id: string) {
	try {
		await checkRedirectsAdmin();
		await db.delete(redirects).where(eq(redirects.id, id));
		revalidatePath("/admin/redirects");
		return { success: true, message: "Redirect deleted successfully." };
	} catch {
		return { success: false, message: "Failed to delete redirect." };
	}
}

export type TimeRange = "24h" | "7d" | "30d" | "lifetime";

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

		const redirect = await db.query.redirects.findFirst({
			where: eq(redirects.id, redirectId),
		});
		if (!redirect) return { success: false, message: "Redirect not found." };

		const now = new Date();
		let startDate = new Date();
		let intervalCount: number;
		let groupByHour = false;
		let groupByWeek = false;
		let groupByMonth = false;

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
				startDate.setDate(startDate.getDate() - 30);
				startDate.setHours(0, 0, 0, 0);
				intervalCount = 30;
				break;
			case "lifetime": {
				startDate = new Date(redirect.createdAt);
				startDate.setHours(0, 0, 0, 0);
				const daysDiff = Math.ceil(
					(now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
				);
				if (daysDiff <= 60) {
					intervalCount = Math.max(daysDiff, 1);
				} else if (daysDiff <= 365) {
					groupByWeek = true;
					intervalCount = Math.ceil(daysDiff / 7);
				} else {
					groupByMonth = true;
					const monthsDiff =
						(now.getFullYear() - startDate.getFullYear()) * 12 +
						(now.getMonth() - startDate.getMonth()) +
						1;
					intervalCount = monthsDiff;
				}
				break;
			}
		}

		const clicks = await db.query.redirectClick.findMany({
			where: and(
				eq(redirectClick.redirectId, redirectId),
				gte(redirectClick.clickedAt, startDate),
			),
			orderBy: [asc(redirectClick.clickedAt)],
		});

		const clicksByInterval = new Map<string, number>();

		if (groupByHour) {
			for (let i = 0; i < intervalCount; i++) {
				const date = new Date(now);
				date.setHours(date.getHours() - (intervalCount - 1 - i));
				date.setMinutes(0, 0, 0);
				clicksByInterval.set(date.toISOString().slice(0, 13), 0);
			}
			clicks.forEach((click) => {
				const key = click.clickedAt.toISOString().slice(0, 13);
				if (clicksByInterval.has(key)) {
					clicksByInterval.set(key, (clicksByInterval.get(key) || 0) + 1);
				}
			});
		} else if (groupByWeek) {
			const current = new Date(startDate);
			for (let i = 0; i < intervalCount; i++) {
				clicksByInterval.set(current.toISOString().split("T")[0], 0);
				current.setDate(current.getDate() + 7);
			}
			const bucketKeys = Array.from(clicksByInterval.keys());
			clicks.forEach((click) => {
				const clickTime = click.clickedAt.getTime();
				let assignedKey: string | null = null;
				for (const key of bucketKeys) {
					if (new Date(key).getTime() <= clickTime) assignedKey = key;
					else break;
				}
				if (assignedKey && clicksByInterval.has(assignedKey)) {
					clicksByInterval.set(assignedKey, (clicksByInterval.get(assignedKey) || 0) + 1);
				}
			});
		} else if (groupByMonth) {
			const current = new Date(startDate);
			current.setDate(1);
			for (let i = 0; i < intervalCount; i++) {
				clicksByInterval.set(current.toISOString().slice(0, 7), 0);
				current.setMonth(current.getMonth() + 1);
			}
			clicks.forEach((click) => {
				const key = click.clickedAt.toISOString().slice(0, 7);
				if (clicksByInterval.has(key)) {
					clicksByInterval.set(key, (clicksByInterval.get(key) || 0) + 1);
				}
			});
		} else {
			for (let i = 0; i < intervalCount; i++) {
				const date = new Date(startDate);
				date.setDate(date.getDate() + i);
				clicksByInterval.set(date.toISOString().split("T")[0], 0);
			}
			clicks.forEach((click) => {
				const dateStr = click.clickedAt.toISOString().split("T")[0];
				if (clicksByInterval.has(dateStr)) {
					clicksByInterval.set(dateStr, (clicksByInterval.get(dateStr) || 0) + 1);
				}
			});
		}

		const clickData: ClickAnalytics[] = Array.from(clicksByInterval.entries()).map(
			([date, c]) => ({ date, clicks: c }),
		);

		const totalClicks = timeRange === "lifetime" ? redirect.clicks : clicks.length;
		const avgClicks = intervalCount > 0 ? totalClicks / intervalCount : 0;
		const peakPeriod = clickData.reduce<{ date: string; clicks: number } | null>((max, item) => {
			if (!max || item.clicks > max.clicks) return item;
			return max;
		}, null);

		return {
			success: true,
			data: { redirect, clickData, totalClicks, avgClicks, peakPeriod, timeRange },
		};
	} catch {
		return { success: false, message: "Failed to fetch analytics." };
	}
}

export async function cleanupOldClicks(): Promise<{ success: boolean; message: string }> {
	try {
		await checkRedirectsAdmin();
		const thirtyDaysAgo = new Date();
		thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
		const result = await db
			.delete(redirectClick)
			.where(lt(redirectClick.clickedAt, thirtyDaysAgo))
			.returning();
		return {
			success: true,
			message: `Cleaned up ${result.length} old click records.`,
		};
	} catch {
		return { success: false, message: "Failed to cleanup old clicks." };
	}
}

export type RedirectExportData = {
	version: 1;
	exportedAt: string;
	tags: { name: string; color: string }[];
	redirects: {
		redirectCode: string;
		newURL: string;
		tags: string[];
		clicks: number;
		createdAt: string;
	}[];
};

export async function exportRedirects(): Promise<
	{ success: true; data: RedirectExportData } | { success: false; message: string }
> {
	try {
		await checkRedirectsAdmin();
		const [allRedirects, tags] = await Promise.all([
			db.query.redirects.findMany({
				orderBy: [asc(redirects.redirectCode)],
				with: { redirectTags: { with: { tag: true } } },
			}),
			db.query.redirectTag.findMany({ orderBy: [asc(redirectTag.name)] }),
		]);

		return {
			success: true,
			data: {
				version: 1,
				exportedAt: new Date().toISOString(),
				tags: tags.map((t) => ({ name: t.name, color: t.color })),
				redirects: allRedirects.map((r) => ({
					redirectCode: r.redirectCode,
					newURL: r.newURL,
					tags: r.redirectTags.map((rt) => rt.tag.name),
					clicks: r.clicks,
					createdAt: r.createdAt.toISOString(),
				})),
			},
		};
	} catch {
		return { success: false, message: "Failed to export redirects." };
	}
}

const importSchema = z.object({
	version: z.number(),
	tags: z
		.array(z.object({ name: z.string(), color: z.string() }))
		.optional()
		.default([]),
	redirects: z.array(
		z.object({
			redirectCode: z.string().min(1),
			newURL: z.string().url(),
			tags: z.array(z.string()).optional().default([]),
			clicks: z.number().optional().default(0),
			createdAt: z.string().optional(),
		}),
	),
});

export type ImportMode = "skip" | "update";

export async function importRedirects(
	jsonData: string,
	mode: ImportMode = "skip",
): Promise<{
	success: boolean;
	message: string;
	created: number;
	updated: number;
	skipped: number;
}> {
	try {
		await checkRedirectsAdmin();
		const parsed = JSON.parse(jsonData);
		const validated = importSchema.parse(parsed);

		const tagMap = new Map<string, string>();
		for (const tagData of validated.tags) {
			const existing = await db.query.redirectTag.findFirst({
				where: eq(redirectTag.name, tagData.name),
			});
			if (existing) {
				await db
					.update(redirectTag)
					.set({ color: tagData.color })
					.where(eq(redirectTag.id, existing.id));
				tagMap.set(existing.name, existing.id);
			} else {
				const inserted = await db
					.insert(redirectTag)
					.values({ name: tagData.name, color: tagData.color })
					.returning();
				tagMap.set(inserted[0].name, inserted[0].id);
			}
		}

		for (const r of validated.redirects) {
			for (const tagName of r.tags) {
				if (!tagMap.has(tagName)) {
					const existing = await db.query.redirectTag.findFirst({
						where: eq(redirectTag.name, tagName),
					});
					if (existing) {
						tagMap.set(existing.name, existing.id);
					} else {
						const inserted = await db
							.insert(redirectTag)
							.values({ name: tagName, color: "#6b7280" })
							.returning();
						tagMap.set(inserted[0].name, inserted[0].id);
					}
				}
			}
		}

		let created = 0;
		let updated = 0;
		let skipped = 0;

		for (const r of validated.redirects) {
			const existing = await db.query.redirects.findFirst({
				where: eq(redirects.redirectCode, r.redirectCode),
			});

			const tagIds = r.tags.map((name) => tagMap.get(name)).filter(Boolean) as string[];

			if (existing) {
				if (mode === "update") {
					await db
						.update(redirects)
						.set({ newURL: r.newURL })
						.where(eq(redirects.id, existing.id));
					await db
						.delete(redirectTagAssignment)
						.where(eq(redirectTagAssignment.redirectId, existing.id));
					if (tagIds.length > 0) {
						await db
							.insert(redirectTagAssignment)
							.values(tagIds.map((tagId) => ({ redirectId: existing.id, tagId })));
					}
					updated++;
				} else {
					skipped++;
				}
			} else {
				const inserted = await db
					.insert(redirects)
					.values({
						redirectCode: r.redirectCode,
						newURL: r.newURL,
						clicks: r.clicks ?? 0,
					})
					.returning();
				if (tagIds.length > 0) {
					await db
						.insert(redirectTagAssignment)
						.values(tagIds.map((tagId) => ({ redirectId: inserted[0].id, tagId })));
				}
				created++;
			}
		}

		revalidatePath("/admin/redirects");
		return {
			success: true,
			message: `Import complete: ${created} created, ${updated} updated, ${skipped} skipped.`,
			created,
			updated,
			skipped,
		};
	} catch (error) {
		if (error instanceof z.ZodError) {
			return {
				success: false,
				message: "Invalid file format.",
				created: 0,
				updated: 0,
				skipped: 0,
			};
		}
		return {
			success: false,
			message: "Failed to import redirects.",
			created: 0,
			updated: 0,
			skipped: 0,
		};
	}
}
