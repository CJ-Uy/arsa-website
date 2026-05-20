/**
 * GCash PDF invoice parser.
 *
 * Migrated from `pdfreader` (Node-only, blocked on Cloudflare Workers) to a
 * Workers-compatible flow: PDF text extraction now happens on the *client*
 * via `pdfjs-dist`, and the server only receives the pre-extracted positioned
 * text items for transaction matching.
 *
 * If you want to parse a PDF on the server, use the legacy Node-only path via
 * a separate background job (e.g. wrangler with `nodejs_compat` does not yet
 * support `pdfreader`'s synchronous Buffer parsing).
 *
 * The pure data-processing function `processExtractedData` is kept exported so
 * the same column-detection logic can be reused once the client passes its
 * extracted items array.
 */

export interface GcashTransaction {
	date: string | null;
	description: string;
	reference: string | null;
	debit: number | null;
	credit: number | null;
	balance: number | null;
}

export interface GcashInvoiceExtractedData {
	dateRange: string | null;
	transactions: GcashTransaction[];
}

export interface PositionedTextItem {
	x: number;
	y: number;
	text: string;
}

export interface ExtractedPages {
	pages: { content: PositionedTextItem[] }[];
}

const columnBoundaries = {
	date: { start: 2, end: 7 },
	description: { start: 7, end: 20 },
	reference: { start: 20, end: 25 },
	debit: { start: 26, end: 28 },
	credit: { start: 29, end: 31 },
	balance: { start: 32, end: 35 },
};

export function processExtractedData(data: ExtractedPages): GcashInvoiceExtractedData {
	const finalTransactions: (GcashTransaction & { startX?: number })[] = [];
	let dateRange: string | null = null;

	for (const page of data.pages) {
		const preliminaryTransactions: (GcashTransaction & { startX: number })[] = [];

		const rows: { y: number; items: PositionedTextItem[] }[] = [];
		const content = [...page.content].sort((a, b) => a.y - b.y || a.x - b.x);

		if (content.length > 0) {
			let currentRow: PositionedTextItem[] = [];
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
				startX,
				date: dateStr.trim() || null,
				description: descriptionStr.trim(),
				reference: referenceStr.trim() || null,
				debit: parseFloat(debitStr.trim().replace(/,/g, "")) || null,
				credit: parseFloat(creditStr.trim().replace(/,/g, "")) || null,
				balance: parseFloat(balanceStr.trim().replace(/,/g, "")) || null,
			};

			const hasRealValue =
				transaction.date !== null ||
				transaction.description !== "" ||
				transaction.reference !== null ||
				transaction.debit !== null ||
				transaction.credit !== null ||
				transaction.balance !== null;
			if (hasRealValue) preliminaryTransactions.push(transaction);
		}

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
	}

	finalTransactions.forEach((tx) => delete (tx as Partial<typeof tx>).startX);
	return { dateRange, transactions: finalTransactions };
}

/**
 * @deprecated Server-side PDF parsing relies on `pdfreader`, which depends on
 * Node APIs unavailable in the Cloudflare Workers runtime. Use the client-side
 * helper at `src/lib/gcashReaders/readInvoice.client.ts` to extract positioned
 * text via `pdfjs-dist`, then POST the result to the invoice action.
 */
export async function parseGcashPdf(
	_pdfBuffer: ArrayBuffer | Uint8Array,
	_password: string = "",
): Promise<GcashInvoiceExtractedData> {
	throw new Error(
		"Server-side PDF parsing is disabled in the Cloudflare Workers runtime. Use the client-side pdfjs-dist extractor and pass the positioned-text payload to the invoice action.",
	);
}
