import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getCart } from "../actions";
import { CheckoutClient } from "./checkout-client";

export default async function CheckoutPage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		redirect("/shop");
	}

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

	return (
		<div className="container mx-auto max-w-4xl px-4 py-10">
			<h1 className="mb-8 text-4xl font-bold">Checkout</h1>
			<CheckoutClient cart={cart} user={user} />
		</div>
	);
}
