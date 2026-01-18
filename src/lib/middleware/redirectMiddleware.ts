import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function redirectMiddleware(req: NextRequest): Promise<NextResponse | undefined> {
	const path = req.nextUrl.pathname;
	const code = path.substring(1);

	// Skip this middleware for known paths and API routes to avoid unnecessary DB queries
	if (path === "/" || path.startsWith("/api") || path.startsWith("/_next")) {
		return undefined; // Let the request continue
	}

	try {
		const redirect = await prisma.redirects.findFirst({
			where: {
				redirectCode: code,
			},
		});

		// If a link is found, return a redirect response immediately
		if (redirect) {
			// Update click count and log the individual click
			await prisma.$transaction([
				prisma.redirects.update({
					where: { id: redirect.id },
					data: {
						clicks: {
							increment: 1,
						},
					},
				}),
				prisma.redirectClick.create({
					data: {
						redirectId: redirect.id,
						userAgent: req.headers.get("user-agent") || null,
						referer: req.headers.get("referer") || null,
					},
				}),
			]);

			return NextResponse.redirect(new URL(redirect.newURL));
		}
	} catch (error) {
		console.error("Redirect middleware database error:", error);
		// Let the request continue to the Next.js router to handle the error
	}

	// If no link is found, return undefined to signal that we are done
	// and the next middleware (or Next.js itself) should take over.
	return undefined;
}
