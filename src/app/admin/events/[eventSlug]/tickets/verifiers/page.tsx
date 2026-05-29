import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { event } from "@/db/schema";
import { getUserEventRoles } from "@/lib/eventPermissions";
import { listEventVerifiers } from "../../actions";
import { VerifiersClient } from "./verifiers-client";

export default async function VerifiersPage({
	params,
}: { params: Promise<{ eventSlug: string }> }) {
	const { eventSlug } = await params;
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) redirect("/shop");

	const e = await db.query.event.findFirst({
		where: eq(event.slug, eventSlug),
	});
	if (!e) notFound();

	const { roles } = await getUserEventRoles(session.user.id, e.id);
	if (!roles.includes("overseer") && !roles.includes("tickets_admin")) {
		redirect(`/admin/events/${eventSlug}`);
	}

	const verifiers = await listEventVerifiers(e.id);

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold text-[#0e3663]">Ticket Verifiers</h1>
				<p className="text-sm text-muted-foreground">
					Assign users who can scan and verify tickets for this event
				</p>
			</div>
			<VerifiersClient eventId={e.id} verifiers={verifiers} />
		</div>
	);
}
