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
		// Enable optimized package imports for smaller bundles
		optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
	},
	// Compiler optimizations
	compiler: {
		// Remove console logs in production for better performance
		removeConsole:
			process.env.NODE_ENV === "production"
				? {
						exclude: ["error", "warn"],
					}
				: false,
	},
	// Image optimization configuration
	images: {
		// Disable Next.js image optimization to reduce server load
		// Images are pre-optimized at upload time using sharp
		unoptimized: true,
		remotePatterns: [
			{
				protocol: "https",
				hostname: "minio-s3.ateneoarsa.org",
				pathname: "/**",
			},
			{
				protocol: "http",
				hostname: "minio-s3.ateneoarsa.org",
				pathname: "/**",
			},
			{
				protocol: "http",
				hostname: "localhost",
				pathname: "/**",
			},
			{
				protocol: "https",
				hostname: "localhost",
				pathname: "/**",
			},
		],
	},
};

export default nextConfig;
