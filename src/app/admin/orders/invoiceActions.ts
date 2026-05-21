"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { and, desc, eq, isNotNull, isNull } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user, order } from "@/db/schema";
import { GCashTransaction } from "@/lib/gcashReaders/parseInvoiceTable";

async function checkShopAdmin() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) throw new Error("Unauthorized");

	const u = await db.query.user.findFirst({
		where: eq(user.id, session.user.id),
		columns: { isShopAdmin: true },
	});
	if (!u?.isShopAdmin) throw new Error("Forbidden: Shop admin access required");
	return session;
}

export async function processInvoiceTransactions(transactions: GCashTransaction[]) {
	try {
		await checkShopAdmin();

		let matched = 0;
		let unmatched = 0;

		const orders = await db.query.order.findMany({
			where: isNotNull(order.receiptImageUrl),
			columns: { id: true, gcashReferenceNumber: true },
		});

		for (const transaction of transactions) {
			const matchingOrder = orders.find(
				(o) => o.gcashReferenceNumber === transaction.referenceNumber,
			);
			if (matchingOrder) matched++;
			else unmatched++;
		}

		revalidatePath("/admin/orders");
		return {
			success: true,
			matched,
			unmatched,
			message: `Processed ${transactions.length} transactions`,
		};
	} catch (error: any) {
		console.error("Error processing invoice transactions:", error);
		return { success: false, message: error.message || "Failed to process transactions" };
	}
}

export async function getOrdersNeedingVerification() {
	try {
		await checkShopAdmin();

		const orders = await db.query.order.findMany({
			where: and(isNotNull(order.receiptImageUrl), isNull(order.gcashReferenceNumber)),
			with: {
				user: { columns: { name: true, email: true, studentId: true } },
				orderItems: { with: { product: { columns: { name: true } } } },
			},
			orderBy: [desc(order.createdAt)],
		});

		return { success: true, orders, count: orders.length };
	} catch (error: any) {
		console.error("Error fetching orders needing verification:", error);
		return {
			success: false,
			message: error.message || "Failed to fetch orders",
			orders: [],
			count: 0,
		};
	}
}
