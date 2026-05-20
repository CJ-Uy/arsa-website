import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { shopClick } from "@/db/schema";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { path, eventId } = body;

		if (!path) {
			return NextResponse.json({ success: false, message: "Path is required" }, { status: 400 });
		}

		await db.insert(shopClick).values({
			path,
			eventId: eventId || null,
			userAgent: request.headers.get("user-agent") || null,
			referer: request.headers.get("referer") || null,
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Track click error:", error);
		return NextResponse.json({ success: false, message: "Failed to track click" }, { status: 500 });
	}
}
