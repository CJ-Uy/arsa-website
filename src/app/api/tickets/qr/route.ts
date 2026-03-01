import { NextRequest, NextResponse } from "next/server";
import QRCode from "qrcode";
import { verifyTicketSignature } from "@/lib/ticketUtils";

export async function GET(request: NextRequest) {
	const { searchParams } = new URL(request.url);
	const shortCode = searchParams.get("id");
	const sig = searchParams.get("sig");

	if (!shortCode || !sig) {
		return new NextResponse("Missing parameters", { status: 400 });
	}

	// Verify HMAC signature
	if (!verifyTicketSignature(shortCode, sig)) {
		return new NextResponse("Invalid signature", { status: 403 });
	}

	// QR code encodes the verification page URL
	const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
	const verifyUrl = `${appUrl}/ticket-verify?t=${shortCode}`;

	try {
		const pngBuffer = await QRCode.toBuffer(verifyUrl, {
			type: "png",
			width: 300,
			margin: 2,
			errorCorrectionLevel: "M",
		});

		return new NextResponse(pngBuffer, {
			status: 200,
			headers: {
				"Content-Type": "image/png",
				"Cache-Control": "public, max-age=86400, immutable",
			},
		});
	} catch (error) {
		console.error("QR generation error:", error);
		return new NextResponse("Failed to generate QR code", { status: 500 });
	}
}
