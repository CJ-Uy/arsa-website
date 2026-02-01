import { prisma } from "@/lib/prisma";
import { ProductsManagement } from "./products-management";

type Product = {
	id: string;
	name: string;
	description: string;
	price: number;
	category: "merch" | "arsari-sari" | "other";
	image: string | null;
	imageUrls: string[];
	imageCropPositions: Record<string, { x: number; y: number }> | null;
	stock: number | null;
	isAvailable: boolean;
	isPreOrder: boolean;
	isEventExclusive: boolean;
	availableSizes: string[];
	sizePricing: any;
	specialNote: string | null;
};

type ShopEvent = {
	id: string;
	name: string;
	slug: string;
};

export default async function AdminProductsPage() {
	const productsRaw = await prisma.product.findMany({
		include: {
			eventProducts: {
				include: {
					event: {
						select: {
							id: true,
							name: true,
							slug: true,
						},
					},
				},
			},
		},
		orderBy: { createdAt: "desc" },
	});

	// Fetch all available events for the assignment dropdown
	const events = await prisma.shopEvent.findMany({
		where: { isActive: true },
		select: {
			id: true,
			name: true,
			slug: true,
		},
		orderBy: { name: "asc" },
	});

	// Type cast to ensure category is properly typed
	const products = productsRaw as any[];

	return <ProductsManagement initialProducts={products} availableEvents={events} />;
}
