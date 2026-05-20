import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { order } from "@/db/schema";
import { OrdersManagement } from "./orders-management";

export default async function AdminOrdersPage({
	searchParams,
}: {
	searchParams: Promise<{ status?: string }>;
}) {
	const { status: statusFilter } = await searchParams;

	const orders = await db.query.order.findMany({
		where: statusFilter ? eq(order.status, statusFilter) : undefined,
		with: {
			user: { columns: { id: true, name: true, email: true } },
			orderItems: { with: { product: true } },
		},
		orderBy: [desc(order.createdAt)],
	});

	return <OrdersManagement initialOrders={orders} />;
}
