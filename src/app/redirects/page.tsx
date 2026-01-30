import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { DashboardClient } from "./dashboardClient";
import { Unauthorized } from "./unauthorized";
import { AdminThemeForcer } from "@/components/admin/admin-theme-forcer";

// This is a Server Component. It fetches data and passes it down.
export default async function DashboardPage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		return <Unauthorized isLoggedIn={false} />;
	}

	// Check if user is redirects admin
	const user = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: { isRedirectsAdmin: true },
	});

	if (!user?.isRedirectsAdmin) {
		return <Unauthorized isLoggedIn={true} />;
	}

	// Fetch initial data on the server for the first page load
	const redirects = await prisma.redirects.findMany({
		orderBy: { redirectCode: "asc" },
	});

	return (
		<div className="container mx-auto py-10">
			{/* Force light mode on redirects admin page */}
			<AdminThemeForcer />

			{/* We pass the initial server-fetched data to the client component */}
			<DashboardClient initialRedirects={redirects} />
		</div>
	);
}
