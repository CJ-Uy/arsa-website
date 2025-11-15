import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/main/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { LayoutWrapper } from "@/components/layout-wrapper";
import { prisma } from "@/lib/prisma";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
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
	// Fetch active banner
	const banner = await prisma.banner.findFirst({
		where: { isActive: true },
		orderBy: { updatedAt: "desc" },
	});

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
