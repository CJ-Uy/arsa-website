# Daily Stock Integration Guide

## Manual Integration Steps

Since the events-management.tsx file is very large, here are the specific changes needed:

### 1. Add State for Daily Stock Dialog

Add this state near the other state declarations (around line 220):

```tsx
const [dailyStockDialogOpen, setDailyStockDialogOpen] = useState(false);
const [dailyStockProductIndex, setDailyStockProductIndex] = useState<number | null>(null);
```

### 2. Add Helper Functions

Add these functions in the component (after the other helper functions):

```tsx
const openDailyStockDialog = (index: number) => {
	setDailyStockProductIndex(index);
	setDailyStockDialogOpen(true);
};

const saveDailyStockConfig = (config: {
	hasDailyStockLimit: boolean;
	defaultMaxOrdersPerDay?: number;
	dailyStockOverrides?: Record<string, number | null>;
}) => {
	if (dailyStockProductIndex !== null) {
		const updatedProducts = [...formData.eventProducts];
		updatedProducts[dailyStockProductIndex] = {
			...updatedProducts[dailyStockProductIndex],
			hasDailyStockLimit: config.hasDailyStockLimit,
			defaultMaxOrdersPerDay: config.defaultMaxOrdersPerDay,
			dailyStockOverrides: config.dailyStockOverrides,
		};
		setFormData({ ...formData, eventProducts: updatedProducts });
	}
};
```

### 3. Add Button to Product Row

Find the product row rendering (around line 1690) and add a button **BEFORE** the Delete button:

```tsx
{
	/* Daily Stock Button */
}
<Button
	type="button"
	variant="outline"
	size="icon"
	onClick={() => openDailyStockDialog(index)}
	title="Configure daily stock limits"
>
	<Package2 className="h-4 w-4" />
</Button>;
```

Don't forget to add `Package2` to the lucide-react imports at the top.

### 4. Add Dialog Component

Add this **AFTER** the closing tag of the main form, before the final closing div:

```tsx
{
	/* Daily Stock Dialog */
}
{
	dailyStockProductIndex !== null && (
		<DailyStockDialog
			open={dailyStockDialogOpen}
			onOpenChange={setDailyStockDialogOpen}
			productName={
				formData.eventProducts[dailyStockProductIndex]?.productId
					? availableProducts.find(
							(p) => p.id === formData.eventProducts[dailyStockProductIndex]?.productId,
						)?.name || "Product"
					: availablePackages.find(
							(p) => p.id === formData.eventProducts[dailyStockProductIndex]?.packageId,
						)?.name || "Package"
			}
			config={{
				hasDailyStockLimit:
					formData.eventProducts[dailyStockProductIndex]?.hasDailyStockLimit || false,
				defaultMaxOrdersPerDay:
					formData.eventProducts[dailyStockProductIndex]?.defaultMaxOrdersPerDay,
				dailyStockOverrides:
					formData.eventProducts[dailyStockProductIndex]?.dailyStockOverrides || {},
			}}
			onSave={saveDailyStockConfig}
		/>
	);
}
```

### 5. Update Icons Import

Add `Package2` to the lucide-react import (around line 43):

```tsx
import {
	CalendarHeart,
	Edit2,
	Trash2,
	X,
	ChevronDown,
	ChevronUp,
	Calendar,
	// ... other icons ...
	Package2, // ADD THIS
	// ... more icons ...
} from "lucide-react";
```

## That's It!

The daily stock dialog will now open when clicking the new button, and changes will be saved to the form data. The backend is already set up to handle these fields.

## Testing

1. Go to Events Admin
2. Edit an event
3. Go to Products tab
4. Click the new Package icon button next to a product
5. Enable daily stock limits
6. Set default max orders per day
7. Add date overrides
8. Save and test!
