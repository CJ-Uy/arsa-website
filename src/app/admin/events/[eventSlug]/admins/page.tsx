import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { event } from "@/db/schema";
import { getUserEventRoles } from "@/lib/eventPermissions";
import { listGrants } from "../actions";
import { AdminsClient } from "./admins-client";

export default async function EventAdminsPage({
	params,
}: { params: Promise<{ eventSlug: string }> }) {
	const { eventSlug } = await params;
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) redirect("/shop");

	const e = await db.query.event.findFirst({ where: eq(event.slug, eventSlug) });
	if (!e) notFound();

	const { roles } = await getUserEventRoles(session.user.id, e.id);
	if (!roles.includes("overseer")) redirect(`/admin/events/${eventSlug}`);

	const grants = await listGrants(e.id);
	return <AdminsClient eventId={e.id} grants={grants} />;
}
