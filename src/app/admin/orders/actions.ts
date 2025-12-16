"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

async function checkShopAdmin() {
	const session = await auth.api.getSession({
		headers: await headers(),
	});

	if (!session?.user) {
		throw new Error("Unauthorized");
	}

	const user = await prisma.user.findUnique({
		where: { id: session.user.id },
		select: { isShopAdmin: true },
	});

	if (!user?.isShopAdmin) {
		throw new Error("Forbidden: Shop admin access required");
	}

	return session;
}

export async function updateOrderStatus(orderId: string, status: string) {
	try {
		await checkShopAdmin();

		await prisma.order.update({
			where: { id: orderId },
			data: { status },
		});

		revalidatePath("/admin/orders");
		return { success: true };
	} catch (error: any) {
		return { success: false, message: error.message || "Failed to update order" };
	}
}

export async function deleteOrder(orderId: string) {
	try {
		await checkShopAdmin();

		await prisma.order.delete({
			where: { id: orderId },
		});

		revalidatePath("/admin/orders");
		return { success: true };
	} catch (error: any) {
		return { success: false, message: error.message || "Failed to delete order" };
	}
}

export async function exportOrdersData() {
	try {
		await checkShopAdmin();

		const orders = await prisma.order.findMany({
			include: {
				user: {
					select: {
						id: true,
						name: true,
						email: true,
						studentId: true,
					},
				},
				orderItems: {
					include: {
						product: {
							select: {
								name: true,
								description: true,
							},
						},
					},
				},
			},
			orderBy: { createdAt: "desc" },
		});

		// Transform data for export
		const exportData = orders.flatMap((order) =>
			order.orderItems.map((item) => ({
				"Order ID": order.id,
				"Order Date": new Date(order.createdAt).toLocaleString(),
				"Customer Name": order.user.name || "N/A",
				"Customer Email": order.user.email,
				"Student ID": order.user.studentId || "N/A",
				"Product Name": item.product.name,
				"Product Description": item.product.description,
				Size: item.size || "N/A",
				Quantity: item.quantity,
				"Unit Price": item.price,
				"Item Total": item.price * item.quantity,
				"Order Total": order.totalAmount,
				"Order Status": order.status,
				"GCash Ref No": order.gcashReferenceNumber || "N/A",
				Notes: order.notes || "",
				"Receipt URL": order.receiptImageUrl || "",
			})),
		);

		return { success: true, data: exportData };
	} catch (error: any) {
		console.error("Error exporting orders:", error);
		return { success: false, message: error.message || "Failed to export orders" };
	}
}
