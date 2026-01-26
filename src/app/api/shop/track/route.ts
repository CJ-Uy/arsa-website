import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { path, eventId } = body;

		if (!path) {
			return NextResponse.json({ success: false, message: "Path is required" }, { status: 400 });
		}

		const userAgent = request.headers.get("user-agent") || null;
		const referer = request.headers.get("referer") || null;

		await prisma.shopClick.create({
			data: {
				path,
				eventId: eventId || null,
				userAgent,
				referer,
			},
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Track click error:", error);
		return NextResponse.json({ success: false, message: "Failed to track click" }, { status: 500 });
	}
}
