import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { DashboardClient } from "./dashboardClient";
import { redirect } from "next/navigation";

export default async function RedirectsPage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		redirect("/");
	}

	// Check if user is redirects admin
	const user = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: { isRedirectsAdmin: true },
	});

	if (!user?.isRedirectsAdmin) {
		redirect("/admin");
	}

	// Fetch initial data on the server for the first page load
	const [redirects, tags] = await Promise.all([
		prisma.redirects.findMany({
			orderBy: { redirectCode: "asc" },
			include: { redirectTags: { include: { tag: true } } },
		}),
		prisma.redirectTag.findMany({ orderBy: { name: "asc" } }),
	]);

	// Flatten for the client
	const redirectsWithTags = redirects.map((r) => ({
		id: r.id,
		newURL: r.newURL,
		redirectCode: r.redirectCode,
		clicks: r.clicks,
		createdAt: r.createdAt,
		tags: r.redirectTags.map((rt) => ({
			id: rt.tag.id,
			name: rt.tag.name,
			color: rt.tag.color,
		})),
	}));

	return <DashboardClient initialRedirects={redirectsWithTags} initialTags={tags} />;
}
