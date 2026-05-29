import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { event, eventShop } from "@/db/schema";
import { getUserEventRoles } from "@/lib/eventPermissions";
import { ShopConfig } from "./shop-config";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default async function EventShopPage({
	params,
}: { params: Promise<{ eventSlug: string }> }) {
	const { eventSlug } = await params;
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) redirect("/shop");

	const e = await db.query.event.findFirst({
		where: eq(event.slug, eventSlug),
		with: { shop: true },
	});
	if (!e) notFound();

	const { roles } = await getUserEventRoles(session.user.id, e.id);
	if (!roles.includes("overseer") && !roles.includes("shop_admin")) {
		redirect(`/admin/events/${eventSlug}`);
	}

	if (!e.shop) {
		return (
			<div className="space-y-6">
				<h1 className="text-2xl font-bold text-[#0e3663]">Shop</h1>
				<Alert>
					<AlertDescription>
						The shop module has not been configured for this event. Enable it from the{" "}
						<Link href={`/admin/events/${eventSlug}`} className="underline font-medium">
							event overview
						</Link>{" "}
						first.
					</AlertDescription>
				</Alert>
			</div>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-[#0e3663]">Shop</h1>
					<p className="text-sm text-muted-foreground">Configure the shop module for this event</p>
				</div>
				<div className="flex items-center gap-2">
					<Button asChild variant="outline" size="sm">
						<Link href={`/admin/events/${eventSlug}/shop/products`}>Products</Link>
					</Button>
					<Button asChild variant="outline" size="sm">
						<Link href={`/admin/events/${eventSlug}/shop/categories`}>Categories</Link>
					</Button>
					<Button asChild variant="outline" size="sm">
						<Link href={`/admin/events/${eventSlug}/shop/orders`}>Orders</Link>
					</Button>
				</div>
			</div>
			<ShopConfig eventId={e.id} eventSlug={eventSlug} shopRow={e.shop} />
		</div>
	);
}
