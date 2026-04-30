import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
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
	const user = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: {
			isShopAdmin: true,
			isEventsAdmin: true,
			isTicketsAdmin: true,
			isRedirectsAdmin: true,
			isSSO26Admin: true,
			isBackupAdmin: true,
			isSuperAdmin: true,
			eventAdmins: {
				select: { eventId: true },
			},
		},
	});

	const isShopAdmin = user?.isShopAdmin ?? false;
	const isEventsAdmin = user?.isEventsAdmin ?? false;
	const isTicketsAdmin = user?.isTicketsAdmin ?? false;
	const isRedirectsAdmin = user?.isRedirectsAdmin ?? false;
	const isSSO26Admin = user?.isSSO26Admin ?? false;
	const isBackupAdmin = user?.isBackupAdmin ?? false;
	const isSuperAdmin = user?.isSuperAdmin ?? false;
	const hasEventAssignments = (user?.eventAdmins?.length ?? 0) > 0;
	const canAccessEvents = isShopAdmin || isEventsAdmin || hasEventAssignments;
	const canAccessBackup = isBackupAdmin || isSuperAdmin;

	// Must have at least one admin permission to access
	if (!isShopAdmin && !canAccessEvents && !isTicketsAdmin && !isRedirectsAdmin && !isSSO26Admin && !canAccessBackup && !isSuperAdmin) {
		return <Unauthorized isLoggedIn={true} />;
	}

	const navItems = [
		// Content group
		...(isShopAdmin
			? [
					{
						href: "/admin/content/home",
						label: "Home",
						iconKey: "home" as const,
						group: "Content",
					},
					{
						href: "/admin/content/faq",
						label: "FAQ",
						iconKey: "faq" as const,
						group: "Content",
					},
					{
						href: "/admin/content/about",
						label: "About",
						iconKey: "about" as const,
						group: "Content",
					},
					{
						href: "/admin/content/bridges",
						label: "Bridges",
						iconKey: "bridges" as const,
						group: "Content",
					},
					{
						href: "/admin/content/contact",
						label: "Contact Us",
						iconKey: "contact" as const,
						group: "Content",
					},
					{
						href: "/admin/content/pages",
						label: "Other Pages",
						iconKey: "otherpages" as const,
						group: "Content",
					},
					{
						href: "/admin/banner",
						label: "Banner",
						iconKey: "banner" as const,
						group: "Content",
					},
				]
			: []),
		// Shop group
		...(isShopAdmin
			? [
					{
						href: "/admin/orders",
						label: "Orders",
						iconKey: "orders" as const,
						group: "Shop",
					},
					{
						href: "/admin/products",
						label: "Products",
						iconKey: "products" as const,
						group: "Shop",
					},
					{
						href: "/admin/packages",
						label: "Packages",
						iconKey: "packages" as const,
						group: "Shop",
					},
				]
			: []),
		...(canAccessEvents
			? [
					{
						href: "/admin/events",
						label: "Events",
						iconKey: "events" as const,
						group: "Shop",
					},
				]
			: []),
		...(isTicketsAdmin
			? [
					{
						href: "/admin/tickets",
						label: "Tickets",
						iconKey: "tickets" as const,
						group: "Shop",
					},
				]
			: []),
		// Tools group
		...(isRedirectsAdmin
			? [
					{
						href: "/admin/redirects",
						label: "Redirects",
						iconKey: "redirects" as const,
						group: "Tools",
					},
				]
			: []),
		...(isShopAdmin
			? [
					{
						href: "/admin/email-logs",
						label: "Email Logs",
						iconKey: "email" as const,
						group: "Tools",
					},
					{
						href: "/admin/settings",
						label: "Settings",
						iconKey: "settings" as const,
						group: "Tools",
					},
				]
			: []),
		...(isSSO26Admin
			? [
					{
						href: "/admin/sso26",
						label: "SSO 2026",
						iconKey: "sso26" as const,
						group: "SSO 2026",
					},
				]
			: []),
		...(canAccessBackup
			? [
					{
						href: "/admin/backup",
						label: "Backup",
						iconKey: "backup" as const,
						group: "System",
					},
				]
			: []),
		...(isSuperAdmin
			? [
					{
						href: "/admin/super",
						label: "Super Admin",
						iconKey: "super" as const,
						group: "System",
					},
				]
			: []),
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
