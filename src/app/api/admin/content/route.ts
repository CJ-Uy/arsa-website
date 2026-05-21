import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { siteContent } from "@/db/schema";

export async function PUT(request: NextRequest) {
	const session = await auth.api.getSession({ headers: request.headers });
	if (!session?.user) {
		return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
	}

	try {
		const { key, data } = await request.json();
		if (!key || typeof key !== "string") {
			return NextResponse.json({ success: false, message: "Invalid key" }, { status: 400 });
		}

		const existing = await db.query.siteContent.findFirst({
			where: eq(siteContent.key, key),
		});

		if (existing) {
			await db.update(siteContent).set({ data }).where(eq(siteContent.key, key));
		} else {
			await db.insert(siteContent).values({ key, data });
		}

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error saving site content:", error);
		return NextResponse.json(
			{ success: false, message: "Failed to save content" },
			{ status: 500 },
		);
	}
}
