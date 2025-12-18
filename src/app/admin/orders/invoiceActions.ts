"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { GCashTransaction } from "@/lib/gcashReaders/parseInvoiceTable";

async function checkShopAdmin() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		throw new Error("Unauthorized");
	}

	const user = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: { isShopAdmin: true },
	});

	if (!user?.isShopAdmin) {
		throw new Error("Forbidden: Shop admin access required");
	}

	return session;
}

/**
 * Process invoice transactions and match with orders
 */
export async function processInvoiceTransactions(transactions: GCashTransaction[]) {
	try {
		await checkShopAdmin();

		let matched = 0;
		let unmatched = 0;

		// Get all orders with receipts but no ref numbers
		const orders = await prisma.order.findMany({
			where: {
				receiptImageUrl: { not: null },
			},
			select: {
				id: true,
				gcashReferenceNumber: true,
			},
		});

		// Create a map of reference numbers from transactions
		const refNumberSet = new Set(transactions.map((t) => t.referenceNumber));

		// Match orders with transactions
		for (const transaction of transactions) {
			const matchingOrder = orders.find(
				(o) => o.gcashReferenceNumber === transaction.referenceNumber,
			);

			if (matchingOrder) {
				matched++;
				// Order already has this ref number - verified!
				console.log(`✓ Verified order ${matchingOrder.id} with ref ${transaction.referenceNumber}`);
			} else {
				unmatched++;
				console.log(`✗ Transaction ${transaction.referenceNumber} not found in orders`);
			}
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
		return {
			success: false,
			message: error.message || "Failed to process transactions",
		};
	}
}

/**
 * Get orders that need manual verification
 * (have receipt but no ref number, or ref number not verified by invoice)
 */
export async function getOrdersNeedingVerification() {
	try {
		await checkShopAdmin();

		const orders = await prisma.order.findMany({
			where: {
				OR: [
					// Orders with receipt but no ref number
					{
						receiptImageUrl: { not: null },
						gcashReferenceNumber: null,
					},
					// TODO: Add logic for orders with ref numbers not verified by invoice
				],
			},
			include: {
				user: {
					select: {
						name: true,
						email: true,
						studentId: true,
					},
				},
				orderItems: {
					include: {
						product: {
							select: {
								name: true,
							},
						},
					},
				},
			},
			orderBy: { createdAt: "desc" },
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
