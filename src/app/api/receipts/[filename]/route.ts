import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq, like } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { order, user } from "@/db/schema";
import { getFileStream, BUCKETS } from "@/lib/r2";

export async function GET(
	_request: NextRequest,
	{ params }: { params: Promise<{ filename: string }> },
) {
	try {
		const { filename } = await params;
		const session = await auth.api.getSession({ headers: await headers() });
		if (!session?.user) {
			return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
		}

		const o = await db.query.order.findFirst({
			where: like(order.receiptImageUrl, `%${filename}%`),
			columns: { userId: true },
		});
		if (!o) {
			return NextResponse.json({ success: false, message: "Receipt not found" }, { status: 404 });
		}

		const u = await db.query.user.findFirst({
			where: eq(user.id, session.user.id),
			columns: { isShopAdmin: true },
		});

		const isOwner = o.userId === session.user.id;
		const isAdmin = u?.isShopAdmin || false;
		if (!isOwner && !isAdmin) {
			return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
		}

		const obj = await getFileStream(BUCKETS.RECEIPTS, filename);
		if (!obj) {
			return NextResponse.json({ success: false, message: "Receipt not found" }, { status: 404 });
		}

		return new NextResponse(obj.body, {
			status: 200,
			headers: {
				"Content-Type": obj.contentType,
				"Cache-Control": "private, max-age=3600",
			},
		});
	} catch (error) {
		console.error("Error fetching receipt:", error);
		return NextResponse.json(
			{ success: false, message: "Failed to fetch receipt" },
			{ status: 500 },
		);
	}
}
