"use server";

import { headers } from "next/headers";
import { desc, eq, asc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
	user,
	packageTable,
	packageItem,
	packagePool,
	packagePoolOption,
	product,
} from "@/db/schema";
import { cache } from "@/lib/cache";

async function verifyAdminAccess() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) return { authorized: false as const, message: "Unauthorized" };

	const u = await db.query.user.findFirst({
		where: eq(user.id, session.user.id),
		columns: { isShopAdmin: true },
	});
	if (!u?.isShopAdmin) return { authorized: false as const, message: "Admin access required" };
	return { authorized: true as const, userId: session.user.id };
}

export type PackageItemInput = {
	productId: string;
	quantity: number;
};

export type PackagePoolInput = {
	name: string;
	selectCount: number;
	productIds: string[];
};

export type CropPosition = { x: number; y: number };

export type PackageFormData = {
	name: string;
	description: string;
	price: number;
	image: string;
	imageUrls: string[];
	imageCropPositions?: Record<string, CropPosition>;
	isAvailable: boolean;
	specialNote: string;
	items: PackageItemInput[];
	pools: PackagePoolInput[];
};

export async function getPackages() {
	try {
		const packages = await db.query.packageTable.findMany({
			with: {
				items: { with: { product: true } },
				pools: { with: { options: { with: { product: true } } } },
			},
			orderBy: [desc(packageTable.createdAt)],
		});
		return { success: true, packages };
	} catch (error) {
		console.error("Get packages error:", error);
		return { success: false, packages: [], message: "Failed to fetch packages" };
	}
}

export async function getAvailableProducts() {
	try {
		const products = await db.query.product.findMany({
			where: eq(product.isAvailable, true),
			orderBy: [asc(product.name)],
		});
		return { success: true, products };
	} catch (error) {
		console.error("Get products error:", error);
		return { success: false, products: [], message: "Failed to fetch products" };
	}
}

export async function createPackage(data: PackageFormData) {
	try {
		const a = await verifyAdminAccess();
		if (!a.authorized) return { success: false, message: a.message };

		const inserted = await db
			.insert(packageTable)
			.values({
				name: data.name,
				description: data.description,
				price: data.price,
				image: data.image || null,
				imageUrls: data.imageUrls,
				imageCropPositions: data.imageCropPositions || {},
				isAvailable: data.isAvailable,
				specialNote: data.specialNote || null,
			})
			.returning();
		const pkgId = inserted[0].id;

		if (data.items.length > 0) {
			await db.insert(packageItem).values(
				data.items.map((item) => ({
					packageId: pkgId,
					productId: item.productId,
					quantity: item.quantity,
				})),
			);
		}

		for (const pool of data.pools) {
			const poolRows = await db
				.insert(packagePool)
				.values({
					packageId: pkgId,
					name: pool.name,
					selectCount: pool.selectCount,
				})
				.returning();
			const poolId = poolRows[0].id;
			if (pool.productIds.length > 0) {
				await db.insert(packagePoolOption).values(
					pool.productIds.map((productId) => ({
						poolId,
						productId,
					})),
				);
			}
		}

		await cache.deletePattern("packages:");
		return { success: true, package: inserted[0] };
	} catch (error) {
		console.error("Create package error:", error);
		return { success: false, message: "Failed to create package" };
	}
}

export async function updatePackage(id: string, data: PackageFormData) {
	try {
		const a = await verifyAdminAccess();
		if (!a.authorized) return { success: false, message: a.message };

		await db.delete(packageItem).where(eq(packageItem.packageId, id));
		await db.delete(packagePool).where(eq(packagePool.packageId, id));

		const updated = await db
			.update(packageTable)
			.set({
				name: data.name,
				description: data.description,
				price: data.price,
				image: data.image || null,
				imageUrls: data.imageUrls,
				imageCropPositions: data.imageCropPositions || {},
				isAvailable: data.isAvailable,
				specialNote: data.specialNote || null,
			})
			.where(eq(packageTable.id, id))
			.returning();

		if (data.items.length > 0) {
			await db.insert(packageItem).values(
				data.items.map((item) => ({
					packageId: id,
					productId: item.productId,
					quantity: item.quantity,
				})),
			);
		}

		for (const pool of data.pools) {
			const poolRows = await db
				.insert(packagePool)
				.values({ packageId: id, name: pool.name, selectCount: pool.selectCount })
				.returning();
			const poolId = poolRows[0].id;
			if (pool.productIds.length > 0) {
				await db.insert(packagePoolOption).values(
					pool.productIds.map((productId) => ({ poolId, productId })),
				);
			}
		}

		await cache.deletePattern("packages:");
		return { success: true, package: updated[0] };
	} catch (error) {
		console.error("Update package error:", error);
		return { success: false, message: "Failed to update package" };
	}
}

export async function deletePackage(id: string) {
	try {
		const a = await verifyAdminAccess();
		if (!a.authorized) return { success: false, message: a.message };
		await db.delete(packageTable).where(eq(packageTable.id, id));
		await cache.deletePattern("packages:");
		return { success: true };
	} catch (error) {
		console.error("Delete package error:", error);
		return { success: false, message: "Failed to delete package" };
	}
}
