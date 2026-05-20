import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user, eventAdmin } from "@/db/schema";

export async function GET() {
	try {
		const session = await auth.api.getSession({ headers: await headers() });
		if (!session?.user) {
			return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
		}

		const u = await db.query.user.findFirst({
			where: eq(user.id, session.user.id),
			columns: {
				isShopAdmin: true,
				isEventsAdmin: true,
				isRedirectsAdmin: true,
				isTicketsAdmin: true,
				isSSO26Admin: true,
				isSuperAdmin: true,
			},
		});

		if (!u) {
			return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
		}

		const eventAdmins = await db.query.eventAdmin.findMany({
			where: eq(eventAdmin.userId, session.user.id),
			columns: { eventId: true },
		});

		const hasEventAdminAccess = u.isEventsAdmin || eventAdmins.length > 0;

		return NextResponse.json({
			success: true,
			roles: {
				isShopAdmin: u.isShopAdmin,
				isEventsAdmin: hasEventAdminAccess,
				isRedirectsAdmin: u.isRedirectsAdmin,
				isTicketsAdmin: u.isTicketsAdmin,
				isSSO26Admin: u.isSSO26Admin,
				isSuperAdmin: u.isSuperAdmin,
				eventAdminIds: eventAdmins.map((ea) => ea.eventId),
			},
		});
	} catch (error) {
		console.error("Error fetching user roles:", error);
		return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
	}
}
