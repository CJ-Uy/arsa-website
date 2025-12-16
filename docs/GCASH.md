# GCash Reference Number Extractor - Complete Documentation

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [System Architecture](#system-architecture)
4. [Dependencies](#dependencies)
5. [Installation & Setup](#installation--setup)
6. [Image-Based Receipt Extraction (OCR)](#image-based-receipt-extraction-ocr)
7. [PDF-Based Invoice Extraction](#pdf-based-invoice-extraction)
8. [Integration Examples](#integration-examples)
9. [Storage Implementation](#storage-implementation)
10. [Troubleshooting](#troubleshooting)

---

## Overview

This system extracts transaction details (especially reference numbers) from GCash receipts and invoices using two different approaches:

1. **Image-Based Extraction**: Uses Tesseract.js OCR to extract data from receipt screenshots
2. **PDF-Based Extraction**: Uses coordinate-based parsing with pdfreader to extract transaction history from GCash PDF statements

Both systems are designed to work in Node.js server environments (Next.js server actions) and can also work client-side (browser) for the image extraction.

---

## Features

### Receipt Image Extraction

- Extracts recipient name and phone number
- Extracts transaction amount
- **Extracts reference number**
- Extracts timestamp
- Works with screenshot images of GCash receipts
- Client-side or server-side processing

### PDF Invoice Extraction

- Extracts multiple transactions from GCash PDF statements
- **Extracts reference numbers for each transaction**
- Extracts date, description, debit, credit, and balance
- Handles multi-page PDFs
- Handles password-protected PDFs
- Uses coordinate-based parsing for accuracy

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT / FRONTEND                         │
├─────────────────────────────────────────────────────────────┤
│  - File Upload (Image or PDF)                               │
│  - Optional: Client-side OCR (tesseract.js)                 │
│  - FormData submission to server actions                     │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                  SERVER ACTIONS LAYER                        │
├─────────────────────────────────────────────────────────────┤
│  - processGcashPdf(formData)                                │
│  - storeReceiptAction(formData)                             │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    PROCESSING LAYER                          │
├─────────────────────────────────────────────────────────────┤
│  Image Path:                  │  PDF Path:                  │
│  - parseGcashReceipt()        │  - parseGcashPdf()         │
│  - parseOcrText()             │  - extractDataWith...()     │
│                               │  - processExtractedData()   │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    STORAGE LAYER                             │
├─────────────────────────────────────────────────────────────┤
│  - storeReceipt() → Supabase Storage                        │
│  - storeInvoice() → Supabase Storage                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Dependencies

### Core Dependencies

```json
{
	"tesseract.js": "^6.0.1",
	"pdfreader": "^3.0.7"
}
```

### Optional Dependencies (for storage examples)

```json
{
	"@supabase/supabase-js": "^2.50.2",
	"@supabase/ssr": "^0.6.1"
}
```

### Node.js Version

- Node.js 18+ recommended
- Works in Next.js 15+ server environments

---

## Installation & Setup

### 1. Install Dependencies

```bash
npm install tesseract.js pdfreader
```

### 2. Setup Tesseract Language Data (for Server-side OCR)

If running OCR on the server, you need language data files:

```bash
# Create directory for language data at project root
mkdir lang-data

# Download English language data
curl -L https://github.com/tesseract-ocr/tessdata/raw/main/eng.traineddata -o lang-data/eng.traineddata
```

**Note**: Client-side OCR (in browser) automatically downloads language files, so this step is only needed for server-side processing.

### 3. Environment Variables (if using Supabase Storage)

```env
GCASH_BUCKET_NAME=your-bucket-name
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
```

---

## Image-Based Receipt Extraction (OCR)

### Architecture

The image extraction uses **Tesseract.js** for OCR (Optical Character Recognition) and regex patterns to extract structured data.

### File Structure

```
src/lib/gcashReaders/
├── readReceipt.ts      # Server-side OCR processing
├── parseReceipt.ts     # Parsing logic (shared)
└── storeReceipt.ts     # Storage logic
```

---

### Code Implementation

#### 1. Data Types (`parseReceipt.ts`)

```typescript
/**
 * Defines the structure of the data extracted from a GCash receipt image.
 */
export interface GcashReceiptData {
	recipientName: string | null;
	recipientNumber: string | null;
	amount: number | null;
	referenceNumber: string | null;
	timestamp: Date | null;
}
```

#### 2. Parser Function (`parseReceipt.ts`)

```typescript
/**
 * Parses the raw text extracted from a GCash receipt image into a structured object.
 * This version is more robust to handle common OCR errors.
 * @param rawText The raw string output from the Tesseract OCR engine.
 * @returns A GcashReceiptData object with the parsed information.
 */
export function parseOcrText(rawText: string): GcashReceiptData {
	const lines = rawText.split("\n");
	const data: GcashReceiptData = {
		recipientName: null,
		recipientNumber: null,
		amount: null,
		referenceNumber: null,
		timestamp: null,
	};

	// --- Regex patterns fine-tuned for OCR inaccuracies ---

	// Matches "Ref No." followed by the number and then captures the rest of the line as the date.
	const refAndDateRegex = /Ref No\.\s*(\d+)\s+(.+)/;

	// Makes the currency symbol optional and non-capturing, looking for any characters
	// between "Total Amount Sent" and the number pattern. This handles '£', '₱', '$', or OCR errors.
	const amountRegex = /Total Amount Sent.*?([\d,]+\.\d{2})/;
	const nameAndNumberRegex = /([A-Za-z\s,.-]+)\s*\+63\s*([\d\s]+)/;

	// An alternative regex for cases where the name might be on the line above the number.
	const numberOnlyRegex = /\+63\s*([\d\s]+)/;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];

		// Find Reference Number and Timestamp
		const refMatch = line.match(refAndDateRegex);
		if (refMatch) {
			data.referenceNumber = refMatch[1].trim();
			const dateString = refMatch[2].trim();
			// Attempt to parse the date, removing any extra text OCR might have added
			const cleanDateString = dateString.replace(/PM/i, " PM").replace(/AM/i, " AM");
			const parsedDate = new Date(cleanDateString);
			if (!isNaN(parsedDate.getTime())) {
				data.timestamp = parsedDate;
			}
			continue;
		}

		// Find Amount
		const amountMatch = line.match(amountRegex);
		if (amountMatch) {
			data.amount = parseFloat(amountMatch[1].replace(/,/g, ""));
			continue;
		}

		// Find Recipient Name and Number on the same line
		const nameMatch = line.match(nameAndNumberRegex);
		if (nameMatch) {
			data.recipientName = nameMatch[1].trim();
			// Remove all spaces from the captured number string
			data.recipientNumber = `+63${nameMatch[2].replace(/\s/g, "")}`;
			continue;
		}
	}

	// Fallback logic: If we found the number but not the name,
	// the name might be on the line directly above the number.
	if (!data.recipientName) {
		const numberLineIndex = lines.findIndex((line) => numberOnlyRegex.test(line));

		if (numberLineIndex > 0) {
			// If the number was not already parsed by the combined regex, parse it now.
			if (!data.recipientNumber) {
				const numberMatch = lines[numberLineIndex].match(numberOnlyRegex);
				if (numberMatch) {
					data.recipientNumber = `+63${numberMatch[1].replace(/\s/g, "")}`;
				}
			}

			// The potential name is on the line above.
			const potentialNameLine = lines[numberLineIndex - 1].trim();
			// A simple check to ensure it's not garbage or a label
			if (
				potentialNameLine &&
				potentialNameLine.length > 2 &&
				isNaN(parseFloat(potentialNameLine))
			) {
				data.recipientName = potentialNameLine;
			}
		}
	}

	return data;
}
```

#### 3. Server-Side OCR (`readReceipt.ts`)

```typescript
import { createWorker } from "tesseract.js";
import path from "path";

/**
 * Reads a GCash receipt image from a buffer, performs OCR, and extracts transaction details.
 * @param imageBuffer The image file as a Buffer.
 * @returns A promise that resolves to the structured GcashReceiptData.
 */
export async function parseGcashReceipt(imageBuffer: Buffer): Promise<GcashReceiptData> {
	// Point ONLY to the language data, which is now at the project root.
	// Tesseract.js will handle its own worker and core paths automatically in this setup.
	const langPath = path.join(process.cwd(), "lang-data");

	const worker = await createWorker("eng", 1, {
		// No workerPath, No corePath. Let the library resolve them.
		langPath,
		// Cache the language data in the specified directory.
		cachePath: path.join(process.cwd(), "lang-data"),
		// Optional logger
		logger: (m) => console.log(m),
	});

	try {
		console.log("Starting OCR process on receipt image...");
		const {
			data: { text },
		} = await worker.recognize(imageBuffer);

		console.log("OCR Raw Text Output:\n---", text, "\n---");

		const extractedData = parseOcrText(text);
		console.log("Parsed Receipt Data:", extractedData);

		return extractedData;
	} catch (error) {
		console.error("Error during receipt OCR processing:", error);
		throw new Error("Failed to read text from the receipt image.");
	} finally {
		await worker.terminate();
		console.log("Tesseract worker terminated.");
	}
}
```

#### 4. Client-Side OCR Example (React/Next.js)

```typescript
import { createWorker } from "tesseract.js";
import { parseOcrText, GcashReceiptData } from "./parseReceipt";

async function processReceiptClientSide(imageFile: File): Promise<GcashReceiptData> {
	const worker = await createWorker("eng");

	try {
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
	}
}
```

---

## PDF-Based Invoice Extraction

### Architecture

The PDF extraction uses **pdfreader** library with a coordinate-based parsing system. It works in two phases:

1. **Low-level extraction**: Extract all text with X/Y coordinates
2. **High-level processing**: Map coordinates to table columns

### File Structure

```
src/lib/gcashReaders/
├── readInvoice.ts     # PDF parsing logic
└── storeInvoice.ts    # Storage logic
```

---

### Code Implementation

#### 1. Data Types (`readInvoice.ts`)

```typescript
/**
 * Represents a single parsed transaction from the GCash statement.
 */
export interface GcashTransaction {
	date: string | null;
	description: string;
	reference: string | null;
	debit: number | null;
	credit: number | null;
	balance: number | null;
}

/**
 * Represents the entire set of data extracted from the GCash PDF.
 */
export interface GcashInvoiceExtractedData {
	dateRange: string | null;
	transactions: GcashTransaction[];
	storageUrl?: string;
}
```

#### 2. Low-Level PDF Extraction (`readInvoice.ts`)

```typescript
import { PdfReader } from "pdfreader";

/**
 * Low-level PDF parsing engine. It wraps the event-based `pdfreader` library
 * in a modern Promise-based interface.
 */
async function extractDataWithCoordinates(
	pdfBuffer: Buffer,
	password: string,
): Promise<{ pages: { content: any[] }[] }> {
	return new Promise((resolve, reject) => {
		const pages: { [key: number]: any[] } = {};

		// The reader instance is created inside the promise
		const reader = new PdfReader({ password });

		reader.parseBuffer(pdfBuffer, (err, item) => {
			if (err) {
				return reject(err);
			}
			if (!item) {
				// End of document
				const rawData = {
					pages: Object.keys(pages)
						.sort((a, b) => parseInt(a) - parseInt(b))
						.map((pageNum) => ({ content: pages[parseInt(pageNum)] })),
				};
				return resolve(rawData);
			}
			if (item.page) {
				// When a new page starts, we create an entry for it.
				if (!pages[item.page]) {
					pages[item.page] = [];
				}
			} else if (item.text) {
				// The library doesn't consistently provide the page number with each text item.
				// We assume the text belongs to the most recently seen page.
				const currentPageNumber = Object.keys(pages).length;
				if (currentPageNumber > 0 && pages[currentPageNumber]) {
					pages[currentPageNumber].push({
						x: item.x,
						y: item.y,
						text: item.text,
					});
				}
			}
		});
	});
}
```

#### 3. High-Level Processing (`readInvoice.ts`)

```typescript
/**
 * Transforms raw, coordinate-based character data into structured transaction objects.
 * This function contains all the business logic specific to the GCash PDF layout.
 * It uses a multi-pass approach to correctly handle multi-line descriptions.
 *
 * @param data An object containing the pages and their content, as extracted by `extractDataWithCoordinates`.
 * @returns An object containing the transaction date range and a list of structured transactions.
 */
function processExtractedData(data: { pages: { content: any[] }[] }) {
	// The final list of transactions is now at the top level,
	// so it persists across page loops.
	const finalTransactions: any[] = [];
	let dateRange: string | null = null;

	const columnBoundaries = {
		date: { start: 2, end: 7 },
		description: { start: 7, end: 20 },
		reference: { start: 20, end: 25 },
		debit: { start: 26, end: 28 },
		credit: { start: 29, end: 31 },
		balance: { start: 32, end: 35 },
	};

	// Process each page sequentially
	for (const page of data.pages) {
		const preliminaryTransactions: any[] = [];

		// --- Pass 1: "Anchored-Y" Row Detection (runs for each page) ---
		const rows: { y: number; items: any[] }[] = [];
		const content = page.content.sort((a, b) => a.y - b.y || a.x - b.x);

		if (content.length > 0) {
			let currentRow: any[] = [];
			let currentRowY = -1;
			const ROW_TOLERANCE = 0.25;

			for (const item of content) {
				if (currentRow.length === 0 || Math.abs(item.y - currentRowY) > ROW_TOLERANCE) {
					if (currentRow.length > 0) {
						rows.push({ y: currentRowY, items: currentRow.sort((a, b) => a.x - b.x) });
					}
					currentRow = [item];
					currentRowY = item.y;
				} else {
					currentRow.push(item);
				}
			}
			if (currentRow.length > 0) {
				rows.push({ y: currentRowY, items: currentRow.sort((a, b) => a.x - b.x) });
			}
		}

		// --- Pass 2: Create preliminary transaction objects (runs for each page) ---
		for (const row of rows) {
			if (row.items.length === 0) continue;
			const startX = row.items[0].x;

			const fullLineText = row.items
				.map((item) => item.text)
				.join("")
				.replace(/\s/g, "")
				.toUpperCase();

			const ignoreKeywords = [
				"GCASHTRANSACTIONHISTORY",
				"STARTINGBALANCE",
				"DATEANDTIMEDESCRIPTION",
				"ENDINGBALANCE",
				"TOTALDEBIT",
				"TOTALCREDIT",
			];
			if (ignoreKeywords.some((keyword) => fullLineText.includes(keyword))) continue;

			// Capture date range only if it hasn't been found yet
			if (!dateRange && fullLineText.match(/\d{4}-\d{2}-\d{2}TO\d{4}-\d{2}-\d{2}/)) {
				dateRange = row.items
					.map((i) => i.text)
					.join("")
					.replace(/(\d{4}-\d{2}-\d{2})to(\d{4}-\d{2}-\d{2})/, "$1 to $2");
				continue;
			}

			let dateStr = "",
				descriptionStr = "",
				referenceStr = "",
				debitStr = "",
				creditStr = "",
				balanceStr = "";
			for (const charItem of row.items) {
				if (charItem.x >= columnBoundaries.date.start && charItem.x < columnBoundaries.date.end)
					dateStr += charItem.text;
				else if (
					charItem.x >= columnBoundaries.description.start &&
					charItem.x < columnBoundaries.description.end
				)
					descriptionStr += charItem.text;
				else if (
					charItem.x >= columnBoundaries.reference.start &&
					charItem.x < columnBoundaries.reference.end
				)
					referenceStr += charItem.text;
				else if (
					charItem.x >= columnBoundaries.debit.start &&
					charItem.x < columnBoundaries.debit.end
				)
					debitStr += charItem.text;
				else if (
					charItem.x >= columnBoundaries.credit.start &&
					charItem.x < columnBoundaries.credit.end
				)
					creditStr += charItem.text;
				else if (
					charItem.x >= columnBoundaries.balance.start &&
					charItem.x < columnBoundaries.balance.end
				)
					balanceStr += charItem.text;
			}

			const transaction = {
				startX: startX,
				date: dateStr.trim() || null,
				description: descriptionStr.trim(),
				reference: referenceStr.trim() || null,
				debit: parseFloat(debitStr.trim().replace(/,/g, "")) || null,
				credit: parseFloat(creditStr.trim().replace(/,/g, "")) || null,
				balance: parseFloat(balanceStr.trim().replace(/,/g, "")) || null,
			};

			if (
				Object.values(transaction).some(
					(v) =>
						(v !== null && v !== "" && v !== undefined && typeof v !== "number") ||
						(typeof v === "number" && !isNaN(v)),
				)
			) {
				preliminaryTransactions.push(transaction);
			}
		}

		// --- Pass 3: The Final Merge (crucially, this appends to the GLOBAL finalTransactions) ---
		for (const currentTx of preliminaryTransactions) {
			const isFragment = currentTx.startX >= columnBoundaries.description.start;

			if (isFragment && finalTransactions.length > 0) {
				const mainTx = finalTransactions[finalTransactions.length - 1];
				mainTx.description = `${mainTx.description} ${currentTx.description}`.trim();
				mainTx.reference = mainTx.reference || currentTx.reference;
				mainTx.debit = mainTx.debit || currentTx.debit;
				mainTx.credit = mainTx.credit || currentTx.credit;
				mainTx.balance = mainTx.balance || currentTx.balance;
			} else if (!isFragment) {
				finalTransactions.push(currentTx);
			}
		}
	} // End of page loop

	// Clean up the temporary 'startX' property before returning.
	finalTransactions.forEach((tx) => delete tx.startX);

	return { dateRange, transactions: finalTransactions };
}
```

#### 4. Main Export Function (`readInvoice.ts`)

```typescript
/**
 * The main exported function that orchestrates the entire PDF parsing pipeline.
 */
export async function parseGcashPdf(pdfBuffer: Buffer, password: string = "") {
	try {
		// Step 1: Call the engine to get raw character data with coordinates.
		const rawData = await extractDataWithCoordinates(pdfBuffer, password);

		// Step 2: Pass the raw data to the high-level processor to get final results.
		return processExtractedData(rawData);
	} catch (error: any) {
		console.error("Failed to parse PDF with pdfreader:", error);
		// Translate low-level errors into user-friendly messages.
		if (error?.message?.includes("PasswordException")) {
			throw new Error("Invalid password provided for the PDF.");
		}
		throw new Error(
			error?.message ||
				"Could not process the PDF file. It might be corrupted or in an unsupported format.",
		);
	}
}
```

---

## Integration Examples

### Next.js Server Actions

#### Server Action for PDF Processing (`actions.ts`)

```typescript
"use server";

import { parseGcashPdf, GcashInvoiceExtractedData } from "@/lib/gcashReaders/readInvoice";
import { storeInvoice } from "@/lib/gcashReaders/storeInvoice";

// Define a consistent result type for our actions
type ActionResult<T> =
	| { success: true; message: string; data: T }
	| { success: false; message: string; data?: null };

/**
 * Processes a GCash PDF statement, extracts transaction data, and stores it in Supabase.
 */
export async function processGcashPdf(
	formData: FormData,
): Promise<ActionResult<GcashInvoiceExtractedData>> {
	const pdfFile = formData.get("pdfFile") as File | null;
	const password = formData.get("password") as string | null;

	if (!pdfFile || !password) {
		return { success: false, message: "PDF file and password are required." };
	}

	if (pdfFile.size === 0) {
		return { success: false, message: "Uploaded PDF file is empty." };
	}

	const MAX_PDF_SIZE_MB = 20;
	if (pdfFile.size > MAX_PDF_SIZE_MB * 1024 * 1024) {
		return { success: false, message: `PDF file size exceeds ${MAX_PDF_SIZE_MB}MB.` };
	}

	try {
		const arrayBuffer = await pdfFile.arrayBuffer();
		const pdfBuffer = Buffer.from(arrayBuffer);

		const extractedData = await parseGcashPdf(pdfBuffer, password);

		if (!extractedData || extractedData.transactions.length === 0) {
			console.error("GCash PDF processing failed: No transactions found or parser failed.");
			return { success: false, message: "Failed to parse PDF or no transactions were found." };
		}

		// After successful parsing, store the invoice
		const storageUrl = await storeInvoice(pdfFile, extractedData);
		console.log(`Invoice stored at: ${storageUrl}`);

		console.log("GCash PDF processed successfully.");
		const message = `Extracted ${extractedData.transactions.length} transactions.`;
		return { success: true, message, data: { ...extractedData, storageUrl } };
	} catch (error: any) {
		console.error("An unexpected error occurred during GCash PDF processing:", error);
		if (error.message && error.message.toLowerCase().includes("password")) {
			return { success: false, message: "Incorrect PDF password." };
		}
		return { success: false, message: `An unexpected server error occurred: ${error.message}` };
	}
}
```

#### Server Action for Receipt Storage (`actions.ts`)

```typescript
"use server";

import { storeReceipt } from "@/lib/gcashReaders/storeReceipt";
import { GcashReceiptData } from "@/lib/gcashReaders/parseReceipt";

/**
 * Stores a receipt image in Supabase Storage.
 * The OCR data is provided by the client.
 */
export async function storeReceiptAction(
	formData: FormData,
): Promise<ActionResult<{ storageUrl: string }>> {
	const receiptImage = formData.get("receiptImage") as File | null;
	const receiptDataString = formData.get("receiptData") as string | null;

	if (!receiptImage || !receiptDataString) {
		return { success: false, message: "Receipt image and data are required." };
	}

	const receiptData: GcashReceiptData = JSON.parse(receiptDataString);

	if (!receiptImage.type.startsWith("image/")) {
		return { success: false, message: "Please upload a valid image file." };
	}

	const MAX_IMAGE_SIZE_MB = 10;
	if (receiptImage.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
		return { success: false, message: `Receipt image size exceeds ${MAX_IMAGE_SIZE_MB}MB.` };
	}

	try {
		const storageUrl = await storeReceipt(receiptImage, receiptData);
		console.log(`Receipt stored at: ${storageUrl}`);

		return {
			success: true,
			message: "Receipt uploaded successfully!",
			data: { storageUrl },
		};
	} catch (error: any) {
		console.error("Error storing receipt on server:", error);
		return {
			success: false,
			message: `An error occurred during receipt upload: ${error.message}`,
		};
	}
}
```

### React Client Component Example

```typescript
"use client";

import { useState } from "react";
import { createWorker } from "tesseract.js";
import { parseOcrText, GcashReceiptData } from "@/lib/gcashReaders/parseReceipt";
import { processGcashPdf, storeReceiptAction } from "./actions";

export default function GcashExtractorClient() {
	const [isProcessing, setIsProcessing] = useState(false);
	const [receiptData, setReceiptData] = useState<GcashReceiptData | null>(null);

	const handleReceiptSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);
		const receiptImage = formData.get("receiptImage") as File;

		if (!receiptImage) return;

		setIsProcessing(true);
		setReceiptData(null);

		let worker;
		try {
			// Client-side OCR
			worker = await createWorker("eng");
			const { data: { text } } = await worker.recognize(receiptImage);

			const extractedData = parseOcrText(text);
			setReceiptData(extractedData);

			// Upload to server
			if (extractedData.referenceNumber) {
				const uploadFormData = new FormData();
				uploadFormData.append("receiptImage", receiptImage);
				uploadFormData.append("receiptData", JSON.stringify(extractedData));

				const result = await storeReceiptAction(uploadFormData);
				if (result.success) {
					console.log("Stored at:", result.data.storageUrl);
				}
			}
		} catch (error) {
			console.error("Error during OCR:", error);
		} finally {
			await worker?.terminate();
			setIsProcessing(false);
		}
	};

	const handlePdfSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);

		try {
			const result = await processGcashPdf(formData);
			if (result.success) {
				console.log("Extracted transactions:", result.data.transactions);
			}
		} catch (error) {
			console.error("Error processing PDF:", error);
		}
	};

	return (
		<div>
			{/* Receipt Form */}
			<form onSubmit={handleReceiptSubmit}>
				<input type="file" name="receiptImage" accept="image/*" required />
				<button type="submit" disabled={isProcessing}>
					{isProcessing ? "Processing..." : "Process Receipt"}
				</button>
			</form>

			{/* PDF Form */}
			<form onSubmit={handlePdfSubmit}>
				<input type="file" name="pdfFile" accept=".pdf" required />
				<input type="password" name="password" placeholder="PDF Password" required />
				<button type="submit">Process PDF</button>
			</form>

			{/* Display Results */}
			{receiptData && (
				<div>
					<h3>Receipt Data</h3>
					<p>Reference Number: {receiptData.referenceNumber}</p>
					<p>Amount: ₱{receiptData.amount?.toFixed(2)}</p>
					<p>Recipient: {receiptData.recipientName}</p>
					<p>Number: {receiptData.recipientNumber}</p>
					<p>Timestamp: {receiptData.timestamp?.toLocaleString()}</p>
				</div>
			)}
		</div>
	);
}
```

---

## Storage Implementation

### Receipt Storage (`storeReceipt.ts`)

```typescript
/**
 * @file This module handles the uploading of GCash receipt images to Supabase Storage.
 */

import { createClient } from "@/lib/supabase/server";
import { GcashReceiptData } from "./parseReceipt";

/**
 * Formats a date object into a YYYYMMDD string.
 * @param date The date to format.
 * @returns The formatted date string.
 */
function formatDate(date: Date): string {
	const year = date.getFullYear();
	const month = (date.getMonth() + 1).toString().padStart(2, "0");
	const day = date.getDate().toString().padStart(2, "0");
	return `${year}${month}${day}`;
}

/**
 * Uploads a receipt image to Supabase storage.
 *
 * @param imageFile The receipt image file to upload.
 * @param receiptData The extracted data from the receipt for naming the file.
 * @returns The public URL of the uploaded file.
 * @throws An error if the upload fails.
 */
export async function storeReceipt(imageFile: File, receiptData: GcashReceiptData) {
	const supabase = await createClient();
	const { timestamp, referenceNumber, recipientName } = receiptData;

	if (!timestamp || !referenceNumber) {
		throw new Error("Timestamp and Reference Number are required to store the receipt.");
	}

	// Create the folder path: receipts/YYYY/MM/
	const year = timestamp.getFullYear();
	const month = (timestamp.getMonth() + 1).toString().padStart(2, "0");
	const folderPath = `receipts/${year}/${month}`;

	// Sanitize recipient name for the filename
	const sanitizedName = (recipientName || "UnknownRecipient").replace(/[^a-zA-Z0-9]/g, "");
	// Get file extension
	const extension = imageFile.name.split(".").pop() || "png";
	// Create the filename: YYYYMMDD_ref_Name.ext
	const fileName = `${formatDate(timestamp)}_${referenceNumber}_${sanitizedName}.${extension}`;

	const filePath = `${folderPath}/${fileName}`;

	console.log(`Uploading receipt to: ${filePath}`);

	const { data, error } = await supabase.storage
		.from(process.env.GCASH_BUCKET_NAME)
		.upload(filePath, imageFile, {
			cacheControl: "3600",
			upsert: true, // Overwrite if file with same name exists
		});

	if (error) {
		console.error("Error uploading receipt to Supabase:", error);
		throw new Error(`Failed to upload receipt: ${error.message}`);
	}

	console.log("Successfully uploaded receipt:", data.path);

	// Return the public URL of the uploaded file
	const {
		data: { publicUrl },
	} = supabase.storage.from(process.env.GCASH_BUCKET_NAME).getPublicUrl(data.path);

	return publicUrl;
}
```

### Invoice Storage (`storeInvoice.ts`)

```typescript
/**
 * @file This module handles the uploading of GCash invoice PDFs to Supabase Storage.
 */

import { createClient } from "@/lib/supabase/server";
import { GcashInvoiceExtractedData } from "./readInvoice";

/**
 * Extracts start and end dates from a date range string (e.g., "YYYY-MM-DD to YYYY-MM-DD").
 * @param dateRange The date range string.
 * @returns An object with startDate and endDate.
 */
function parseDateRange(dateRange: string): { startDate: string; endDate: string } {
	const [startDate, endDate] = dateRange.split(" to ").map((date) => date.trim());
	return { startDate, endDate };
}

/**
 * Uploads a GCash invoice PDF to Supabase storage.
 *
 * @param pdfFile The invoice PDF file to upload.
 * @param invoiceData The extracted data from the invoice for naming the file.
 * @returns The public URL of the uploaded file.
 * @throws An error if the upload fails.
 */
export async function storeInvoice(pdfFile: File, invoiceData: GcashInvoiceExtractedData) {
	const supabase = await createClient();
	const { dateRange } = invoiceData;

	if (!dateRange) {
		throw new Error("Date Range is required to store the invoice.");
	}

	// Extract dates for naming and path
	const { startDate } = parseDateRange(dateRange);
	const year = new Date(startDate).getFullYear();
	const month = (new Date(startDate).getMonth() + 1).toString().padStart(2, "0");

	// Create the folder path: invoices/YYYY/MM/
	const folderPath = `invoices/${year}/${month}`;

	// Create the filename from the date range
	const fileName = `${dateRange.replace(/ /g, "").replace(/-/g, "")}.pdf`;

	const filePath = `${folderPath}/${fileName}`;

	console.log(`Uploading invoice to: ${filePath}`);

	const { data, error } = await supabase.storage
		.from(process.env.GCASH_BUCKET_NAME)
		.upload(filePath, pdfFile, {
			cacheControl: "3600",
			upsert: true, // Overwrite if file with same name exists
		});

	if (error) {
		console.error("Error uploading invoice to Supabase:", error);
		throw new Error(`Failed to upload invoice: ${error.message}`);
	}

	console.log("Successfully uploaded invoice:", data.path);

	// Return the public URL of the uploaded file
	const {
		data: { publicUrl },
	} = supabase.storage.from(process.env.GCASH_BUCKET_NAME).getPublicUrl(data.path);

	return publicUrl;
}
```

---

## Troubleshooting

### Common Issues

#### 1. Tesseract.js Language Data Not Found

**Error**: `Error: Language data not found`

**Solution**:

- For server-side: Ensure `lang-data/eng.traineddata` exists in project root
- For client-side: Check network connectivity (auto-downloads)

```bash
# Download language data
mkdir lang-data
curl -L https://github.com/tesseract-ocr/tessdata/raw/main/eng.traineddata -o lang-data/eng.traineddata
```

#### 2. OCR Not Recognizing Text

**Problem**: Reference number not extracted

**Solutions**:

- Ensure image is clear and high resolution
- Make sure text is not rotated
- Adjust regex patterns in `parseOcrText()` if GCash UI changed
- Test with console.log of raw OCR text to debug

#### 3. PDF Password Error

**Error**: `Invalid password provided for the PDF`

**Solution**:

- Verify password is correct
- GCash PDFs typically use last 4 digits of mobile number as password
- Ensure password is passed as string, not number

#### 4. Coordinate-Based Parsing Issues

**Problem**: PDF extraction missing columns or merging incorrectly

**Solution**:

- Adjust `columnBoundaries` in `processExtractedData()`
- GCash may update PDF layout - check actual X coordinates by logging
- Adjust `ROW_TOLERANCE` if rows are splitting incorrectly

```typescript
// Debug coordinates
console.log(
	"Character positions:",
	page.content.map((c) => ({ x: c.x, y: c.y, text: c.text })),
);
```

#### 5. Multi-line Descriptions Not Merging

**Problem**: Transaction descriptions split across rows

**Solution**:

- Check the `isFragment` logic in Pass 3
- Adjust the `startX` threshold for fragment detection
- Ensure rows are sorted by Y coordinate first

---

## Testing Recommendations

### Unit Tests

```typescript
import { parseOcrText } from "./parseReceipt";

describe("parseOcrText", () => {
	it("should extract reference number", () => {
		const mockText = `
      Sent via GCash
      John Doe
      +63 912 345 6789
      Total Amount Sent ₱500.00
      Ref No. 1234567890 Dec 14, 2024 10:30 AM
    `;

		const result = parseOcrText(mockText);

		expect(result.referenceNumber).toBe("1234567890");
		expect(result.amount).toBe(500.0);
		expect(result.recipientName).toBe("John Doe");
	});
});
```

### Integration Tests

```typescript
import { parseGcashPdf } from "./readInvoice";
import fs from "fs";

describe("parseGcashPdf", () => {
	it("should extract transactions from PDF", async () => {
		const pdfBuffer = fs.readFileSync("./test-data/sample.pdf");
		const password = "1234";

		const result = await parseGcashPdf(pdfBuffer, password);

		expect(result.transactions.length).toBeGreaterThan(0);
		expect(result.transactions[0].reference).toBeDefined();
	});
});
```

---

## Performance Considerations

### Image OCR

- **Client-side**: ~5-15 seconds per image (depends on device)
- **Server-side**: ~3-8 seconds per image
- **Recommendation**: Use client-side for single receipts, server-side for batch processing

### PDF Parsing

- **Processing time**: ~1-3 seconds per page
- **Multi-page**: Linear scaling (10 pages = ~10-30 seconds)
- **Memory**: ~50-100MB per PDF being processed

### Optimization Tips

1. Use client-side OCR when possible to reduce server load
2. Implement progress callbacks for better UX
3. Consider queuing system for batch processing
4. Cache parsed results to avoid reprocessing

---

## Security Considerations

1. **File Upload Validation**
   - Check file type (MIME type)
   - Limit file size (10MB for images, 20MB for PDFs)
   - Sanitize filenames

2. **Password Handling**
   - Never log passwords
   - Pass passwords securely
   - Consider encrypted storage for PDFs

3. **Data Storage**
   - Use environment variables for bucket names
   - Implement access controls on storage buckets
   - Consider encrypting stored files

4. **Reference Number Privacy**
   - Reference numbers are sensitive financial data
   - Implement proper authentication before exposing
   - Log access for audit trails

---

## Regex Pattern Explanations

### Receipt Patterns

1. **Reference Number with Date**

   ```regex
   /Ref No\.\s*(\d+)\s+(.+)/
   ```

   - Matches "Ref No." followed by digits
   - Captures reference number and timestamp
   - Example: "Ref No. 1234567890 Dec 14, 2024 10:30 AM"

2. **Amount Pattern**

   ```regex
   /Total Amount Sent.*?([\d,]+\.\d{2})/
   ```

   - Flexible currency symbol handling
   - Captures numeric amount with decimals
   - Example: "Total Amount Sent ₱1,234.56"

3. **Name and Number Pattern**

   ```regex
   /([A-Za-z\s,.-]+)\s*\+63\s*([\d\s]+)/
   ```

   - Captures recipient name before phone number
   - Philippines format (+63)
   - Example: "John Doe +63 912 345 6789"

### PDF Patterns

1. **Date Range Pattern**

   ```regex
   /\d{4}-\d{2}-\d{2}TO\d{4}-\d{2}-\d{2}/
   ```

   - Matches date range in GCash PDFs
   - Example: "2024-01-01TO2024-01-31"

---

## Version History

- **v1.0.0** - Initial implementation with basic OCR and PDF parsing
- **v1.1.0** - Added robust error handling and multi-page PDF support
- **v1.2.0** - Improved OCR accuracy with fallback patterns
- **v1.3.0** - Added Supabase storage integration

---

## License

This documentation is provided as-is for implementation in your projects.

---

## Support

For issues with:

- **Tesseract.js**: https://github.com/naptha/tesseract.js
- **pdfreader**: https://github.com/adrienjoly/npm-pdfreader
- **Supabase**: https://supabase.com/docs

---

## Summary

This system provides a complete solution for extracting GCash transaction data:

1. **For Screenshots/Images**: Use Tesseract.js OCR + regex parsing
2. **For PDF Statements**: Use pdfreader + coordinate-based extraction
3. **Both systems extract**: Reference numbers, amounts, dates, and other transaction details
4. **Storage**: Optional Supabase integration with organized folder structure

The code is production-ready and handles edge cases like OCR errors, multi-line text, password-protected PDFs, and multi-page documents.
