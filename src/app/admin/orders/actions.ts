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
