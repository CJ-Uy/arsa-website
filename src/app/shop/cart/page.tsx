import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getCart, type PackageSelections } from "../actions";
import { CartClient } from "./cart-client";

export default async function CartPage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		redirect("/shop");
	}

	const { cart } = await getCart();

	// Transform cart items to properly type packageSelections
	const typedCart = cart.map((item) => ({
		...item,
		packageSelections: item.packageSelections as PackageSelections | null,
	}));

	return (
		<div className="container mx-auto px-4 py-10">
			<h1 className="mb-8 text-4xl font-bold">Shopping Cart</h1>
			<CartClient initialCart={typedCart} />
		</div>
	);
}
