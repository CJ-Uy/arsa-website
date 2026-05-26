import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { event } from "@/db/schema";
import { getUserEventRoles } from "@/lib/eventPermissions";
import { getEventTickets } from "../../actions";
import { GenerateClient } from "./generate-client";

export default async function GenerateTicketsPage({
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

	const result = await getEventTickets(e.id);
	const tickets = result.success ? result.tickets : [];

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold text-[#0e3663]">Generate Tickets</h1>
				<p className="text-sm text-muted-foreground">
					Bulk-generate tickets and export for Mail Merge
				</p>
			</div>
			<GenerateClient eventId={e.id} eventSlug={eventSlug} tickets={tickets} />
		</div>
	);
}
