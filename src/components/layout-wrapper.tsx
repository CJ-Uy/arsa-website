"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { Header } from "@/components/main/Header";
import { Footer } from "@/components/main/Footer";
import { AnnouncementBanner } from "@/components/main/announcement-banner";

type Banner = {
	id: string;
	message: string;
	deadline: Date | null;
	isActive: boolean;
};

type LayoutWrapperProps = {
	children: React.ReactNode;
	banner?: Banner | null;
};

export function LayoutWrapper({ children, banner }: LayoutWrapperProps) {
	const pathname = usePathname();
	const isShopRoute = pathname?.startsWith("/shop") || pathname?.startsWith("/admin");
	const [isMinimized, setIsMinimized] = useState(false);

	useEffect(() => {
		if (banner?.id) {
			const minimized = localStorage.getItem(`banner-minimized-${banner.id}`);
			setIsMinimized(minimized === "true");
		}
	}, [banner?.id]);

	const handleMinimize = () => {
		setIsMinimized(true);
	};

	const handleMaximize = () => {
		setIsMinimized(false);
	};

	return (
		<div className="flex min-h-screen flex-col">
			{banner && banner.isActive && !isMinimized && (
				<AnnouncementBanner {...banner} onMinimize={handleMinimize} />
			)}
			{!isShopRoute && <Header />}
			<main className="flex-1">{children}</main>
			{!isShopRoute && <Footer />}
			{banner && banner.isActive && isMinimized && (
				<AnnouncementBanner {...banner} position="bottom" onMaximize={handleMaximize} />
			)}
		</div>
	);
}
