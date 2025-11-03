import { prisma } from "@/lib/prisma";
import { ProductsManagement } from "./products-management";

export default async function AdminProductsPage() {
	const products = await prisma.product.findMany({
		orderBy: { createdAt: "desc" },
	});

	return <ProductsManagement initialProducts={products} />;
}
