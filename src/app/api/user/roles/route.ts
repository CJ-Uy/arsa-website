import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET() {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session?.user) {
			return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
		}

		const user = await prisma.user.findUnique({
			where: { id: session.user.id },
			select: {
				isShopAdmin: true,
				isEventsAdmin: true,
				isRedirectsAdmin: true,
				eventAdmins: {
					select: {
						eventId: true,
					},
				},
			},
		});

		if (!user) {
			return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
		}

		// User is an events admin if they have the global flag OR are assigned to specific events
		const hasEventAdminAccess = user.isEventsAdmin || user.eventAdmins.length > 0;

		return NextResponse.json({
			success: true,
			roles: {
				isShopAdmin: user.isShopAdmin,
				isEventsAdmin: hasEventAdminAccess,
				isRedirectsAdmin: user.isRedirectsAdmin,
				// Include specific event IDs for fine-grained access control
				eventAdminIds: user.eventAdmins.map((ea) => ea.eventId),
			},
		});
	} catch (error) {
		console.error("Error fetching user roles:", error);
		return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
	}
}
