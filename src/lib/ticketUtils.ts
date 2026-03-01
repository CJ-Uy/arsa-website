import crypto from "crypto";

// Unambiguous charset - excludes 0/O, 1/I/L to avoid confusion
const CHARSET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 8;

/**
 * Generate a cryptographically random 8-character alphanumeric short code.
 */
export function generateShortCode(): string {
	const bytes = crypto.randomBytes(CODE_LENGTH);
	return Array.from(bytes)
		.map((b) => CHARSET[b % CHARSET.length])
		.join("");
}

/**
 * Generate HMAC-SHA256 signature for a ticket short code.
 * Used to create tamper-proof QR image URLs embeddable in emails.
 */
export function signTicketCode(shortCode: string): string {
	const secret = process.env.TICKET_HMAC_SECRET;
	if (!secret) throw new Error("TICKET_HMAC_SECRET is not set");
	return crypto.createHmac("sha256", secret).update(shortCode).digest("hex");
}

/**
 * Verify an HMAC signature for a ticket short code.
 */
export function verifyTicketSignature(shortCode: string, sig: string): boolean {
	try {
		const expected = signTicketCode(shortCode);
		return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(sig, "hex"));
	} catch {
		return false;
	}
}

/**
 * Build the full signed QR image URL for a ticket.
 */
export function buildQrImageUrl(shortCode: string, baseUrl: string): string {
	const sig = signTicketCode(shortCode);
	return `${baseUrl}/api/tickets/qr?id=${shortCode}&sig=${sig}`;
}
