import { prisma } from "../src/lib/prisma";

async function debugExport() {
	console.log("Fetching order with event data...\n");

	const order = await prisma.order.findFirst({
		where: {
			eventData: { not: null },
		},
		include: {
			event: {
				select: {
					name: true,
					checkoutConfig: true,
				},
			},
		},
	});

	if (!order) {
		console.log("No orders with event data found");
		return;
	}

	console.log("Order ID:", order.id);
	console.log("Event:", order.event?.name);
	console.log("\n=== Event Data (from order.eventData) ===");
	console.log(JSON.stringify(order.eventData, null, 2));

	console.log("\n=== Checkout Config (from event.checkoutConfig) ===");
	console.log(JSON.stringify(order.event?.checkoutConfig, null, 2));

	await prisma.$disconnect();
}

debugExport().catch(console.error);
