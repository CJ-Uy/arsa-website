import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { minioClient } from "@/lib/minio";

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ filename: string }> },
) {
	try {
		const { filename } = await params;
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session?.user) {
			return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
		}

		// Find the order with this receipt
		const order = await prisma.order.findFirst({
			where: {
				receiptImageUrl: {
					contains: filename,
				},
			},
			select: {
				userId: true,
			},
		});

		if (!order) {
			return NextResponse.json({ success: false, message: "Receipt not found" }, { status: 404 });
		}

		// Check if user is authorized (shop admin or owner of the order)
		const user = await prisma.user.findUnique({
			where: { id: session.user.id },
			select: { isShopAdmin: true },
		});

		const isOwner = order.userId === session.user.id;
		const isAdmin = user?.isShopAdmin || false;

		if (!isOwner && !isAdmin) {
			return NextResponse.json({ success: false, message: "Forbidden" }, { status: 403 });
		}

		// Get the file from MinIO
		const stream = await minioClient.getObject("receipts", filename);

		// Convert stream to buffer
		const chunks: Buffer[] = [];
		for await (const chunk of stream) {
			chunks.push(chunk);
		}
		const buffer = Buffer.concat(chunks);

		// Determine content type based on file extension
		const extension = filename.split(".").pop()?.toLowerCase();
		let contentType = "image/jpeg";
		if (extension === "png") contentType = "image/png";
		if (extension === "gif") contentType = "image/gif";
		if (extension === "webp") contentType = "image/webp";

		// Return the image
		return new NextResponse(buffer, {
			status: 200,
			headers: {
				"Content-Type": contentType,
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
