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

	// Matches "Ref No." followed by the number (with possible spaces) and then captures the date.
	// Reference numbers can have spaces (e.g., "1234 567 8901")
	// Capture only digits and spaces, stop at first non-digit/non-space character
	const refAndDateRegex = /Ref No\.\s*([\d\s]+?)\s+([A-Za-z].+)/;

	// Makes the currency symbol optional and non-capturing, looking for any characters
	// between "Total Amount Sent" and the number pattern. This handles '₱', '£', '$', or OCR errors.
	const amountRegex = /Total Amount Sent.*?([\d,]+\.\d{2})/;
	const nameAndNumberRegex = /([A-Za-z\s,.-]+)\s*\+63\s*([\d\s]+)/;

	// An alternative regex for cases where the name might be on the line above the number.
	const numberOnlyRegex = /\+63\s*([\d\s]+)/;

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i];

		// Find Reference Number and Timestamp
		const refMatch = line.match(refAndDateRegex);
		if (refMatch) {
			// Remove all spaces from the reference number
			data.referenceNumber = refMatch[1].replace(/\s/g, "").trim();
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
