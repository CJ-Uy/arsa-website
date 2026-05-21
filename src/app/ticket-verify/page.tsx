import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user as userTable, ticketVerifier } from "@/db/schema";
import { TicketVerifyClient } from "./ticket-verify-client";

export const dynamic = "force-dynamic";

export default async function TicketVerifyPage() {
	const session = await auth.api.getSession({ headers: await headers() });

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

	const user = await db.query.user.findFirst({
		where: eq(userTable.id, session.user.id),
		columns: { isTicketsAdmin: true, name: true, email: true },
	});

	const verifiers = await db.query.ticketVerifier.findMany({
		where: eq(ticketVerifier.userId, session.user.id),
		with: {
			ticketEvent: { columns: { id: true, name: true, isActive: true } },
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

	const hasVerifierAccess = user.isTicketsAdmin || verifiers.length > 0;

	return (
		<TicketVerifyClient
			isLoggedIn={true}
			hasAccess={hasVerifierAccess}
			currentUser={{ name: user.name, email: user.email }}
			assignedEvents={
				user.isTicketsAdmin
					? []
					: verifiers.map((v) => ({
							id: v.ticketEvent.id,
							name: v.ticketEvent.name,
							isActive: v.ticketEvent.isActive,
						}))
			}
			isAdmin={user.isTicketsAdmin}
		/>
	);
}
