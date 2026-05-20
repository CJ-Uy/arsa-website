"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { asc, eq, like, or } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user } from "@/db/schema";

async function verifySuperAdmin() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) return { authorized: false as const, message: "Unauthorized" };

	const u = await db.query.user.findFirst({
		where: eq(user.id, session.user.id),
		columns: { isSuperAdmin: true },
	});
	if (!u?.isSuperAdmin) {
		return { authorized: false as const, message: "Super admin access required" };
	}
	return { authorized: true as const, userId: session.user.id };
}

export async function getAllAdmins() {
	try {
		const authResult = await verifySuperAdmin();
		if (!authResult.authorized) return { success: false, message: authResult.message, admins: [] };

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

		return { success: true, admins };
	} catch (error) {
		console.error("Error fetching admins:", error);
		return { success: false, message: "Failed to fetch admins", admins: [] };
	}
}

export async function searchUsersForAdmin(query: string) {
	try {
		const authResult = await verifySuperAdmin();
		if (!authResult.authorized) return { success: false, message: authResult.message, users: [] };
		if (!query || query.length < 2) return { success: true, users: [] };

		const q = `%${query.toLowerCase()}%`;
		// SQLite LIKE is case-insensitive by default for ASCII; lower() both sides for safety.
		const users = await db.query.user.findMany({
			where: or(like(user.email, q), like(user.name, q)),
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
			limit: 20,
			orderBy: [asc(user.name)],
		});

		return { success: true, users };
	} catch (error) {
		console.error("Error searching users:", error);
		return { success: false, message: "Failed to search users", users: [] };
	}
}

export async function updateUserRoles(
	userId: string,
	roles: {
		isShopAdmin: boolean;
		isEventsAdmin: boolean;
		isRedirectsAdmin: boolean;
		isTicketsAdmin: boolean;
		isSSO26Admin: boolean;
		isBackupAdmin: boolean;
	},
) {
	try {
		const authResult = await verifySuperAdmin();
		if (!authResult.authorized) return { success: false, message: authResult.message };

		if (userId === authResult.userId) {
			return { success: false, message: "Cannot modify your own roles" };
		}

		await db
			.update(user)
			.set({
				isShopAdmin: roles.isShopAdmin,
				isEventsAdmin: roles.isEventsAdmin,
				isRedirectsAdmin: roles.isRedirectsAdmin,
				isTicketsAdmin: roles.isTicketsAdmin,
				isSSO26Admin: roles.isSSO26Admin,
				isBackupAdmin: roles.isBackupAdmin,
			})
			.where(eq(user.id, userId));

		revalidatePath("/admin/super");
		return { success: true, message: "Roles updated" };
	} catch (error) {
		console.error("Error updating user roles:", error);
		return { success: false, message: "Failed to update user roles" };
	}
}
