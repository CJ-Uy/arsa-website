# Fix for Daily Stock Limits - Extract from Repeater Fields

## Problem

Delivery dates are stored in repeater fields with dynamic column IDs like:

```json
{
	"fields": {
		"Delivery Details": [
			{
				"col-1769930609783": "2026-02-13", // Date column
				"col-1769930670051": "09:00", // Time column
				"col-1769930712174": "S412" // Location column
			}
		]
	}
}
```

## Solution

Update `src/app/shop/actions.ts` to extract dates from repeater fields.

### Replace the extraction logic (around line 417-456):

```typescript
// Extract delivery date and time from event data
let extractedDeliveryDate: Date | null = null;
let extractedDeliveryTimeSlot: string | null = null;

if (eventId && eventData) {
	const fields = eventData.fields as Record<string, any> | undefined;
	if (fields) {
		// Look for delivery/pickup fields (could be simple fields or repeater fields)
		for (const [fieldName, fieldValue] of Object.entries(fields)) {
			const lowerFieldName = fieldName.toLowerCase();
			const isDeliveryField =
				lowerFieldName.includes("delivery") || lowerFieldName.includes("pickup");

			if (!isDeliveryField) continue;

			// Check if it's a repeater field (array)
			if (Array.isArray(fieldValue) && fieldValue.length > 0) {
				// Repeater field - extract date from first row
				const firstRow = fieldValue[0];
				if (typeof firstRow === "object" && firstRow !== null) {
					// Find the date column (value that looks like a date)
					for (const [colId, colValue] of Object.entries(firstRow)) {
						if (typeof colValue === "string") {
							// Try to parse as date
							const parsedDate = new Date(colValue);
							if (!isNaN(parsedDate.getTime()) && colValue.includes("-")) {
								// Valid date format (YYYY-MM-DD)
								if (!extractedDeliveryDate) {
									extractedDeliveryDate = parsedDate;
								}
							} else if (colValue.includes(":")) {
								// Time format (HH:MM)
								if (!extractedDeliveryTimeSlot) {
									extractedDeliveryTimeSlot = colValue;
								}
							}
						}
					}
				}
			} else if (typeof fieldValue === "string") {
				// Simple field - try to parse directly
				if (lowerFieldName.includes("date")) {
					const parsedDate = new Date(fieldValue);
					if (!isNaN(parsedDate.getTime())) {
						extractedDeliveryDate = parsedDate;
					}
				} else if (lowerFieldName.includes("time")) {
					extractedDeliveryTimeSlot = fieldValue;
				}
			}

			// Stop if we found both
			if (extractedDeliveryDate && extractedDeliveryTimeSlot) break;
		}

		// Validate daily stock limits if we found a delivery date
		if (extractedDeliveryDate) {
			const cartItemsForValidation = cartItems.map((item) => ({
				productId: item.productId || undefined,
				packageId: item.packageId || undefined,
				quantity: item.quantity,
			}));

			const validation = await validateDailyStockForCart(
				cartItemsForValidation,
				extractedDeliveryDate,
				eventId,
			);

			if (!validation.valid) {
				return {
					success: false,
					message:
						validation.errors.join(", ") ||
						"Some items are not available for the selected delivery date",
				};
			}
		}
	}
}
```

### Then save to database (around line 562-577):

Add these two lines to the `prisma.order.create()`:

```typescript
deliveryDate: extractedDeliveryDate,
deliveryTimeSlot: extractedDeliveryTimeSlot,
```

The full order creation should look like:

```typescript
const order = await prisma.order.create({
	data: {
		userId: session.user.id,
		totalAmount,
		receiptImageUrl,
		gcashReferenceNumber,
		notes,
		status: "pending",
		eventId: eventId || null,
		eventData: eventData ? (eventData as Prisma.InputJsonValue) : Prisma.JsonNull,
		deliveryDate: extractedDeliveryDate, // ADD THIS
		deliveryTimeSlot: extractedDeliveryTimeSlot, // ADD THIS
		orderItems: {
			create: orderItemsData,
		},
	},
});
```

## What This Does

1. **Loops through all event fields** looking for delivery/pickup fields
2. **Handles repeater fields** (arrays) by extracting from the first row
3. **Parses dynamic column IDs** by detecting date formats (YYYY-MM-DD) and time formats (HH:MM)
4. **Falls back to simple fields** if the field is a string
5. **Validates stock** for the extracted date
6. **Saves** both date and time to the Order record

## Behavior for Multiple Deliveries

If a customer has multiple delivery rows in the repeater, this uses the **first delivery date** for:

- Daily stock validation
- The Order's `deliveryDate` field

The full delivery details are still preserved in `eventData` JSON.

## Testing

After applying this fix, create a test order and check:

1. Server console shows the extracted date in debug logs
2. The order in the database has `deliveryDate` populated
3. Daily stock limits show correct remaining counts
