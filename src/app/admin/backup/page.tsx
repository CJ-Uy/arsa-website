export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { listBackupTables } from "@/lib/backup";
import { BackupClient } from "./backup-client";

export default async function BackupPage() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) redirect("/");

	const user = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: { isBackupAdmin: true, isSuperAdmin: true },
	});

	if (!user?.isBackupAdmin && !user?.isSuperAdmin) redirect("/admin");

	const tables = listBackupTables();

	return (
		<div className="container mx-auto max-w-5xl px-4 py-8">
			<div className="mb-8">
				<h1 className="text-3xl font-bold">Database Backup</h1>
				<p className="text-muted-foreground mt-2">
					Export all data in a portable format (ZIP of NDJSON + manifest). Designed for migration
					to any database/ORM — Postgres → D1/SQLite, Prisma → Drizzle, etc.
				</p>
			</div>

			<BackupClient tables={tables} />
		</div>
	);
}
