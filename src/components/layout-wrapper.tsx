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
	activeMajorEvent?: string | null;
};

export function LayoutWrapper({ children, banner, activeMajorEvent }: LayoutWrapperProps) {
	const pathname = usePathname();
	const isHomePage = pathname === "/";
	const isAdminRoute = pathname?.startsWith("/admin") || pathname?.startsWith("/ticket-verify");
	const hideDefaultLayout = isAdminRoute;
	const [isMinimized, setIsMinimized] = useState(false);

	// Header is always visible and sticky now
	const headerRevealed = true;

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

	const showHeader = !hideDefaultLayout;

	return (
		<div className="flex min-h-screen flex-col">
			{banner && banner.isActive && !isMinimized && headerRevealed && (
				<AnnouncementBanner {...banner} onMinimize={handleMinimize} />
			)}
			{showHeader && (
				<div className="sticky top-0 z-50 w-full">
					<Header />
				</div>
			)}
			<main className="flex-1">{children}</main>
			{!hideDefaultLayout && <Footer />}
			{banner && banner.isActive && isMinimized && (
				<AnnouncementBanner {...banner} position="bottom" onMaximize={handleMaximize} />
			)}
		</div>
	);
}
