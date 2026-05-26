import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { desc, eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { event, order } from "@/db/schema";
import { getUserEventRoles } from "@/lib/eventPermissions";
import { OrdersManagement } from "@/app/admin/orders/orders-management";

export default async function EventShopOrdersPage({
	params,
}: { params: Promise<{ eventSlug: string }> }) {
	const { eventSlug } = await params;
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) redirect("/shop");

	const e = await db.query.event.findFirst({ where: eq(event.slug, eventSlug) });
	if (!e) notFound();

	const { roles } = await getUserEventRoles(session.user.id, e.id);
	if (!roles.includes("overseer") && !roles.includes("shop_admin")) {
		redirect(`/admin/events/${eventSlug}`);
	}

	// order.eventId references shopEvent.id which equals event.id (IDs preserved in backfill)
	const orders = await db.query.order.findMany({
		where: eq(order.eventId, e.id),
		with: {
			user: { columns: { id: true, name: true, email: true } },
			orderItems: { with: { product: true } },
		},
		orderBy: [desc(order.createdAt)],
	});

	return (
		<div className="space-y-4">
			<div>
				<h1 className="text-2xl font-bold text-[#0e3663]">Orders</h1>
				<p className="text-sm text-muted-foreground">
					{orders.length} order{orders.length !== 1 ? "s" : ""} for this event
				</p>
			</div>
			<OrdersManagement initialOrders={orders} />
		</div>
	);
}
