import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	output: "standalone",
	eslint: {
		// Allows production builds to successfully complete with ESLint errors.
		ignoreDuringBuilds: true,
	},
	typescript: {
		// Skip type checking during build (we do it separately)
		ignoreBuildErrors: true,
	},
	// Optimize build performance
	experimental: {
		// Reduce memory usage during build
		webpackMemoryOptimizations: true,
	},
	// Image optimization configuration
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "minio-s3.ateneoarsa.org",
				pathname: "/**",
			},
		],
		formats: ["image/webp", "image/avif"],
	},
};

export default nextConfig;
