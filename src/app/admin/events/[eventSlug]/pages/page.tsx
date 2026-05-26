import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { event } from "@/db/schema";
import { getUserEventRoles } from "@/lib/eventPermissions";
import { listPages } from "../actions";
import { PagesList } from "./pages-list";

export default async function EventPagesPage({
	params,
}: {
	params: Promise<{ eventSlug: string }>;
}) {
	const { eventSlug } = await params;
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) redirect("/shop");

	const e = await db.query.event.findFirst({ where: eq(event.slug, eventSlug) });
	if (!e) notFound();

	const { roles } = await getUserEventRoles(session.user.id, e.id);
	if (!roles.includes("overseer") && !roles.includes("content_admin")) {
		redirect(`/admin/events/${eventSlug}`);
	}

	const pages = await listPages(e.id);
	return <PagesList eventId={e.id} eventSlug={eventSlug} pages={pages} />;
}
