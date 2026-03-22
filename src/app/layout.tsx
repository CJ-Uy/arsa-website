import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/main/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { LayoutWrapper } from "@/components/layout-wrapper";
import { prisma } from "@/lib/prisma";

const geistSans = localFont({
	src: [
		{
			path: "../../public/fonts/geist/Geist-Regular.woff2",
			weight: "400",
			style: "normal",
		},
		{
			path: "../../public/fonts/geist/Geist-Medium.woff2",
			weight: "500",
			style: "normal",
		},
		{
			path: "../../public/fonts/geist/Geist-SemiBold.woff2",
			weight: "600",
			style: "normal",
		},
		{
			path: "../../public/fonts/geist/Geist-Bold.woff2",
			weight: "700",
			style: "normal",
		},
	],
	variable: "--font-geist-sans",
});

const gentlemensScript = localFont({
	src: [
		{
			path: "../../public/fonts/gentlemens-script/Gentlemens Script.otf",
			weight: "400",
			style: "normal",
		},
	],
	variable: "--font-gentlemens-script",
});

const farmToMarket = localFont({
	src: [
		{
			path: "../../public/fonts/farm_to_market/Farm to Market.ttf",
			weight: "400",
			style: "normal",
		},
		{
			path: "../../public/fonts/farm_to_market/Farm to Market Bold Demo.ttf",
			weight: "700",
			style: "normal",
		},
	],
	variable: "--font-farm-to-market",
});

const geistMono = localFont({
	src: [
		{
			path: "../../public/fonts/geist/GeistMono-Regular.woff2",
			weight: "400",
			style: "normal",
		},
		{
			path: "../../public/fonts/geist/GeistMono-Medium.woff2",
			weight: "500",
			style: "normal",
		},
		{
			path: "../../public/fonts/geist/GeistMono-SemiBold.woff2",
			weight: "600",
			style: "normal",
		},
		{
			path: "../../public/fonts/geist/GeistMono-Bold.woff2",
			weight: "700",
			style: "normal",
		},
	],
	variable: "--font-geist-mono",
});

export const metadata: Metadata = {
	title: "ARSA Website",
	description: "Official website for ARSA - It's Good to be Home",
	keywords: ["dorm", "university", "student housing", "ARSA"],
	icons: {
		icon: "/images/favicon.png", // /public path
	},
};

export default async function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	// Fetch active banner (gracefully handle DB unavailability during build)
	let banner = null;
	let activeMajorEvent: string | null = null;
	try {
		banner = await prisma.banner.findFirst({
			where: { isActive: true },
			orderBy: { updatedAt: "desc" },
		});
	} catch (error) {
		// Database not available during build or no banner exists
		console.log("Banner fetch skipped:", error instanceof Error ? error.message : "Unknown error");
	}

	// Fetch active major event for homepage
	try {
		const setting = await prisma.siteContent.findUnique({
			where: { key: "homepage-active-major-event" },
		});
		if (
			setting?.data &&
			typeof setting.data === "object" &&
			"slug" in (setting.data as Record<string, unknown>)
		) {
			activeMajorEvent = (setting.data as { slug: string }).slug || null;
		}
	} catch {
		// No active major event
	}

	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${geistSans.variable} ${geistMono.variable} ${gentlemensScript.variable} ${farmToMarket.variable} antialiased`}
			>
				<ThemeProvider
					attribute="class"
					defaultTheme="light"
					enableSystem
					disableTransitionOnChange
				>
					<LayoutWrapper banner={banner} activeMajorEvent={activeMajorEvent}>
						{children}
					</LayoutWrapper>
					<Toaster position="top-center" />
				</ThemeProvider>
			</body>
		</html>
	);
}
