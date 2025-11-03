"use client";

import { usePathname } from "next/navigation";
import { Header } from "@/components/main/Header";
import { Footer } from "@/components/main/Footer";

export function LayoutWrapper({ children }: { children: React.ReactNode }) {
	const pathname = usePathname();
	const isShopRoute = pathname?.startsWith("/shop") || pathname?.startsWith("/admin");

	return (
		<div className="flex min-h-screen flex-col">
			{!isShopRoute && <Header />}
			<main className="flex-1">{children}</main>
			{!isShopRoute && <Footer />}
		</div>
	);
}
