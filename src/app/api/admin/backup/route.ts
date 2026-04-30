import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createBackupStream } from "@/lib/backup";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 600;

export async function POST(req: NextRequest) {
	const session = await auth.api.getSession({ headers: req.headers });
	if (!session?.user) {
		return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
	}

	const user = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: { isBackupAdmin: true, isSuperAdmin: true },
	});

	if (!user?.isBackupAdmin && !user?.isSuperAdmin) {
		return NextResponse.json({ error: "Forbidden" }, { status: 403 });
	}

	let body: { includeAuditTables?: boolean; includeFiles?: boolean } = {};
	try {
		body = await req.json();
	} catch {
		// allow empty body — defaults below
	}

	const options = {
		includeAuditTables: body.includeAuditTables ?? true,
		includeFiles: body.includeFiles ?? false,
	};

	const { stream, filename } = createBackupStream(options);

	return new Response(stream, {
		headers: {
			"Content-Type": "application/zip",
			"Content-Disposition": `attachment; filename="${filename}"`,
			"Cache-Control": "no-store",
			"X-Backup-Filename": filename,
		},
	});
}
