"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sso26Nomination, sso26DdayVote } from "@/db/schema";

const ALLOWED_DOMAINS = ["@student.ateneo.edu", "@ateneo.edu"];

async function verifyAteneoUser() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) return { authorized: false as const, message: "Not signed in" };

	const email = session.user.email ?? "";
	const isAllowed = ALLOWED_DOMAINS.some((d) => email.endsWith(d));
	if (!isAllowed) return { authorized: false as const, message: "Ateneo email required" };

	return { authorized: true as const, userId: session.user.id };
}

export type NominationInput = {
	question: string;
	nominee: string;
	otherText?: string;
}[];

export async function submitNominations(nominations: NominationInput) {
	try {
		const authResult = await verifyAteneoUser();
		if (!authResult.authorized) return { success: false, message: authResult.message };

		await db.transaction(async (tx) => {
			for (const { question, nominee, otherText } of nominations) {
				const otherTextValue = nominee === "OTHER" ? (otherText ?? null) : null;
				const existing = await tx.query.sso26Nomination.findFirst({
					where: and(
						eq(sso26Nomination.userId, authResult.userId),
						eq(sso26Nomination.question, question),
					),
				});
				if (existing) {
					await tx
						.update(sso26Nomination)
						.set({ nominee, otherText: otherTextValue })
						.where(eq(sso26Nomination.id, existing.id));
				} else {
					await tx.insert(sso26Nomination).values({
						userId: authResult.userId,
						question,
						nominee,
						otherText: otherTextValue,
					});
				}
			}
		});

		revalidatePath("/sso26/superlatives");
		return { success: true, message: "Nominations saved!" };
	} catch {
		return { success: false, message: "Failed to save nominations" };
	}
}

export async function getUserNominations(): Promise<
	Record<string, { nominee: string; otherText: string | null }>
> {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) return {};

	const nominations = await db.query.sso26Nomination.findMany({
		where: eq(sso26Nomination.userId, session.user.id),
		columns: { question: true, nominee: true, otherText: true },
	});

	return Object.fromEntries(
		nominations.map((n) => [n.question, { nominee: n.nominee, otherText: n.otherText }]),
	);
}

export type DdayVoteInput = {
	question: string;
	nominee: string;
}[];

export async function submitDdayVotes(votes: DdayVoteInput) {
	try {
		await db.insert(sso26DdayVote).values(
			votes.map(({ question, nominee }) => ({
				question,
				nominee,
			})),
		);
		return { success: true, message: "Votes submitted!" };
	} catch {
		return { success: false, message: "Failed to submit votes" };
	}
}
