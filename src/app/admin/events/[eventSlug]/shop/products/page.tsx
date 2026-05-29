import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { event, eventProduct } from "@/db/schema";
import { getUserEventRoles } from "@/lib/eventPermissions";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default async function EventShopProductsPage({
	params,
}: { params: Promise<{ eventSlug: string }> }) {
	const { eventSlug } = await params;
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) redirect("/shop");

	const e = await db.query.event.findFirst({ where: eq(event.slug, eventSlug) });
	if (!e) notFound();

	const { roles } = await getUserEventRoles(session.user.id, e.id);
	if (!roles.includes("overseer") && !roles.includes("shop_admin")) {
		redirect(`/admin/events/${eventSlug}`);
	}

	// eventProduct.eventId references shopEvent.id which equals event.id (IDs preserved in backfill)
	const eventProducts = await db.query.eventProduct.findMany({
		where: eq(eventProduct.eventId, e.id),
		with: { product: true },
		orderBy: (ep, { asc }) => [asc(ep.sortOrder)],
	});

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-[#0e3663]">Products</h1>
					<p className="text-sm text-muted-foreground">Products assigned to this event</p>
				</div>
				<Button asChild variant="outline">
					<Link href="/admin/products">Manage all products</Link>
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>{eventProducts.length} product{eventProducts.length !== 1 ? "s" : ""} in this event</CardTitle>
				</CardHeader>
				<CardContent>
					{eventProducts.length === 0 ? (
						<p className="text-sm text-muted-foreground">
							No products assigned to this event. Assign products from the{" "}
							<Link href="/admin/products" className="underline">
								product management page
							</Link>
							.
						</p>
					) : (
						<div className="overflow-x-auto">
							<table className="w-full text-sm">
								<thead>
									<tr className="border-b text-left">
										<th className="pb-2 pr-4 font-medium">Name</th>
										<th className="pb-2 pr-4 font-medium">Base price</th>
										<th className="pb-2 pr-4 font-medium">Event price</th>
										<th className="pb-2 pr-4 font-medium">Code</th>
										<th className="pb-2 font-medium">Exclusive</th>
									</tr>
								</thead>
								<tbody>
									{eventProducts.map((ep) => (
										<tr key={ep.id} className="border-t">
											<td className="py-2 pr-4">{ep.product?.name ?? <span className="text-muted-foreground italic">Package / deleted</span>}</td>
											<td className="py-2 pr-4">
												{ep.product ? `₱${ep.product.price}` : <span className="text-muted-foreground">—</span>}
											</td>
											<td className="py-2 pr-4">
												{ep.eventPrice != null ? (
													`₱${ep.eventPrice}`
												) : (
													<span className="text-muted-foreground">—</span>
												)}
											</td>
											<td className="py-2 pr-4">
												{ep.productCode ? (
													<code className="text-xs bg-muted px-1 py-0.5 rounded">{ep.productCode}</code>
												) : (
													<span className="text-muted-foreground">—</span>
												)}
											</td>
											<td className="py-2">
												{ep.product?.isEventExclusive ? (
													<Badge variant="secondary">exclusive</Badge>
												) : null}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
