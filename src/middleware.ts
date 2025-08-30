import { NextRequest, NextResponse } from "next/server";
import { redirectMiddleware } from "./lib/middleware/redirectMiddleware";

export const runtime = "nodejs";

export async function middleware(req: NextRequest) {
	// Run the redirect middleware first
	const redirectResponse = await redirectMiddleware(req);
	// If it returned a response (a redirect), stop and return that response.
	if (redirectResponse) {
		return redirectResponse;
	}

	/*
  // You can easily chain another middleware here
  const authResponse = await authMiddleware(req);
  if (authResponse) {
    return authResponse;
  }
  */

	// If no middleware returned a response, continue to the Next.js router.
	return NextResponse.next();
}

// The matcher config remains here. It controls which paths trigger this
// main middleware entry point.
export const config = {
	matcher: [
		/*
		 * Match all request paths except for the ones starting with:
		 * - api (API routes)
		 * - _next/static (static files)
		 * - _next/image (image optimization files)
		 * - favicon.ico (favicon file)
		 */
		"/((?!api|_next/static|_next/image|favicon.ico).*)",
	],
};
