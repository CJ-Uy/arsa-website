import { desc, eq, inArray } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { order, event } from "@/db/schema";
import { getUserAccessibleEvents } from "@/lib/eventPermissions";
import { OrdersManagement } from "./orders-management";

export default async function AdminOrdersPage({
	searchParams,
}: {
	searchParams: Promise<{ status?: string }>;
}) {
	const { status: statusFilter } = await searchParams;

	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) redirect("/shop");

	const accessible = await getUserAccessibleEvents(session.user.id);
	const shopEventIds: string[] = [];
	for (const [eid, roles] of accessible) {
		if (roles.includes("overseer") || roles.includes("shop_admin")) shopEventIds.push(eid);
	}

	// Fetch accessible event names for the filter dropdown
	const accessibleEvents = shopEventIds.length
		? await db.query.event.findMany({
				where: inArray(event.id, shopEventIds),
				columns: { id: true, name: true },
			})
		: [];

	if (!shopEventIds.length) {
		return <OrdersManagement initialOrders={[]} availableEvents={[]} />;
	}

	const orders = await db.query.order.findMany({
		where: statusFilter ? eq(order.status, statusFilter) : undefined,
		with: {
			user: { columns: { id: true, name: true, email: true } },
			orderItems: { with: { product: true } },
		},
		orderBy: [desc(order.createdAt)],
	});

	return <OrdersManagement initialOrders={orders} availableEvents={accessibleEvents} />;
}
