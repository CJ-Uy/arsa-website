import { prisma } from "@/lib/prisma";
import { DashboardClient } from "./dashboardClient";

// This is a Server Component. It fetches data and passes it down.
export default async function DashboardPage() {
	// Fetch initial data on the server for the first page load
	const redirects = await prisma.redirects.findMany({
		orderBy: { redirectCode: "asc" },
	});

	return (
		<div className="container mx-auto py-10">
			{/* We pass the initial server-fetched data to the client component */}
			<DashboardClient initialRedirects={redirects} />
		</div>
	);
}
