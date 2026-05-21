"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { and, asc, count, desc, eq, gte, inArray, isNotNull, lte } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
	cartItem,
	eventProduct,
	order,
	orderItem,
	packageTable,
	product,
	shopEvent,
	shopPurchase,
	user,
} from "@/db/schema";
import { cache, cacheKeys, withCache } from "@/lib/cache";
import { sendOrderConfirmationEmail } from "@/lib/email";
import { validateDailyStockForCart } from "@/lib/daily-stock";

async function getSession() {
	return await auth.api.getSession({ headers: await headers() });
}

export async function addToCart(productId: string, quantity: number = 1, size?: string) {
	try {
		const session = await getSession();
		if (!session?.user) {
			return { success: false, message: "You must be logged in to add items to cart" };
		}

		const p = await db.query.product.findFirst({ where: eq(product.id, productId) });
		if (!p || !p.isAvailable) {
			return { success: false, message: "Product not available" };
		}

		if (p.availableSizes.length > 0 && !size) {
			return { success: false, message: "Please select a size" };
		}

		if (!p.isPreOrder && p.stock !== null && p.stock < quantity) {
			return { success: false, message: "Insufficient stock" };
		}

		const normalizedSize = size ? size : null;

		const existing = await db.query.cartItem.findFirst({
			where: and(
				eq(cartItem.userId, session.user.id),
				eq(cartItem.productId, productId),
				normalizedSize === null
					? eq(cartItem.size, null as unknown as string)
					: eq(cartItem.size, normalizedSize),
			),
		});

		if (existing) {
			await db
				.update(cartItem)
				.set({ quantity: existing.quantity + quantity })
				.where(eq(cartItem.id, existing.id));
		} else {
			await db.insert(cartItem).values({
				userId: session.user.id,
				productId,
				quantity,
				size: normalizedSize,
			});
		}

		await cache.delete(cacheKeys.cart(session.user.id));
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
		if (!session?.user) return { success: false, message: "Unauthorized" };

		if (quantity <= 0) return await removeFromCart(cartItemId);

		await db
			.update(cartItem)
			.set({ quantity })
			.where(and(eq(cartItem.id, cartItemId), eq(cartItem.userId, session.user.id)));

		await cache.delete(cacheKeys.cart(session.user.id));
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
		if (!session?.user) return { success: false, message: "Unauthorized" };

		await db
			.delete(cartItem)
			.where(and(eq(cartItem.id, cartItemId), eq(cartItem.userId, session.user.id)));

		await cache.delete(cacheKeys.cart(session.user.id));
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
		if (!session?.user) return { success: false, cart: [] };

		const cartItems = await withCache(
			cacheKeys.cart(session.user.id),
			10000,
			async () =>
				db.query.cartItem.findMany({
					where: eq(cartItem.userId, session.user.id),
					with: {
						product: true,
						package: {
							with: {
								items: { with: { product: true } },
								pools: { with: { options: { with: { product: true } } } },
							},
						},
					},
					orderBy: [desc(cartItem.createdAt)],
				}),
		);

		return { success: true, cart: cartItems };
	} catch (error) {
		console.error("Get cart error:", error);
		return { success: false, cart: [] };
	}
}

export async function validateAndCleanCart(): Promise<{
	success: boolean;
	removedItems: string[];
}> {
	try {
		const session = await getSession();
		if (!session?.user) return { success: true, removedItems: [] };

		const cartItems = await db.query.cartItem.findMany({
			where: eq(cartItem.userId, session.user.id),
			with: { product: true, package: true },
		});

		const idsToRemove: string[] = [];
		const removedNames: string[] = [];

		for (const item of cartItems) {
			let shouldRemove = false;
			let itemName = "Unknown item";

			if (item.productId && item.product) {
				itemName = item.product.name;
				if (!item.product.isAvailable) shouldRemove = true;
				else if (
					!item.product.isPreOrder &&
					item.product.stock !== null &&
					item.product.stock <= 0
				) {
					shouldRemove = true;
				}
			} else if (item.packageId && item.package) {
				itemName = item.package.name;
				if (!item.package.isAvailable) shouldRemove = true;
			} else if (!item.product && !item.package) {
				shouldRemove = true;
				itemName = "a deleted item";
			}

			if (shouldRemove) {
				idsToRemove.push(item.id);
				removedNames.push(itemName);
			}
		}

		if (idsToRemove.length > 0) {
			await db
				.delete(cartItem)
				.where(
					and(inArray(cartItem.id, idsToRemove), eq(cartItem.userId, session.user.id)),
				);
			await cache.delete(cacheKeys.cart(session.user.id));
		}

		return { success: true, removedItems: removedNames };
	} catch (error) {
		console.error("Validate and clean cart error:", error);
		return { success: false, removedItems: [] };
	}
}

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

		const pkg = await db.query.packageTable.findFirst({
			where: eq(packageTable.id, packageId),
			with: {
				items: { with: { product: true } },
				pools: { with: { options: { with: { product: true } } } },
			},
		});

		if (!pkg || !pkg.isAvailable) {
			return { success: false, message: "Package not available" };
		}

		for (const item of pkg.items) {
			const itemSelections = selections.fixedItems.filter((s) => s.productId === item.productId);
			if (itemSelections.length !== item.quantity) {
				if (item.product.availableSizes.length > 0 && itemSelections.length < item.quantity) {
					return {
						success: false,
						message: `Please select sizes for all ${item.product.name} items`,
					};
				}
			}
		}

		for (const pool of pkg.pools) {
			const poolSelection = selections.poolSelections.find((s) => s.poolId === pool.id);
			if (!poolSelection || poolSelection.selections.length !== pool.selectCount) {
				return {
					success: false,
					message: `Please select ${pool.selectCount} items from "${pool.name}"`,
				};
			}
			const validProductIds = pool.options.map((o) => o.productId);
			for (const sel of poolSelection.selections) {
				if (!validProductIds.includes(sel.productId)) {
					return { success: false, message: "Invalid product selection" };
				}
			}
		}

		await db.insert(cartItem).values({
			userId: session.user.id,
			packageId,
			quantity,
			packageSelections: selections,
		});

		await cache.delete(cacheKeys.cart(session.user.id));
		revalidatePath("/shop");
		return { success: true, message: "Package added to cart" };
	} catch (error) {
		console.error("Add package to cart error:", error);
		return { success: false, message: "Failed to add package to cart" };
	}
}

function formatPurchaseTimestamp(): string {
	const now = new Date();
	const utcPlus8Offset = 8 * 60 * 60 * 1000;
	const manilaTime = new Date(now.getTime() + utcPlus8Offset);

	const month = String(manilaTime.getUTCMonth() + 1).padStart(2, "0");
	const day = String(manilaTime.getUTCDate()).padStart(2, "0");
	const year = String(manilaTime.getUTCFullYear()).slice(-2);
	const hours = String(manilaTime.getUTCHours()).padStart(2, "0");
	const minutes = String(manilaTime.getUTCMinutes()).padStart(2, "0");
	return `${month}-${day}-${year}-${hours}:${minutes}`;
}

async function generatePurchaseCodes(
	eventId: string,
	productId: string | null,
	packageId: string | null,
	quantity: number,
	productCode: string,
): Promise<string> {
	const itemFilter = productId
		? eq(orderItem.productId, productId)
		: eq(orderItem.packageId, packageId!);

	const [r] = await db
		.select({ c: count() })
		.from(orderItem)
		.innerJoin(order, eq(orderItem.orderId, order.id))
		.where(and(eq(order.eventId, eventId), itemFilter, isNotNull(orderItem.purchaseCode)));

	const existingCount = r.c;
	const timestamp = formatPurchaseTimestamp();
	const codes: string[] = [];
	for (let i = 0; i < quantity; i++) {
		const sequenceNum = existingCount + i + 1;
		codes.push(`${productCode}_${timestamp}_${sequenceNum}`);
	}
	return codes.join(",");
}

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
		if (!session?.user) return { success: false, message: "Unauthorized" };

		if (gcashReferenceNumber) {
			const existing = await db.query.order.findFirst({
				where: eq(order.gcashReferenceNumber, gcashReferenceNumber),
				with: { user: { columns: { name: true, email: true } } },
			});
			if (existing) {
				return {
					success: false,
					message: `This GCash reference number has already been used for another order (Order ID: ${existing.id.slice(0, 8)}). Each payment can only be used for one order. Please contact support if you believe this is an error.`,
					isDuplicate: true,
				};
			}
		}

		const updateData: {
			firstName?: string;
			lastName?: string;
			name?: string;
			studentId?: string;
		} = {};
		if (firstName && firstName.trim()) updateData.firstName = firstName.trim();
		if (lastName && lastName.trim()) updateData.lastName = lastName.trim();
		if (firstName && lastName) updateData.name = `${firstName.trim()} ${lastName.trim()}`;
		if (studentId && studentId.trim()) updateData.studentId = studentId.trim();
		if (Object.keys(updateData).length > 0) {
			await db.update(user).set(updateData).where(eq(user.id, session.user.id));
		}

		const cartItems = await db.query.cartItem.findMany({
			where: eq(cartItem.userId, session.user.id),
			with: {
				product: { with: { eventProducts: true } },
				package: true,
			},
		});

		if (cartItems.length === 0) return { success: false, message: "Cart is empty" };

		const unavailableIds: string[] = [];
		const unavailableNames: string[] = [];
		for (const item of cartItems) {
			if (item.productId && item.product) {
				if (
					!item.product.isAvailable ||
					(!item.product.isPreOrder && item.product.stock !== null && item.product.stock <= 0)
				) {
					unavailableIds.push(item.id);
					unavailableNames.push(item.product.name);
				}
			} else if (item.packageId && item.package) {
				if (!item.package.isAvailable) {
					unavailableIds.push(item.id);
					unavailableNames.push(item.package.name);
				}
			}
		}
		if (unavailableIds.length > 0) {
			await db
				.delete(cartItem)
				.where(
					and(inArray(cartItem.id, unavailableIds), eq(cartItem.userId, session.user.id)),
				);
			await cache.delete(cacheKeys.cart(session.user.id));

			return {
				success: false,
				message: `The following items are no longer available and have been removed from your cart: ${unavailableNames.join(", ")}. Please review your cart and try again.`,
			};
		}

		// Cutoff time / disabled-date validation
		if (eventId && eventData) {
			const fields = eventData.fields as Record<string, any> | undefined;
			if (fields) {
				const eventForCutoff = await db.query.shopEvent.findFirst({
					where: eq(shopEvent.id, eventId),
					columns: { checkoutConfig: true },
				});

				const checkoutConfig = eventForCutoff?.checkoutConfig as {
					cutoffTime?: string;
					cutoffDaysOffset?: number;
					additionalFields?: Array<{
						id: string;
						label: string;
						type: string;
						minDateOffset?: number;
						disabledDates?: string[];
						columns?: Array<{
							id: string;
							label: string;
							type: string;
							minDateOffset?: number;
							disabledDates?: string[];
						}>;
					}>;
				} | null;

				if (checkoutConfig) {
					const now = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Manila" }));
					const todayStart = new Date(now);
					todayStart.setHours(0, 0, 0, 0);

					const datesToValidate: Array<{
						dateString: string;
						fieldLabel: string;
						minDateOffset?: number;
						disabledDates?: string[];
					}> = [];

					const isDateRelatedField = (text: string) => {
						const lower = text.toLowerCase();
						return (
							lower.includes("delivery") ||
							lower.includes("pickup") ||
							lower.includes("pick up") ||
							lower.includes("date")
						);
					};

					for (const [fieldLabel, fieldValue] of Object.entries(fields)) {
						const fieldConfig = checkoutConfig.additionalFields?.find(
							(f) => f.label === fieldLabel,
						);
						if (!fieldConfig) continue;

						if (fieldConfig.type === "date" && typeof fieldValue === "string" && fieldValue) {
							if (isDateRelatedField(`${fieldConfig.id} ${fieldConfig.label}`)) {
								datesToValidate.push({
									dateString: fieldValue,
									fieldLabel: fieldConfig.label,
									minDateOffset: fieldConfig.minDateOffset,
									disabledDates: fieldConfig.disabledDates,
								});
							}
						} else if (fieldConfig.type === "repeater" && Array.isArray(fieldValue)) {
							const dateColumns = fieldConfig.columns?.filter(
								(col) => col.type === "date" && isDateRelatedField(`${col.id} ${col.label}`),
							);
							if (dateColumns?.length) {
								for (const row of fieldValue) {
									if (!row || typeof row !== "object") continue;
									for (const col of dateColumns) {
										const cellValue = (row as Record<string, any>)[col.id];
										if (typeof cellValue === "string" && cellValue) {
											datesToValidate.push({
												dateString: cellValue,
												fieldLabel: `${fieldConfig.label} - ${col.label}`,
												minDateOffset: col.minDateOffset,
												disabledDates: col.disabledDates,
											});
										}
									}
								}
							}
						}
					}

					for (const dateInfo of datesToValidate) {
						const selectedDate = new Date(dateInfo.dateString);
						selectedDate.setHours(0, 0, 0, 0);

						if (dateInfo.minDateOffset !== undefined) {
							const minAllowed = new Date(todayStart);
							minAllowed.setDate(minAllowed.getDate() + dateInfo.minDateOffset);
							if (selectedDate < minAllowed) {
								return {
									success: false,
									message: `The selected date for "${dateInfo.fieldLabel}" is no longer available. Please choose a date on or after ${minAllowed.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.`,
								};
							}
						}

						if (dateInfo.disabledDates?.length) {
							const selectedDateStr = selectedDate.toISOString().split("T")[0];
							if (dateInfo.disabledDates.includes(selectedDateStr)) {
								return {
									success: false,
									message: `The selected date for "${dateInfo.fieldLabel}" is no longer available. Please go back and choose a different date.`,
								};
							}
						}

						if (checkoutConfig.cutoffTime) {
							const [cutoffHours, cutoffMinutes] = checkoutConfig.cutoffTime
								.split(":")
								.map(Number);
							const cutoffToday = new Date(now);
							cutoffToday.setHours(cutoffHours, cutoffMinutes, 0, 0);

							if (now > cutoffToday) {
								const daysOffset = checkoutConfig.cutoffDaysOffset || 2;
								const earliestDelivery = new Date(todayStart);
								earliestDelivery.setDate(earliestDelivery.getDate() + daysOffset);

								if (selectedDate < earliestDelivery) {
									const formattedEarliest = earliestDelivery.toLocaleDateString("en-US", {
										month: "long",
										day: "numeric",
										year: "numeric",
									});
									return {
										success: false,
										message: `We've passed today's ${checkoutConfig.cutoffTime.replace(/^0/, "")} cutoff for upcoming orders. The earliest available pickup/delivery date is ${formattedEarliest}. Please update your selected date and try again.`,
									};
								}
							}
						}
					}
				}
			}
		}

		// Daily stock validation
		if (eventId && eventData) {
			const fields = eventData.fields as Record<string, any> | undefined;
			if (fields) {
				const deliveryDateEntry = Object.entries(fields).find(([key]) =>
					key.toLowerCase().includes("delivery date"),
				);

				if (deliveryDateEntry) {
					const deliveryDateString = deliveryDateEntry[1] as string;
					if (deliveryDateString) {
						const deliveryDate = new Date(deliveryDateString);
						const cartItemsForValidation = cartItems.map((item) => ({
							productId: item.productId || undefined,
							packageId: item.packageId || undefined,
							quantity: item.quantity,
						}));
						const validation = await validateDailyStockForCart(
							cartItemsForValidation,
							deliveryDate,
							eventId,
						);
						if (!validation.valid) {
							return {
								success: false,
								message:
									validation.errors.join(", ") ||
									"Some items are not available for the selected delivery date",
							};
						}
					}
				}
			}
		}

		const getProductPrice = (item: (typeof cartItems)[0]) => {
			if (!item.product) return 0;
			if (item.size && item.product.sizePricing) {
				const sizePricing = item.product.sizePricing as Record<string, number>;
				if (sizePricing[item.size]) return sizePricing[item.size];
			}
			if (eventId && item.product.eventProducts) {
				const ep = (item.product.eventProducts as any[]).find(
					(e: any) => e.eventId === eventId,
				);
				if (ep?.eventPrice) return ep.eventPrice;
			}
			return item.product.price;
		};

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

		const eventProductMap = new Map<string, string>();
		if (eventId) {
			const eventProducts = await db.query.eventProduct.findMany({
				where: and(eq(eventProduct.eventId, eventId), isNotNull(eventProduct.productCode)),
				columns: { productId: true, packageId: true, productCode: true },
			});
			eventProducts.forEach((ep) => {
				const key = ep.productId || ep.packageId;
				if (key && ep.productCode) eventProductMap.set(key, ep.productCode);
			});
		}

		// Pre-compute purchase codes sequentially so the existingCount increments correctly
		const orderItemsData: Array<{
			productId?: string | null;
			packageId?: string | null;
			quantity: number;
			price: number;
			size?: string | null;
			packageSelections?: unknown;
			purchaseCode: string | null;
		}> = [];

		for (const item of cartItems) {
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
				orderItemsData.push({
					productId: item.productId,
					quantity: item.quantity,
					price: getProductPrice(item),
					size: item.size,
					purchaseCode,
				});
			} else {
				orderItemsData.push({
					packageId: item.packageId,
					quantity: item.quantity,
					price: item.package!.price,
					packageSelections: item.packageSelections ?? null,
					purchaseCode,
				});
			}
		}

		const orderRows = await db
			.insert(order)
			.values({
				userId: session.user.id,
				totalAmount,
				receiptImageUrl,
				gcashReferenceNumber,
				notes,
				status: "pending",
				eventId: eventId || null,
				eventData: eventData ?? null,
			})
			.returning();
		const createdOrder = orderRows[0];

		if (orderItemsData.length > 0) {
			await db
				.insert(orderItem)
				.values(orderItemsData.map((oi) => ({ ...oi, orderId: createdOrder.id })));
		}

		await db.insert(shopPurchase).values({
			orderId: createdOrder.id,
			eventId: eventId || null,
			totalAmount,
			itemCount,
		});

		await db.delete(cartItem).where(eq(cartItem.userId, session.user.id));
		await cache.delete(cacheKeys.cart(session.user.id));

		try {
			let eventName: string | undefined;
			let eventSlug: string | undefined;
			if (eventId) {
				const event = await db.query.shopEvent.findFirst({
					where: eq(shopEvent.id, eventId),
					columns: { name: true, slug: true },
				});
				eventName = event?.name;
				eventSlug = event?.slug;
			}

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

			const emailResult = await sendOrderConfirmationEmail({
				orderId: createdOrder.id,
				customerName,
				customerEmail: session.user.email,
				items: emailItems,
				totalAmount,
				eventName,
				eventSlug,
				orderDate: new Date(),
				eventData: {
					eventName,
					paymentMethod: eventData?.paymentMethod || "GCash",
					fields: eventData?.fields,
				},
			});

			if (emailResult.success) {
				await db
					.update(order)
					.set({ confirmationEmailSent: true })
					.where(eq(order.id, createdOrder.id));
			}
		} catch (emailError) {
			console.error("Failed to send order confirmation email:", emailError);
		}

		revalidatePath("/shop");
		return { success: true, orderId: createdOrder.id, message: "Order created successfully" };
	} catch (error) {
		console.error("Create order error:", error);
		return { success: false, message: "Failed to create order" };
	}
}

export async function getOrders() {
	try {
		const session = await getSession();
		if (!session?.user) return { success: false, orders: [] };

		const orders = await db.query.order.findMany({
			where: eq(order.userId, session.user.id),
			with: {
				orderItems: { with: { product: true } },
			},
			orderBy: [desc(order.createdAt)],
		});

		return { success: true, orders };
	} catch (error) {
		console.error("Get orders error:", error);
		return { success: false, orders: [] };
	}
}

export async function getProducts(category?: string) {
	try {
		const products = await withCache(
			cacheKeys.products(category),
			600000,
			async () =>
				db.query.product.findMany({
					where: category
						? and(eq(product.isAvailable, true), eq(product.category, category))
						: eq(product.isAvailable, true),
					with: {
						eventProducts: {
							with: {
								event: { columns: { id: true, name: true, slug: true } },
							},
						},
					},
					orderBy: [desc(product.createdAt)],
				}),
		);

		return { success: true, products };
	} catch (error) {
		console.error("Get products error:", error);
		return { success: false, products: [] };
	}
}

export async function getPackages() {
	try {
		const packages = await withCache(
			"packages:all",
			600000,
			async () =>
				db.query.packageTable.findMany({
					where: eq(packageTable.isAvailable, true),
					with: {
						items: { with: { product: true } },
						pools: { with: { options: { with: { product: true } } } },
					},
					orderBy: [desc(packageTable.createdAt)],
				}),
		);

		return { success: true, packages };
	} catch (error) {
		console.error("Get packages error:", error);
		return { success: false, packages: [] };
	}
}

export async function getActiveEvents() {
	try {
		const now = new Date();
		const events = await withCache(
			"events:active",
			60000,
			async () =>
				db.query.shopEvent.findMany({
					where: and(
						eq(shopEvent.isActive, true),
						lte(shopEvent.startDate, now),
						gte(shopEvent.endDate, now),
					),
					with: {
						products: {
							with: {
								product: true,
								package: {
									with: {
										items: { with: { product: true } },
										pools: { with: { options: { with: { product: true } } } },
									},
								},
							},
							orderBy: [asc(eventProduct.sortOrder)],
						},
						categories: {
							orderBy: (cat, { asc }) => [asc(cat.displayOrder)],
						},
					},
					orderBy: [desc(shopEvent.isPriority), asc(shopEvent.tabOrder)],
				}),
		);

		return { success: true, events };
	} catch (error) {
		console.error("Get active events error:", error);
		return { success: false, events: [] };
	}
}

export async function getEventBySlug(slug: string) {
	try {
		const event = await db.query.shopEvent.findFirst({
			where: eq(shopEvent.slug, slug),
			with: {
				products: {
					with: {
						product: true,
						package: {
							with: {
								items: { with: { product: true } },
								pools: { with: { options: { with: { product: true } } } },
							},
						},
					},
					orderBy: [asc(eventProduct.sortOrder)],
				},
			},
		});

		if (!event) return { success: false, event: null, message: "Event not found" };
		return { success: true, event };
	} catch (error) {
		console.error("Get event error:", error);
		return { success: false, event: null, message: "Failed to fetch event" };
	}
}
