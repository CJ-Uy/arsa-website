"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

type BannerProps = {
	id: string;
	message: string;
	deadline: Date | null;
	position?: "top" | "bottom";
	onMinimize?: () => void;
	onMaximize?: () => void;
};

export function AnnouncementBanner({
	id,
	message,
	deadline,
	position = "top",
	onMinimize,
	onMaximize,
}: BannerProps) {
	const [isVisible, setIsVisible] = useState(false);
	const [timeLeft, setTimeLeft] = useState<string>("");

	useEffect(() => {
		setIsVisible(true);
	}, [id]);

	useEffect(() => {
		if (!deadline) return;

		const calculateTimeLeft = () => {
			const now = new Date().getTime();
			const deadlineTime = new Date(deadline).getTime();
			const difference = deadlineTime - now;

			if (difference <= 0) {
				setTimeLeft("Closed");
				return;
			}

			const days = Math.floor(difference / (1000 * 60 * 60 * 24));
			const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
			const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
			const seconds = Math.floor((difference % (1000 * 60)) / 1000);

			if (days > 0) {
				setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
			} else if (hours > 0) {
				setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
			} else if (minutes > 0) {
				setTimeLeft(`${minutes}m ${seconds}s`);
			} else {
				setTimeLeft(`${seconds}s`);
			}
		};

		calculateTimeLeft();
		const interval = setInterval(calculateTimeLeft, 1000);

		return () => clearInterval(interval);
	}, [deadline]);

	const handleMinimize = () => {
		localStorage.setItem(`banner-minimized-${id}`, "true");
		onMinimize?.();
	};

	const handleMaximize = () => {
		localStorage.removeItem(`banner-minimized-${id}`);
		onMaximize?.();
	};

	if (!isVisible) return null;

	// Replace {timer} placeholder with actual countdown
	const displayMessage =
		deadline && timeLeft
			? message.replace(/\{timer\}/g, timeLeft)
			: message.replace(/\{timer\}/g, "");

	// Show minimized version at bottom when position is bottom
	if (position === "bottom") {
		return (
			<div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-white shadow-lg">
				<div className="container mx-auto text-center">
					<p className="text-xs font-medium md:text-sm">{displayMessage}</p>
				</div>
			</div>
		);
	}

	// Show full version at top
	return (
		<div className="relative bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-3 text-white shadow-md">
			<div className="container mx-auto flex items-center justify-between gap-4">
				<div className="flex-1 text-center">
					<p className="text-sm font-medium md:text-base">{displayMessage}</p>
				</div>
				<Button
					variant="ghost"
					size="icon"
					className="h-6 w-6 shrink-0 hover:bg-white/20"
					onClick={handleMinimize}
					title="Minimize to bottom"
				>
					<X className="h-4 w-4" />
					<span className="sr-only">Minimize banner</span>
				</Button>
			</div>
		</div>
	);
}
