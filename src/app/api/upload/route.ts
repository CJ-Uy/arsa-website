import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadFile, BUCKETS } from "@/lib/minio";
import { randomUUID } from "crypto";
import sharp from "sharp";

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
		const type = formData.get("type") as string; // "product", "receipt", "event", or "payment"

		if (!file) {
			return NextResponse.json({ error: "No file provided" }, { status: 400 });
		}

		// Validate file type
		if (!file.type.startsWith("image/")) {
			return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
		}

		// Validate file size (max 10MB)
		if (file.size > 10 * 1024 * 1024) {
			return NextResponse.json({ error: "File size must be less than 10MB" }, { status: 400 });
		}

		// Convert file to buffer
		const arrayBuffer = await file.arrayBuffer();
		let buffer: Buffer = Buffer.from(arrayBuffer);

		// Optimize images for product, event, and payment uploads (one-time optimization at upload)
		if (type === "product" || type === "event" || type === "payment") {
			try {
				// Resize and optimize product images
				// Max width: 1200px, maintain aspect ratio
				// Convert to WebP for better compression (70% smaller than JPEG)
				const optimizedBuffer = await sharp(buffer)
					.rotate() // Auto-rotate based on EXIF orientation metadata
					.resize(1200, 1200, {
						fit: "inside", // Maintain aspect ratio, don't exceed dimensions
						withoutEnlargement: true, // Don't upscale small images
					})
					.webp({ quality: 85 }) // Good quality, smaller file size
					.toBuffer();
				buffer = optimizedBuffer;
			} catch (error) {
				console.error("Image optimization failed, uploading original:", error);
				// If optimization fails, continue with original image
			}
		}

		// Determine bucket and generate unique filename
		let bucket: string;
		let fileName: string;
		let contentType: string;

		const originalExtension = file.name.split(".").pop() || "jpg";

		if (type === "product") {
			bucket = BUCKETS.PRODUCTS;
			fileName = `${randomUUID()}.webp`;
			contentType = "image/webp";
		} else if (type === "event" || type === "payment") {
			bucket = BUCKETS.EVENTS;
			fileName = `${randomUUID()}.webp`;
			contentType = "image/webp";
		} else {
			// receipt or other types
			bucket = BUCKETS.RECEIPTS;
			fileName = `${randomUUID()}.${originalExtension}`;
			contentType = file.type;
		}
		const url = await uploadFile(bucket, fileName, buffer, contentType);

		return NextResponse.json({ url, fileName });
	} catch (error) {
		console.error("Upload error:", error);
		return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
	}
}
