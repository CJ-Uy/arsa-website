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
		// Ensure serverComponentsExternalPackages includes tesseract.js
		serverComponentsExternalPackages: ["tesseract.js"],
	},
	// Configure webpack for Tesseract.js worker files
	webpack: (config, { isServer }) => {
		if (isServer) {
			// Ensure Tesseract.js worker files are available
			config.resolve.alias = {
				...config.resolve.alias,
				canvas: false,
			};
		}
		return config;
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
