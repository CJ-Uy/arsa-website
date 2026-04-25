"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

const ALLOWED_DOMAINS = ["@student.ateneo.edu", "@ateneo.edu"];

async function verifyAteneoUser() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) return { authorized: false as const, message: "Not signed in" };

	const email = session.user.email ?? "";
	const isAllowed = ALLOWED_DOMAINS.some((d) => email.endsWith(d));
	if (!isAllowed) return { authorized: false as const, message: "Ateneo email required" };

	return { authorized: true as const, userId: session.user.id };
}

// ── Superlatives ──────────────────────────────────────────────────────────────

export type NominationInput = {
	question: string;
	nominee: string;
	otherText?: string;
}[];

export async function submitNominations(nominations: NominationInput) {
	try {
		const authResult = await verifyAteneoUser();
		if (!authResult.authorized) return { success: false, message: authResult.message };

		await prisma.$transaction(
			nominations.map(({ question, nominee, otherText }) =>
				prisma.sSO26Nomination.upsert({
					where: { userId_question: { userId: authResult.userId, question } },
					update: { nominee, otherText: nominee === "OTHER" ? (otherText ?? null) : null },
					create: {
						userId: authResult.userId,
						question,
						nominee,
						otherText: nominee === "OTHER" ? (otherText ?? null) : null,
					},
				}),
			),
		);

		revalidatePath("/sso26/superlatives");
		return { success: true, message: "Nominations saved!" };
	} catch {
		return { success: false, message: "Failed to save nominations" };
	}
}

export async function getUserNominations(): Promise<Record<string, { nominee: string; otherText: string | null }>> {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) return {};

	const nominations = await prisma.sSO26Nomination.findMany({
		where: { userId: session.user.id },
		select: { question: true, nominee: true, otherText: true },
	});

	return Object.fromEntries(nominations.map((n) => [n.question, { nominee: n.nominee, otherText: n.otherText }]));
}

// ── DDay ──────────────────────────────────────────────────────────────────────

export type DdayVoteInput = {
	question: string;
	nominee: string;
}[];

export async function submitDdayVotes(votes: DdayVoteInput) {
	try {
		await prisma.sSO26DdayVote.createMany({
			data: votes.map(({ question, nominee }) => ({
				question,
				nominee,
			})),
		});

		return { success: true, message: "Votes submitted!" };
	} catch {
		return { success: false, message: "Failed to submit votes" };
	}
}
