"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

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
 * Get orders that need OCR processing with their receipt URLs
 * Client will download and process these
 */
export async function getOrdersForClientOcr() {
	try {
		await checkShopAdmin();

		const orders = await prisma.order.findMany({
			where: {
				receiptImageUrl: { not: null },
				gcashReferenceNumber: null,
			},
			select: {
				id: true,
				receiptImageUrl: true,
				totalAmount: true,
				status: true,
				createdAt: true,
				user: {
					select: {
						name: true,
						email: true,
					},
				},
			},
			orderBy: { createdAt: "desc" },
		});

		// Filter to only image receipts (not PDFs) since client-side OCR works on images
		const imageOrders = orders.filter(
			(order) => order.receiptImageUrl && !order.receiptImageUrl.toLowerCase().endsWith(".pdf"),
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

/**
 * Save extracted reference number for an order
 * Called by client after it processes the image with OCR
 */
export async function saveExtractedReferenceNumber(orderId: string, referenceNumber: string) {
	try {
		await checkShopAdmin();

		if (!referenceNumber || referenceNumber.trim() === "") {
			return {
				success: false,
				message: "Reference number is required",
			};
		}

		// Check if order exists and doesn't already have a reference number
		const order = await prisma.order.findUnique({
			where: { id: orderId },
			select: {
				id: true,
				gcashReferenceNumber: true,
			},
		});

		if (!order) {
			return { success: false, message: "Order not found" };
		}

		if (order.gcashReferenceNumber) {
			return {
				success: false,
				message: "Order already has a reference number",
			};
		}

		// Save the reference number
		await prisma.order.update({
			where: { id: orderId },
			data: { gcashReferenceNumber: referenceNumber.trim() },
		});

		return {
			success: true,
			message: `Reference number saved: ${referenceNumber}`,
		};
	} catch (error: any) {
		console.error(`Error saving reference number for order ${orderId}:`, error);
		return {
			success: false,
			message: error.message || "Failed to save reference number",
		};
	}
}

/**
 * Mark an order as failed OCR processing
 * Used when client-side OCR can't extract the reference number
 */
export async function markOrderOcrFailed(orderId: string, errorMessage: string) {
	try {
		await checkShopAdmin();

		console.log(`Order ${orderId} OCR failed: ${errorMessage}`);

		// You could optionally store failed OCR attempts in the database
		// For now, just log it

		return {
			success: true,
			message: "Marked as failed",
		};
	} catch (error: any) {
		console.error(`Error marking order ${orderId} as failed:`, error);
		return {
			success: false,
			message: error.message || "Failed to mark as failed",
		};
	} finally {
		revalidatePath("/admin/orders");
	}
}
