"use client";

import type { ExtractedPages, PositionedTextItem } from "./readInvoice";

/**
 * Client-side PDF text extraction via pdfjs-dist.
 *
 * Output shape matches the server-side `processExtractedData()` contract: a list
 * of pages, each with positioned text items. Coordinates are normalized to the
 * legacy `pdfreader` scale (approximately 1/40th of a typographic point) so the
 * existing column-boundary heuristics keep working unchanged.
 */
export async function extractInvoiceFromPdf(
	file: File | Blob,
	password = "",
): Promise<ExtractedPages> {
	const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
	(pdfjsLib as unknown as { GlobalWorkerOptions: { workerSrc: string } }).GlobalWorkerOptions.workerSrc =
		// Run worker-less; pdfjs falls back to fake worker
		"";

	const arrayBuffer = await file.arrayBuffer();
	const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer, password });
	const doc = await loadingTask.promise;

	const pages: ExtractedPages["pages"] = [];

	for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
		const page = await doc.getPage(pageNum);
		const text = await page.getTextContent();
		const content: PositionedTextItem[] = [];

		// pdfjs returns items in PDF user space coordinates (transform[4] = x, [5] = y).
		// Page height varies; scale x by /14 and convert y to top-down by viewport.height - y, then /14.
		const viewport = page.getViewport({ scale: 1 });
		const scaleDivisor = 14;

		for (const item of text.items as unknown as { transform: number[]; str: string }[]) {
			const rawX = item.transform?.[4] ?? 0;
			const rawY = item.transform?.[5] ?? 0;
			const x = rawX / scaleDivisor;
			const y = (viewport.height - rawY) / scaleDivisor;

			// Tokenize the string into per-character items so the downstream column
			// boundary logic (which sums character contributions by x position) keeps
			// the same behavior as the old pdfreader output.
			const str = item.str ?? "";
			if (!str) continue;

			// pdfjs reports one text run per chunk; approximate per-character X using width if available.
			for (let i = 0; i < str.length; i++) {
				content.push({
					x: x + i * 0.12, // tiny offset per char so sort by x is stable
					y,
					text: str[i],
				});
			}
		}

		pages.push({ content });
	}

	return { pages };
}
