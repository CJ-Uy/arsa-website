import { and, desc, eq, inArray, isNull, or } from "drizzle-orm";
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

	// Include null-eventId orders (general shop orders) for all authorized admins
	const eventFilter = or(inArray(order.eventId, shopEventIds), isNull(order.eventId));
	const orders = await db.query.order.findMany({
		where: statusFilter
			? and(eventFilter, eq(order.status, statusFilter))
			: eventFilter,
		with: {
			user: { columns: { id: true, name: true, email: true } },
			orderItems: { with: { product: true } },
		},
		orderBy: [desc(order.createdAt)],
	});

	return <OrdersManagement initialOrders={orders} availableEvents={accessibleEvents} />;
}
