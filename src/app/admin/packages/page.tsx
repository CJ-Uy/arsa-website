import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import { PackagesManagement } from "./packages-management";

export const dynamic = "force-dynamic";

export default async function AdminPackagesPage() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		redirect("/shop");
	}

	const user = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: { isShopAdmin: true },
	});

	if (!user?.isShopAdmin) {
		redirect("/shop");
	}

	// Fetch packages with their items and pools
	const packages = await prisma.package.findMany({
		include: {
			items: {
				include: {
					product: true,
				},
			},
			pools: {
				include: {
					options: {
						include: {
							product: true,
						},
					},
				},
			},
		},
		orderBy: { createdAt: "desc" },
	});

	// Fetch all available products for the form
	const products = await prisma.product.findMany({
		where: { isAvailable: true },
		orderBy: { name: "asc" },
	});

	return (
		<div>
			<div className="mb-6">
				<h2 className="text-2xl font-bold">Package Management</h2>
				<p className="text-muted-foreground mt-1">Create and manage product bundles/packages</p>
			</div>

			<PackagesManagement initialPackages={packages} availableProducts={products} />
		</div>
	);
}
