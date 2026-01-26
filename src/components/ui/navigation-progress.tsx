"use client";

import { useEffect, useState, useTransition } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function NavigationProgress() {
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const [isNavigating, setIsNavigating] = useState(false);
	const [progress, setProgress] = useState(0);

	useEffect(() => {
		// Reset when navigation completes
		setIsNavigating(false);
		setProgress(100);

		const timeout = setTimeout(() => {
			setProgress(0);
		}, 200);

		return () => clearTimeout(timeout);
	}, [pathname, searchParams]);

	// Listen for link clicks to detect navigation start
	useEffect(() => {
		const handleClick = (e: MouseEvent) => {
			const target = e.target as HTMLElement;
			const link = target.closest("a");

			if (link) {
				const href = link.getAttribute("href");
				// Only show progress for internal navigation
				if (href && href.startsWith("/") && href !== pathname) {
					setIsNavigating(true);
					setProgress(0);

					// Simulate progress
					let currentProgress = 0;
					const interval = setInterval(() => {
						currentProgress += Math.random() * 15;
						if (currentProgress >= 90) {
							clearInterval(interval);
							setProgress(90);
						} else {
							setProgress(currentProgress);
						}
					}, 100);

					// Cleanup interval on navigation complete
					const cleanup = () => {
						clearInterval(interval);
					};

					// Store cleanup in a way we can access it
					(window as Window & { __navCleanup?: () => void }).__navCleanup = cleanup;
				}
			}
		};

		const handleBeforeUnload = () => {
			const cleanup = (window as Window & { __navCleanup?: () => void }).__navCleanup;
			if (cleanup) cleanup();
		};

		document.addEventListener("click", handleClick);
		window.addEventListener("beforeunload", handleBeforeUnload);

		return () => {
			document.removeEventListener("click", handleClick);
			window.removeEventListener("beforeunload", handleBeforeUnload);
			const cleanup = (window as Window & { __navCleanup?: () => void }).__navCleanup;
			if (cleanup) cleanup();
		};
	}, [pathname]);

	if (!isNavigating && progress === 0) return null;

	return (
		<div className="fixed top-0 right-0 left-0 z-[100] h-1">
			<div
				className="h-full bg-gradient-to-r from-blue-500 via-blue-600 to-blue-500 transition-all duration-300 ease-out"
				style={{
					width: `${progress}%`,
					boxShadow: isNavigating ? "0 0 10px rgba(59, 130, 246, 0.7)" : "none",
				}}
			/>
		</div>
	);
}
