import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
	eslint: {
		ignoreDuringBuilds: true,
	},
	typescript: {
		ignoreBuildErrors: true,
	},
	experimental: {
		webpackMemoryOptimizations: true,
		optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
	},
	compiler: {
		removeConsole:
			process.env.NODE_ENV === "production"
				? {
						exclude: ["error", "warn"],
					}
				: false,
	},
	images: {
		unoptimized: true,
		remotePatterns: [
			{ protocol: "https", hostname: "r2.ateneoarsa.org", pathname: "/**" },
			{ protocol: "https", hostname: "*.r2.dev", pathname: "/**" },
			{ protocol: "https", hostname: "minio-s3.ateneoarsa.org", pathname: "/**" },
			{ protocol: "http", hostname: "localhost", pathname: "/**" },
			{ protocol: "https", hostname: "localhost", pathname: "/**" },
		],
	},
};

export default nextConfig;
