"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { cache, cacheKeys, withCache } from "@/lib/cache";
import { sendOrderConfirmationEmail } from "@/lib/email";

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

		if (!product.isPreOrder && product.stock !== null && product.stock < quantity) {
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
						package: {
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
						},
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

// Package Selections type for cart items
export type PackageSelections = {
	fixedItems: Array<{
		productId: string;
		itemIndex: number;
		size: string | null;
	}>;
	poolSelections: Array<{
		poolId: string;
		selections: Array<{
			productId: string;
			size: string | null;
		}>;
	}>;
};

// Add package to cart with selections
export async function addPackageToCart(
	packageId: string,
	quantity: number = 1,
	selections: PackageSelections,
) {
	try {
		const session = await getSession();
		if (!session?.user) {
			return { success: false, message: "You must be logged in to add items to cart" };
		}

		const pkg = await prisma.package.findUnique({
			where: { id: packageId },
			include: {
				items: { include: { product: true } },
				pools: { include: { options: { include: { product: true } } } },
			},
		});

		if (!pkg || !pkg.isAvailable) {
			return { success: false, message: "Package not available" };
		}

		// Validate selections
		// Check that all fixed items have sizes if required
		for (const item of pkg.items) {
			const itemSelections = selections.fixedItems.filter((s) => s.productId === item.productId);

			// Check we have the right number of selections for quantity
			if (itemSelections.length !== item.quantity) {
				// Allow if product doesn't require size
				if (item.product.availableSizes.length > 0 && itemSelections.length < item.quantity) {
					return {
						success: false,
						message: `Please select sizes for all ${item.product.name} items`,
					};
				}
			}
		}

		// Validate pool selections
		for (const pool of pkg.pools) {
			const poolSelection = selections.poolSelections.find((s) => s.poolId === pool.id);
			if (!poolSelection || poolSelection.selections.length !== pool.selectCount) {
				return {
					success: false,
					message: `Please select ${pool.selectCount} items from "${pool.name}"`,
				};
			}

			// Validate selected products are in the pool
			const validProductIds = pool.options.map((o) => o.productId);
			for (const selection of poolSelection.selections) {
				if (!validProductIds.includes(selection.productId)) {
					return { success: false, message: "Invalid product selection" };
				}
			}
		}

		// Create cart item with selections
		await prisma.cartItem.create({
			data: {
				userId: session.user.id,
				packageId,
				quantity,
				packageSelections: selections,
			},
		});

		// Invalidate cart cache
		cache.delete(cacheKeys.cart(session.user.id));

		revalidatePath("/shop");
		return { success: true, message: "Package added to cart" };
	} catch (error) {
		console.error("Add package to cart error:", error);
		return { success: false, message: "Failed to add package to cart" };
	}
}

// Purchase Code Generation Helpers

// Format timestamp as MM-DD-YY-HH:mm for purchase codes
function formatPurchaseTimestamp(): string {
	const now = new Date();
	const month = String(now.getMonth() + 1).padStart(2, "0");
	const day = String(now.getDate()).padStart(2, "0");
	const year = String(now.getFullYear()).slice(-2);
	const hours = String(now.getHours()).padStart(2, "0");
	const minutes = String(now.getMinutes()).padStart(2, "0");
	return `${month}-${day}-${year}-${hours}:${minutes}`;
}

// Generate purchase codes for an order item
async function generatePurchaseCodes(
	eventId: string,
	productId: string | null,
	packageId: string | null,
	quantity: number,
	productCode: string,
): Promise<string> {
	// Count existing items with purchase codes for this product/package in this event
	const existingCount = await prisma.orderItem.count({
		where: {
			order: { eventId },
			...(productId ? { productId } : { packageId }),
			purchaseCode: { not: null },
		},
	});

	const timestamp = formatPurchaseTimestamp();
	const codes: string[] = [];

	for (let i = 0; i < quantity; i++) {
		const sequenceNum = existingCount + i + 1;
		codes.push(`${productCode}_${timestamp}_${sequenceNum}`);
	}

	return codes.join(",");
}

// Order Actions
export async function createOrder(
	receiptImageUrl: string,
	notes?: string,
	firstName?: string,
	lastName?: string,
	studentId?: string,
	gcashReferenceNumber?: string,
	eventId?: string,
	eventData?: Record<string, any>,
) {
	try {
		const session = await getSession();
		if (!session?.user) {
			return { success: false, message: "Unauthorized" };
		}

		// Check for duplicate orders using the same GCash reference number
		if (gcashReferenceNumber) {
			const existingOrder = await prisma.order.findFirst({
				where: {
					gcashReferenceNumber,
				},
				include: {
					user: {
						select: {
							name: true,
							email: true,
						},
					},
				},
			});

			if (existingOrder) {
				return {
					success: false,
					message: `This GCash reference number has already been used for another order (Order ID: ${existingOrder.id.slice(0, 8)}). Each payment can only be used for one order. Please contact support if you believe this is an error.`,
					isDuplicate: true,
				};
			}
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

		// Get cart items with products and packages
		const cartItems = await prisma.cartItem.findMany({
			where: { userId: session.user.id },
			include: {
				product: {
					include: {
						eventProducts: true,
					},
				},
				package: true,
			},
		});

		if (cartItems.length === 0) {
			return { success: false, message: "Cart is empty" };
		}

		// Helper to get correct product price
		const getProductPrice = (item: (typeof cartItems)[0]) => {
			if (!item.product) return 0;

			// 1. Check for size-specific pricing
			if (item.size && item.product.sizePricing) {
				const sizePricing = item.product.sizePricing as Record<string, number>;
				if (sizePricing[item.size]) {
					return sizePricing[item.size];
				}
			}

			// 2. Check for event-specific pricing
			if (eventId && item.product.eventProducts) {
				const eventProduct = (item.product.eventProducts as any[]).find(
					(ep: any) => ep.eventId === eventId,
				);
				if (eventProduct?.eventPrice) {
					return eventProduct.eventPrice;
				}
			}

			// 3. Fall back to base price
			return item.product.price;
		};

		// Calculate total (products and packages)
		let totalAmount = 0;
		let itemCount = 0;
		for (const item of cartItems) {
			if (item.product) {
				const itemPrice = getProductPrice(item);
				totalAmount += itemPrice * item.quantity;
				itemCount += item.quantity;
			} else if (item.package) {
				totalAmount += item.package.price * item.quantity;
				itemCount += item.quantity;
			}
		}

		// Get EventProduct records to check for productCodes (for purchase code generation)
		const eventProductMap = new Map<string, string>(); // productId/packageId -> productCode

		if (eventId) {
			const eventProducts = await prisma.eventProduct.findMany({
				where: {
					eventId,
					productCode: { not: null },
				},
				select: {
					productId: true,
					packageId: true,
					productCode: true,
				},
			});

			eventProducts.forEach((ep) => {
				const key = ep.productId || ep.packageId;
				if (key && ep.productCode) {
					eventProductMap.set(key, ep.productCode);
				}
			});
		}

		// Build order items data with purchase codes
		const orderItemsData = await Promise.all(
			cartItems.map(async (item) => {
				const itemId = item.productId || item.packageId;
				const productCode = itemId ? eventProductMap.get(itemId) : null;

				let purchaseCode: string | null = null;
				if (productCode && eventId) {
					purchaseCode = await generatePurchaseCodes(
						eventId,
						item.productId,
						item.packageId,
						item.quantity,
						productCode,
					);
				}

				if (item.product) {
					return {
						productId: item.productId,
						quantity: item.quantity,
						price: getProductPrice(item),
						size: item.size,
						purchaseCode,
					};
				} else {
					// Package item
					return {
						packageId: item.packageId,
						quantity: item.quantity,
						price: item.package!.price,
						packageSelections: item.packageSelections
							? (item.packageSelections as Prisma.InputJsonValue)
							: Prisma.JsonNull,
						purchaseCode,
					};
				}
			}),
		);

		// Create order with order items
		const order = await prisma.order.create({
			data: {
				userId: session.user.id,
				totalAmount,
				receiptImageUrl,
				gcashReferenceNumber,
				notes,
				status: "pending",
				eventId: eventId || null,
				eventData: eventData ? (eventData as Prisma.InputJsonValue) : Prisma.JsonNull,
				orderItems: {
					create: orderItemsData,
				},
			},
		});

		// Create purchase analytics record
		await prisma.shopPurchase.create({
			data: {
				orderId: order.id,
				eventId: eventId || null,
				totalAmount,
				itemCount,
			},
		});

		// Clear cart
		await prisma.cartItem.deleteMany({
			where: { userId: session.user.id },
		});

		// Invalidate cart cache
		cache.delete(cacheKeys.cart(session.user.id));

		// Send order confirmation email (non-blocking)
		try {
			// Get event name if applicable
			let eventName: string | undefined;
			if (eventId) {
				const event = await prisma.shopEvent.findUnique({
					where: { id: eventId },
					select: { name: true },
				});
				eventName = event?.name;
			}

			// Build email data from cart items
			const emailItems = cartItems.map((item) => ({
				name: item.product?.name || item.package?.name || "Item",
				size: item.size,
				quantity: item.quantity,
				price: item.product ? getProductPrice(item) : item.package?.price || 0,
				purchaseCode:
					orderItemsData.find(
						(oi) =>
							(item.productId && oi.productId === item.productId) ||
							(item.packageId && oi.packageId === item.packageId),
					)?.purchaseCode || null,
			}));

			const customerName =
				firstName && lastName ? `${firstName} ${lastName}` : session.user.name || "Customer";

			await sendOrderConfirmationEmail({
				orderId: order.id,
				customerName,
				customerEmail: session.user.email,
				items: emailItems,
				totalAmount,
				eventName,
				orderDate: new Date(),
			});
		} catch (emailError) {
			// Log error but don't fail the order
			console.error("Failed to send order confirmation email:", emailError);
		}

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
		// Cache products for 10 minutes to handle high load (increased due to VPS latency)
		// Products rarely change, so longer cache is safe
		const products = await withCache(
			cacheKeys.products(category),
			600000, // 10 minutes cache (was 2 minutes)
			async () => {
				return await prisma.product.findMany({
					where: {
						isAvailable: true,
						...(category && { category }),
					},
					include: {
						eventProducts: {
							include: {
								event: {
									select: {
										id: true,
										name: true,
										slug: true,
									},
								},
							},
						},
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

// Package Actions
export async function getPackages() {
	try {
		const packages = await withCache(
			"packages:all",
			600000, // 10 minutes cache
			async () => {
				return await prisma.package.findMany({
					where: { isAvailable: true },
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
			},
		);

		return { success: true, packages };
	} catch (error) {
		console.error("Get packages error:", error);
		return { success: false, packages: [] };
	}
}

// Event Actions
export async function getActiveEvents() {
	try {
		const now = new Date();
		const events = await withCache(
			"events:active",
			60000, // 1 minute cache (events can change status)
			async () => {
				return await prisma.shopEvent.findMany({
					where: {
						isActive: true,
						startDate: { lte: now },
						endDate: { gte: now },
					},
					include: {
						products: {
							include: {
								product: true,
								package: {
									include: {
										items: { include: { product: true } },
										pools: { include: { options: { include: { product: true } } } },
									},
								},
							},
							orderBy: { sortOrder: "asc" },
						},
						categories: {
							orderBy: { displayOrder: "asc" },
						},
					},
					orderBy: [{ isPriority: "desc" }, { tabOrder: "asc" }],
				});
			},
		);

		return { success: true, events };
	} catch (error) {
		console.error("Get active events error:", error);
		return { success: false, events: [] };
	}
}

export async function getEventBySlug(slug: string) {
	try {
		const event = await prisma.shopEvent.findUnique({
			where: { slug },
			include: {
				products: {
					include: {
						product: true,
						package: {
							include: {
								items: { include: { product: true } },
								pools: { include: { options: { include: { product: true } } } },
							},
						},
					},
					orderBy: { sortOrder: "asc" },
				},
			},
		});

		if (!event) {
			return { success: false, event: null, message: "Event not found" };
		}

		return { success: true, event };
	} catch (error) {
		console.error("Get event error:", error);
		return { success: false, event: null, message: "Failed to fetch event" };
	}
}
