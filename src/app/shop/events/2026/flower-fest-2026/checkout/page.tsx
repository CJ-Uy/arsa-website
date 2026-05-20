import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { shopEvent, cartItem } from "@/db/schema";
import { FlowerFestCheckout } from "./checkout-client";

export default async function FlowerFestCheckoutPage() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) {
		redirect("/api/auth/signin?callbackUrl=/shop/events/2026/flower-fest-2026/checkout");
	}

	const event = await db.query.shopEvent.findFirst({
		where: eq(shopEvent.slug, "flower-fest-2026"),
	});
	if (!event) redirect("/shop");

	const now = new Date();
	if (now < event.startDate || now > event.endDate || !event.isActive) redirect("/shop");

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

	const cartItems = await db.query.cartItem.findMany({
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
	});

	if (cartItems.length === 0) redirect("/shop/events/2026/flower-fest-2026");

	return (
		<div className="container mx-auto py-8">
			<h1 className="mb-8 text-3xl font-bold">FlowerFest Checkout 🌸</h1>
			<FlowerFestCheckout event={event} cartItems={cartItems} user={session.user} />
		</div>
	);
}
