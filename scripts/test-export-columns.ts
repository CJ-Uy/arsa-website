import { prisma } from "../src/lib/prisma";

/**
 * Parse checkout config to get field definitions with proper labels
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseCheckoutConfig(
	checkoutConfig: any,
): Map<string, { label: string; type: string; columns?: any[] }> {
	const fieldMap = new Map();

	if (!checkoutConfig?.additionalFields) return fieldMap;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	checkoutConfig.additionalFields.forEach((field: any) => {
		// Use the field label as the key (that's what's stored in order.eventData.fields)
		fieldMap.set(field.label, {
			label: field.label,
			type: field.type,
			columns: field.columns, // For repeater fields
		});
	});

	return fieldMap;
}

async function testExportColumns() {
	console.log("Testing export column generation...\n");

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

	if (!order || !order.event?.checkoutConfig) {
		console.log("No orders with event data found");
		return;
	}

	console.log("Order ID:", order.id);
	console.log("Event:", order.event?.name);

	const fieldMap = parseCheckoutConfig(order.event.checkoutConfig);
	console.log("\n=== Parsed Field Map ===");
	fieldMap.forEach((fieldDef, key) => {
		console.log(`${key}:`);
		console.log(`  Type: ${fieldDef.type}`);
		if (fieldDef.columns) {
			console.log(
				`  Columns: ${fieldDef.columns.map((c: any) => `${c.label} (${c.id})`).join(", ")}`,
			);
		}
	});

	const eventDataWrapper = order.eventData as any;
	const eventData = eventDataWrapper.fields || eventDataWrapper;

	console.log("\n=== Processing Event Data ===");
	const columns: string[] = [];

	Object.keys(eventData).forEach((key) => {
		if (key === "eventName") return;

		const fieldDef = fieldMap.get(key);
		const value = eventData[key];

		console.log(`\nField: ${key}`);
		console.log(`  Found in config: ${!!fieldDef}`);
		console.log(`  Type: ${fieldDef?.type || "unknown"}`);
		console.log(`  Value type: ${Array.isArray(value) ? "array" : typeof value}`);

		if (fieldDef?.type === "repeater" && Array.isArray(value)) {
			console.log(`  Repeater with ${value.length} rows`);
			if (fieldDef.columns) {
				for (let i = 1; i <= value.length; i++) {
					fieldDef.columns.forEach((column: any) => {
						const colName = `${column.label} ${i}`;
						columns.push(colName);
						const subValue = value[i - 1][column.id];
						console.log(`    ${colName}: ${subValue}`);
					});
				}
			}
		} else if (fieldDef?.type !== "message") {
			columns.push(fieldDef?.label || key);
			console.log(`  Simple field: ${fieldDef?.label || key} = ${value}`);
		}
	});

	console.log("\n=== Final Columns ===");
	columns.forEach((col, i) => {
		console.log(`${i + 1}. ${col}`);
	});

	await prisma.$disconnect();
}

testExportColumns().catch(console.error);
