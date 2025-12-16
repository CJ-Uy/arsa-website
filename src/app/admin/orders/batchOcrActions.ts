"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { parseGcashReceiptFromUrl } from "@/lib/gcashReaders/readReceipt.server";
import { parseGcashPdf } from "@/lib/gcashReaders/readInvoice";

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
 * Process a single order's receipt image with OCR to extract reference number
 */
export async function processOrderReceipt(orderId: string) {
	try {
		await checkShopAdmin();

		// Get the order with receipt URL
		const order = await prisma.order.findUnique({
			where: { id: orderId },
			select: {
				id: true,
				receiptImageUrl: true,
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
				skipped: true,
			};
		}

		if (!order.receiptImageUrl) {
			return { success: false, message: "Order has no receipt image", skipped: true };
		}

		// Check if it's a PDF or image based on file extension
		const isPDF = order.receiptImageUrl.toLowerCase().endsWith(".pdf");

		let referenceNumber: string | null = null;

		if (isPDF) {
			// Fetch and process PDF
			const response = await fetch(order.receiptImageUrl);
			if (!response.ok) {
				throw new Error(`Failed to fetch PDF: ${response.statusText}`);
			}

			const arrayBuffer = await response.arrayBuffer();
			const pdfBuffer = Buffer.from(arrayBuffer);

			const extractedData = await parseGcashPdf(pdfBuffer, "");
			referenceNumber = extractedData.transactions[0]?.reference || null;
		} else {
			// Process image with OCR
			const receiptData = await parseGcashReceiptFromUrl(order.receiptImageUrl);
			referenceNumber = receiptData.referenceNumber;
		}

		if (!referenceNumber) {
			return {
				success: false,
				message: "Could not extract reference number from receipt",
			};
		}

		// Update order with extracted reference number
		await prisma.order.update({
			where: { id: orderId },
			data: { gcashReferenceNumber: referenceNumber },
		});

		return {
			success: true,
			referenceNumber,
			message: `Extracted reference number: ${referenceNumber}`,
		};
	} catch (error: any) {
		console.error(`Error processing order ${orderId}:`, error);
		return {
			success: false,
			message: error.message || "Failed to process receipt",
		};
	}
}

/**
 * Batch process multiple orders' receipts
 * Returns summary of processed, failed, and skipped orders
 */
export async function batchProcessOrders(orderIds: string[]) {
	try {
		await checkShopAdmin();

		const results = {
			processed: 0,
			failed: 0,
			skipped: 0,
			errors: [] as { orderId: string; error: string }[],
			extracted: [] as { orderId: string; refNumber: string }[],
		};

		for (const orderId of orderIds) {
			const result = await processOrderReceipt(orderId);

			if (result.success && result.referenceNumber) {
				results.processed++;
				results.extracted.push({
					orderId,
					refNumber: result.referenceNumber,
				});
			} else if (result.skipped) {
				results.skipped++;
			} else {
				results.failed++;
				results.errors.push({
					orderId,
					error: result.message || "Unknown error",
				});
			}
		}

		revalidatePath("/admin/orders");

		return {
			success: true,
			results,
			message: `Processed: ${results.processed}, Failed: ${results.failed}, Skipped: ${results.skipped}`,
		};
	} catch (error: any) {
		console.error("Batch processing error:", error);
		return {
			success: false,
			message: error.message || "Failed to batch process orders",
		};
	}
}

/**
 * Get all orders that need OCR processing (have receipt but no ref number)
 */
export async function getOrdersNeedingOcr() {
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

		return { success: true, orders, count: orders.length };
	} catch (error: any) {
		console.error("Error fetching orders needing OCR:", error);
		return {
			success: false,
			message: error.message || "Failed to fetch orders",
			orders: [],
			count: 0,
		};
	}
}
