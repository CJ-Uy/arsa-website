import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { user } from "@/db/schema";
import { getAuditData } from "./actions";
import { MigrationAuditClient } from "./audit-client";

export default async function MigrationAuditPage() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) redirect("/shop");

	const u = await db.query.user.findFirst({
		where: eq(user.id, session.user.id),
		columns: { isSuperAdmin: true },
	});
	if (!u?.isSuperAdmin) redirect("/admin");

	const data = await getAuditData();
	return <MigrationAuditClient initial={data} />;
}
