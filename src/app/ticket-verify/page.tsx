import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { TicketVerifyClient } from "./ticket-verify-client";

export const dynamic = "force-dynamic";

export default async function TicketVerifyPage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	// Not logged in — show login prompt
	if (!session?.user) {
		return (
			<TicketVerifyClient
				isLoggedIn={false}
				hasAccess={false}
				currentUser={null}
				assignedEvents={[]}
			/>
		);
	}

	// Check if user is a verifier for any event or is a tickets admin
	const user = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: {
			isTicketsAdmin: true,
			name: true,
			email: true,
			ticketVerifiers: {
				include: {
					ticketEvent: { select: { id: true, name: true, isActive: true } },
				},
			},
		},
	});

	if (!user) {
		return (
			<TicketVerifyClient
				isLoggedIn={true}
				hasAccess={false}
				currentUser={null}
				assignedEvents={[]}
			/>
		);
	}

	const hasVerifierAccess = user.isTicketsAdmin || user.ticketVerifiers.length > 0;

	return (
		<TicketVerifyClient
			isLoggedIn={true}
			hasAccess={hasVerifierAccess}
			currentUser={{ name: user.name, email: user.email }}
			assignedEvents={
				user.isTicketsAdmin
					? [] // Admin sees all — no need to list
					: user.ticketVerifiers.map((v) => ({
							id: v.ticketEvent.id,
							name: v.ticketEvent.name,
							isActive: v.ticketEvent.isActive,
						}))
			}
			isAdmin={user.isTicketsAdmin}
		/>
	);
}
