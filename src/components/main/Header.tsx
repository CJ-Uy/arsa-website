"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/main/theme-toggle";
import { Menu, X, ShoppingCart, User, LogOut, Settings, Link2 } from "lucide-react";
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
	{ name: "About", href: "/about" },
	{ name: "Calendar", href: "/calendar" },
	{ name: "Bridges", href: "/publications" },
	{ name: "Merch", href: "/merch" },
	{ name: "Shop", href: "/shop" },
	{ name: "Resources", href: "/resources" },
	{ name: "Contact Us", href: "/contact" },
];

export function Header() {
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
	const [userRoles, setUserRoles] = useState<{ isShopAdmin: boolean; isRedirectsAdmin: boolean }>({
		isShopAdmin: false,
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

	return (
		<header className="border-primary/20 bg-primary text-primary-foreground sticky top-0 z-50 w-full border-b">
			<div className="flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-8">
				{/* Logo */}
				<div className="flex items-center">
					<Link href="/" className="flex items-center">
						<img src="/images/logo.png" alt="ARSA Logo" className="h-12 w-12 object-contain" />
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

				{/* Right side - Theme toggle, Cart, User Profile */}
				<div className="flex items-center space-x-3">
					<ThemeToggle />

					{session?.user && (
						<>
							<Link href="/shop/cart">
								<Button
									variant="ghost"
									size="sm"
									className="text-primary-foreground hover:bg-primary-foreground/10 hidden md:flex"
								>
									<ShoppingCart className="h-5 w-5" />
								</Button>
							</Link>

							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
										<Avatar className="h-9 w-9">
											<AvatarImage
												src={session.user.image || ""}
												alt={session.user.name || "User"}
											/>
											<AvatarFallback className="bg-primary-foreground text-primary">
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
										<Link href="/shop/orders" className="cursor-pointer">
											<ShoppingCart className="mr-2 h-4 w-4" />
											My Orders
										</Link>
									</DropdownMenuItem>
									<DropdownMenuItem asChild>
										<Link href="/shop/cart" className="cursor-pointer md:hidden">
											<ShoppingCart className="mr-2 h-4 w-4" />
											Cart
										</Link>
									</DropdownMenuItem>
									{(userRoles.isShopAdmin || userRoles.isRedirectsAdmin) && (
										<>
											<DropdownMenuSeparator />
											{userRoles.isShopAdmin && (
												<DropdownMenuItem asChild>
													<Link href="/admin" className="cursor-pointer">
														<Settings className="mr-2 h-4 w-4" />
														Shop Admin
													</Link>
												</DropdownMenuItem>
											)}
											{userRoles.isRedirectsAdmin && (
												<DropdownMenuItem asChild>
													<Link href="/redirects" className="cursor-pointer">
														<Link2 className="mr-2 h-4 w-4" />
														Redirects Admin
													</Link>
												</DropdownMenuItem>
											)}
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
