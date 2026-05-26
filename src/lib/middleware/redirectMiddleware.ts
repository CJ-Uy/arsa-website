import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { redirects, redirectClick } from "@/db/schema";

export async function redirectMiddleware(req: NextRequest): Promise<NextResponse | undefined> {
	const path = req.nextUrl.pathname;
	const code = path.substring(1);

	if (path === "/" || path.startsWith("/api") || path.startsWith("/_next")) {
		return undefined;
	}

	try {
		const [redirect] = await db
			.select()
			.from(redirects)
			.where(eq(redirects.redirectCode, code))
			.limit(1);

		if (redirect?.id) {
			await db
				.update(redirects)
				.set({ clicks: sql`${redirects.clicks} + 1` })
				.where(eq(redirects.id, redirect.id));
			await db.insert(redirectClick).values({
				redirectId: redirect.id,
				userAgent: req.headers.get("user-agent") || null,
				referer: req.headers.get("referer") || null,
			});

			return NextResponse.redirect(new URL(redirect.newURL));
		}
	} catch (error) {
		console.error("Redirect middleware database error:", error);
	}

	return undefined;
}
