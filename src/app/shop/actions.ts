"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { cache, cacheKeys, withCache } from "@/lib/cache";

// Get current session
async function getSession() {
	return await auth.api.getSession({
		headers: await headers(),
	});
}

// Cart Actions
export async function addToCart(productId: string, quantity: number = 1, size?: string) {
	try {
		const session = await getSession();
		if (!session?.user) {
			return { success: false, message: "You must be logged in to add items to cart" };
		}

		const product = await prisma.product.findUnique({
			where: { id: productId },
		});

		if (!product || !product.isAvailable) {
			return { success: false, message: "Product not available" };
		}

		// Check if size is required but not provided
		if (product.availableSizes.length > 0 && !size) {
			return { success: false, message: "Please select a size" };
		}

		if (!product.isPreOrder && product.stock < quantity) {
			return { success: false, message: "Insufficient stock" };
		}

		// Normalize size to null if undefined or empty
		const normalizedSize = size ? size : null;

		// Check if item already in cart (including size)
		const existingCartItem = await prisma.cartItem.findFirst({
			where: {
				userId: session.user.id,
				productId,
				size: normalizedSize,
			},
		});

		if (existingCartItem) {
			// Update quantity
			await prisma.cartItem.update({
				where: { id: existingCartItem.id },
				data: { quantity: existingCartItem.quantity + quantity },
			});
		} else {
			// Create new cart item
			await prisma.cartItem.create({
				data: {
					userId: session.user.id,
					productId,
					quantity,
					size: normalizedSize,
				},
			});
		}

		// Invalidate cart cache
		cache.delete(cacheKeys.cart(session.user.id));

		revalidatePath("/shop");
		return { success: true, message: "Added to cart" };
	} catch (error) {
		console.error("Add to cart error:", error);
		return { success: false, message: "Failed to add to cart" };
	}
}

export async function updateCartItemQuantity(cartItemId: string, quantity: number) {
	try {
		const session = await getSession();
		if (!session?.user) {
			return { success: false, message: "Unauthorized" };
		}

		if (quantity <= 0) {
			return await removeFromCart(cartItemId);
		}

		await prisma.cartItem.update({
			where: {
				id: cartItemId,
				userId: session.user.id,
			},
			data: { quantity },
		});

		// Invalidate cart cache
		cache.delete(cacheKeys.cart(session.user.id));

		revalidatePath("/shop");
		revalidatePath("/shop/cart");
		return { success: true };
	} catch (error) {
		console.error("Update cart error:", error);
		return { success: false, message: "Failed to update cart" };
	}
}

export async function removeFromCart(cartItemId: string) {
	try {
		const session = await getSession();
		if (!session?.user) {
			return { success: false, message: "Unauthorized" };
		}

		await prisma.cartItem.delete({
			where: {
				id: cartItemId,
				userId: session.user.id,
			},
		});

		// Invalidate cart cache
		cache.delete(cacheKeys.cart(session.user.id));

		revalidatePath("/shop");
		return { success: true };
	} catch (error) {
		console.error("Remove from cart error:", error);
		return { success: false, message: "Failed to remove from cart" };
	}
}

export async function getCart() {
	try {
		const session = await getSession();
		if (!session?.user) {
			return { success: false, cart: [] };
		}

		// Cache cart for 10 seconds - it updates frequently but this still helps
		const cartItems = await withCache(
			cacheKeys.cart(session.user.id),
			10000, // 10 seconds cache
			async () => {
				return await prisma.cartItem.findMany({
					where: { userId: session.user.id },
					include: {
						product: true,
					},
					orderBy: { createdAt: "desc" },
				});
			},
		);

		return { success: true, cart: cartItems };
	} catch (error) {
		console.error("Get cart error:", error);
		return { success: false, cart: [] };
	}
}

// Order Actions
export async function createOrder(
	receiptImageUrl: string,
	notes?: string,
	firstName?: string,
	lastName?: string,
	studentId?: string,
) {
	try {
		const session = await getSession();
		if (!session?.user) {
			return { success: false, message: "Unauthorized" };
		}

		// Update user's information if provided
		const updateData: {
			firstName?: string;
			lastName?: string;
			name?: string;
			studentId?: string;
		} = {};

		if (firstName && firstName.trim()) {
			updateData.firstName = firstName.trim();
		}
		if (lastName && lastName.trim()) {
			updateData.lastName = lastName.trim();
		}
		if (firstName && lastName) {
			updateData.name = `${firstName.trim()} ${lastName.trim()}`;
		}
		if (studentId && studentId.trim()) {
			updateData.studentId = studentId.trim();
		}

		if (Object.keys(updateData).length > 0) {
			await prisma.user.update({
				where: { id: session.user.id },
				data: updateData,
			});
		}

		// Get cart items
		const cartItems = await prisma.cartItem.findMany({
			where: { userId: session.user.id },
			include: { product: true },
		});

		if (cartItems.length === 0) {
			return { success: false, message: "Cart is empty" };
		}

		// Calculate total
		const totalAmount = cartItems.reduce(
			(sum, item) => sum + item.product.price * item.quantity,
			0,
		);

		// Create order with order items
		const order = await prisma.order.create({
			data: {
				userId: session.user.id,
				totalAmount,
				receiptImageUrl,
				notes,
				status: "pending",
				orderItems: {
					create: cartItems.map((item) => ({
						productId: item.productId,
						quantity: item.quantity,
						price: item.product.price,
						size: item.size,
					})),
				},
			},
		});

		// Clear cart
		await prisma.cartItem.deleteMany({
			where: { userId: session.user.id },
		});

		revalidatePath("/shop");
		return { success: true, orderId: order.id, message: "Order created successfully" };
	} catch (error) {
		console.error("Create order error:", error);
		return { success: false, message: "Failed to create order" };
	}
}

export async function getOrders() {
	try {
		const session = await getSession();
		if (!session?.user) {
			return { success: false, orders: [] };
		}

		const orders = await prisma.order.findMany({
			where: { userId: session.user.id },
			include: {
				orderItems: {
					include: {
						product: true,
					},
				},
			},
			orderBy: { createdAt: "desc" },
		});

		return { success: true, orders };
	} catch (error) {
		console.error("Get orders error:", error);
		return { success: false, orders: [] };
	}
}

// Product Actions
export async function getProducts(category?: string) {
	try {
		// Cache products for 30 seconds to reduce DB load
		const products = await withCache(
			cacheKeys.products(category),
			30000, // 30 seconds cache
			async () => {
				return await prisma.product.findMany({
					where: {
						isAvailable: true,
						...(category && { category }),
					},
					orderBy: { createdAt: "desc" },
				});
			},
		);

		return { success: true, products };
	} catch (error) {
		console.error("Get products error:", error);
		return { success: false, products: [] };
	}
}
