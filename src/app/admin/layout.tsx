import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Unauthorized } from "./unauthorized";
import { Suspense } from "react";
import { NavigationProgress } from "@/components/ui/navigation-progress";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminThemeForcer } from "@/components/admin/admin-theme-forcer";

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
			{/* Force light mode on admin pages */}
			<AdminThemeForcer />

			{/* Navigation Progress Bar */}
			<Suspense fallback={null}>
				<NavigationProgress />
			</Suspense>

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

				<AdminNav
					items={[
						...(isShopAdmin
							? [
									{ href: "/admin/orders", label: "Orders", iconKey: "orders" as const },
									{ href: "/admin/products", label: "Products", iconKey: "products" as const },
									{ href: "/admin/packages", label: "Packages", iconKey: "packages" as const },
								]
							: []),
						...(canAccessEvents
							? [{ href: "/admin/events", label: "Events", iconKey: "events" as const }]
							: []),
						...(isShopAdmin
							? [{ href: "/admin/banner", label: "Banner", iconKey: "banner" as const }]
							: []),
					]}
				/>

				{children}
			</div>
		</div>
	);
}
