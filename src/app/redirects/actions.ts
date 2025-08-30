"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

// Action to verify credentials
export async function verifyCredentials(formData: FormData) {
	const schema = z.object({
		username: z.string().min(1),
		password: z.string().min(1),
	});

	try {
		const data = schema.parse(Object.fromEntries(formData));

		const user = await prisma.credentials.findUnique({
			where: { username: data.username },
		});

		if (!user) {
			return { success: false, message: "Invalid credentials" };
		}

		const isPasswordValid = data.password == user.password;

		if (!isPasswordValid) {
			return { success: false, message: "Invalid credentials" };
		}
		return { success: true };
	} catch (error) {
		return { success: false, message: "An error occurred." };
	}
}

// Actions for CRUD operations on Redirects
const redirectSchema = z.object({
	id: z.string().optional(),
	newURL: z.string().url("Must be a valid URL"),
	redirectCode: z.string().min(1, "Short Code is required"),
});

export async function createRedirect(formData: FormData) {
	try {
		const data = redirectSchema.parse(Object.fromEntries(formData));
		await prisma.redirects.create({
			data: {
				newURL: data.newURL,
				redirectCode: data.redirectCode,
			},
		});
		revalidatePath("/dashboard");
		return { success: true, message: "Redirect created successfully." };
	} catch (error) {
		return { success: false, message: "Failed to create redirect." };
	}
}

export async function updateRedirect(formData: FormData) {
	try {
		const data = redirectSchema.parse(Object.fromEntries(formData));
		if (!data.id) throw new Error("ID is required for update.");

		await prisma.redirects.update({
			where: { id: data.id },
			data: { newURL: data.newURL, redirectCode: data.redirectCode },
		});
		revalidatePath("/dashboard");
		return { success: true, message: "Redirect updated successfully." };
	} catch (error) {
		return { success: false, message: "Failed to update redirect." };
	}
}

export async function deleteRedirect(id: string) {
	try {
		await prisma.redirects.delete({ where: { id } });
		revalidatePath("/dashboard");
		return { success: true, message: "Redirect deleted successfully." };
	} catch (error) {
		return { success: false, message: "Failed to delete redirect." };
	}
}
