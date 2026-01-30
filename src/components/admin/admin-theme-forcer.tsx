"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";

/**
 * Forces light mode theme when on admin pages (/admin/* or /redirects/*)
 * Only changes theme when navigating between admin and non-admin pages
 * Allows manual theme toggling while staying on the same page type
 */
export function AdminThemeForcer() {
	const { setTheme } = useTheme();
	const pathname = usePathname();
	const lastPageTypeRef = useRef<"admin" | "other" | null>(null);

	useEffect(() => {
		const isAdminPage = pathname.startsWith("/admin") || pathname.startsWith("/redirects");
		const currentPageType = isAdminPage ? "admin" : "other";

		// Only force theme change when switching between admin and non-admin areas
		if (lastPageTypeRef.current !== currentPageType) {
			if (isAdminPage) {
				setTheme("light");
			} else {
				setTheme("dark");
			}
			lastPageTypeRef.current = currentPageType;
		}
	}, [pathname, setTheme]);

	return null; // This component doesn't render anything
}
