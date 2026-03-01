export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { SuperAdminManagement } from "./super-admin-management";

export default async function SuperAdminPage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});
	if (!session?.user) redirect("/");

	const user = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: { isSuperAdmin: true },
	});
	if (!user?.isSuperAdmin) redirect("/");

	const admins = await prisma.user.findMany({
		where: {
			OR: [
				{ isShopAdmin: true },
				{ isEventsAdmin: true },
				{ isRedirectsAdmin: true },
				{ isTicketsAdmin: true },
				{ isSuperAdmin: true },
			],
		},
		select: {
			id: true,
			email: true,
			name: true,
			image: true,
			isShopAdmin: true,
			isEventsAdmin: true,
			isRedirectsAdmin: true,
			isTicketsAdmin: true,
			isSuperAdmin: true,
		},
		orderBy: { name: "asc" },
	});

	return <SuperAdminManagement initialAdmins={admins} />;
}
