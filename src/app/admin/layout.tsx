import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Package } from "lucide-react";
import { Unauthorized } from "./unauthorized";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		return <Unauthorized isLoggedIn={false} />;
	}

	// Check if user is shop admin
	const user = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: { isShopAdmin: true },
	});

	if (!user?.isShopAdmin) {
		return <Unauthorized isLoggedIn={true} />;
	}

	return (
		<div className="container mx-auto px-4 py-10">
			<div className="mb-8">
				<h1 className="mb-2 text-4xl font-bold">Admin Dashboard</h1>
				<p className="text-muted-foreground">Manage orders and products</p>
			</div>

			<div className="mb-8 flex gap-4">
				<Link href="/admin/orders">
					<Button variant="outline">
						<ShoppingCart className="mr-2 h-4 w-4" />
						Orders
					</Button>
				</Link>
				<Link href="/admin/products">
					<Button variant="outline">
						<Package className="mr-2 h-4 w-4" />
						Products
					</Button>
				</Link>
			</div>

			{children}
		</div>
	);
}
