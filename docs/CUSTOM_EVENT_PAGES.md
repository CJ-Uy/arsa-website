# Custom Event Pages Guide

## Building Fully Custom Event Experiences

This guide explains how to create completely custom pages for major events like Flower Fest 2026, where the generic event system isn't enough and you need full control over:

- Custom product display
- Custom checkout flows with advanced fields (date/time pickers, etc.)
- Custom validation logic
- Custom delivery scheduling
- Custom UI/UX

---

## Table of Contents

1. [When to Use Custom Pages](#when-to-use-custom-pages)
2. [Architecture Overview](#architecture-overview)
3. [File Structure](#file-structure)
4. [Custom Product Display](#custom-product-display)
5. [Custom Checkout Flow](#custom-checkout-flow)
6. [Delivery Scheduling](#delivery-scheduling)
7. [Complete Example: Flower Fest 2026](#complete-example-flower-fest-2026)
8. [Database Setup](#database-setup)
9. [Deployment Checklist](#deployment-checklist)

---

## When to Use Custom Pages

### Use Generic Event System When:

- Event has standard product display needs
- Checkout needs only simple additional fields (text, select, checkbox)
- Default delivery scheduling is sufficient
- Event theme can be achieved with colors/animations config

### Use Custom Pages When:

- Event requires complex product categorization or display
- Checkout needs advanced input types (date/time pickers, file uploads, multi-step forms)
- Custom delivery scheduling logic (time slots, location-based, etc.)
- Highly customized UI/UX that can't be achieved with theme config
- Integration with external systems (payment, inventory, etc.)
- Complex validation rules or business logic

**Examples:**

- ✅ **Custom Page**: Flower Fest 2026 - needs time/date delivery selection, room-by-room organization, custom bouquet builder
- ❌ **Generic System**: Valentine's Day Sale - just needs red/pink theme and "Message" field at checkout

---

## Architecture Overview

### System Components

```
1. Database Event Record
   ↓
2. Event Page Route (Next.js)
   ↓
3. Custom Components (Product Display, Cart, Checkout)
   ↓
4. Custom Server Actions (Order Processing)
   ↓
5. Order Storage (with custom eventData)
```

### Two Approaches

#### Approach 1: Completely Standalone

Build a completely separate page that doesn't use the generic shop system at all.

**Pros:**

- Full control
- No constraints from generic system
- Can use different data models if needed

**Cons:**

- More code duplication
- Need to reimplement cart, checkout, etc.
- Harder to maintain

#### Approach 2: Extend Generic System (Recommended)

Use the generic shop system's infrastructure (cart, orders) but override the UI/UX layers.

**Pros:**

- Reuse cart and order logic
- Admin interface still works
- Less code duplication
- Easier to maintain

**Cons:**

- Still constrained by Order model schema
- Need to work within existing patterns

**We recommend Approach 2** - extend the generic system while overriding display and checkout.

---

## File Structure

### Recommended Structure for Custom Event

```
src/app/shop/events/2026/flower-fest-2026/
  ├── page.tsx                    # Main event page (server component)
  ├── shop-client.tsx             # Product display client component
  ├── checkout-client.tsx         # Custom checkout client component
  ├── actions.ts                  # Custom server actions
  ├── components/
  │   ├── bouquet-builder.tsx     # Event-specific components
  │   ├── room-selector.tsx
  │   └── delivery-scheduler.tsx
  ├── lib/
  │   ├── validation.ts           # Custom validation logic
  │   └── pricing.ts              # Custom pricing logic
  └── types.ts                    # Type definitions

src/components/shop/
  └── delivery-schedule-selector.tsx  # Reusable delivery component
```

---

## Custom Product Display

### Basic Pattern

```typescript
// src/app/shop/events/2026/flower-fest-2026/page.tsx
import { prisma } from "@/lib/prisma";
import { ShopClient } from "./shop-client";

export default async function FlowerFest2026Page() {
	// Fetch event data
	const event = await prisma.shopEvent.findUnique({
		where: { slug: "flower-fest-2026" },
		include: {
			products: {
				include: {
					product: true,
					package: {
						include: {
							items: { include: { product: true } },
							pools: { include: { options: { include: { product: true } } } },
						},
					},
				},
				orderBy: { sortOrder: "asc" },
			},
		},
	});

	if (!event) {
		return <div>Event not found</div>;
	}

	// Check if event is active
	const now = new Date();
	if (now < event.startDate || now > event.endDate || !event.isActive) {
		return <div>This event is not currently active</div>;
	}

	// Check if shop is closed
	if (event.isShopClosed) {
		return <div>{event.closureMessage || "Event shop is currently closed"}</div>;
	}

	// Extract products
	const products = event.products.map((ep) => ({
		...(ep.product || ep.package),
		eventPrice: ep.eventPrice,
	}));

	return (
		<div>
			<ShopClient event={event} products={products} />
		</div>
	);
}
```

### Custom Product Organization

```typescript
// src/app/shop/events/2026/flower-fest-2026/shop-client.tsx
"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Product = {
	id: string;
	name: string;
	description: string;
	price: number;
	category: string;
	// ... other fields
};

export function ShopClient({ event, products }: Props) {
	const [selectedCategory, setSelectedCategory] = useState("bouquets");

	// Custom categorization
	const categories = {
		bouquets: products.filter((p) => p.category === "bouquets"),
		arrangements: products.filter((p) => p.category === "arrangements"),
		addons: products.filter((p) => p.category === "add-ons"),
	};

	return (
		<div className="container mx-auto py-8">
			{/* Custom Header */}
			<div className="mb-8 text-center">
				<h1 className="text-4xl font-bold">🌸 Flower Fest 2026 🌸</h1>
				<p className="text-muted-foreground mt-2">{event.description}</p>
			</div>

			{/* Custom Navigation */}
			<Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
				<TabsList className="grid w-full grid-cols-3">
					<TabsTrigger value="bouquets">Bouquets</TabsTrigger>
					<TabsTrigger value="arrangements">Arrangements</TabsTrigger>
					<TabsTrigger value="addons">Add-ons</TabsTrigger>
				</TabsList>

				<TabsContent value="bouquets">
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
						{categories.bouquets.map((product) => (
							<ProductCard key={product.id} product={product} />
						))}
					</div>
				</TabsContent>

				<TabsContent value="arrangements">
					{/* Custom layout for arrangements */}
				</TabsContent>

				<TabsContent value="addons">
					{/* Add-ons display */}
				</TabsContent>
			</Tabs>
		</div>
	);
}
```

---

## Custom Checkout Flow

### Complete Custom Checkout Component

```typescript
// src/app/shop/events/2026/flower-fest-2026/checkout-client.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { DeliveryScheduleSelector } from "@/components/shop/delivery-schedule-selector";
import { createFlowerFestOrder } from "./actions";
import { toast } from "sonner";

type CheckoutFormData = {
	// Standard fields
	notes: string;

	// Flower Fest specific fields
	recipientName: string;
	recipientRoom: string;
	deliveryDate: Date | null;
	deliveryTimeSlot: string | null;
	cardMessage: string;
	isAnonymous: boolean;

	// Payment
	receiptFile: File | null;
};

export function FlowerFestCheckout({ event, cartItems }: Props) {
	const router = useRouter();
	const [loading, setLoading] = useState(false);
	const [formData, setFormData] = useState<CheckoutFormData>({
		notes: "",
		recipientName: "",
		recipientRoom: "",
		deliveryDate: null,
		deliveryTimeSlot: null,
		cardMessage: "",
		isAnonymous: false,
		receiptFile: null,
	});

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();

		// Validation
		if (!formData.recipientName) {
			toast.error("Please enter recipient name");
			return;
		}

		if (!formData.recipientRoom) {
			toast.error("Please enter recipient room number");
			return;
		}

		if (!formData.deliveryDate || !formData.deliveryTimeSlot) {
			toast.error("Please select delivery date and time");
			return;
		}

		if (!formData.receiptFile) {
			toast.error("Please upload payment receipt");
			return;
		}

		setLoading(true);

		try {
			// Upload receipt
			const receiptFormData = new FormData();
			receiptFormData.append("file", formData.receiptFile);
			receiptFormData.append("type", "receipt");

			const uploadRes = await fetch("/api/upload", {
				method: "POST",
				body: receiptFormData,
			});

			if (!uploadRes.ok) {
				throw new Error("Failed to upload receipt");
			}

			const { url: receiptUrl } = await uploadRes.json();

			// Create order with custom data
			const result = await createFlowerFestOrder({
				eventId: event.id,
				cartItems,
				receiptUrl,
				customData: {
					recipientName: formData.recipientName,
					recipientRoom: formData.recipientRoom,
					deliveryDate: formData.deliveryDate.toISOString(),
					deliveryTimeSlot: formData.deliveryTimeSlot,
					cardMessage: formData.cardMessage,
					isAnonymous: formData.isAnonymous,
				},
				notes: formData.notes,
			});

			if (result.success) {
				toast.success("Order placed successfully!");
				router.push(`/shop/orders/${result.orderId}`);
			} else {
				toast.error(result.message || "Failed to create order");
			}
		} catch (error) {
			console.error("Checkout error:", error);
			toast.error("An error occurred during checkout");
		} finally {
			setLoading(false);
		}
	}

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			{/* Recipient Information */}
			<Card className="p-6">
				<h2 className="text-xl font-bold mb-4">Recipient Information</h2>

				<div className="space-y-4">
					<div>
						<Label htmlFor="recipient-name">
							Recipient Name <span className="text-destructive">*</span>
						</Label>
						<Input
							id="recipient-name"
							value={formData.recipientName}
							onChange={(e) =>
								setFormData({ ...formData, recipientName: e.target.value })
							}
							placeholder="Full name"
							required
						/>
					</div>

					<div>
						<Label htmlFor="recipient-room">
							Room Number <span className="text-destructive">*</span>
						</Label>
						<Input
							id="recipient-room"
							value={formData.recipientRoom}
							onChange={(e) =>
								setFormData({ ...formData, recipientRoom: e.target.value })
							}
							placeholder="e.g., 301"
							required
						/>
					</div>
				</div>
			</Card>

			{/* Delivery Schedule */}
			<DeliveryScheduleSelector
				event={event}
				onDeliveryChange={(date, timeSlot) => {
					setFormData({
						...formData,
						deliveryDate: date,
						deliveryTimeSlot: timeSlot,
					});
				}}
				required
			/>

			{/* Card Message */}
			<Card className="p-6">
				<h2 className="text-xl font-bold mb-4">Card Message</h2>

				<div className="space-y-4">
					<div>
						<Label htmlFor="card-message">Message (optional)</Label>
						<Textarea
							id="card-message"
							value={formData.cardMessage}
							onChange={(e) =>
								setFormData({ ...formData, cardMessage: e.target.value })
							}
							placeholder="Your message to the recipient..."
							rows={4}
							maxLength={200}
						/>
						<p className="text-muted-foreground text-sm mt-1">
							{formData.cardMessage.length}/200 characters
						</p>
					</div>

					<div className="flex items-center space-x-2">
						<input
							type="checkbox"
							id="anonymous"
							checked={formData.isAnonymous}
							onChange={(e) =>
								setFormData({ ...formData, isAnonymous: e.target.checked })
							}
						/>
						<Label htmlFor="anonymous" className="cursor-pointer">
							Send anonymously (don't include my name)
						</Label>
					</div>
				</div>
			</Card>

			{/* Payment */}
			<Card className="p-6">
				<h2 className="text-xl font-bold mb-4">Payment</h2>

				<div className="space-y-4">
					<div>
						<Label htmlFor="receipt">
							GCash Receipt <span className="text-destructive">*</span>
						</Label>
						<Input
							id="receipt"
							type="file"
							accept="image/*"
							onChange={(e) =>
								setFormData({
									...formData,
									receiptFile: e.target.files?.[0] || null,
								})
							}
							required
						/>
						<p className="text-muted-foreground text-sm mt-1">
							Upload screenshot of your GCash payment receipt
						</p>
					</div>
				</div>
			</Card>

			{/* Submit */}
			<Button type="submit" className="w-full" size="lg" disabled={loading}>
				{loading ? "Processing..." : "Place Order"}
			</Button>
		</form>
	);
}
```

### Custom Server Actions

```typescript
// src/app/shop/events/2026/flower-fest-2026/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { readGCashReceiptClient } from "@/lib/gcashReaders/readReceipt.client";
import { isValidDeliveryDate } from "@/lib/deliveryScheduling";

type CreateOrderData = {
	eventId: string;
	cartItems: any[];
	receiptUrl: string;
	customData: {
		recipientName: string;
		recipientRoom: string;
		deliveryDate: string; // ISO string
		deliveryTimeSlot: string;
		cardMessage: string;
		isAnonymous: boolean;
	};
	notes: string;
};

export async function createFlowerFestOrder(data: CreateOrderData) {
	// Auth check
	const session = await auth();
	if (!session?.user) {
		return { success: false, message: "Not authenticated" };
	}

	try {
		// Get event for validation
		const event = await prisma.shopEvent.findUnique({
			where: { id: data.eventId },
		});

		if (!event) {
			return { success: false, message: "Event not found" };
		}

		// Validate delivery date
		const deliveryDate = new Date(data.customData.deliveryDate);
		const validation = isValidDeliveryDate(deliveryDate, event);

		if (!validation.valid) {
			return { success: false, message: validation.error };
		}

		// Calculate total (you'd implement this based on cart items)
		const totalAmount = calculateTotal(data.cartItems);

		// Create order
		const order = await prisma.order.create({
			data: {
				userId: session.user.id,
				eventId: data.eventId,
				totalAmount,
				status: "pending",
				receiptImageUrl: data.receiptUrl,
				notes: data.notes,

				// Delivery scheduling
				deliveryDate,
				deliveryTimeSlot: data.customData.deliveryTimeSlot,

				// Custom event data (stored as JSON)
				eventData: {
					recipientName: data.customData.recipientName,
					recipientRoom: data.customData.recipientRoom,
					cardMessage: data.customData.cardMessage,
					isAnonymous: data.customData.isAnonymous,
				},

				// Order items
				orderItems: {
					create: data.cartItems.map((item) => ({
						productId: item.productId,
						quantity: item.quantity,
						price: item.price,
						size: item.size,
					})),
				},
			},
		});

		// Clear cart
		await prisma.cartItem.deleteMany({
			where: { userId: session.user.id },
		});

		// Create analytics record
		await prisma.shopPurchase.create({
			data: {
				orderId: order.id,
				eventId: data.eventId,
				totalAmount,
				itemCount: data.cartItems.length,
			},
		});

		return { success: true, orderId: order.id };
	} catch (error) {
		console.error("Order creation error:", error);
		return { success: false, message: "Failed to create order" };
	}
}

function calculateTotal(cartItems: any[]): number {
	return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
}
```

---

## Delivery Scheduling

### Using the Delivery Schedule Selector

The delivery schedule selector component is already created and reusable. It handles:

- Cutoff time logic
- Delivery date validation
- Time slot selection
- Shop closure detection

**Usage:**

```typescript
import { DeliveryScheduleSelector } from "@/components/shop/delivery-schedule-selector";

<DeliveryScheduleSelector
	event={event}
	onDeliveryChange={(date, timeSlot) => {
		setFormData({
			...formData,
			deliveryDate: date,
			deliveryTimeSlot: timeSlot,
		});
	}}
	required
/>;
```

### Database Configuration

Configure delivery settings in the event:

```typescript
const event = await prisma.shopEvent.update({
	where: { slug: "flower-fest-2026" },
	data: {
		// Cutoff time (2 PM daily)
		dailyCutoffTime: "14:00",

		// Delivery lead time (1 day)
		deliveryLeadDays: 1,

		// Allow customers to choose delivery date/time
		allowScheduledDelivery: true,

		// Shop status
		isShopClosed: false,
		closureMessage: null,
	},
});
```

---

## Complete Example: Flower Fest 2026

### Step 1: Database Setup

```bash
# Run Prisma migration
npx prisma db push

# Open Prisma Studio
npx prisma studio
```

In Prisma Studio, create/update the Flower Fest event:

```
name: "Flower Fest 2026"
slug: "flower-fest-2026"
description: "Valentine's flower delivery for the dorm"
startDate: 2026-02-01T00:00:00.000Z
endDate: 2026-02-14T23:59:59.999Z
isActive: true
isPriority: true

dailyCutoffTime: "14:00"
deliveryLeadDays: 1
allowScheduledDelivery: true
isShopClosed: false

hasCustomCheckout: true
componentPath: "flower-fest-2026"
```

### Step 2: Create Route

```typescript
// src/app/shop/events/flower-fest-2026/page.tsx
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { FlowerFestShop } from "./shop-client";

export default async function FlowerFest2026() {
	const session = await auth();
	if (!session?.user) {
		redirect("/api/auth/signin");
	}

	const event = await prisma.shopEvent.findUnique({
		where: { slug: "flower-fest-2026" },
		include: {
			products: {
				include: {
					product: true,
				},
				orderBy: { sortOrder: "asc" },
			},
		},
	});

	if (!event) {
		return <div>Event not found</div>;
	}

	return <FlowerFestShop event={event} />;
}
```

### Step 3: Add Link to Header

```typescript
// src/components/main/Header.tsx
// Add link to Flower Fest during event dates
{now >= flowerFestStart && now <= flowerFestEnd && (
  <Link href="/shop/events/flower-fest-2026">
    🌸 Flower Fest 2026
  </Link>
)}
```

---

## Deployment Checklist

### Before Launch

- [ ] Create event in database via Prisma Studio
- [ ] Set event dates (start/end)
- [ ] Configure cutoff time and delivery settings
- [ ] Upload hero images
- [ ] Create and assign products to event
- [ ] Set event-specific pricing if needed
- [ ] Test custom checkout flow
- [ ] Test delivery date/time selection
- [ ] Test order creation
- [ ] Verify eventData is stored correctly
- [ ] Test admin order viewing
- [ ] Set `isPriority = true` for default landing

### During Event

- [ ] Monitor orders in admin dashboard
- [ ] Check for duplicate GCash references
- [ ] Verify delivery dates are correct
- [ ] Update `isShopClosed` if needed (sold out, etc.)
- [ ] Monitor analytics (clicks, purchases)

### After Event

- [ ] Set `isActive = false` to hide event tab
- [ ] Export orders to Excel
- [ ] Process any pending orders
- [ ] Archive custom components if needed

---

## Best Practices

1. **Reuse Generic Components**: Use cart, order history, etc. from generic system
2. **Store Custom Data in eventData**: Don't modify Order schema for event-specific fields
3. **Validate Server-Side**: Never trust client-side validation alone
4. **Handle Timezones**: Use UTC in database, convert for display
5. **Test Cutoff Logic**: Test before, during, and after cutoff time
6. **Mobile First**: Test on mobile devices
7. **Error Handling**: Show clear error messages
8. **Loading States**: Show loading indicators during async operations
9. **Accessibility**: Use proper labels, ARIA attributes
10. **Documentation**: Document custom fields and validation rules

---

## Conclusion

Custom event pages give you complete control over the customer experience for major events. Use this approach when the generic event system's limitations prevent you from creating the ideal experience.

**Key Takeaways:**

- Custom pages extend the generic system, not replace it
- Store custom checkout data in `Order.eventData` JSON field
- Use delivery scheduling utilities for cutoff time logic
- Reuse components where possible
- Document your custom implementation
- Test thoroughly before launch

Use this guide as a reference when building Flower Fest 2026 or any other major event!
