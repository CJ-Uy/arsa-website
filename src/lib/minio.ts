import * as Minio from "minio";
import * as https from "https";

const minioPort = parseInt(process.env.MINIO_PORT || "9000");
const useSSL = process.env.MINIO_USE_SSL === "true";

// Create a custom HTTPS agent that accepts self-signed certificates
const httpsAgent = useSSL
	? new https.Agent({
			rejectUnauthorized: false, // Accept self-signed certificates
		})
	: undefined;

export const minioClient = new Minio.Client({
	endPoint: process.env.MINIO_ENDPOINT || "localhost",
	port: minioPort,
	useSSL: useSSL,
	accessKey: process.env.MINIO_ACCESS_KEY || "",
	secretKey: process.env.MINIO_SECRET_KEY || "",
	// Use custom HTTPS agent to handle SSL certificates
	transportAgent: httpsAgent,
});

// Bucket names (configurable via environment variables)
export const BUCKETS = {
	PRODUCTS: process.env.MINIO_BUCKET_PRODUCTS || "products",
	RECEIPTS: process.env.MINIO_BUCKET_RECEIPTS || "receipts",
	EVENTS: process.env.MINIO_BUCKET_EVENTS || "events",
};

// Initialize buckets
export async function initializeBuckets() {
	try {
		for (const bucketName of Object.values(BUCKETS)) {
			const exists = await minioClient.bucketExists(bucketName);
			if (!exists) {
				await minioClient.makeBucket(bucketName, "us-east-1");

				// Set bucket policy to allow read access for product images, receipts, and event images
				// These need to be publicly readable for OCR processing and display
				if (
					bucketName === BUCKETS.PRODUCTS ||
					bucketName === BUCKETS.RECEIPTS ||
					bucketName === BUCKETS.EVENTS
				) {
					const policy = {
						Version: "2012-10-17",
						Statement: [
							{
								Effect: "Allow",
								Principal: { AWS: ["*"] },
								Action: ["s3:GetObject"],
								Resource: [`arn:aws:s3:::${bucketName}/*`],
							},
						],
					};
					await minioClient.setBucketPolicy(bucketName, JSON.stringify(policy));
				}
			}
		}
		console.log("MinIO buckets initialized");
	} catch (error) {
		console.error("Error initializing MinIO buckets:", error);
	}
}

// Upload file to MinIO
export async function uploadFile(
	bucket: string,
	fileName: string,
	fileBuffer: Buffer,
	contentType: string,
): Promise<string> {
	try {
		const metadata = {
			"Content-Type": contentType,
		};

		await minioClient.putObject(bucket, fileName, fileBuffer, fileBuffer.length, metadata);

		// Generate URL
		const protocol = useSSL ? "https" : "http";
		const endpoint = process.env.MINIO_ENDPOINT || "localhost";

		// Don't include port if using standard ports (80 for HTTP, 443 for HTTPS)
		const port = minioPort;
		const shouldIncludePort = (useSSL && port !== 443) || (!useSSL && port !== 80);
		const portPart = shouldIncludePort ? `:${port}` : "";

		const url = `${protocol}://${endpoint}${portPart}/${bucket}/${fileName}`;

		return url;
	} catch (error: any) {
		console.error("Error uploading file to MinIO:", error);
		// Provide more detailed error message
		if (error.code === "ETIMEDOUT" || error.code === "ECONNREFUSED") {
			throw new Error(
				`Cannot connect to MinIO server at ${process.env.MINIO_ENDPOINT}:${minioPort}. Please check if MinIO is running and accessible.`,
			);
		}
		throw new Error(`Failed to upload file: ${error.message || "Unknown error"}`);
	}
}

// Delete file from MinIO
export async function deleteFile(bucket: string, fileName: string): Promise<void> {
	try {
		await minioClient.removeObject(bucket, fileName);
	} catch (error) {
		console.error("Error deleting file from MinIO:", error);
		throw new Error("Failed to delete file");
	}
}

// Get file URL (for private access with presigned URL)
export async function getPresignedUrl(
	bucket: string,
	fileName: string,
	expirySeconds: number = 3600,
): Promise<string> {
	try {
		return await minioClient.presignedGetObject(bucket, fileName, expirySeconds);
	} catch (error) {
		console.error("Error generating presigned URL:", error);
		throw new Error("Failed to generate URL");
	}
}
