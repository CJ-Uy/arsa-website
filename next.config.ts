import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	output: "standalone",
	eslint: {
		// Allows production builds to successfully complete with ESLint errors.
		ignoreDuringBuilds: true,
	},
};

export default nextConfig;
