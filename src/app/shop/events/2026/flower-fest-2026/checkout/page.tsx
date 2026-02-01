import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { FlowerFestCheckout } from "./checkout-client";

export default async function FlowerFestCheckoutPage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		redirect("/api/auth/signin?callbackUrl=/shop/events/2026/flower-fest-2026/checkout");
	}

	// Fetch event data
	const event = await prisma.shopEvent.findUnique({
		where: { slug: "flower-fest-2026" },
	});

	if (!event) {
		redirect("/shop");
	}

	// Check if event is active
	const now = new Date();
	if (now < event.startDate || now > event.endDate || !event.isActive) {
		redirect("/shop");
	}

	// Check if shop is closed
	if (event.isShopClosed) {
		return (
			<div className="container mx-auto py-12">
				<div className="text-center">
					<h1 className="mb-4 text-2xl font-bold">Shop Temporarily Closed</h1>
					<p className="text-muted-foreground">
						{event.closureMessage || "The FlowerFest shop is currently closed."}
					</p>
				</div>
			</div>
		);
	}

	// Fetch cart items
	const cartItems = await prisma.cartItem.findMany({
		where: { userId: session.user.id },
		include: {
			product: true,
			package: {
				include: {
					items: { include: { product: true } },
					pools: { include: { options: { include: { product: true } } } },
				},
			},
		},
	});

	if (cartItems.length === 0) {
		redirect("/shop/events/2026/flower-fest-2026");
	}

	return (
		<div className="container mx-auto py-8">
			<h1 className="mb-8 text-3xl font-bold">FlowerFest Checkout 🌸</h1>
			<FlowerFestCheckout event={event} cartItems={cartItems} user={session.user} />
		</div>
	);
}
