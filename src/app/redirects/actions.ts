"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

async function checkRedirectsAdmin() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		throw new Error("Unauthorized");
	}

	const user = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: { isRedirectsAdmin: true },
	});

	if (!user?.isRedirectsAdmin) {
		throw new Error("Forbidden: Redirects admin access required");
	}

	return session;
}

// Actions for CRUD operations on Redirects
const redirectSchema = z.object({
	id: z.string().optional(),
	newURL: z.string().url("Must be a valid URL"),
	redirectCode: z.string().min(1, "Short Code is required"),
});

export async function createRedirect(formData: FormData) {
	try {
		await checkRedirectsAdmin();
		const data = redirectSchema.parse(Object.fromEntries(formData));
		await prisma.redirects.create({
			data: {
				newURL: data.newURL,
				redirectCode: data.redirectCode,
			},
		});
		revalidatePath("/redirects");
		return { success: true, message: "Redirect created successfully." };
	} catch (error) {
		return { success: false, message: "Failed to create redirect." };
	}
}

export async function updateRedirect(formData: FormData) {
	try {
		await checkRedirectsAdmin();
		const data = redirectSchema.parse(Object.fromEntries(formData));
		if (!data.id) throw new Error("ID is required for update.");

		await prisma.redirects.update({
			where: { id: data.id },
			data: { newURL: data.newURL, redirectCode: data.redirectCode },
		});
		revalidatePath("/redirects");
		return { success: true, message: "Redirect updated successfully." };
	} catch (error) {
		return { success: false, message: "Failed to update redirect." };
	}
}

export async function deleteRedirect(id: string) {
	try {
		await checkRedirectsAdmin();
		await prisma.redirects.delete({ where: { id } });
		revalidatePath("/redirects");
		return { success: true, message: "Redirect deleted successfully." };
	} catch (error) {
		return { success: false, message: "Failed to delete redirect." };
	}
}
