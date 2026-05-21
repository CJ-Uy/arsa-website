export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { asc, eq, or } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/db/schema";
import { SuperAdminManagement } from "./super-admin-management";

export default async function SuperAdminPage() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) redirect("/");

	const u = await db.query.user.findFirst({
		where: eq(user.id, session.user.id),
		columns: { isSuperAdmin: true },
	});
	if (!u?.isSuperAdmin) redirect("/");

	const admins = await db.query.user.findMany({
		where: or(
			eq(user.isShopAdmin, true),
			eq(user.isEventsAdmin, true),
			eq(user.isRedirectsAdmin, true),
			eq(user.isTicketsAdmin, true),
			eq(user.isSSO26Admin, true),
			eq(user.isBackupAdmin, true),
			eq(user.isSuperAdmin, true),
		),
		columns: {
			id: true,
			email: true,
			name: true,
			image: true,
			isShopAdmin: true,
			isEventsAdmin: true,
			isRedirectsAdmin: true,
			isTicketsAdmin: true,
			isSSO26Admin: true,
			isBackupAdmin: true,
			isSuperAdmin: true,
		},
		orderBy: [asc(user.name)],
	});

	return <SuperAdminManagement initialAdmins={admins} />;
}
