import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { eq, count } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { event, eventTickets, ticket } from "@/db/schema";
import { getUserEventRoles } from "@/lib/eventPermissions";
import { TicketsOverview } from "./tickets-overview";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function EventTicketsPage({
	params,
}: { params: Promise<{ eventSlug: string }> }) {
	const { eventSlug } = await params;
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) redirect("/shop");

	const e = await db.query.event.findFirst({
		where: eq(event.slug, eventSlug),
		with: { tickets: true },
	});
	if (!e) notFound();

	const { roles } = await getUserEventRoles(session.user.id, e.id);
	if (!roles.includes("overseer") && !roles.includes("tickets_admin")) {
		redirect(`/admin/events/${eventSlug}`);
	}

	if (!e.tickets) {
		return (
			<div className="space-y-6">
				<h1 className="text-2xl font-bold text-[#0e3663]">Tickets</h1>
				<Alert>
					<AlertDescription>
						The tickets module has not been configured for this event. Enable it from the{" "}
						<Link href={`/admin/events/${eventSlug}`} className="underline font-medium">
							event overview
						</Link>{" "}
						first.
					</AlertDescription>
				</Alert>
			</div>
		);
	}

	const [{ count: ticketCount }] = await db
		.select({ count: count() })
		.from(ticket)
		.where(eq(ticket.ticketEventId, e.id));

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-[#0e3663]">Tickets</h1>
					<p className="text-sm text-muted-foreground">
						Manage ticket generation and verification for this event
					</p>
				</div>
				<div className="flex items-center gap-2">
					<Button asChild variant="outline" size="sm">
						<Link href={`/admin/events/${eventSlug}/tickets/generate`}>Generate</Link>
					</Button>
					<Button asChild variant="outline" size="sm">
						<Link href={`/admin/events/${eventSlug}/tickets/verifiers`}>Verifiers</Link>
					</Button>
				</div>
			</div>
			<TicketsOverview
				eventId={e.id}
				eventSlug={eventSlug}
				ticketsRow={e.tickets}
				ticketCount={ticketCount}
			/>
		</div>
	);
}
