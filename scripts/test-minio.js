require("dotenv").config();
const Minio = require("minio");

const client = new Minio.Client({
	endPoint: process.env.MINIO_ENDPOINT || "localhost",
	port: parseInt(process.env.MINIO_PORT || "9000"),
	useSSL: process.env.MINIO_USE_SSL === "true",
	accessKey: process.env.MINIO_ACCESS_KEY || "",
	secretKey: process.env.MINIO_SECRET_KEY || "",
});

console.log("Testing MinIO connection...");
console.log(`Endpoint: ${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`);
console.log(`SSL: ${process.env.MINIO_USE_SSL}`);

client
	.listBuckets()
	.then((buckets) => {
		console.log("✅ Connection successful!");
		console.log(
			"Buckets:",
			buckets.map((b) => b.name),
		);
	})
	.catch((err) => {
		console.error("❌ Connection failed:", err.message);
		console.error("Error code:", err.code);
	});
