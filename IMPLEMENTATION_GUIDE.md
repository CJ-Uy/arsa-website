# Product Event Assignment & Size Pricing Implementation Guide

## Overview

This guide covers implementing:

1. Event assignment for products (hybrid approach)
2. Size-specific pricing (variant pricing)
3. Event-exclusive products filtering in shop

## Database Changes ✅ COMPLETED

- Added `isEventExclusive` to Product and Package models
- Added `sizePricing` JSON field to Product model
- Ran `prisma generate` and `prisma db push`

## Implementation Steps

### 1. Update Product Types & Form Data

**File**: `src/app/admin/products/products-management.tsx`

Update the `Product` type (around line 39):

```typescript
type Product = {
	id: string;
	name: string;
	description: string;
	price: number;
	category: "merch" | "arsari-sari" | "other";
	image: string | null;
	imageUrls: string[];
	stock: number | null;
	isAvailable: boolean;
	isPreOrder: boolean;
	isEventExclusive: boolean;
	availableSizes: string[];
	sizePricing: Record<string, number> | null; // { "S": 100, "M": 150 }
	specialNote: string | null;
	eventProducts: Array<{
		eventId: string;
		eventPrice: number | null;
		event: {
			id: string;
			name: string;
			slug: string;
		};
	}>;
};

type ShopEvent = {
	id: string;
	name: string;
	slug: string;
};

type ProductsManagementProps = {
	initialProducts: Product[];
	availableEvents: ShopEvent[];
};
```

Update `ProductFormData` type (around line 58):

```typescript
type ProductFormData = {
	name: string;
	description: string;
	price: number;
	category: "merch" | "arsari-sari" | "other";
	image: string;
	imageUrls: string[];
	stock: number | null;
	isAvailable: boolean;
	isPreOrder: boolean;
	isEventExclusive: boolean;
	availableSizes: string[];
	sizePricing: Record<string, number>;
	specialNote: string;
	assignedEvents: Array<{ eventId: string; eventPrice: number | null }>;
};
```

### 2. Update Component State

Add to the component's state declarations (around line 72):

```typescript
const [selectedSizeForPricing, setSelectedSizeForPricing] = useState<string>("");
```

Update the `resetForm` function to include new fields:

```typescript
const resetForm = () => {
	setFormData({
		// ... existing fields
		isEventExclusive: false,
		sizePricing: {},
		assignedEvents: [],
	});
	// ... rest of reset
};
```

### 3. Add Size Pricing UI Section

Add this section in the form dialog (after the sizes section, around line 400):

```typescript
{/* Size-Specific Pricing */}
{formData.availableSizes.length > 0 && (
	<div className="space-y-3">
		<div className="flex items-center justify-between">
			<Label>Size-Specific Pricing (Optional)</Label>
			<p className="text-muted-foreground text-xs">
				Leave empty to use base price for all sizes
			</p>
		</div>
		<div className="grid grid-cols-2 gap-2">
			{formData.availableSizes.map((size) => (
				<div key={size} className="flex items-center gap-2">
					<Label className="w-12 text-sm">{size}:</Label>
					<Input
						type="number"
						step="0.01"
						placeholder={`₱${formData.price}`}
						value={formData.sizePricing[size] || ""}
						onChange={(e) => {
							const value = e.target.value;
							setFormData({
								...formData,
								sizePricing: {
									...formData.sizePricing,
									[size]: value ? parseFloat(value) : undefined,
								},
							});
						}}
					/>
				</div>
			))}
		</div>
		<p className="text-muted-foreground text-xs">
			Shop will show price range (e.g., "₱100 - ₱200") if sizes have different prices
		</p>
	</div>
)}
```

### 4. Add Event Assignment UI Section

Add this section after the size pricing section:

```typescript
{/* Event Assignment */}
<div className="space-y-3">
	<div className="flex items-center justify-between">
		<Label>Event Assignment (Optional)</Label>
		<div className="flex items-center space-x-2">
			<Switch
				id="isEventExclusive"
				checked={formData.isEventExclusive}
				onCheckedChange={(checked) =>
					setFormData({ ...formData, isEventExclusive: checked })
				}
			/>
			<Label htmlFor="isEventExclusive" className="text-sm font-normal">
				Event Exclusive
			</Label>
		</div>
	</div>
	<p className="text-muted-foreground text-xs">
		{formData.isEventExclusive
			? "This product will ONLY appear under assigned event tabs"
			: "This product will appear in All/categories AND assigned event tabs"}
	</p>

	{/* Event Multi-Select */}
	<div className="space-y-2">
		{availableEvents.map((event) => {
			const isAssigned = formData.assignedEvents.some((e) => e.eventId === event.id);
			const eventData = formData.assignedEvents.find((e) => e.eventId === event.id);

			return (
				<Card key={event.id} className="p-3">
					<div className="flex items-start justify-between gap-3">
						<div className="flex items-center space-x-2 flex-1">
							<input
								type="checkbox"
								checked={isAssigned}
								onChange={(e) => {
									if (e.target.checked) {
										setFormData({
											...formData,
											assignedEvents: [
												...formData.assignedEvents,
												{ eventId: event.id, eventPrice: null },
											],
										});
									} else {
										setFormData({
											...formData,
											assignedEvents: formData.assignedEvents.filter(
												(ev) => ev.eventId !== event.id
											),
										});
									}
								}}
							/>
							<Label className="font-medium cursor-pointer">{event.name}</Label>
						</div>

						{isAssigned && (
							<div className="flex items-center gap-2">
								<Label className="text-xs whitespace-nowrap">Event Price:</Label>
								<Input
									type="number"
									step="0.01"
									placeholder={`₱${formData.price}`}
									className="w-24"
									value={eventData?.eventPrice || ""}
									onChange={(e) => {
										const value = e.target.value;
										setFormData({
											...formData,
											assignedEvents: formData.assignedEvents.map((ev) =>
												ev.eventId === event.id
													? { ...ev, eventPrice: value ? parseFloat(value) : null }
													: ev
											),
										});
									}}
								/>
							</div>
						)}
					</div>
				</Card>
			);
		})}
	</div>
</div>
```

### 5. Update handleOpenDialog Function

Update the function to populate event data when editing (around line 110):

```typescript
const handleOpenDialog = (product?: Product) => {
	if (product) {
		setEditingProduct(product);
		setFormData({
			name: product.name,
			description: product.description,
			price: product.price,
			category: product.category,
			image: product.image || "",
			imageUrls: product.imageUrls || [],
			stock: product.stock,
			isAvailable: product.isAvailable,
			isPreOrder: product.isPreOrder,
			isEventExclusive: product.isEventExclusive,
			availableSizes: product.availableSizes || [],
			sizePricing: (product.sizePricing as Record<string, number>) || {},
			specialNote: product.specialNote || "",
			assignedEvents:
				product.eventProducts?.map((ep) => ({
					eventId: ep.eventId,
					eventPrice: ep.eventPrice,
				})) || [],
		});
	} else {
		resetForm();
	}
	setShowDialog(true);
};
```

### 6. Update Product Actions

**File**: `src/app/admin/products/actions.ts`

Add event management to createProduct and updateProduct actions:

```typescript
export async function createProduct(formData: FormData) {
	try {
		// ... existing validation

		// Parse event assignments
		const assignedEventsStr = formData.get("assignedEvents") as string;
		const assignedEvents = assignedEventsStr ? JSON.parse(assignedEventsStr) : [];

		// Parse size pricing
		const sizePricingStr = formData.get("sizePricing") as string;
		const sizePricing = sizePricingStr ? JSON.parse(sizePricingStr) : null;

		const product = await prisma.product.create({
			data: {
				// ... existing fields
				isEventExclusive: formData.get("isEventExclusive") === "true",
				sizePricing: sizePricing,
				// Create event assignments
				eventProducts: {
					create: assignedEvents.map((event: any, index: number) => ({
						eventId: event.eventId,
						eventPrice: event.eventPrice,
						sortOrder: index,
					})),
				},
			},
		});

		revalidatePath("/admin/products");
		revalidatePath("/shop");

		return { success: true, message: "Product created successfully", product };
	} catch (error) {
		console.error("Error creating product:", error);
		return { success: false, message: "Failed to create product" };
	}
}

export async function updateProduct(formData: FormData) {
	try {
		const id = formData.get("id") as string;
		// ... existing validation

		// Parse event assignments
		const assignedEventsStr = formData.get("assignedEvents") as string;
		const assignedEvents = assignedEventsStr ? JSON.parse(assignedEventsStr) : [];

		// Parse size pricing
		const sizePricingStr = formData.get("sizePricing") as string;
		const sizePricing = sizePricingStr ? JSON.parse(sizePricingStr) : null;

		// Delete existing event assignments
		await prisma.eventProduct.deleteMany({
			where: { productId: id },
		});

		const product = await prisma.product.update({
			where: { id },
			data: {
				// ... existing fields
				isEventExclusive: formData.get("isEventExclusive") === "true",
				sizePricing: sizePricing,
				// Recreate event assignments
				eventProducts: {
					create: assignedEvents.map((event: any, index: number) => ({
						eventId: event.eventId,
						eventPrice: event.eventPrice,
						sortOrder: index,
					})),
				},
			},
		});

		revalidatePath("/admin/products");
		revalidatePath("/shop");

		return { success: true, message: "Product updated successfully", product };
	} catch (error) {
		console.error("Error updating product:", error);
		return { success: false, message: "Failed to update product" };
	}
}
```

### 7. Update Form Submission

In `products-management.tsx`, update the form submission to include new fields:

```typescript
const handleSubmit = async (e: React.FormEvent) => {
	e.preventDefault();
	setLoading(true);

	const data = new FormData();
	// ... existing fields
	data.append("isEventExclusive", String(formData.isEventExclusive));
	data.append("sizePricing", JSON.stringify(formData.sizePricing));
	data.append("assignedEvents", JSON.stringify(formData.assignedEvents));

	// ... rest of submission
};
```

### 8. Update Shop Display Logic

**File**: `src/app/shop/shop-client.tsx`

Update the `filteredProducts` useMemo to respect `isEventExclusive`:

```typescript
const filteredProducts = useMemo(() => {
	return allProducts.filter((product) => {
		// Search filter
		if (searchQuery && !product.name.toLowerCase().includes(searchQuery.toLowerCase())) {
			return false;
		}

		// Category/Event filter
		if (selectedCategory.startsWith("event-")) {
			// Show products assigned to this event
			const eventSlug = selectedCategory.replace("event-", "");
			const productEvent = product.eventProducts?.find((ep: any) => ep.event?.slug === eventSlug);
			return !!productEvent;
		} else {
			// Regular category tabs (All, Arsari-Sari, Other)
			// Skip event-exclusive products
			if (product.isEventExclusive) {
				return false;
			}

			// Apply category filter
			if (selectedCategory === "all") return true;
			if (selectedCategory === "arsari-sari") return product.category === "arsari-sari";
			if (selectedCategory === "other") return product.category === "other";
			return true;
		}
	});
}, [allProducts, selectedCategory, searchQuery]);
```

### 9. Add Price Display Helper

Add a helper function to display price or price range:

```typescript
const getProductPriceDisplay = (product: Product) => {
	// Check if product has size-specific pricing
	if (product.sizePricing && Object.keys(product.sizePricing).length > 0) {
		const prices = Object.values(product.sizePricing as Record<string, number>);
		const minPrice = Math.min(...prices);
		const maxPrice = Math.max(...prices);

		if (minPrice === maxPrice) {
			return `₱${minPrice.toFixed(2)}`;
		}
		return `₱${minPrice.toFixed(2)} - ₱${maxPrice.toFixed(2)}`;
	}

	// Check if product has event-specific pricing
	const currentEvent = activeEvent;
	if (currentEvent && product.eventProducts) {
		const eventProduct = product.eventProducts.find((ep: any) => ep.eventId === currentEvent.id);
		if (eventProduct?.eventPrice) {
			return `₱${eventProduct.eventPrice.toFixed(2)}`;
		}
	}

	return `₱${product.price.toFixed(2)}`;
};
```

Use this in the product card display:

```typescript
<p className="text-lg font-bold">{getProductPriceDisplay(product)}</p>
```

### 10. Update Cart/Checkout to Use Correct Price

**File**: `src/app/shop/actions.ts`

Update `addToCart` to use size-specific or event-specific pricing:

```typescript
export async function addToCart(
	productId: string,
	quantity: number = 1,
	size: string | null = null,
) {
	// ... existing code to get product

	// Determine correct price
	let finalPrice = product.price;

	// Priority 1: Size-specific pricing
	if (size && product.sizePricing) {
		const sizePrices = product.sizePricing as Record<string, number>;
		if (sizePrices[size]) {
			finalPrice = sizePrices[size];
		}
	}

	// Priority 2: Event-specific pricing (if product is in an active event)
	// This would require knowing which event context the user is shopping from
	// You may need to pass eventId as a parameter if you want event pricing

	// ... rest of cart logic using finalPrice
}
```

## Testing Checklist

- [ ] Create a product with size-specific pricing
- [ ] Verify price range displays in shop (e.g., "₱100 - ₱200")
- [ ] Create an event-exclusive product assigned to an event
- [ ] Verify it only shows under that event tab, not in All/categories
- [ ] Create a regular product assigned to an event with event-specific price
- [ ] Verify it shows in both All/categories AND the event tab
- [ ] Verify event price overrides base price when viewing event tab
- [ ] Add product to cart and verify correct price based on selected size
- [ ] Test editing product and changing event assignments

## Next Steps

1. Complete the UI changes in products-management.tsx
2. Update the actions.ts file
3. Update shop-client.tsx filtering logic
4. Add the quick "Create Product" button in events-management.tsx
5. Test thoroughly with real data

## Notes

- The `sizePricing` field stores `null` if no size-specific pricing is set
- Event-exclusive products are filtered out of All/category tabs in the shop
- Event-specific pricing overrides base price when viewing that event
- Size-specific pricing overrides both base and event pricing
