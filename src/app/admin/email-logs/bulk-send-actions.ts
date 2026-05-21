"use server";

import { desc, eq, inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { order } from "@/db/schema";
import { sendOrderConfirmationEmail, getEmailSettings } from "@/lib/email";

export async function getOrdersWithoutEmails(options?: { limit?: number; offset?: number }) {
	try {
		const orders = await db.query.order.findMany({
			where: eq(order.confirmationEmailSent, false),
			with: {
				user: {
					columns: { email: true, firstName: true, lastName: true, name: true },
				},
				orderItems: {
					with: {
						product: { columns: { name: true } },
						package: { columns: { name: true } },
					},
				},
				event: { columns: { name: true } },
			},
			orderBy: [desc(order.createdAt)],
			limit: options?.limit || 100,
			offset: options?.offset || 0,
		});

		const totalRows = await db.query.order.findMany({
			where: eq(order.confirmationEmailSent, false),
			columns: { id: true },
		});

		return {
			orders: orders.map((o) => ({
				id: o.id,
				customerEmail: o.user.email,
				customerName: o.user.name || `${o.user.firstName} ${o.user.lastName}`.trim(),
				totalAmount: o.totalAmount,
				status: o.status,
				createdAt: o.createdAt,
				eventName: o.event?.name,
				itemCount: o.orderItems.length,
				items: o.orderItems.map((item) => ({
					name: item.product?.name || item.package?.name || "Unknown",
					size: item.size,
					quantity: item.quantity,
					price: item.price,
					purchaseCode: item.purchaseCode,
				})),
				eventData: o.eventData,
			})),
			total: totalRows.length,
		};
	} catch (error) {
		console.error("Failed to get orders without emails:", error);
		throw error;
	}
}

export async function sendBulkConfirmationEmails(orderIds: string[]) {
	try {
		const settings = await getEmailSettings();
		if (!settings?.enabled) {
			return {
				success: false,
				message: "Email notifications are disabled. Please enable them in settings first.",
			};
		}

		const results: {
			orderId: string;
			customerEmail: string;
			success: boolean;
			error?: string;
		}[] = [];

		const orders = await db.query.order.findMany({
			where: inArray(order.id, orderIds),
			with: {
				user: {
					columns: { email: true, firstName: true, lastName: true, name: true },
				},
				orderItems: {
					with: {
						product: { columns: { name: true } },
						package: { columns: { name: true } },
					},
				},
				event: { columns: { name: true } },
			},
		});

		for (const o of orders) {
			try {
				const emailData = {
					orderId: o.id,
					customerName: o.user.name || `${o.user.firstName} ${o.user.lastName}`.trim(),
					customerEmail: o.user.email,
					items: o.orderItems.map((item) => ({
						name: item.product?.name || item.package?.name || "Unknown Item",
						size: item.size,
						quantity: item.quantity,
						price: item.price,
						purchaseCode: item.purchaseCode,
					})),
					totalAmount: o.totalAmount,
					eventName: o.event?.name,
					orderDate: o.createdAt,
					eventData: o.eventData as any,
				};

				const result = await sendOrderConfirmationEmail(emailData);

				if (result.success) {
					await db
						.update(order)
						.set({ confirmationEmailSent: true })
						.where(eq(order.id, o.id));
				}

				results.push({
					orderId: o.id,
					customerEmail: o.user.email,
					success: result.success,
					error: result.message,
				});

				await new Promise((resolve) => setTimeout(resolve, 100));
			} catch (error) {
				results.push({
					orderId: o.id,
					customerEmail: o.user.email,
					success: false,
					error: error instanceof Error ? error.message : "Unknown error",
				});
			}
		}

		const successCount = results.filter((r) => r.success).length;
		const failureCount = results.filter((r) => !r.success).length;

		return {
			success: true,
			results,
			summary: { total: results.length, successful: successCount, failed: failureCount },
		};
	} catch (error) {
		console.error("Failed to send bulk emails:", error);
		return {
			success: false,
			message: error instanceof Error ? error.message : "Failed to send bulk emails",
		};
	}
}
