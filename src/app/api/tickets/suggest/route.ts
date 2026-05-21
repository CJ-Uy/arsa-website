import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import { and, eq, inArray, like } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user, ticketVerifier, ticket } from "@/db/schema";

export async function GET(request: NextRequest) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) {
		return NextResponse.json({ suggestions: [] }, { status: 401 });
	}

	const { searchParams } = new URL(request.url);
	const q = searchParams.get("q")?.toUpperCase() ?? "";
	if (q.length < 3) return NextResponse.json({ suggestions: [] });

	const u = await db.query.user.findFirst({
		where: eq(user.id, session.user.id),
		columns: { isTicketsAdmin: true },
	});
	if (!u) return NextResponse.json({ suggestions: [] }, { status: 403 });

	const verifiers = await db.query.ticketVerifier.findMany({
		where: eq(ticketVerifier.userId, session.user.id),
		columns: { ticketEventId: true },
	});

	const hasAccess = u.isTicketsAdmin || verifiers.length > 0;
	if (!hasAccess) return NextResponse.json({ suggestions: [] }, { status: 403 });

	const filters = [like(ticket.shortCode, `${q}%`)];
	if (!u.isTicketsAdmin) {
		const eventIds = verifiers.map((v) => v.ticketEventId);
		if (eventIds.length === 0) return NextResponse.json({ suggestions: [] });
		filters.push(inArray(ticket.ticketEventId, eventIds));
	}

	const tickets = await db.query.ticket.findMany({
		where: and(...filters),
		columns: { shortCode: true, email: true, scanned: true },
		with: { ticketEvent: { columns: { name: true } } },
		limit: 10,
	});

	return NextResponse.json({ suggestions: tickets });
}
