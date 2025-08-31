"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/main/theme-toggle";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const navigation = [
	{ name: "Home", href: "/" },
	{ name: "About", href: "/about" },
	{ name: "Calendar", href: "/calendar" },
	{ name: "Bridges", href: "/publications" },
	{ name: "Merch", href: "/merch" },
	{ name: "Resources", href: "/resources" },
	{ name: "Contact Us", href: "/contact" },
];

export function Header() {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const pathname = usePathname();

	return (
		<header className="border-primary/20 bg-primary text-primary-foreground sticky top-0 z-50 w-full border-b">
			<div className="flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-8">
				{/* Logo */}
				<div className="flex items-center">
					<Link href="/" className="flex items-center">
						<div className="relative h-12 w-12">
							<Image
								src="/images/logo.png"
								alt="ARSA Logo"
								fill
								className="object-contain"
								priority
							/>
						</div>
					</Link>
				</div>

				{/* Desktop Navigation */}
				<nav className="hidden items-center space-x-6 md:flex">
					{navigation.map((item) => (
						<Link
							key={item.name}
							href={item.href}
							className={cn(
								"hover:text-primary-foreground/80 text-sm font-medium transition-colors",
								pathname === item.href ? "text-primary-foreground" : "text-primary-foreground/70",
							)}
						>
							{item.name}
						</Link>
					))}
				</nav>

				{/* Right side - Theme toggle and mobile menu button */}
				<div className="flex items-center space-x-4">
					<ThemeToggle />

					{/* Mobile menu button */}
					<Button
						variant="ghost"
						size="sm"
						className="text-primary-foreground hover:bg-primary-foreground/10 md:hidden"
						onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
					>
						{mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
					</Button>
				</div>
			</div>

			{/* Mobile Navigation */}
			{mobileMenuOpen && (
				<div className="border-primary-foreground/20 bg-primary border-t md:hidden">
					<div className="w-full space-y-3 px-4 py-4 sm:px-6 lg:px-8">
						{navigation.map((item) => (
							<Link
								key={item.name}
								href={item.href}
								className={cn(
									"hover:text-primary-foreground/80 block py-2 text-sm font-medium transition-colors",
									pathname === item.href ? "text-primary-foreground" : "text-primary-foreground/70",
								)}
								onClick={() => setMobileMenuOpen(false)}
							>
								{item.name}
							</Link>
						))}
					</div>
				</div>
			)}
		</header>
	);
}
