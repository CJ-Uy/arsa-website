import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		return NextResponse.json({ suggestions: [] }, { status: 401 });
	}

	const { searchParams } = new URL(request.url);
	const q = searchParams.get("q")?.toUpperCase() ?? "";

	if (q.length < 3) {
		return NextResponse.json({ suggestions: [] });
	}

	// Check if user is tickets admin or a verifier
	const user = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: {
			isTicketsAdmin: true,
			ticketVerifiers: { select: { ticketEventId: true } },
		},
	});

	if (!user) {
		return NextResponse.json({ suggestions: [] }, { status: 403 });
	}

	const hasAccess = user.isTicketsAdmin || user.ticketVerifiers.length > 0;
	if (!hasAccess) {
		return NextResponse.json({ suggestions: [] }, { status: 403 });
	}

	// Build event filter: tickets admin sees all, verifiers see only their events
	const eventFilter = user.isTicketsAdmin
		? undefined
		: { in: user.ticketVerifiers.map((v) => v.ticketEventId) };

	const tickets = await prisma.ticket.findMany({
		where: {
			shortCode: { startsWith: q },
			...(eventFilter ? { ticketEventId: eventFilter } : {}),
		},
		select: {
			shortCode: true,
			email: true,
			scanned: true,
			ticketEvent: { select: { name: true } },
		},
		take: 10,
	});

	return NextResponse.json({ suggestions: tickets });
}
