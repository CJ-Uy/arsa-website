import { getCloudflareContext } from "@opennextjs/cloudflare";

export const BUCKETS = {
	PRODUCTS: "products",
	RECEIPTS: "receipts",
	EVENTS: "events",
	CONTENT: "content",
} as const;

type BucketName = (typeof BUCKETS)[keyof typeof BUCKETS] | string;

function getBucket(): R2Bucket {
	const ctx = getCloudflareContext();
	const env = ctx.env as unknown as { BUCKET: R2Bucket };
	return env.BUCKET;
}

const R2_PUBLIC_DOMAIN = process.env.R2_PUBLIC_DOMAIN || "https://r2.ateneoarsa.org";

export async function initializeBuckets(): Promise<void> {
	// No-op on R2 — bucket is provisioned via wrangler / dashboard.
}

export async function uploadFile(
	bucket: BucketName,
	fileName: string,
	fileBuffer: ArrayBuffer | Uint8Array | Buffer,
	contentType: string,
): Promise<string> {
	const r2 = getBucket();
	const key = `${bucket}/${fileName}`;
	const body =
		fileBuffer instanceof ArrayBuffer
			? fileBuffer
			: fileBuffer instanceof Uint8Array
				? fileBuffer
				: new Uint8Array(fileBuffer);

	await r2.put(key, body, { httpMetadata: { contentType } });

	return `${R2_PUBLIC_DOMAIN}/${key}`;
}

export async function deleteFile(bucket: BucketName, fileName: string): Promise<void> {
	const r2 = getBucket();
	await r2.delete(`${bucket}/${fileName}`);
}

export async function getPresignedUrl(
	bucket: BucketName,
	fileName: string,
	_expirySeconds: number = 3600,
): Promise<string> {
	return `${R2_PUBLIC_DOMAIN}/${bucket}/${fileName}`;
}

export async function getFileStream(
	bucket: BucketName,
	fileName: string,
): Promise<{ body: ReadableStream; contentType: string } | null> {
	const r2 = getBucket();
	const obj = await r2.get(`${bucket}/${fileName}`);
	if (!obj) return null;
	return {
		body: obj.body,
		contentType: obj.httpMetadata?.contentType ?? "application/octet-stream",
	};
}
