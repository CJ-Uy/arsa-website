import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { TicketsManagement } from "./tickets-management";

export const dynamic = "force-dynamic";

export default async function AdminTicketsPage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) redirect("/");

	const user = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: { isTicketsAdmin: true },
	});

	if (!user?.isTicketsAdmin) redirect("/");

	const events = await prisma.ticketEvent.findMany({
		include: {
			_count: { select: { tickets: true } },
			tickets: {
				select: { scanned: true },
			},
			verifiers: {
				include: {
					user: { select: { id: true, email: true, name: true, image: true } },
				},
			},
		},
		orderBy: { createdAt: "desc" },
	});

	// Transform to include scan stats
	const eventsWithStats = events.map((event) => ({
		id: event.id,
		name: event.name,
		description: event.description,
		isActive: event.isActive,
		date: event.date,
		createdAt: event.createdAt,
		updatedAt: event.updatedAt,
		ticketCount: event._count.tickets,
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
