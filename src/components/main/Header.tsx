"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/main/theme-toggle";
import { Menu, X, ShoppingCart, Package, LogOut, Settings } from "lucide-react";
import { CartCounter } from "@/components/features/cart-counter";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useSession, signOut } from "@/lib/auth-client";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const navigation = [
	{ name: "Home", href: "/" },
	{ name: "FAQ", href: "/faq" },
	{ name: "About", href: "/about" },
	{ name: "Bridges", href: "/publications" },
	{ name: "Shop", href: "/shop" },
	{ name: "Contact Us", href: "/contact" },
];

export function Header() {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [userRoles, setUserRoles] = useState<{
		isShopAdmin: boolean;
		isEventsAdmin: boolean;
		isRedirectsAdmin: boolean;
	}>({
		isShopAdmin: false,
		isEventsAdmin: false,
		isRedirectsAdmin: false,
	});
	const pathname = usePathname();
	const { data: session } = useSession();

	// Fetch user roles from the database
	useEffect(() => {
		if (session?.user) {
			fetch("/api/user/roles")
				.then((res) => res.json())
				.then((data) => {
					if (data.success) {
						setUserRoles(data.roles);
					}
				})
				.catch(() => {
					// Silently fail if endpoint doesn't exist yet
				});
		}
	}, [session]);

	const handleSignOut = async () => {
		await signOut();
		window.location.href = "/";
	};

	const getInitials = (name?: string | null) => {
		if (!name) return "U";
		return name
			.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase()
			.slice(0, 2);
	};

	const isShopRoute = pathname?.startsWith("/shop");

	return (
		<header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
			<div className="flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-8">
				{/* Logo */}
				<div className="flex items-center">
					<Link href="/" className="flex items-center">
						<Image
							src="/images/logo.png"
							alt="ARSA Logo"
							width={48}
							height={48}
							className="h-12 w-12 object-contain"
							priority
						/>
					</Link>
				</div>

				{/* Desktop Navigation */}
				<nav className="hidden items-center space-x-6 md:flex">
					{navigation.map((item) => (
						<Link
							key={item.name}
							href={item.href}
							className={cn(
								"hover:text-foreground/80 text-sm font-medium transition-colors",
								pathname === item.href ? "text-foreground" : "text-foreground/70",
							)}
						>
							{item.name}
						</Link>
					))}
				</nav>

				{/* Right side - Theme toggle, Cart, User Profile */}
				<div className="flex items-center space-x-3">
					<ThemeToggle />

					{session?.user && (
						<>
							{isShopRoute && <CartCounter />}

							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
										<Avatar className="h-9 w-9">
											<AvatarImage
												src={session.user.image || ""}
												alt={session.user.name || "User"}
											/>
											<AvatarFallback className="bg-muted">
												{getInitials(session.user.name)}
											</AvatarFallback>
										</Avatar>
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end" className="w-56">
									<DropdownMenuLabel>
										<div className="flex flex-col space-y-1">
											<p className="text-sm leading-none font-medium">{session.user.name}</p>
											<p className="text-muted-foreground text-xs leading-none">
												{session.user.email}
											</p>
										</div>
									</DropdownMenuLabel>
									<DropdownMenuSeparator />
									<DropdownMenuItem asChild>
										<Link href="/shop/cart" className="cursor-pointer">
											<ShoppingCart className="mr-2 h-4 w-4" />
											My Cart
										</Link>
									</DropdownMenuItem>
									<DropdownMenuItem asChild>
										<Link href="/shop/orders" className="cursor-pointer">
											<Package className="mr-2 h-4 w-4" />
											My Orders
										</Link>
									</DropdownMenuItem>
									{(userRoles.isShopAdmin ||
										userRoles.isEventsAdmin ||
										userRoles.isRedirectsAdmin) && (
										<>
											<DropdownMenuSeparator />
											<DropdownMenuItem asChild>
												<Link href="/admin" className="cursor-pointer">
													<Settings className="mr-2 h-4 w-4" />
													Admin Dashboard
												</Link>
											</DropdownMenuItem>
										</>
									)}
									<DropdownMenuSeparator />
									<DropdownMenuItem
										onClick={handleSignOut}
										className="cursor-pointer text-red-600 focus:text-red-600"
									>
										<LogOut className="mr-2 h-4 w-4" />
										Sign Out
									</DropdownMenuItem>
								</DropdownMenuContent>
							</DropdownMenu>
						</>
					)}

					{/* Mobile menu button */}
					<Button
						variant="ghost"
						size="sm"
						className="md:hidden"
						onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
					>
						{mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
					</Button>
				</div>
			</div>

			{/* Mobile Navigation */}
			{mobileMenuOpen && (
				<div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 border-t backdrop-blur md:hidden">
					<div className="w-full space-y-3 px-4 py-4 sm:px-6 lg:px-8">
						{navigation.map((item) => (
							<Link
								key={item.name}
								href={item.href}
								className={cn(
									"hover:text-foreground/80 block py-2 text-sm font-medium transition-colors",
									pathname === item.href ? "text-foreground" : "text-foreground/70",
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
