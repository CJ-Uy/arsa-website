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
};

export default nextConfig;
