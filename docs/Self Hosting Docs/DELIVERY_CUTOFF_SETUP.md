# Delivery Cutoff Time Setup Guide

## Quick Setup Guide for Event Delivery Management

This guide shows you how to configure delivery cutoff times and scheduling for your events.

---

## Table of Contents

1. [Database Setup](#database-setup)
2. [Configuring an Event](#configuring-an-event)
3. [How Cutoff Times Work](#how-cutoff-times-work)
4. [Testing](#testing)
5. [Troubleshooting](#troubleshooting)

---

## Database Setup

### Step 1: Run Prisma Migrations

```bash
# Generate Prisma client with new fields
npx prisma generate

# Push schema changes to database
npx prisma db push

# Restart your dev server
npm run dev
```

### New Fields Added to ShopEvent Model

```prisma
model ShopEvent {
  // ... existing fields ...

  // Delivery & Cutoff Management
  dailyCutoffTime String?              // "14:00" format (24-hour time)
  deliveryLeadDays Int @default(1)     // How many days ahead for delivery
  isShopClosed Boolean @default(false) // Temporarily close event shop
  closureMessage String?               // Message to show when closed
  allowScheduledDelivery Boolean @default(false) // Allow date/time selection

  hasCustomCheckout Boolean @default(false) // Use custom checkout component
}
```

### New Fields Added to Order Model

```prisma
model Order {
  // ... existing fields ...

  // Delivery Scheduling
  deliveryDate DateTime?      // Scheduled delivery date
  deliveryTimeSlot String?    // e.g., "Morning (9 AM - 12 PM)"
  deliveryNotes String?       // Special delivery instructions
}
```

---

## Configuring an Event

### Option 1: Using Prisma Studio (Recommended for First Time)

```bash
# Open Prisma Studio
npx prisma studio
```

1. Navigate to the `ShopEvent` table
2. Find your event (e.g., "Flower Fest 2026")
3. Set the following fields:

```
dailyCutoffTime: "14:00"           // 2 PM cutoff
deliveryLeadDays: 1                // Deliver 1 day later
allowScheduledDelivery: true       // Let customers choose date/time
isShopClosed: false                // Shop is open
closureMessage: null               // No closure message
hasCustomCheckout: true            // Using custom checkout for Flower Fest
```

4. Click "Save"

### Option 2: Using Database Query

```typescript
await prisma.shopEvent.update({
	where: { slug: "flower-fest-2026" },
	data: {
		dailyCutoffTime: "14:00", // 2 PM daily cutoff
		deliveryLeadDays: 1, // 1 day delivery lead time
		allowScheduledDelivery: true, // Allow customer to select date/time
		isShopClosed: false,
		closureMessage: null,
		hasCustomCheckout: true,
	},
});
```

---

## How Cutoff Times Work

### Scenario 1: Automatic Delivery (allowScheduledDelivery = false)

**Configuration:**

- `dailyCutoffTime = "14:00"` (2 PM)
- `deliveryLeadDays = 1`
- `allowScheduledDelivery = false`

**Customer Experience:**

| Order Time                       | Delivery Date |
| -------------------------------- | ------------- |
| Monday 1:00 PM (before cutoff)   | Tuesday       |
| Monday 3:00 PM (after cutoff)    | Wednesday     |
| Tuesday 10:00 AM (before cutoff) | Wednesday     |
| Tuesday 5:00 PM (after cutoff)   | Thursday      |

**UI Display:**

```
✓ Expected delivery: Tuesday, February 14, 2026
ℹ️ Orders placed after 2:00 PM will be delivered the next day.
```

### Scenario 2: Customer-Selected Delivery (allowScheduledDelivery = true)

**Configuration:**

- `dailyCutoffTime = "14:00"`
- `deliveryLeadDays = 1`
- `allowScheduledDelivery = true`

**Customer Experience:**

Customer sees a delivery scheduler component where they can:

1. Select delivery date from calendar (earliest allowed date calculated based on cutoff)
2. Select delivery time slot (Morning, Afternoon, Evening)

**UI Display:**

```
📅 Delivery Schedule
Expected delivery: Tuesday, February 14, 2026

[Calendar Picker]
- Dates before Tuesday are disabled
- Customer can select Tuesday or later

[Time Slot Dropdown]
- Morning (9 AM - 12 PM)
- Afternoon (12 PM - 3 PM)
- Late Afternoon (3 PM - 6 PM)
- Evening (6 PM - 9 PM)
```

### Scenario 3: Shop Closure

**Configuration:**

- `isShopClosed = true`
- `closureMessage = "We've reached our delivery capacity for this event. Thank you!"`

**Customer Experience:**

```
⚠️ Shop Temporarily Closed
We've reached our delivery capacity for this event. Thank you!
```

---

## Testing

### Test Cutoff Time Logic

1. **Before Cutoff Test:**

   ```
   Current time: 1:00 PM
   Cutoff time: 2:00 PM
   Expected: Order today → Deliver tomorrow
   ```

2. **After Cutoff Test:**

   ```
   Current time: 3:00 PM
   Cutoff time: 2:00 PM
   Expected: Order today → Deliver day after tomorrow
   ```

3. **Right at Cutoff:**
   ```
   Current time: 2:00 PM
   Cutoff time: 2:00 PM
   Expected: Should be past cutoff (use >= comparison)
   ```

### Testing Checklist

- [ ] Test order before cutoff time
- [ ] Test order after cutoff time
- [ ] Test order exactly at cutoff time
- [ ] Test with `allowScheduledDelivery = false` (automatic)
- [ ] Test with `allowScheduledDelivery = true` (customer choice)
- [ ] Test shop closure (`isShopClosed = true`)
- [ ] Test that closed shop shows closure message
- [ ] Verify delivery date is saved to order
- [ ] Verify delivery time slot is saved to order
- [ ] Check order details page shows delivery info
- [ ] Verify admin can see delivery date/time in orders

---

## Configuration Examples

### Example 1: Same-Day Delivery Before Noon

```typescript
{
  dailyCutoffTime: "12:00",          // Noon cutoff
  deliveryLeadDays: 0,               // Same day delivery
  allowScheduledDelivery: false,
}
```

**Result:** Orders before noon deliver same day, orders after noon deliver next day.

### Example 2: Next-Day Delivery with 2 PM Cutoff

```typescript
{
  dailyCutoffTime: "14:00",          // 2 PM cutoff
  deliveryLeadDays: 1,               // Next day
  allowScheduledDelivery: false,
}
```

**Result:** Orders before 2 PM deliver next day, orders after 2 PM deliver in 2 days.

### Example 3: Schedule Your Own Delivery

```typescript
{
  dailyCutoffTime: "14:00",
  deliveryLeadDays: 1,
  allowScheduledDelivery: true,      // Customer picks date/time
}
```

**Result:** Customer can select delivery date (earliest = next day if before 2 PM, or day after tomorrow if after 2 PM).

### Example 4: No Cutoff Time (Always Next Day)

```typescript
{
  dailyCutoffTime: null,             // No cutoff
  deliveryLeadDays: 1,
  allowScheduledDelivery: false,
}
```

**Result:** All orders deliver next day regardless of order time.

---

## Troubleshooting

### Issue: Delivery dates are wrong

**Check:**

1. Verify `dailyCutoffTime` format is "HH:MM" (24-hour time)
2. Check `deliveryLeadDays` is a number
3. Verify server timezone matches expected timezone
4. Check that dates are stored in UTC in database

### Issue: Cutoff message doesn't show

**Check:**

1. Verify current time is actually past cutoff
2. Check that event has `dailyCutoffTime` set
3. Look for console errors in browser
4. Verify component is receiving event data

### Issue: Can't select delivery date

**Check:**

1. `allowScheduledDelivery` should be `true`
2. Event must not be closed (`isShopClosed = false`)
3. Check for validation errors in browser console
4. Verify delivery dates aren't in the past

### Issue: Orders not saving delivery info

**Check:**

1. Verify `deliveryDate` and `deliveryTimeSlot` are being passed to server action
2. Check database schema has delivery fields
3. Look for errors in server logs
4. Verify Prisma client was regenerated after schema changes

---

## Quick Reference: Field Definitions

| Field                    | Type    | Description                                      | Example        |
| ------------------------ | ------- | ------------------------------------------------ | -------------- |
| `dailyCutoffTime`        | String  | Time of day for same-day cutoff (24-hour format) | "14:00" = 2 PM |
| `deliveryLeadDays`       | Int     | How many days ahead for delivery                 | 1 = next day   |
| `allowScheduledDelivery` | Boolean | Let customers choose delivery date/time          | true or false  |
| `isShopClosed`           | Boolean | Temporarily close shop                           | true or false  |
| `closureMessage`         | String  | Message shown when shop is closed                | "Sold out!"    |
| `hasCustomCheckout`      | Boolean | Use custom checkout component                    | true or false  |

---

## Next Steps

1. ✅ Database fields are already added (from previous steps)
2. ✅ Utility functions created ([src/lib/deliveryScheduling.ts](../src/lib/deliveryScheduling.ts))
3. ✅ Component created ([src/components/shop/delivery-schedule-selector.tsx](../src/components/shop/delivery-schedule-selector.tsx))
4. ✅ Custom checkout example created (Flower Fest 2026)
5. Configure your event using Prisma Studio or database query
6. Test the delivery scheduling in development
7. Deploy and monitor

For custom event pages with complex checkout, see: [CUSTOM_EVENT_PAGES.md](CUSTOM_EVENT_PAGES.md)
