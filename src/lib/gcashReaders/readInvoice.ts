import { PdfReader } from "pdfreader";

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
}

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

/**
 * The main exported function that orchestrates the entire PDF parsing pipeline.
 * @param pdfBuffer The PDF file as a Buffer
 * @param password The PDF password (typically last 4 digits of mobile number for GCash PDFs)
 * @returns Extracted transaction data with date range
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
