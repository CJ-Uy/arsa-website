import { getCloudflareContext } from "@opennextjs/cloudflare";

// Bucket binding mapping. Keep external "bucket" string identical to old MinIO usage.
export const BUCKETS = {
	PRODUCTS: "products",
	RECEIPTS: "receipts",
	EVENTS: "events",
	CONTENT: "content",
} as const;

type BucketName = (typeof BUCKETS)[keyof typeof BUCKETS] | string;

function getBucket(bucket: BucketName): R2Bucket {
	const ctx = getCloudflareContext();
	const env = ctx.env as unknown as {
		PRODUCTS_BUCKET: R2Bucket;
		RECEIPTS_BUCKET: R2Bucket;
		EVENTS_BUCKET: R2Bucket;
		CONTENT_BUCKET: R2Bucket;
	};

	switch (bucket) {
		case BUCKETS.PRODUCTS:
			return env.PRODUCTS_BUCKET;
		case BUCKETS.RECEIPTS:
			return env.RECEIPTS_BUCKET;
		case BUCKETS.EVENTS:
			return env.EVENTS_BUCKET;
		case BUCKETS.CONTENT:
			return env.CONTENT_BUCKET;
		default:
			throw new Error(`Unknown bucket: ${bucket}`);
	}
}

const R2_PUBLIC_DOMAIN = process.env.R2_PUBLIC_DOMAIN || "https://r2.ateneoarsa.org";

export async function initializeBuckets(): Promise<void> {
	// No-op on R2 — buckets are provisioned via wrangler / dashboard, public access
	// is configured by attaching a custom domain or enabling the r2.dev URL.
}

export async function uploadFile(
	bucket: BucketName,
	fileName: string,
	fileBuffer: ArrayBuffer | Uint8Array | Buffer,
	contentType: string,
): Promise<string> {
	const r2 = getBucket(bucket);
	const body =
		fileBuffer instanceof ArrayBuffer
			? fileBuffer
			: fileBuffer instanceof Uint8Array
				? fileBuffer
				: new Uint8Array(fileBuffer);

	await r2.put(fileName, body, {
		httpMetadata: { contentType },
	});

	return `${R2_PUBLIC_DOMAIN}/${bucket}/${fileName}`;
}

export async function deleteFile(bucket: BucketName, fileName: string): Promise<void> {
	const r2 = getBucket(bucket);
	await r2.delete(fileName);
}

export async function getPresignedUrl(
	bucket: BucketName,
	fileName: string,
	_expirySeconds: number = 3600,
): Promise<string> {
	// R2 with public custom domain — buckets are public read, return direct URL.
	// For private buckets, swap in @aws-sdk/s3-request-presigner against R2 S3 API.
	return `${R2_PUBLIC_DOMAIN}/${bucket}/${fileName}`;
}

export async function getFileStream(
	bucket: BucketName,
	fileName: string,
): Promise<{ body: ReadableStream; contentType: string } | null> {
	const r2 = getBucket(bucket);
	const obj = await r2.get(fileName);
	if (!obj) return null;
	return {
		body: obj.body,
		contentType: obj.httpMetadata?.contentType ?? "application/octet-stream",
	};
}
