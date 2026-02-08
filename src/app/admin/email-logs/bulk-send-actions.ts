"use server";

import { prisma } from "@/lib/prisma";
import { sendOrderConfirmationEmail, getEmailSettings } from "@/lib/email";

// Get orders that don't have confirmation emails sent (based on confirmationEmailSent field)
export async function getOrdersWithoutEmails(options?: { limit?: number; offset?: number }) {
	try {
		// Find all orders where confirmationEmailSent = false (regardless of status)
		const orders = await prisma.order.findMany({
			where: {
				// Orders where confirmation email has not been sent
				confirmationEmailSent: false,
			},
			include: {
				user: {
					select: {
						email: true,
						firstName: true,
						lastName: true,
						name: true,
					},
				},
				orderItems: {
					include: {
						product: {
							select: {
								name: true,
							},
						},
						package: {
							select: {
								name: true,
							},
						},
					},
				},
				event: {
					select: {
						name: true,
					},
				},
			},
			orderBy: {
				createdAt: "desc",
			},
			take: options?.limit || 100,
			skip: options?.offset || 0,
		});

		// Count total orders without confirmation emails sent
		const total = await prisma.order.count({
			where: {
				confirmationEmailSent: false,
			},
		});

		return {
			orders: orders.map((order) => ({
				id: order.id,
				customerEmail: order.user.email,
				customerName: order.user.name || `${order.user.firstName} ${order.user.lastName}`.trim(),
				totalAmount: order.totalAmount,
				status: order.status,
				createdAt: order.createdAt,
				eventName: order.event?.name,
				itemCount: order.orderItems.length,
				items: order.orderItems.map((item) => ({
					name: item.product?.name || item.package?.name || "Unknown",
					size: item.size,
					quantity: item.quantity,
					price: item.price,
					purchaseCode: item.purchaseCode,
				})),
				eventData: order.eventData,
			})),
			total,
		};
	} catch (error) {
		console.error("Failed to get orders without emails:", error);
		throw error;
	}
}

// Send confirmation emails for multiple orders
export async function sendBulkConfirmationEmails(orderIds: string[]) {
	try {
		// Check if email is enabled
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

		// Fetch all orders
		const orders = await prisma.order.findMany({
			where: {
				id: {
					in: orderIds,
				},
			},
			include: {
				user: {
					select: {
						email: true,
						firstName: true,
						lastName: true,
						name: true,
					},
				},
				orderItems: {
					include: {
						product: {
							select: {
								name: true,
							},
						},
						package: {
							select: {
								name: true,
							},
						},
					},
				},
				event: {
					select: {
						name: true,
					},
				},
			},
		});

		// Send emails one by one (to avoid rate limits and provide individual feedback)
		for (const order of orders) {
			try {
				const emailData = {
					orderId: order.id,
					customerName: order.user.name || `${order.user.firstName} ${order.user.lastName}`.trim(),
					customerEmail: order.user.email,
					items: order.orderItems.map((item) => ({
						name: item.product?.name || item.package?.name || "Unknown Item",
						size: item.size,
						quantity: item.quantity,
						price: item.price,
						purchaseCode: item.purchaseCode,
					})),
					totalAmount: order.totalAmount,
					eventName: order.event?.name,
					orderDate: order.createdAt,
					eventData: order.eventData as any,
				};

				const result = await sendOrderConfirmationEmail(emailData);

				// If email was sent successfully, mark confirmationEmailSent as true
				if (result.success) {
					await prisma.order.update({
						where: { id: order.id },
						data: { confirmationEmailSent: true },
					});
				}

				results.push({
					orderId: order.id,
					customerEmail: order.user.email,
					success: result.success,
					error: result.message,
				});

				// Small delay to avoid rate limits (100ms between emails)
				await new Promise((resolve) => setTimeout(resolve, 100));
			} catch (error) {
				results.push({
					orderId: order.id,
					customerEmail: order.user.email,
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
			summary: {
				total: results.length,
				successful: successCount,
				failed: failureCount,
			},
		};
	} catch (error) {
		console.error("Failed to send bulk emails:", error);
		return {
			success: false,
			message: error instanceof Error ? error.message : "Failed to send bulk emails",
		};
	}
}
