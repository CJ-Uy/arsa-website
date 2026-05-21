import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { asc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user, redirects, redirectTag } from "@/db/schema";
import { DashboardClient } from "./dashboardClient";

export default async function RedirectsPage() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) redirect("/");

	const u = await db.query.user.findFirst({
		where: eq(user.id, session.user.id),
		columns: { isRedirectsAdmin: true },
	});
	if (!u?.isRedirectsAdmin) redirect("/admin");

	const [allRedirects, tags] = await Promise.all([
		db.query.redirects.findMany({
			orderBy: [asc(redirects.redirectCode)],
			with: { redirectTags: { with: { tag: true } } },
		}),
		db.query.redirectTag.findMany({ orderBy: [asc(redirectTag.name)] }),
	]);

	const redirectsWithTags = allRedirects.map((r) => ({
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
