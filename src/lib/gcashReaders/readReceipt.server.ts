import { createWorker } from "tesseract.js";
import path from "path";
import { parseOcrText, GcashReceiptData } from "./parseReceipt";

/**
 * Server-side OCR processing for GCash receipts.
 * This runs on the Node.js server and can process images from URLs or buffers.
 * Useful for batch processing existing orders.
 *
 * @param imageBuffer The image file as a Buffer (from file upload or fetched URL)
 * @returns A promise that resolves to the structured GcashReceiptData
 */
export async function parseGcashReceiptServer(imageBuffer: Buffer): Promise<GcashReceiptData> {
	// For server-side, we can use local language data if available
	// Otherwise Tesseract.js will download it
	const langPath = path.join(process.cwd(), "lang-data");

	const worker = await createWorker("eng", 1, {
		langPath,
		cachePath: langPath,
		// Optional logger for debugging
		logger: (m) => {
			if (m.status === "recognizing text") {
				console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
			}
		},
	});

	try {
		console.log("Starting server-side OCR process on receipt image...");
		const {
			data: { text },
		} = await worker.recognize(imageBuffer);

		console.log("OCR Raw Text Output:\n---", text, "\n---");

		const extractedData = parseOcrText(text);
		console.log("Parsed Receipt Data:", extractedData);

		return extractedData;
	} catch (error) {
		console.error("Error during server-side OCR processing:", error);
		throw new Error("Failed to read text from the receipt image.");
	} finally {
		await worker.terminate();
		console.log("Tesseract worker terminated.");
	}
}

/**
 * Fetch an image from a URL and process it with OCR
 * Useful for processing receipt images that are already uploaded to storage (MinIO, S3, etc.)
 *
 * @param imageUrl The URL of the receipt image
 * @returns A promise that resolves to the structured GcashReceiptData
 */
export async function parseGcashReceiptFromUrl(imageUrl: string): Promise<GcashReceiptData> {
	try {
		console.log(`Fetching image from URL: ${imageUrl}`);
		const response = await fetch(imageUrl);

		if (!response.ok) {
			throw new Error(`Failed to fetch image: ${response.statusText}`);
		}

		const arrayBuffer = await response.arrayBuffer();
		const imageBuffer = Buffer.from(arrayBuffer);

		return await parseGcashReceiptServer(imageBuffer);
	} catch (error) {
		console.error("Error fetching or processing image from URL:", error);
		throw new Error(`Failed to process receipt from URL: ${error instanceof Error ? error.message : "Unknown error"}`);
	}
}
