"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";

async function checkShopAdmin() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		throw new Error("Unauthorized");
	}

	const user = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: { isShopAdmin: true },
	});

	if (!user?.isShopAdmin) {
		throw new Error("Forbidden: Admin access required");
	}

	return session;
}

const productSchema = z.object({
	name: z.string().min(1, "Name is required"),
	description: z.string().min(1, "Description is required"),
	price: z.number().positive("Price must be positive"),
	category: z.enum(["merch", "arsari-sari", "services"]),
	image: z.string().optional(),
	stock: z.number().int().min(0, "Stock cannot be negative"),
	isAvailable: z.boolean(),
});

export async function createProduct(data: z.infer<typeof productSchema>) {
	try {
		await checkShopAdmin();

		const validated = productSchema.parse(data);

		await prisma.product.create({
			data: validated,
		});

		revalidatePath("/admin/products");
		revalidatePath("/shop");
		return { success: true };
	} catch (error: any) {
		return { success: false, message: error.message || "Failed to create product" };
	}
}

export async function updateProduct(id: string, data: z.infer<typeof productSchema>) {
	try {
		await checkShopAdmin();

		const validated = productSchema.parse(data);

		await prisma.product.update({
			where: { id },
			data: validated,
		});

		revalidatePath("/admin/products");
		revalidatePath("/shop");
		return { success: true };
	} catch (error: any) {
		return { success: false, message: error.message || "Failed to update product" };
	}
}

export async function deleteProduct(id: string) {
	try {
		await checkShopAdmin();

		await prisma.product.delete({
			where: { id },
		});

		revalidatePath("/admin/products");
		revalidatePath("/shop");
		return { success: true };
	} catch (error: any) {
		return { success: false, message: error.message || "Failed to delete product" };
	}
}
