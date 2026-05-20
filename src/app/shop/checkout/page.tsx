import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { and, eq, gte, lte } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user as userTable, shopEvent } from "@/db/schema";
import { getCart, validateAndCleanCart } from "../actions";
import { CheckoutClient } from "./checkout-client";
import { getCartDailyStockInfo, getAvailableDatesForCart } from "./daily-stock-actions";

import type { CheckoutConfig } from "../events/types";

export default async function CheckoutPage() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) redirect("/shop");

	const { removedItems } = await validateAndCleanCart();
	const { cart } = await getCart();
	if (!cart || cart.length === 0) redirect("/shop/cart");

	const user = await db.query.user.findFirst({
		where: eq(userTable.id, session.user.id),
		columns: {
			id: true,
			email: true,
			name: true,
			firstName: true,
			lastName: true,
			studentId: true,
		},
	});
	if (!user) redirect("/shop");

	const now = new Date();
	const activeEvents = await db.query.shopEvent.findMany({
		where: and(
			eq(shopEvent.isActive, true),
			lte(shopEvent.startDate, now),
			gte(shopEvent.endDate, now),
		),
		with: {
			products: { columns: { productId: true, packageId: true } },
		},
	});

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

	let dailyStockInfo = { hasLimitedItems: false, items: [] };
	let availableDates: Array<{
		date: string;
		remaining: number;
		productStocks: Array<{ productName: string; remaining: number; limit: number }>;
	}> = [];

	if (eventForCheckout) {
		dailyStockInfo = await getCartDailyStockInfo(session.user.id, eventForCheckout.id);
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
