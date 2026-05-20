"use server";

import { and, count, desc, eq, gte, like, lte, SQL } from "drizzle-orm";
import { db } from "./db";
import { emailLog } from "@/db/schema";
import type { EmailProvider } from "./email";

export async function manuallyLogEmail(
	provider: EmailProvider,
	recipient: string,
	subject: string,
	emailType: string,
	orderId?: string,
	userId?: string,
): Promise<{ success: boolean; message?: string }> {
	try {
		await db.insert(emailLog).values({
			provider,
			recipient,
			subject,
			emailType,
			status: "sent",
			orderId,
			userId,
		});

		return { success: true };
	} catch (error) {
		console.error("Failed to manually log email:", error);
		return {
			success: false,
			message: error instanceof Error ? error.message : "Failed to log email",
		};
	}
}

export async function getEmailLogs(options?: {
	limit?: number;
	offset?: number;
	recipient?: string;
	orderId?: string;
	status?: "sent" | "failed";
	emailType?: string;
	startDate?: Date;
	endDate?: Date;
}) {
	try {
		const filters: SQL[] = [];
		if (options?.recipient) {
			filters.push(like(emailLog.recipient, `%${options.recipient.toLowerCase()}%`));
		}
		if (options?.orderId) filters.push(eq(emailLog.orderId, options.orderId));
		if (options?.status) filters.push(eq(emailLog.status, options.status));
		if (options?.emailType) filters.push(eq(emailLog.emailType, options.emailType));
		if (options?.startDate) filters.push(gte(emailLog.sentAt, options.startDate));
		if (options?.endDate) filters.push(lte(emailLog.sentAt, options.endDate));

		const whereExpr = filters.length > 0 ? and(...filters) : undefined;

		const [logs, totalRows] = await Promise.all([
			db.query.emailLog.findMany({
				where: whereExpr,
				orderBy: [desc(emailLog.sentAt)],
				limit: options?.limit || 50,
				offset: options?.offset || 0,
			}),
			db.select({ c: count() }).from(emailLog).where(whereExpr),
		]);

		return { logs, total: totalRows[0]?.c ?? 0 };
	} catch (error) {
		console.error("Failed to get email logs:", error);
		throw error;
	}
}

export async function getEmailLogStats() {
	try {
		const [sentRows, failedRows, recentLogs] = await Promise.all([
			db.select({ c: count() }).from(emailLog).where(eq(emailLog.status, "sent")),
			db.select({ c: count() }).from(emailLog).where(eq(emailLog.status, "failed")),
			db.query.emailLog.findMany({
				orderBy: [desc(emailLog.sentAt)],
				limit: 5,
				columns: {
					recipient: true,
					subject: true,
					status: true,
					sentAt: true,
					emailType: true,
				},
			}),
		]);

		const totalSent = sentRows[0]?.c ?? 0;
		const totalFailed = failedRows[0]?.c ?? 0;

		return {
			totalSent,
			totalFailed,
			totalEmails: totalSent + totalFailed,
			recentLogs,
		};
	} catch (error) {
		console.error("Failed to get email log stats:", error);
		throw error;
	}
}

export async function deleteEmailLog(id: string): Promise<{ success: boolean; message?: string }> {
	try {
		await db.delete(emailLog).where(eq(emailLog.id, id));
		return { success: true };
	} catch (error) {
		console.error("Failed to delete email log:", error);
		return {
			success: false,
			message: error instanceof Error ? error.message : "Failed to delete email log",
		};
	}
}
