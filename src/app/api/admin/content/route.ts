import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest) {
	const session = await auth.api.getSession({
		headers: request.headers,
	});

	if (!session?.user) {
		return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
	}

	try {
		const { key, data } = await request.json();

		if (!key || typeof key !== "string") {
			return NextResponse.json({ success: false, message: "Invalid key" }, { status: 400 });
		}

		await prisma.siteContent.upsert({
			where: { key },
			create: { key, data: data as object },
			update: { data: data as object },
		});

		return NextResponse.json({ success: true });
	} catch (error) {
		console.error("Error saving site content:", error);
		return NextResponse.json(
			{ success: false, message: "Failed to save content" },
			{ status: 500 },
		);
	}
}
