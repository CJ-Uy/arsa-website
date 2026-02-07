"use server";

import { getEmailLogs, manuallyLogEmail, deleteEmailLog } from "@/lib/email-logs";
import type { EmailProvider } from "@/lib/email";

export async function fetchEmailLogs(options?: {
	limit?: number;
	offset?: number;
	recipient?: string;
	orderId?: string;
	status?: "sent" | "failed";
	emailType?: string;
	startDate?: Date;
	endDate?: Date;
}) {
	return await getEmailLogs(options);
}

export async function addManualEmailLog(
	provider: EmailProvider,
	recipient: string,
	subject: string,
	emailType: string,
	orderId?: string,
	userId?: string,
) {
	return await manuallyLogEmail(provider, recipient, subject, emailType, orderId, userId);
}

export async function removeEmailLog(id: string) {
	return await deleteEmailLog(id);
}
