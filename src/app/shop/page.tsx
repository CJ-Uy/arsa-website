import { getProducts } from "./actions";
import { ShopClient } from "./shop-client";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Cache for 5 minutes for remote DB - products don't change that often
export const revalidate = 300; // 5 minutes

// Generate static params at build time (optional)
export const dynamic = "force-dynamic"; // Ensure fresh session data

export default async function ARSAShopPage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	const { products } = await getProducts();

	return (
		<div className="container mx-auto px-4 py-10">
			<div className="mb-8">
				<h1 className="mb-2 text-4xl font-bold">ARSA Shop</h1>
				<p className="text-muted-foreground">
					Get official ARSA merch, items from the Arsari-Sari store, and pay for services!
				</p>
			</div>

			<ShopClient initialProducts={products} session={session} />
		</div>
	);
}
