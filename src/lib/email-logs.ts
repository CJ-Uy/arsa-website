"use server";

import { prisma } from "./prisma";
import type { EmailProvider } from "./email";

// Manually log an email (for historical records or manual tracking)
export async function manuallyLogEmail(
	provider: EmailProvider,
	recipient: string,
	subject: string,
	emailType: string,
	orderId?: string,
	userId?: string,
): Promise<{ success: boolean; message?: string }> {
	try {
		await prisma.emailLog.create({
			data: {
				provider,
				recipient,
				subject,
				emailType,
				status: "sent",
				orderId,
				userId,
			},
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

// Get email logs with filtering
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
		const where: any = {};

		if (options?.recipient) {
			where.recipient = { contains: options.recipient, mode: "insensitive" };
		}
		if (options?.orderId) {
			where.orderId = options.orderId;
		}
		if (options?.status) {
			where.status = options.status;
		}
		if (options?.emailType) {
			where.emailType = options.emailType;
		}
		if (options?.startDate || options?.endDate) {
			where.sentAt = {};
			if (options.startDate) {
				where.sentAt.gte = options.startDate;
			}
			if (options.endDate) {
				where.sentAt.lte = options.endDate;
			}
		}

		const [logs, total] = await Promise.all([
			prisma.emailLog.findMany({
				where,
				orderBy: { sentAt: "desc" },
				take: options?.limit || 50,
				skip: options?.offset || 0,
			}),
			prisma.emailLog.count({ where }),
		]);

		return { logs, total };
	} catch (error) {
		console.error("Failed to get email logs:", error);
		throw error;
	}
}

// Get email log statistics
export async function getEmailLogStats() {
	try {
		const [totalSent, totalFailed, recentLogs] = await Promise.all([
			prisma.emailLog.count({ where: { status: "sent" } }),
			prisma.emailLog.count({ where: { status: "failed" } }),
			prisma.emailLog.findMany({
				orderBy: { sentAt: "desc" },
				take: 5,
				select: {
					recipient: true,
					subject: true,
					status: true,
					sentAt: true,
					emailType: true,
				},
			}),
		]);

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

// Delete an email log
export async function deleteEmailLog(id: string): Promise<{ success: boolean; message?: string }> {
	try {
		await prisma.emailLog.delete({
			where: { id },
		});

		return { success: true };
	} catch (error) {
		console.error("Failed to delete email log:", error);
		return {
			success: false,
			message: error instanceof Error ? error.message : "Failed to delete email log",
		};
	}
}
