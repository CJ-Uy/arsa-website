import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { eq, count } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { event, eventPage } from "@/db/schema";
import { getUserEventRoles } from "@/lib/eventPermissions";
import { EventOverview } from "./event-overview";

export default async function EventOverviewPage({
	params,
}: { params: Promise<{ eventSlug: string }> }) {
	const { eventSlug } = await params;
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) redirect("/shop");

	const e = await db.query.event.findFirst({
		where: eq(event.slug, eventSlug),
		with: {
			shop: true,
			tickets: true,
			landing: true,
		},
	});
	if (!e) notFound();

	const { roles } = await getUserEventRoles(session.user.id, e.id);
	if (roles.length === 0) redirect("/admin");

	const [{ count: pageCount }] = await db
		.select({ count: count() })
		.from(eventPage)
		.where(eq(eventPage.eventId, e.id));

	return <EventOverview event={e} pageCount={pageCount} roles={roles} />;
}
