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
	try {
		banner = await prisma.banner.findFirst({
			where: { isActive: true },
			orderBy: { updatedAt: "desc" },
		});
	} catch (error) {
		// Database not available during build or no banner exists
		console.log("Banner fetch skipped:", error instanceof Error ? error.message : "Unknown error");
	}

	return (
		<html lang="en" suppressHydrationWarning>
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
				<ThemeProvider
					attribute="class"
					defaultTheme="light"
					enableSystem
					disableTransitionOnChange
				>
					<LayoutWrapper banner={banner}>{children}</LayoutWrapper>
					<Toaster position="top-center" />
				</ThemeProvider>
			</body>
		</html>
	);
}
