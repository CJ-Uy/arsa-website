# Fix for Daily Stock Limits - Delivery Date Not Saved

## Problem

Orders are created with `deliveryDate: NULL` because the checkout doesn't save the delivery date from event custom fields to the `Order.deliveryDate` column.

## Solution

In **src/app/shop/actions.ts**, make these two changes:

### Change 1: Extract delivery date and time (around line 417-456)

**REPLACE THIS:**

```typescript
// Validate daily stock for delivery date if applicable
if (eventId && eventData) {
	// Find delivery date in event data fields
	const fields = eventData.fields as Record<string, any> | undefined;
	if (fields) {
		// Look for delivery date field
		const deliveryDateEntry = Object.entries(fields).find(([key]) =>
			key.toLowerCase().includes("delivery date"),
		);

		if (deliveryDateEntry) {
			const deliveryDateString = deliveryDateEntry[1] as string;
			if (deliveryDateString) {
				const deliveryDate = new Date(deliveryDateString);

				// Build cart items for validation
				const cartItemsForValidation = cartItems.map((item) => ({
					productId: item.productId || undefined,
					packageId: item.packageId || undefined,
					quantity: item.quantity,
				}));

				const validation = await validateDailyStockForCart(
					cartItemsForValidation,
					deliveryDate,
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
}
```

**WITH THIS:**

```typescript
// Extract delivery date and time from event data
let extractedDeliveryDate: Date | null = null;
let extractedDeliveryTimeSlot: string | null = null;

if (eventId && eventData) {
	const fields = eventData.fields as Record<string, any> | undefined;
	if (fields) {
		// Look for delivery date field (any field with "delivery" or "pickup" and "date" in the label)
		const deliveryDateEntry = Object.entries(fields).find(([key]) => {
			const lowerKey = key.toLowerCase();
			return (
				(lowerKey.includes("delivery") || lowerKey.includes("pickup")) && lowerKey.includes("date")
			);
		});

		if (deliveryDateEntry && deliveryDateEntry[1]) {
			const deliveryDateString = deliveryDateEntry[1] as string;
			extractedDeliveryDate = new Date(deliveryDateString);

			// Validate daily stock limits
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

		// Look for delivery time field
		const deliveryTimeEntry = Object.entries(fields).find(([key]) => {
			const lowerKey = key.toLowerCase();
			return (
				(lowerKey.includes("delivery") || lowerKey.includes("pickup")) && lowerKey.includes("time")
			);
		});

		if (deliveryTimeEntry && deliveryTimeEntry[1]) {
			extractedDeliveryTimeSlot = deliveryTimeEntry[1] as string;
		}
	}
}
```

### Change 2: Save delivery date and time to database (around line 562-577)

**REPLACE THIS:**

```typescript
// Create order with order items
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
		orderItems: {
			create: orderItemsData,
		},
	},
});
```

**WITH THIS:**

```typescript
// Create order with order items
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
		deliveryDate: extractedDeliveryDate,
		deliveryTimeSlot: extractedDeliveryTimeSlot,
		orderItems: {
			create: orderItemsData,
		},
	},
});
```

## What This Does

1. **Extracts** the delivery date and time from the event's custom checkout fields
2. **Stores variables** `extractedDeliveryDate` and `extractedDeliveryTimeSlot`
3. **Saves** them to the Order record when creating the order
4. **Validates** daily stock limits using the extracted date
5. **Future orders** will now have `deliveryDate` populated, so daily stock limits will work correctly

## After Applying

- New orders will have delivery dates saved
- Daily stock counting will work correctly
- The remaining slots calculation will show actual remaining stock

## Note About Existing Orders

The 55 existing orders still have `deliveryDate: NULL`. You have two options:

1. **Accept it**: Only new orders (after this fix) will have proper delivery dates
2. **Backfill**: Manually update existing orders by extracting dates from their `eventData` field

Would you like me to create a script to backfill existing orders?
