import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { product, shopEvent } from "@/db/schema";
import { ProductsManagement } from "./products-management";

export default async function AdminProductsPage() {
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

	const events = await db.query.shopEvent.findMany({
		where: eq(shopEvent.isActive, true),
		columns: { id: true, name: true, slug: true },
		orderBy: [asc(shopEvent.name)],
	});

	const products = productsRaw as any[];
	return <ProductsManagement initialProducts={products} availableEvents={events} />;
}
