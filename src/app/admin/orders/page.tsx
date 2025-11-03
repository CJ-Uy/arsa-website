import { prisma } from "@/lib/prisma";
import { OrdersManagement } from "./orders-management";

export default async function AdminOrdersPage({
	searchParams,
}: {
	searchParams: { status?: string };
}) {
	const statusFilter = searchParams.status;

	const orders = await prisma.order.findMany({
		where: statusFilter ? { status: statusFilter } : undefined,
		include: {
			user: {
				select: {
					id: true,
					name: true,
					email: true,
				},
			},
			orderItems: {
				include: {
					product: true,
				},
			},
		},
		orderBy: { createdAt: "desc" },
	});

	return <OrdersManagement initialOrders={orders} />;
}
