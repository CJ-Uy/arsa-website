"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { and, asc, count, desc, eq, isNotNull, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user, shopSettings, sso26Nomination, sso26DdayVote } from "@/db/schema";

export interface SSO26Question {
	title: string;
	description?: string;
	nominees?: string[];
}

export interface SSO26Config {
	superlativesOpen: boolean;
	ddayOpen: boolean;
	superlativesSeniors: string[];
	superlativesQuestions: SSO26Question[];
	ddaySeniors: string[];
	ddayQuestions: SSO26Question[];
}

const SSO26_CONFIG_KEY = "sso26Config";

async function verifySSO26Admin() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) return { authorized: false as const, message: "Unauthorized" };

	const u = await db.query.user.findFirst({
		where: eq(user.id, session.user.id),
		columns: { isSSO26Admin: true, isSuperAdmin: true },
	});

	if (!u?.isSSO26Admin && !u?.isSuperAdmin) {
		return { authorized: false as const, message: "SSO26 admin access required" };
	}

	return { authorized: true as const, userId: session.user.id };
}

export async function getSSO26Config(): Promise<SSO26Config> {
	const row = await db.query.shopSettings.findFirst({
		where: eq(shopSettings.key, SSO26_CONFIG_KEY),
	});
	if (!row) {
		return {
			superlativesOpen: false,
			ddayOpen: false,
			superlativesSeniors: [],
			superlativesQuestions: [],
			ddaySeniors: [],
			ddayQuestions: [],
		};
	}
	return row.value as unknown as SSO26Config;
}

export async function saveSSO26Config(config: SSO26Config) {
	try {
		const authResult = await verifySSO26Admin();
		if (!authResult.authorized) return { success: false, message: authResult.message };

		const existing = await db.query.shopSettings.findFirst({
			where: eq(shopSettings.key, SSO26_CONFIG_KEY),
		});
		if (existing) {
			await db
				.update(shopSettings)
				.set({ value: config, updatedBy: authResult.userId })
				.where(eq(shopSettings.key, SSO26_CONFIG_KEY));
		} else {
			await db.insert(shopSettings).values({
				key: SSO26_CONFIG_KEY,
				value: config,
				updatedBy: authResult.userId,
			});
		}

		revalidatePath("/admin/sso26");
		revalidatePath("/sso26/superlatives");
		revalidatePath("/sso26/dday");
		return { success: true, message: "Config saved" };
	} catch {
		return { success: false, message: "Failed to save config" };
	}
}

export type QuestionResult = {
	question: string;
	data: { name: string; count: number }[];
	otherResponses: { text: string; createdAt: Date }[];
};

export async function getSuperlativesResults(): Promise<QuestionResult[]> {
	const authResult = await verifySSO26Admin();
	if (!authResult.authorized) return [];

	const grouped = await db
		.select({
			question: sso26Nomination.question,
			nominee: sso26Nomination.nominee,
			c: count(sso26Nomination.id),
		})
		.from(sso26Nomination)
		.groupBy(sso26Nomination.question, sso26Nomination.nominee)
		.orderBy(asc(sso26Nomination.question), desc(count(sso26Nomination.id)));

	const others = await db.query.sso26Nomination.findMany({
		where: eq(sso26Nomination.nominee, "OTHER"),
		columns: { question: true, otherText: true, updatedAt: true },
		orderBy: [desc(sso26Nomination.updatedAt)],
	});

	const questions = [...new Set(grouped.map((g) => g.question))];

	return questions.map((question) => {
		const rows = grouped.filter((g) => g.question === question && g.nominee !== "OTHER");
		const otherCount =
			grouped.find((g) => g.question === question && g.nominee === "OTHER")?.c ?? 0;
		return {
			question,
			data: [
				...rows.map((r) => ({ name: r.nominee, count: r.c })),
				...(otherCount > 0 ? [{ name: "Other", count: otherCount }] : []),
			],
			otherResponses: others
				.filter((o) => o.question === question && o.otherText)
				.map((o) => ({ text: o.otherText!, createdAt: o.updatedAt })),
		};
	});
}

export async function getDdayResults(): Promise<QuestionResult[]> {
	const authResult = await verifySSO26Admin();
	if (!authResult.authorized) return [];

	const grouped = await db
		.select({
			question: sso26DdayVote.question,
			nominee: sso26DdayVote.nominee,
			c: count(sso26DdayVote.id),
		})
		.from(sso26DdayVote)
		.groupBy(sso26DdayVote.question, sso26DdayVote.nominee)
		.orderBy(asc(sso26DdayVote.question), desc(count(sso26DdayVote.id)));

	const questions = [...new Set(grouped.map((g) => g.question))];

	return questions.map((question) => ({
		question,
		data: grouped.filter((g) => g.question === question).map((r) => ({
			name: r.nominee,
			count: r.c,
		})),
		otherResponses: [],
	}));
}

export type RawNomination = {
	id: string;
	question: string;
	nominee: string;
	otherText: string | null;
	userEmail: string;
	updatedAt: Date;
};

export type RawDdayVote = {
	id: string;
	question: string;
	nominee: string;
	userEmail: string | null;
	createdAt: Date;
};

export async function getRawNominations(): Promise<RawNomination[]> {
	const authResult = await verifySSO26Admin();
	if (!authResult.authorized) return [];

	const rows = await db.query.sso26Nomination.findMany({
		columns: {
			id: true,
			question: true,
			nominee: true,
			otherText: true,
			updatedAt: true,
		},
		with: { user: { columns: { email: true } } },
		orderBy: [asc(sso26Nomination.question), desc(sso26Nomination.updatedAt)],
	});

	return rows.map((r) => ({
		id: r.id,
		question: r.question,
		nominee: r.nominee,
		otherText: r.otherText,
		userEmail: r.user.email,
		updatedAt: r.updatedAt,
	}));
}

export async function getRawDdayVotes(): Promise<RawDdayVote[]> {
	const authResult = await verifySSO26Admin();
	if (!authResult.authorized) return [];

	const rows = await db.query.sso26DdayVote.findMany({
		columns: { id: true, question: true, nominee: true, createdAt: true },
		with: { user: { columns: { email: true } } },
		orderBy: [asc(sso26DdayVote.question), desc(sso26DdayVote.createdAt)],
	});

	return rows.map((r) => ({
		id: r.id,
		question: r.question,
		nominee: r.nominee,
		userEmail: r.user?.email ?? null,
		createdAt: r.createdAt,
	}));
}

export async function deleteNomination(id: string) {
	try {
		const authResult = await verifySSO26Admin();
		if (!authResult.authorized) return { success: false, message: authResult.message };
		await db.delete(sso26Nomination).where(eq(sso26Nomination.id, id));
		return { success: true };
	} catch {
		return { success: false, message: "Failed to delete nomination" };
	}
}

export async function deleteDdayVote(id: string) {
	try {
		const authResult = await verifySSO26Admin();
		if (!authResult.authorized) return { success: false, message: authResult.message };
		await db.delete(sso26DdayVote).where(eq(sso26DdayVote.id, id));
		return { success: true };
	} catch {
		return { success: false, message: "Failed to delete vote" };
	}
}

export async function clearAllNominations() {
	try {
		const authResult = await verifySSO26Admin();
		if (!authResult.authorized) return { success: false, message: authResult.message };
		await db.delete(sso26Nomination);
		return { success: true };
	} catch {
		return { success: false, message: "Failed to clear nominations" };
	}
}

export async function clearAllDdayVotes() {
	try {
		const authResult = await verifySSO26Admin();
		if (!authResult.authorized) return { success: false, message: authResult.message };
		await db.delete(sso26DdayVote);
		return { success: true };
	} catch {
		return { success: false, message: "Failed to clear D-Day votes" };
	}
}

export async function importSuperlativesToDday(): Promise<{
	success: boolean;
	message: string;
	count?: number;
}> {
	try {
		const authResult = await verifySSO26Admin();
		if (!authResult.authorized) return { success: false, message: authResult.message };

		const nominations = await db.query.sso26Nomination.findMany({
			columns: { userId: true, question: true, nominee: true, otherText: true },
		});

		const data = nominations.map((n) => ({
			userId: n.userId,
			question: n.question,
			nominee:
				n.nominee === "OTHER" ? n.otherText?.trim() || "Other (unlisted)" : n.nominee,
		}));

		if (data.length === 0) return { success: true, message: "No nominations to import", count: 0 };

		await db.insert(sso26DdayVote).values(data);
		return {
			success: true,
			message: `Imported ${data.length} vote${data.length !== 1 ? "s" : ""}`,
			count: data.length,
		};
	} catch {
		return { success: false, message: "Failed to import votes" };
	}
}

export async function getSSO26Stats() {
	const authResult = await verifySSO26Admin();
	if (!authResult.authorized) return null;

	const [
		[{ c: nominationCount }],
		[{ c: ddayVoteCount }],
		uniqueNominatorsRows,
		uniqueDdayVotersRows,
	] = await Promise.all([
		db.select({ c: count() }).from(sso26Nomination),
		db.select({ c: count() }).from(sso26DdayVote),
		db
			.select({ uid: sso26Nomination.userId })
			.from(sso26Nomination)
			.groupBy(sso26Nomination.userId),
		db
			.select({ uid: sso26DdayVote.userId })
			.from(sso26DdayVote)
			.where(isNotNull(sso26DdayVote.userId))
			.groupBy(sso26DdayVote.userId),
	]);

	return {
		nominationCount,
		ddayVoteCount,
		uniqueNominators: uniqueNominatorsRows.length,
		uniqueDdayVoters: uniqueDdayVotersRows.length,
	};
}
