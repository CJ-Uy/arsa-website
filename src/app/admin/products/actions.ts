"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user, product, eventProduct } from "@/db/schema";
import { cache } from "@/lib/cache";

async function checkShopAdmin() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) throw new Error("Unauthorized");

	const u = await db.query.user.findFirst({
		where: eq(user.id, session.user.id),
		columns: { isShopAdmin: true },
	});
	if (!u?.isShopAdmin) throw new Error("Forbidden: Admin access required");
	return session;
}

const cropPositionSchema = z.object({
	x: z.number().min(0).max(100),
	y: z.number().min(0).max(100),
});

const productSchema = z.object({
	name: z.string().min(1, "Name is required"),
	description: z.string().min(1, "Description is required"),
	price: z.number().positive("Price must be positive"),
	category: z.enum(["merch", "arsari-sari", "other"]),
	image: z.string().optional(),
	imageUrls: z.array(z.string()).default([]),
	imageCropPositions: z.record(z.string(), cropPositionSchema).optional().default({}),
	stock: z.number().int().min(0, "Stock cannot be negative").nullable(),
	isAvailable: z.boolean(),
	isPreOrder: z.boolean(),
	isEventExclusive: z.boolean().default(false),
	availableSizes: z.array(z.string()),
	sizePricing: z.record(z.string(), z.number()).nullable().optional(),
	specialNote: z.string().optional(),
	assignedEvents: z
		.array(
			z.object({
				eventId: z.string(),
				eventPrice: z.number().nullable(),
				productCode: z.string().nullable().optional(),
				categoryId: z.string().nullable().optional(),
			}),
		)
		.default([]),
});

export async function createProduct(data: z.infer<typeof productSchema>) {
	try {
		await checkShopAdmin();
		const validated = productSchema.parse(data);
		const { assignedEvents, ...productData } = validated;

		const inserted = await db.insert(product).values(productData).returning();
		const productId = inserted[0].id;

		if (assignedEvents.length > 0) {
			await db.insert(eventProduct).values(
				assignedEvents.map((event, index) => ({
					eventId: event.eventId,
					productId,
					eventPrice: event.eventPrice,
					productCode: event.productCode ?? null,
					categoryId: event.categoryId ?? null,
					sortOrder: index,
				})),
			);
		}

		await cache.deletePattern("products:.*");
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
		const { assignedEvents, ...productData } = validated;

		await db.delete(eventProduct).where(eq(eventProduct.productId, id));
		await db.update(product).set(productData).where(eq(product.id, id));

		if (assignedEvents.length > 0) {
			await db.insert(eventProduct).values(
				assignedEvents.map((event, index) => ({
					eventId: event.eventId,
					productId: id,
					eventPrice: event.eventPrice,
					productCode: event.productCode ?? null,
					categoryId: event.categoryId ?? null,
					sortOrder: index,
				})),
			);
		}

		await cache.deletePattern("products:.*");
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
		await db.delete(product).where(eq(product.id, id));
		await cache.deletePattern("products:.*");
		revalidatePath("/admin/products");
		revalidatePath("/shop");
		return { success: true };
	} catch (error: any) {
		return { success: false, message: error.message || "Failed to delete product" };
	}
}
