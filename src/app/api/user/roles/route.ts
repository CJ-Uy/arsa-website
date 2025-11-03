import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";

export async function GET() {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		});

		if (!session?.user) {
			return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
		}

		const user = await prisma.user.findUnique({
			where: { id: session.user.id },
			select: {
				isShopAdmin: true,
				isRedirectsAdmin: true,
			},
		});

		if (!user) {
			return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });
		}

		return NextResponse.json({
			success: true,
			roles: {
				isShopAdmin: user.isShopAdmin,
				isRedirectsAdmin: user.isRedirectsAdmin,
			},
		});
	} catch (error) {
		console.error("Error fetching user roles:", error);
		return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
	}
}
