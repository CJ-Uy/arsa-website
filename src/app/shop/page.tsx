import { getProducts, getPackages, getActiveEvents } from "./actions";
import { ShopClient } from "./shop-client";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Cache for 5 minutes for remote DB - products don't change that often
export const revalidate = 300; // 5 minutes

export default async function ARSAShopPage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	// Fetch products, packages, and active events in parallel
	const [productsResult, packagesResult, eventsResult] = await Promise.all([
		getProducts(),
		getPackages(),
		getActiveEvents(),
	]);

	return (
		<div className="container mx-auto px-4 py-10">
			<div className="mb-8">
				<h1 className="mb-2 text-4xl font-bold">ARSA Shop</h1>
				<p className="text-muted-foreground">
					The official Ateneo Residents Hall Student Association E-Shop!
				</p>
			</div>

			<ShopClient
				initialProducts={productsResult.products}
				initialPackages={packagesResult.packages}
				initialEvents={eventsResult.events}
				session={session}
			/>
		</div>
	);
}
