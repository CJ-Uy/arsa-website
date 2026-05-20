import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { asc, desc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { user, packageTable, product } from "@/db/schema";
import { PackagesManagement } from "./packages-management";

export const dynamic = "force-dynamic";

export default async function AdminPackagesPage() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) redirect("/shop");

	const u = await db.query.user.findFirst({
		where: eq(user.id, session.user.id),
		columns: { isShopAdmin: true },
	});
	if (!u?.isShopAdmin) redirect("/shop");

	const packages = await db.query.packageTable.findMany({
		with: {
			items: { with: { product: true } },
			pools: { with: { options: { with: { product: true } } } },
		},
		orderBy: [desc(packageTable.createdAt)],
	});

	const products = await db.query.product.findMany({
		where: eq(product.isAvailable, true),
		orderBy: [asc(product.name)],
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
