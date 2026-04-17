"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export interface SSO26Config {
	superlativesOpen: boolean;
	ddayOpen: boolean;
	superlativesSeniors: string[];
	superlativesQuestions: string[];
	ddaySeniors: string[];
	ddayQuestions: string[];
}

const SSO26_CONFIG_KEY = "sso26Config";

async function verifySSO26Admin() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) return { authorized: false as const, message: "Unauthorized" };

	const user = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: { isSSO26Admin: true, isSuperAdmin: true },
	});

	if (!user?.isSSO26Admin && !user?.isSuperAdmin) {
		return { authorized: false as const, message: "SSO26 admin access required" };
	}

	return { authorized: true as const, userId: session.user.id };
}

export async function getSSO26Config(): Promise<SSO26Config> {
	const row = await prisma.shopSettings.findUnique({ where: { key: SSO26_CONFIG_KEY } });
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

		await prisma.shopSettings.upsert({
			where: { key: SSO26_CONFIG_KEY },
			update: { value: config as object, updatedBy: authResult.userId },
			create: { key: SSO26_CONFIG_KEY, value: config as object, updatedBy: authResult.userId },
		});

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

	const grouped = await prisma.sSO26Nomination.groupBy({
		by: ["question", "nominee"],
		_count: { id: true },
		orderBy: [{ question: "asc" }, { _count: { id: "desc" } }],
	});

	const others = await prisma.sSO26Nomination.findMany({
		where: { nominee: "OTHER" },
		select: { question: true, otherText: true, updatedAt: true },
		orderBy: { updatedAt: "desc" },
	});

	const questions = [...new Set(grouped.map((g) => g.question))];

	return questions.map((question) => {
		const rows = grouped.filter((g) => g.question === question && g.nominee !== "OTHER");
		const otherCount = grouped.find((g) => g.question === question && g.nominee === "OTHER")?._count.id ?? 0;
		return {
			question,
			data: [
				...rows.map((r) => ({ name: r.nominee, count: r._count.id })),
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

	const grouped = await prisma.sSO26DdayVote.groupBy({
		by: ["question", "nominee"],
		_count: { id: true },
		orderBy: [{ question: "asc" }, { _count: { id: "desc" } }],
	});

	const questions = [...new Set(grouped.map((g) => g.question))];

	return questions.map((question) => ({
		question,
		data: grouped
			.filter((g) => g.question === question)
			.map((r) => ({ name: r.nominee, count: r._count.id })),
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
	userEmail: string;
	createdAt: Date;
};

export async function getRawNominations(): Promise<RawNomination[]> {
	const authResult = await verifySSO26Admin();
	if (!authResult.authorized) return [];

	const rows = await prisma.sSO26Nomination.findMany({
		select: {
			id: true,
			question: true,
			nominee: true,
			otherText: true,
			updatedAt: true,
			user: { select: { email: true } },
		},
		orderBy: [{ question: "asc" }, { updatedAt: "desc" }],
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

	const rows = await prisma.sSO26DdayVote.findMany({
		select: {
			id: true,
			question: true,
			nominee: true,
			createdAt: true,
			user: { select: { email: true } },
		},
		orderBy: [{ question: "asc" }, { createdAt: "desc" }],
	});

	return rows.map((r) => ({
		id: r.id,
		question: r.question,
		nominee: r.nominee,
		userEmail: r.user.email,
		createdAt: r.createdAt,
	}));
}

export async function deleteNomination(id: string) {
	try {
		const authResult = await verifySSO26Admin();
		if (!authResult.authorized) return { success: false, message: authResult.message };

		await prisma.sSO26Nomination.delete({ where: { id } });
		return { success: true };
	} catch {
		return { success: false, message: "Failed to delete nomination" };
	}
}

export async function deleteDdayVote(id: string) {
	try {
		const authResult = await verifySSO26Admin();
		if (!authResult.authorized) return { success: false, message: authResult.message };

		await prisma.sSO26DdayVote.delete({ where: { id } });
		return { success: true };
	} catch {
		return { success: false, message: "Failed to delete vote" };
	}
}

export async function clearAllNominations() {
	try {
		const authResult = await verifySSO26Admin();
		if (!authResult.authorized) return { success: false, message: authResult.message };

		await prisma.sSO26Nomination.deleteMany({});
		return { success: true };
	} catch {
		return { success: false, message: "Failed to clear nominations" };
	}
}

export async function clearAllDdayVotes() {
	try {
		const authResult = await verifySSO26Admin();
		if (!authResult.authorized) return { success: false, message: authResult.message };

		await prisma.sSO26DdayVote.deleteMany({});
		return { success: true };
	} catch {
		return { success: false, message: "Failed to clear D-Day votes" };
	}
}

export async function getSSO26Stats() {
	const authResult = await verifySSO26Admin();
	if (!authResult.authorized) return null;

	const [nominationCount, ddayVoteCount, uniqueNominators, uniqueDdayVoters] = await Promise.all([
		prisma.sSO26Nomination.count(),
		prisma.sSO26DdayVote.count(),
		prisma.sSO26Nomination.groupBy({ by: ["userId"], _count: { id: true } }).then((r) => r.length),
		prisma.sSO26DdayVote.groupBy({ by: ["userId"], _count: { id: true } }).then((r) => r.length),
	]);

	return { nominationCount, ddayVoteCount, uniqueNominators, uniqueDdayVoters };
}
