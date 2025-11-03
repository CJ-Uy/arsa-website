require("dotenv").config();
const Minio = require("minio");

const client = new Minio.Client({
	endPoint: process.env.MINIO_ENDPOINT || "localhost",
	port: parseInt(process.env.MINIO_PORT || "9000"),
	useSSL: process.env.MINIO_USE_SSL === "true",
	accessKey: process.env.MINIO_ACCESS_KEY || "",
	secretKey: process.env.MINIO_SECRET_KEY || "",
});

async function setupBuckets() {
	console.log("Setting up MinIO buckets...\n");

	try {
		// Make products bucket public (read-only)
		console.log("Setting products bucket to public (read-only)...");
		const productsPolicy = {
			Version: "2012-10-17",
			Statement: [
				{
					Effect: "Allow",
					Principal: { AWS: ["*"] },
					Action: ["s3:GetObject"],
					Resource: ["arn:aws:s3:::products/*"],
				},
			],
		};

		await client.setBucketPolicy("products", JSON.stringify(productsPolicy));
		console.log("✅ Products bucket is now public (read-only)\n");

		// Verify receipts bucket is private (no policy = private)
		console.log("Checking receipts bucket...");
		try {
			const receiptsPolicy = await client.getBucketPolicy("receipts");
			if (receiptsPolicy) {
				console.log("⚠️  Receipts bucket has a policy. Removing it to make it private...");
				await client.setBucketPolicy("receipts", "");
				console.log("✅ Receipts bucket is now private\n");
			}
		} catch (err) {
			if (err.code === "NoSuchBucketPolicy") {
				console.log("✅ Receipts bucket is already private (no policy)\n");
			} else {
				throw err;
			}
		}

		console.log("✅ All done! Bucket configuration:");
		console.log("  - products: PUBLIC (read-only)");
		console.log("  - receipts: PRIVATE");
	} catch (error) {
		console.error("❌ Error setting up buckets:", error.message);
		process.exit(1);
	}
}

setupBuckets();
