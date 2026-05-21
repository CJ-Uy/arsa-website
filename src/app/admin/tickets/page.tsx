import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user, ticketEvent } from "@/db/schema";
import { TicketsManagement } from "./tickets-management";

export const dynamic = "force-dynamic";

export default async function AdminTicketsPage() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) redirect("/");

	const u = await db.query.user.findFirst({
		where: eq(user.id, session.user.id),
		columns: { isTicketsAdmin: true },
	});
	if (!u?.isTicketsAdmin) redirect("/");

	const events = await db.query.ticketEvent.findMany({
		with: {
			tickets: { columns: { id: true, scanned: true } },
			verifiers: {
				with: { user: { columns: { id: true, email: true, name: true, image: true } } },
			},
		},
		orderBy: [desc(ticketEvent.createdAt)],
	});

	const eventsWithStats = events.map((event) => ({
		id: event.id,
		name: event.name,
		description: event.description,
		isActive: event.isActive,
		date: event.date,
		createdAt: event.createdAt,
		updatedAt: event.updatedAt,
		ticketCount: event.tickets.length,
		scannedCount: event.tickets.filter((t) => t.scanned).length,
		verifiers: event.verifiers.map((v) => ({
			userId: v.userId,
			email: v.user.email,
			name: v.user.name,
			image: v.user.image,
		})),
	}));

	return (
		<div>
			<div className="mb-6">
				<h2 className="text-2xl font-bold">Ticket Management</h2>
				<p className="text-muted-foreground mt-1">
					Create events, generate tickets, and manage verifiers
				</p>
			</div>
			<TicketsManagement initialEvents={eventsWithStats} />
		</div>
	);
}
