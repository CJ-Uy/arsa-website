"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { and, desc, eq, isNotNull, isNull } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user, order } from "@/db/schema";

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

export async function getOrdersForClientOcr() {
	try {
		await checkShopAdmin();

		const orders = await db.query.order.findMany({
			where: and(isNotNull(order.receiptImageUrl), isNull(order.gcashReferenceNumber)),
			columns: {
				id: true,
				receiptImageUrl: true,
				totalAmount: true,
				status: true,
				createdAt: true,
			},
			with: { user: { columns: { name: true, email: true } } },
			orderBy: [desc(order.createdAt)],
		});

		const imageOrders = orders.filter(
			(o) => o.receiptImageUrl && !o.receiptImageUrl.toLowerCase().endsWith(".pdf"),
		);

		return { success: true, orders: imageOrders, count: imageOrders.length };
	} catch (error: any) {
		console.error("Error fetching orders for client OCR:", error);
		return {
			success: false,
			message: error.message || "Failed to fetch orders",
			orders: [],
			count: 0,
		};
	}
}

export async function getAllOrdersWithReceipts() {
	try {
		await checkShopAdmin();

		const orders = await db.query.order.findMany({
			where: isNotNull(order.receiptImageUrl),
			columns: {
				id: true,
				receiptImageUrl: true,
				totalAmount: true,
				status: true,
				createdAt: true,
				gcashReferenceNumber: true,
			},
			with: { user: { columns: { name: true, email: true } } },
			orderBy: [desc(order.createdAt)],
		});

		const imageOrders = orders.filter(
			(o) => o.receiptImageUrl && !o.receiptImageUrl.toLowerCase().endsWith(".pdf"),
		);

		return { success: true, orders: imageOrders, count: imageOrders.length };
	} catch (error: any) {
		console.error("Error fetching all orders with receipts:", error);
		return {
			success: false,
			message: error.message || "Failed to fetch orders",
			orders: [],
			count: 0,
		};
	}
}

export async function saveExtractedReferenceNumber(
	orderId: string,
	referenceNumber: string,
	allowOverwrite: boolean = false,
) {
	try {
		await checkShopAdmin();

		if (!referenceNumber || referenceNumber.trim() === "") {
			return { success: false, message: "Reference number is required" };
		}

		const found = await db.query.order.findFirst({
			where: eq(order.id, orderId),
			columns: { id: true, gcashReferenceNumber: true },
		});

		if (!found) return { success: false, message: "Order not found" };

		if (found.gcashReferenceNumber && !allowOverwrite) {
			return {
				success: false,
				message: "Order already has a reference number (use reprocess to overwrite)",
				skipped: true,
			};
		}

		await db
			.update(order)
			.set({ gcashReferenceNumber: referenceNumber.trim() })
			.where(eq(order.id, orderId));

		const action = found.gcashReferenceNumber ? "Updated" : "Saved";
		return {
			success: true,
			message: `${action} reference number: ${referenceNumber}`,
			wasOverwritten: !!found.gcashReferenceNumber,
		};
	} catch (error: any) {
		console.error(`Error saving reference number for order ${orderId}:`, error);
		return { success: false, message: error.message || "Failed to save reference number" };
	}
}

export async function markOrderOcrFailed(orderId: string, errorMessage: string) {
	try {
		await checkShopAdmin();
		console.log(`Order ${orderId} OCR failed: ${errorMessage}`);
		return { success: true, message: "Marked as failed" };
	} catch (error: any) {
		console.error(`Error marking order ${orderId} as failed:`, error);
		return { success: false, message: error.message || "Failed to mark as failed" };
	} finally {
		revalidatePath("/admin/orders");
	}
}
