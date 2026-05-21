import { NextRequest, NextResponse } from "next/server";
import { redirectMiddleware } from "./lib/middleware/redirectMiddleware";

export async function middleware(req: NextRequest) {
	const redirectResponse = await redirectMiddleware(req);
	if (redirectResponse) {
		return redirectResponse;
	}
	return NextResponse.next();
}

export const config = {
	matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
