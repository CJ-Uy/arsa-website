import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { uploadFile, BUCKETS } from "@/lib/r2";

export async function POST(request: NextRequest) {
	try {
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session?.user) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const formData = await request.formData();
		const file = formData.get("file") as File;
		const type = formData.get("type") as string;

		if (!file) {
			return NextResponse.json({ error: "No file provided" }, { status: 400 });
		}
		if (!file.type.startsWith("image/")) {
			return NextResponse.json({ error: "Only image files are allowed" }, { status: 400 });
		}

		const unlimitedTypes = ["content", "event", "product", "payment"];
		if (!unlimitedTypes.includes(type || "") && file.size > 10 * 1024 * 1024) {
			return NextResponse.json({ error: "File size must be less than 10MB" }, { status: 400 });
		}

		const buffer = await file.arrayBuffer();

		let bucket: string;
		let fileName: string;
		let contentType: string;
		const originalExtension = file.name.split(".").pop() || "jpg";
		const isPreCompressed = file.type === "image/webp";
		const ext = isPreCompressed ? "webp" : originalExtension;

		if (type === "product") {
			bucket = BUCKETS.PRODUCTS;
			fileName = `${crypto.randomUUID()}.${ext}`;
			contentType = file.type;
		} else if (type === "content") {
			bucket = BUCKETS.CONTENT;
			fileName = `${crypto.randomUUID()}.${ext}`;
			contentType = file.type;
		} else if (type === "event" || type === "payment") {
			bucket = BUCKETS.EVENTS;
			fileName = `${crypto.randomUUID()}.${ext}`;
			contentType = file.type;
		} else {
			bucket = BUCKETS.RECEIPTS;
			fileName = `${crypto.randomUUID()}.${originalExtension}`;
			contentType = file.type;
		}

		const url = await uploadFile(bucket, fileName, buffer, contentType);
		return NextResponse.json({ url, fileName });
	} catch (error) {
		console.error("Upload error:", error);
		return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
	}
}
