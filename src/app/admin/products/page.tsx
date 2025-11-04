import { prisma } from "@/lib/prisma";
import { ProductsManagement } from "./products-management";

type Product = {
	id: string;
	name: string;
	description: string;
	price: number;
	category: "merch" | "arsari-sari" | "other";
	image: string | null;
	stock: number;
	isAvailable: boolean;
};

export default async function AdminProductsPage() {
	const productsRaw = await prisma.product.findMany({
		orderBy: { createdAt: "desc" },
	});

	// Type cast to ensure category is properly typed
	const products = productsRaw as Product[];

	return <ProductsManagement initialProducts={products} />;
}
