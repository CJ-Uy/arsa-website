import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { event, eventPage } from "@/db/schema";
import { getUserEventRoles } from "@/lib/eventPermissions";
import { PageEditor } from "./page-editor";

export default async function EventPageEditorPage({
	params,
}: {
	params: Promise<{ eventSlug: string; pageSlug: string }>;
}) {
	const { eventSlug, pageSlug } = await params;
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) redirect("/shop");

	const e = await db.query.event.findFirst({ where: eq(event.slug, eventSlug) });
	if (!e) notFound();

	const { roles } = await getUserEventRoles(session.user.id, e.id);
	if (!roles.includes("overseer") && !roles.includes("content_admin")) {
		redirect(`/admin/events/${eventSlug}`);
	}

	const page = await db.query.eventPage.findFirst({
		where: and(eq(eventPage.eventId, e.id), eq(eventPage.pageSlug, pageSlug)),
	});
	if (!page) notFound();

	return <PageEditor page={page} eventSlug={eventSlug} />;
}
