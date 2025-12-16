"use server";

import { parseGcashPdf } from "@/lib/gcashReaders/readInvoice";

/**
 * Server action to extract GCash reference number from PDF invoice
 * This is used as a fallback when client-side OCR isn't possible (PDF files)
 */
export async function extractRefNumberFromPdf(formData: FormData) {
	try {
		const pdfFile = formData.get("pdfFile") as File | null;
		const password = formData.get("password") as string | null;

		if (!pdfFile) {
			return { success: false, message: "PDF file is required" };
		}

		const arrayBuffer = await pdfFile.arrayBuffer();
		const pdfBuffer = Buffer.from(arrayBuffer);

		// Parse the PDF with optional password (last 4 digits of mobile number for GCash PDFs)
		const extractedData = await parseGcashPdf(pdfBuffer, password || "");

		// Get the most recent transaction (usually first in the list)
		const mostRecentTransaction = extractedData.transactions[0];

		if (mostRecentTransaction?.reference) {
			return {
				success: true,
				referenceNumber: mostRecentTransaction.reference,
				transactionCount: extractedData.transactions.length,
				dateRange: extractedData.dateRange,
			};
		} else {
			return {
				success: false,
				message: "No reference number found in PDF. This might not be a GCash transaction history.",
			};
		}
	} catch (error: any) {
		console.error("PDF extraction error:", error);
		if (error?.message?.includes("password")) {
			return {
				success: false,
				message: "Invalid PDF password. GCash PDFs usually use the last 4 digits of your mobile number.",
			};
		}
		return {
			success: false,
			message: `Failed to process PDF: ${error?.message || "Unknown error"}`,
		};
	}
}
