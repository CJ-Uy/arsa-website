import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Package, ArrowLeft, Megaphone, CalendarHeart, Gift } from "lucide-react";
import { Unauthorized } from "./unauthorized";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		return <Unauthorized isLoggedIn={false} />;
	}

	// Check user permissions - shop admin OR events admin (global or event-specific)
	const user = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: {
			isShopAdmin: true,
			isEventsAdmin: true,
			eventAdmins: {
				select: { eventId: true },
			},
		},
	});

	const isShopAdmin = user?.isShopAdmin ?? false;
	const isEventsAdmin = user?.isEventsAdmin ?? false;
	const hasEventAssignments = (user?.eventAdmins?.length ?? 0) > 0;
	const canAccessEvents = isShopAdmin || isEventsAdmin || hasEventAssignments;

	// Must have at least one admin permission to access
	if (!isShopAdmin && !canAccessEvents) {
		return <Unauthorized isLoggedIn={true} />;
	}

	return (
		<div className="min-h-screen">
			{/* Shop Header */}
			<header className="border-b">
				<div className="container mx-auto flex items-center justify-between px-4 py-4">
					<Link
						href="/shop"
						className="flex items-center gap-3 transition-opacity hover:opacity-80"
					>
						<img src="/images/logo.png" alt="ARSA Logo" className="h-12 w-12 object-contain" />
						<h1 className="text-xl font-bold">ARSA Shop</h1>
					</Link>
					<Link href="/shop">
						<Button variant="ghost" size="sm">
							<ArrowLeft className="mr-2 h-4 w-4" />
							Back to Shop
						</Button>
					</Link>
				</div>
			</header>

			{/* Admin Dashboard Content */}
			<div className="container mx-auto px-4 py-10">
				<div className="mb-8">
					<h1 className="mb-2 text-4xl font-bold">
						{isShopAdmin ? "Admin Dashboard" : "Events Dashboard"}
					</h1>
					<p className="text-muted-foreground">
						{isShopAdmin ? "Manage orders, products, and events" : "Manage your assigned events"}
					</p>
				</div>

				<div className="mb-8 flex flex-wrap gap-2">
					{isShopAdmin && (
						<>
							<Link href="/admin/orders">
								<Button variant="outline" size="sm">
									<ShoppingCart className="mr-2 h-4 w-4" />
									Orders
								</Button>
							</Link>
							<Link href="/admin/products">
								<Button variant="outline" size="sm">
									<Package className="mr-2 h-4 w-4" />
									Products
								</Button>
							</Link>
							<Link href="/admin/packages">
								<Button variant="outline" size="sm">
									<Gift className="mr-2 h-4 w-4" />
									Packages
								</Button>
							</Link>
						</>
					)}
					{canAccessEvents && (
						<Link href="/admin/events">
							<Button variant="outline" size="sm">
								<CalendarHeart className="mr-2 h-4 w-4" />
								Events
							</Button>
						</Link>
					)}
					{isShopAdmin && (
						<Link href="/admin/banner">
							<Button variant="outline" size="sm">
								<Megaphone className="mr-2 h-4 w-4" />
								Banner
							</Button>
						</Link>
					)}
				</div>

				{children}
			</div>
		</div>
	);
}
