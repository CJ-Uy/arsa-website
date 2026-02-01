"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState, useTransition } from "react";
import {
	Loader2,
	ShoppingCart,
	Package,
	Gift,
	CalendarHeart,
	Megaphone,
	Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
	href: string;
	label: string;
	icon: React.ReactNode;
};

const iconMap = {
	orders: ShoppingCart,
	products: Package,
	packages: Gift,
	events: CalendarHeart,
	banner: Megaphone,
	settings: Settings,
} as const;

type AdminNavProps = {
	items: Array<{
		href: string;
		label: string;
		iconKey: keyof typeof iconMap;
	}>;
};

export function AdminNav({ items }: AdminNavProps) {
	const pathname = usePathname();
	const [loadingPath, setLoadingPath] = useState<string | null>(null);

	const handleClick = (href: string) => {
		if (href !== pathname) {
			setLoadingPath(href);
		}
	};

	// Reset loading state when pathname changes
	if (loadingPath && pathname === loadingPath) {
		setLoadingPath(null);
	}

	return (
		<div className="mb-8 flex flex-wrap gap-2">
			{items.map((item) => {
				const Icon = iconMap[item.iconKey];
				const isActive = pathname === item.href;
				const isLoading = loadingPath === item.href;

				return (
					<Link key={item.href} href={item.href} onClick={() => handleClick(item.href)}>
						<Button
							variant={isActive ? "default" : "outline"}
							size="sm"
							disabled={isLoading}
							className={cn(
								"transition-all duration-200",
								isActive && "ring-primary ring-2 ring-offset-2",
								isLoading && "opacity-70",
							)}
						>
							{isLoading ? (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							) : (
								<Icon className="mr-2 h-4 w-4" />
							)}
							{item.label}
						</Button>
					</Link>
				);
			})}
		</div>
	);
}
