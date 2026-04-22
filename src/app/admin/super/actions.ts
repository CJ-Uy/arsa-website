"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

// ── Auth Helper ────────────────────────────────────────────────
async function verifySuperAdmin() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		return { authorized: false as const, message: "Unauthorized" };
	}

	const user = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: { isSuperAdmin: true },
	});

	if (!user?.isSuperAdmin) {
		return { authorized: false as const, message: "Super admin access required" };
	}

	return { authorized: true as const, userId: session.user.id };
}

// ── Get All Admins ────────────────────────────────────────────

export async function getAllAdmins() {
	try {
		const authResult = await verifySuperAdmin();
		if (!authResult.authorized) return { success: false, message: authResult.message, admins: [] };

		const admins = await prisma.user.findMany({
			where: {
				OR: [
					{ isShopAdmin: true },
					{ isEventsAdmin: true },
					{ isRedirectsAdmin: true },
					{ isTicketsAdmin: true },
					{ isSSO26Admin: true },
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
				isSSO26Admin: true,
				isSuperAdmin: true,
			},
			orderBy: { name: "asc" },
		});

		return { success: true, admins };
	} catch (error) {
		console.error("Error fetching admins:", error);
		return { success: false, message: "Failed to fetch admins", admins: [] };
	}
}

// ── Search Users ──────────────────────────────────────────────

export async function searchUsersForAdmin(query: string) {
	try {
		const authResult = await verifySuperAdmin();
		if (!authResult.authorized) return { success: false, message: authResult.message, users: [] };

		if (!query || query.length < 2) return { success: true, users: [] };

		const users = await prisma.user.findMany({
			where: {
				OR: [
					{ email: { contains: query, mode: "insensitive" } },
					{ name: { contains: query, mode: "insensitive" } },
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
				isSSO26Admin: true,
				isSuperAdmin: true,
			},
			take: 20,
			orderBy: { name: "asc" },
		});

		return { success: true, users };
	} catch (error) {
		console.error("Error searching users:", error);
		return { success: false, message: "Failed to search users", users: [] };
	}
}

// ── Update User Roles ─────────────────────────────────────────

export async function updateUserRoles(
	userId: string,
	roles: {
		isShopAdmin: boolean;
		isEventsAdmin: boolean;
		isRedirectsAdmin: boolean;
		isTicketsAdmin: boolean;
		isSSO26Admin: boolean;
	},
) {
	try {
		const authResult = await verifySuperAdmin();
		if (!authResult.authorized) return { success: false, message: authResult.message };

		// Prevent super admin from modifying their own roles
		if (userId === authResult.userId) {
			return { success: false, message: "Cannot modify your own roles" };
		}

		await prisma.user.update({
			where: { id: userId },
			data: {
				isShopAdmin: roles.isShopAdmin,
				isEventsAdmin: roles.isEventsAdmin,
				isRedirectsAdmin: roles.isRedirectsAdmin,
				isTicketsAdmin: roles.isTicketsAdmin,
				isSSO26Admin: roles.isSSO26Admin,
			},
		});

		revalidatePath("/admin/super");
		return { success: true, message: "Roles updated" };
	} catch (error) {
		console.error("Error updating user roles:", error);
		return { success: false, message: "Failed to update user roles" };
	}
}
