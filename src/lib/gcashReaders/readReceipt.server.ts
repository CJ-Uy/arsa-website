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
		console.log(`[OCR] Fetching image from URL: ${imageUrl}`);

		// Configure fetch with increased timeout
		// SSL certificate validation is disabled globally for production
		const fetchOptions: RequestInit = {
			signal: AbortSignal.timeout(30000), // 30 second timeout
		};

		console.log(`[OCR] Initiating fetch request...`);
		const response = await fetch(imageUrl, fetchOptions);
		console.log(`[OCR] Fetch response status: ${response.status} ${response.statusText}`);

		if (!response.ok) {
			throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
		}

		const arrayBuffer = await response.arrayBuffer();
		const imageBuffer = Buffer.from(arrayBuffer);

		if (imageBuffer.length === 0) {
			throw new Error("Downloaded image is empty");
		}

		console.log(`Successfully fetched image (${imageBuffer.length} bytes)`);
		return await parseGcashReceiptServer(imageBuffer);
	} catch (error) {
		console.error("Error fetching or processing image from URL:", error);

		// Provide more specific error messages
		if (error instanceof Error) {
			if (error.name === "AbortError" || error.message.includes("ETIMEDOUT")) {
				throw new Error(
					"Timeout fetching receipt image. The storage server may be slow or unreachable.",
				);
			} else if (error.message.includes("UNABLE_TO_GET_ISSUER_CERT")) {
				throw new Error(
					"SSL certificate error. The receipt image is stored on a server with an invalid certificate.",
				);
			} else if (error.message.includes("ENOTFOUND") || error.message.includes("ECONNREFUSED")) {
				throw new Error("Could not connect to storage server. Check if MinIO is accessible.");
			}
		}

		throw new Error(
			`Failed to process receipt from URL: ${error instanceof Error ? error.message : "Unknown error"}`,
		);
	}
}
