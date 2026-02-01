"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { cache, cacheKeys } from "@/lib/cache";

// Get current session and verify admin access
async function verifyAdminAccess() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		return { authorized: false, message: "Unauthorized" };
	}

	const user = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: { isShopAdmin: true },
	});

	if (!user?.isShopAdmin) {
		return { authorized: false, message: "Admin access required" };
	}

	return { authorized: true, userId: session.user.id };
}

// Types for package data
export type PackageItemInput = {
	productId: string;
	quantity: number;
};

export type PackagePoolInput = {
	name: string;
	selectCount: number;
	productIds: string[];
};

export type CropPosition = {
	x: number;
	y: number;
};

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

// Get all packages with their items and pools
export async function getPackages() {
	try {
		const packages = await prisma.package.findMany({
			include: {
				items: {
					include: {
						product: true,
					},
				},
				pools: {
					include: {
						options: {
							include: {
								product: true,
							},
						},
					},
				},
			},
			orderBy: { createdAt: "desc" },
		});

		return { success: true, packages };
	} catch (error) {
		console.error("Get packages error:", error);
		return { success: false, packages: [], message: "Failed to fetch packages" };
	}
}

// Get all available products for package creation
export async function getAvailableProducts() {
	try {
		const products = await prisma.product.findMany({
			where: { isAvailable: true },
			orderBy: { name: "asc" },
		});

		return { success: true, products };
	} catch (error) {
		console.error("Get products error:", error);
		return { success: false, products: [], message: "Failed to fetch products" };
	}
}

// Create a new package
export async function createPackage(data: PackageFormData) {
	try {
		const auth = await verifyAdminAccess();
		if (!auth.authorized) {
			return { success: false, message: auth.message };
		}

		const pkg = await prisma.package.create({
			data: {
				name: data.name,
				description: data.description,
				price: data.price,
				image: data.image || null,
				imageUrls: data.imageUrls,
				imageCropPositions: data.imageCropPositions || {},
				isAvailable: data.isAvailable,
				specialNote: data.specialNote || null,
				items: {
					create: data.items.map((item) => ({
						productId: item.productId,
						quantity: item.quantity,
					})),
				},
				pools: {
					create: data.pools.map((pool) => ({
						name: pool.name,
						selectCount: pool.selectCount,
						options: {
							create: pool.productIds.map((productId) => ({
								productId,
							})),
						},
					})),
				},
			},
		});

		// Invalidate cache
		cache.deletePattern("packages:");

		return { success: true, package: pkg };
	} catch (error) {
		console.error("Create package error:", error);
		return { success: false, message: "Failed to create package" };
	}
}

// Update an existing package
export async function updatePackage(id: string, data: PackageFormData) {
	try {
		const auth = await verifyAdminAccess();
		if (!auth.authorized) {
			return { success: false, message: auth.message };
		}

		// Delete existing items and pools (will be recreated)
		await prisma.packageItem.deleteMany({ where: { packageId: id } });
		await prisma.packagePool.deleteMany({ where: { packageId: id } });

		const pkg = await prisma.package.update({
			where: { id },
			data: {
				name: data.name,
				description: data.description,
				price: data.price,
				image: data.image || null,
				imageUrls: data.imageUrls,
				imageCropPositions: data.imageCropPositions || {},
				isAvailable: data.isAvailable,
				specialNote: data.specialNote || null,
				items: {
					create: data.items.map((item) => ({
						productId: item.productId,
						quantity: item.quantity,
					})),
				},
				pools: {
					create: data.pools.map((pool) => ({
						name: pool.name,
						selectCount: pool.selectCount,
						options: {
							create: pool.productIds.map((productId) => ({
								productId,
							})),
						},
					})),
				},
			},
		});

		// Invalidate cache
		cache.deletePattern("packages:");

		return { success: true, package: pkg };
	} catch (error) {
		console.error("Update package error:", error);
		return { success: false, message: "Failed to update package" };
	}
}

// Delete a package
export async function deletePackage(id: string) {
	try {
		const auth = await verifyAdminAccess();
		if (!auth.authorized) {
			return { success: false, message: auth.message };
		}

		await prisma.package.delete({ where: { id } });

		// Invalidate cache
		cache.deletePattern("packages:");

		return { success: true };
	} catch (error) {
		console.error("Delete package error:", error);
		return { success: false, message: "Failed to delete package" };
	}
}
