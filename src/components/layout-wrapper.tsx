"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
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

	// Header visibility: hidden until user scrolls past the major event section
	const hasMajorEvent = isHomePage && !!activeMajorEvent;
	const [headerRevealed, setHeaderRevealed] = useState(!hasMajorEvent);

	// Track scroll position — reveal header when the major event sentinel is passed
	const handleMajorEventScrollEnd = useCallback(() => {
		setHeaderRevealed(true);
	}, []);

	// Also listen to scroll position for the sticky reveal effect
	useEffect(() => {
		if (!hasMajorEvent) {
			setHeaderRevealed(true);
			return;
		}

		function onScroll() {
			const sentinel = document.getElementById("major-event-end");
			if (!sentinel) return;
			const rect = sentinel.getBoundingClientRect();
			// Reveal header once the sentinel is at or above the top of the viewport
			if (rect.top <= 0) {
				setHeaderRevealed(true);
			} else {
				setHeaderRevealed(false);
			}
		}

		window.addEventListener("scroll", onScroll, { passive: true });
		onScroll(); // check initial position
		return () => window.removeEventListener("scroll", onScroll);
	}, [hasMajorEvent]);

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
				<div
					className={`transition-transform duration-500 ease-out ${
						headerRevealed
							? "translate-y-0"
							: "-translate-y-full"
					}`}
					style={{ position: headerRevealed ? "sticky" : "fixed", top: 0, zIndex: 50, width: "100%" }}
				>
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
