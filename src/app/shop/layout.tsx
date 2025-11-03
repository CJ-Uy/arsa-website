"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "@/lib/auth-client";
import { ThemeToggle } from "@/components/main/theme-toggle";
import { Button } from "@/components/ui/button";
import { LogOut, Package, Settings, Link2 } from "lucide-react";
import Link from "next/link";
import { CartCounter } from "@/components/features/cart-counter";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
	const { data: session } = useSession();
	const [userRoles, setUserRoles] = useState<{ isShopAdmin: boolean; isRedirectsAdmin: boolean }>({
		isShopAdmin: false,
		isRedirectsAdmin: false,
	});

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
		window.location.href = "/shop";
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
		<div className="flex min-h-screen flex-col">
			{/* Minimal header for shop */}
			<header className="bg-background/95 supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50 w-full border-b backdrop-blur">
				<div className="container flex h-16 items-center justify-between px-4">
					<Link href="/shop" className="flex items-center">
						<h1 className="text-xl font-bold">ARSA Shop</h1>
					</Link>

					<div className="flex items-center space-x-3">
						<ThemeToggle />

						{session?.user && (
							<>
								<CartCounter />

								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
											<Avatar className="h-9 w-9">
												<AvatarImage
													src={session.user.image || ""}
													alt={session.user.name || "User"}
												/>
												<AvatarFallback>{getInitials(session.user.name)}</AvatarFallback>
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
												<Package className="mr-2 h-4 w-4" />
												My Orders
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
					</div>
				</div>
			</header>

			{/* Main content */}
			<main className="flex-1">{children}</main>
		</div>
	);
}
