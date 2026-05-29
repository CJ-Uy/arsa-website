import { desc, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { product, event } from "@/db/schema";
import { getUserAccessibleEvents } from "@/lib/eventPermissions";
import { ProductsManagement } from "./products-management";

export default async function AdminProductsPage() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) redirect("/shop");

	const accessible = await getUserAccessibleEvents(session.user.id);
	const shopEventIds: string[] = [];
	for (const [eid, roles] of accessible) {
		if (roles.includes("overseer") || roles.includes("shop_admin")) shopEventIds.push(eid);
	}

	if (!shopEventIds.length) redirect("/shop");

	// Fetch accessible events from the umbrella event table for the assignment dropdown
	const events = await db.query.event.findMany({
		where: inArray(event.id, shopEventIds),
		columns: { id: true, name: true, slug: true },
	});

	const productsRaw = await db.query.product.findMany({
		with: {
			eventProducts: {
				columns: {
					eventId: true,
					eventPrice: true,
					productCode: true,
					categoryId: true,
					sortOrder: true,
				},
				with: { event: { columns: { id: true, name: true, slug: true } } },
			},
		},
		orderBy: [desc(product.createdAt)],
	});

	const products = productsRaw as any[];
	return <ProductsManagement initialProducts={products} availableEvents={events} />;
}
