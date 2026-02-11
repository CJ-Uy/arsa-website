import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getCart, validateAndCleanCart } from "../actions";
import { CheckoutClient } from "./checkout-client";
import { getCartDailyStockInfo, getAvailableDatesForCart } from "./daily-stock-actions";

// Import types from the shared types file
import type { CheckoutConfig } from "../events/types";

export default async function CheckoutPage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		redirect("/shop");
	}

	// Clean up unavailable/sold-out items before fetching cart
	const { removedItems } = await validateAndCleanCart();

	const { cart } = await getCart();

	if (!cart || cart.length === 0) {
		redirect("/shop/cart");
	}

	// Fetch full user data including firstName, lastName, studentId
	const user = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: {
			id: true,
			email: true,
			name: true,
			firstName: true,
			lastName: true,
			studentId: true,
		},
	});

	if (!user) {
		redirect("/shop");
	}

	// Check if any cart items are associated with an event
	// Get event IDs from cart items (products or packages could be in events)
	const now = new Date();
	const activeEvents = await prisma.shopEvent.findMany({
		where: {
			isActive: true,
			startDate: { lte: now },
			endDate: { gte: now },
		},
		include: {
			products: {
				select: {
					productId: true,
					packageId: true,
				},
			},
		},
	});

	// Find if any cart items belong to an event
	let eventForCheckout: {
		id: string;
		name: string;
		checkoutConfig: CheckoutConfig | null;
	} | null = null;

	for (const event of activeEvents) {
		const eventProductIds = event.products.filter((ep) => ep.productId).map((ep) => ep.productId);
		const eventPackageIds = event.products.filter((ep) => ep.packageId).map((ep) => ep.packageId);

		const hasEventItem = cart.some(
			(item) =>
				(item.productId && eventProductIds.includes(item.productId)) ||
				(item.packageId && eventPackageIds.includes(item.packageId)),
		);

		if (hasEventItem) {
			eventForCheckout = {
				id: event.id,
				name: event.name,
				checkoutConfig: event.checkoutConfig as CheckoutConfig | null,
			};
			break;
		}
	}

	// Fetch daily stock data server-side
	let dailyStockInfo = { hasLimitedItems: false, items: [] };
	let availableDates: Array<{
		date: string;
		remaining: number;
		productStocks: Array<{ productName: string; remaining: number; limit: number }>;
	}> = [];

	if (eventForCheckout) {
		dailyStockInfo = await getCartDailyStockInfo(session.user.id, eventForCheckout.id);

		// Get available dates for the next 90 days
		if (dailyStockInfo.hasLimitedItems) {
			const startDate = new Date();
			const endDate = new Date();
			endDate.setDate(endDate.getDate() + 90);
			availableDates = await getAvailableDatesForCart(
				session.user.id,
				eventForCheckout.id,
				startDate,
				endDate,
			);
		}
	}

	return (
		<div className="container mx-auto max-w-4xl px-4 py-10">
			<h1 className="mb-8 text-4xl font-bold">Checkout</h1>
			<CheckoutClient
				cart={cart}
				user={user}
				event={eventForCheckout}
				dailyStockInfo={dailyStockInfo}
				availableDates={availableDates}
				removedItems={removedItems}
			/>
		</div>
	);
}
