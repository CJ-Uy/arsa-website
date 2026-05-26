import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { user as userTable, event } from "@/db/schema";
import { getUserAccessibleEvents } from "@/lib/eventPermissions";
import { Unauthorized } from "./unauthorized";
import { Suspense } from "react";
import { NavigationProgress } from "@/components/ui/navigation-progress";
import { AdminNav, AdminPageTitle } from "@/components/admin/admin-nav";
import { AdminThemeForcer } from "@/components/admin/admin-theme-forcer";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		return <Unauthorized isLoggedIn={false} />;
	}

	// Check user permissions - shop admin OR events admin (global or event-specific)
	const user = await db.query.user.findFirst({
		where: eq(userTable.id, session.user.id),
		columns: {
			isShopAdmin: true,
			isEventsAdmin: true,
			isTicketsAdmin: true,
			isRedirectsAdmin: true,
			isSSO26Admin: true,
			isBackupAdmin: true,
			isSuperAdmin: true,
		},
	});
	const isShopAdmin = user?.isShopAdmin ?? false;
	const isEventsAdmin = user?.isEventsAdmin ?? false;
	const isTicketsAdmin = user?.isTicketsAdmin ?? false;
	const isRedirectsAdmin = user?.isRedirectsAdmin ?? false;
	const isSSO26Admin = user?.isSSO26Admin ?? false;
	const isBackupAdmin = user?.isBackupAdmin ?? false;
	const isSuperAdmin = user?.isSuperAdmin ?? false;
	const canAccessBackup = isBackupAdmin || isSuperAdmin;

	const accessibleMap = await getUserAccessibleEvents(session.user.id);
	const eventIds = Array.from(accessibleMap.keys());
	const events = eventIds.length > 0
		? await db.query.event.findMany({
			where: inArray(event.id, eventIds),
			columns: { id: true, slug: true, name: true, status: true },
			orderBy: (e, { desc }) => [desc(e.priority), e.name],
		})
		: [];

	// Must have at least one admin permission to access
	if (!isShopAdmin && !isEventsAdmin && !isTicketsAdmin && !isRedirectsAdmin && !isSSO26Admin && !canAccessBackup && !isSuperAdmin && events.length === 0) {
		return <Unauthorized isLoggedIn={true} />;
	}

	const navItems = [
		// ARSA Permanent group
		...(isShopAdmin || isSuperAdmin
			? [
				{ href: "/admin/content/home", label: "Home", iconKey: "home" as const, group: "ARSA Permanent" },
				{ href: "/admin/content/faq", label: "FAQ", iconKey: "faq" as const, group: "ARSA Permanent" },
				{ href: "/admin/content/about", label: "About", iconKey: "about" as const, group: "ARSA Permanent" },
				{ href: "/admin/content/bridges", label: "Bridges", iconKey: "bridges" as const, group: "ARSA Permanent" },
				{ href: "/admin/content/contact", label: "Contact Us", iconKey: "contact" as const, group: "ARSA Permanent" },
				{ href: "/admin/content/pages", label: "Other Pages", iconKey: "otherpages" as const, group: "ARSA Permanent" },
				{ href: "/admin/banner", label: "Banner", iconKey: "banner" as const, group: "ARSA Permanent" },
			]
			: []),

		// Events group — one expandable workspace per accessible event
		...events.map((e) => {
			const roles = accessibleMap.get(e.id) ?? [];
			const isOverseer = roles.includes("overseer");
			const subitems = [
				{ href: `/admin/events/${e.slug}`, label: "Overview" },
				...(isOverseer ? [{ href: `/admin/events/${e.slug}/settings`, label: "Settings" }] : []),
				...(isOverseer || roles.includes("content_admin") ? [
					{ href: `/admin/events/${e.slug}/landing`, label: "Landing" },
					{ href: `/admin/events/${e.slug}/pages`, label: "Pages" },
				] : []),
				...(isOverseer || roles.includes("shop_admin") ? [
					{ href: `/admin/events/${e.slug}/shop`, label: "Shop" },
					{ href: `/admin/events/${e.slug}/shop/orders`, label: "Orders" },
					{ href: `/admin/events/${e.slug}/shop/products`, label: "Products" },
				] : []),
				...(isOverseer || roles.includes("tickets_admin") ? [
					{ href: `/admin/events/${e.slug}/tickets`, label: "Tickets" },
				] : []),
				...(isOverseer ? [{ href: `/admin/events/${e.slug}/admins`, label: "Admins" }] : []),
			];
			return {
				href: `/admin/events/${e.slug}`,
				label: e.name,
				iconKey: "events" as const,
				group: "Events",
				subitems,
				eventStatus: e.status as "draft" | "active" | "archived",
			};
		}),

		// New event creator
		...(isShopAdmin || isEventsAdmin || isSuperAdmin
			? [{ href: "/admin/events/new", label: "＋ New Event", iconKey: "events" as const, group: "Events" }]
			: []),

		// Cross-event union views (multi-event users only)
		...(events.length >= 2 && (isShopAdmin || isSuperAdmin) ? [
			{ href: "/admin/orders", label: "All Orders", iconKey: "orders" as const, group: "Tools" },
			{ href: "/admin/products", label: "All Products", iconKey: "products" as const, group: "Tools" },
			{ href: "/admin/packages", label: "All Packages", iconKey: "packages" as const, group: "Tools" },
		] : []),

		// Tools group
		...(isRedirectsAdmin ? [{ href: "/admin/redirects", label: "Redirects", iconKey: "redirects" as const, group: "Tools" }] : []),
		...(isShopAdmin || isSuperAdmin ? [
			{ href: "/admin/email-logs", label: "Email Logs", iconKey: "email" as const, group: "Tools" },
			{ href: "/admin/settings", label: "Settings", iconKey: "settings" as const, group: "Tools" },
		] : []),
		...(isSSO26Admin ? [{ href: "/admin/sso26", label: "SSO 2026", iconKey: "sso26" as const, group: "SSO 2026" }] : []),
		...(isSuperAdmin ? [{ href: "/admin/super", label: "Super Admin", iconKey: "super" as const, group: "System" }] : []),
	];

	return (
		<SidebarProvider>
			{/* Force light mode on admin pages */}
			<AdminThemeForcer />

			{/* Navigation Progress Bar */}
			<Suspense fallback={null}>
				<NavigationProgress />
			</Suspense>

			<AdminNav
				items={navItems}
				user={{
					name: session.user.name ?? null,
					email: session.user.email ?? null,
					image: session.user.image ?? null,
				}}
			/>

			<SidebarInset>
				{/* Header */}
				<header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
					<SidebarTrigger className="-ml-1" />
					<Separator orientation="vertical" className="mr-2 h-4" />
					<AdminPageTitle items={navItems} />
				</header>

				{/* Main Content */}
				<div className="flex-1 overflow-x-hidden px-4 py-8 lg:px-8">{children}</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
