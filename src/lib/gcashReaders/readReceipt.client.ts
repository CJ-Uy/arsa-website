import { createWorker } from "tesseract.js";
import { parseOcrText, GcashReceiptData } from "./parseReceipt";

/**
 * Client-side OCR processing for GCash receipts.
 * This runs in the browser and automatically downloads language data.
 * @param imageFile The receipt image file to process
 * @returns A promise that resolves to the structured GcashReceiptData
 */
export async function parseGcashReceiptClient(imageFile: File): Promise<GcashReceiptData> {
	const worker = await createWorker("eng");

	try {
		console.log("Starting client-side OCR process on receipt image...");
		const {
			data: { text },
		} = await worker.recognize(imageFile);

		console.log("OCR Raw Text Output:\n---", text, "\n---");

		const extractedData = parseOcrText(text);
		console.log("Parsed Receipt Data:", extractedData);

		return extractedData;
	} catch (error) {
		console.error("Error during client-side OCR:", error);
		throw new Error("Could not read the receipt. Please try a clearer image.");
	} finally {
		await worker.terminate();
		console.log("Tesseract worker terminated.");
	}
}
