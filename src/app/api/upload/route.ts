import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadFile, BUCKETS } from "@/lib/minio";
import { randomUUID } from "crypto";

export async function POST(request: NextRequest) {
	try {
		// Check authentication
		const session = await auth.api.getSession({
			headers: request.headers,
		});

		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const formData = await request.formData();
		const file = formData.get("file") as File;
		const type = formData.get("type") as string; // "product" or "receipt"

		if (!file) {
			return NextResponse.json({ error: "No file provided" }, { status: 400 });
		}

		// Validate file type
		if (!file.type.startsWith("image/")) {
			return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
		}

		// Validate file size (max 5MB)
		if (file.size > 5 * 1024 * 1024) {
			return NextResponse.json({ error: "File size must be less than 5MB" }, { status: 400 });
		}

		// Convert file to buffer
		const arrayBuffer = await file.arrayBuffer();
		const buffer = Buffer.from(arrayBuffer);

		// Determine bucket and generate unique filename
		const bucket = type === "product" ? BUCKETS.PRODUCTS : BUCKETS.RECEIPTS;
		const extension = file.name.split(".").pop();
		const fileName = `${randomUUID()}.${extension}`;

		// Upload to MinIO
		const url = await uploadFile(bucket, fileName, buffer, file.type);

		return NextResponse.json({ url, fileName });
	} catch (error) {
		console.error("Upload error:", error);
		return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
	}
}
