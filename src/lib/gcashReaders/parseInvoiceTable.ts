/**
 * Parse GCash invoice table from OCR text
 * Format: Date and Time | Description | Reference No. | Debit | Credit
 */

export interface GCashTransaction {
	dateTime: string;
	description: string;
	referenceNumber: string;
	debit: number | null;
	credit: number | null;
}

export function parseInvoiceTable(ocrText: string): GCashTransaction[] {
	const lines = ocrText.split("\n");
	const transactions: GCashTransaction[] = [];

	for (const line of lines) {
		// Skip header lines and empty lines
		if (
			!line.trim() ||
			line.includes("Date and Time") ||
			line.includes("Reference No") ||
			line.includes("Description")
		) {
			continue;
		}

		// Try to extract transaction data
		// Pattern: Look for reference number (13 digits), amounts, and date
		const refMatch = line.match(/(\d{13})/);
		if (!refMatch) continue;

		const referenceNumber = refMatch[1];

		// Extract amounts (format: 1,234.56 or 1234.56)
		const amounts = line.match(/[\d,]+\.\d{2}/g);

		// Extract date (various formats: Dec 08, 2025 or 12/08/2025 or 2025-12-08)
		const dateMatch =
			line.match(/[A-Z][a-z]{2}\s+\d{1,2},\s+\d{4}/) ||
			line.match(/\d{1,2}\/\d{1,2}\/\d{4}/) ||
			line.match(/\d{4}-\d{2}-\d{2}/);

		if (!dateMatch) continue;

		// Extract description (text between date and ref number)
		const dateEndIndex = line.indexOf(dateMatch[0]) + dateMatch[0].length;
		const refStartIndex = line.indexOf(referenceNumber);
		const description = line.substring(dateEndIndex, refStartIndex).trim();

		// Determine debit/credit
		let debit: number | null = null;
		let credit: number | null = null;

		if (amounts && amounts.length > 0) {
			// If description contains "Send Money" or similar, it's a debit
			if (
				description.toLowerCase().includes("send") ||
				description.toLowerCase().includes("transfer")
			) {
				debit = parseFloat(amounts[0].replace(/,/g, ""));
			} else {
				credit = parseFloat(amounts[0].replace(/,/g, ""));
			}
		}

		transactions.push({
			dateTime: dateMatch[0],
			description: description || "Unknown",
			referenceNumber,
			debit,
			credit,
		});
	}

	return transactions;
}
