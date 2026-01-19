import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		redirect("/shop");
	}

	// Check user permissions to redirect to appropriate page
	const user = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: {
			isShopAdmin: true,
			isEventsAdmin: true,
			eventAdmins: {
				select: { eventId: true },
			},
		},
	});

	const isShopAdmin = user?.isShopAdmin ?? false;

	// Shop admins go to orders, event-only admins go to events
	if (isShopAdmin) {
		redirect("/admin/orders");
	} else {
		redirect("/admin/events");
	}
}
