# Batch OCR Processing Guide

## Overview

The Batch OCR Processing feature allows admins to automatically extract GCash reference numbers from **existing orders** that have receipt images but no reference numbers. This is useful for:

- Processing orders created before the auto-extraction feature was implemented
- Re-processing orders where OCR initially failed
- Bulk updating orders with missing reference numbers

## Access

**Location:** Admin Dashboard → Orders → "Batch OCR Processing" button

**Requirements:**

- Must be logged in as Shop Admin (`isShopAdmin: true`)
- Orders must have `receiptImageUrl` but `gcashReferenceNumber` is `null`

## How It Works

### 1. Open Batch OCR Dialog

```
Admin Dashboard → Orders
└─> Click "Batch OCR Processing" button
    └─> System loads all orders needing OCR
        └─> Shows count: "Found X orders needing OCR processing"
```

### 2. Review Orders List

Each order shows:

- Order ID (first 8 characters)
- Status badge
- PDF badge (if receipt is PDF format)
- Customer name/email
- Order amount
- Order date
- Checkbox for selection

### 3. Select Orders

**Options:**

- **Individual Selection**: Click checkbox next to each order
- **Select All**: Click "Select All" button
- **Deselect All**: Click "Deselect All" button

**Counter**: Shows "X of Y orders selected"

### 4. Process Batch

Click "Process X Orders" button to start batch processing.

**Processing Flow:**

```
For each selected order:
  1. Fetch receipt image/PDF from storage (MinIO)
  2. Determine file type (image or PDF)
  3. Run appropriate extraction method:
     - Images: Server-side OCR (Tesseract.js)
     - PDFs: Coordinate-based parsing (pdfreader)
  4. Extract reference number
  5. Update order in database
  6. Track result (success/failed/skipped)
```

**Progress Tracking:**

- Real-time progress bar
- Percentage complete
- Processing indicator

### 5. Review Results

After processing completes, see detailed summary:

**Statistics:**

- ✅ **Processed**: Successfully extracted reference numbers
- ❌ **Failed**: Could not extract (poor image quality, wrong format, etc.)
- ⚠️ **Skipped**: Already has ref number or no receipt image

**Successfully Extracted:**

- Shows Order ID → Reference Number mapping
- Green badges with extracted numbers

**Errors:**

- Lists failed orders with error messages
- Red alert boxes with details

## UI Walkthrough

### Initial State

```
┌─────────────────────────────────────────────────────────┐
│  Batch OCR Processing                                   │
│  Extract GCash reference numbers from existing orders   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  0 of 15 orders selected                [Select All]    │
│                                        [Deselect All]   │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │ ☐ #a1b2c3d4  [Pending]                          │   │
│  │   Customer: Juan Dela Cruz                      │   │
│  │   Amount: ₱500.00                                │   │
│  │   Date: 12/17/2024                               │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │ ☐ #e5f6g7h8  [Paid]  [PDF]                     │   │
│  │   Customer: Maria Santos                        │   │
│  │   Amount: ₱1,200.00                              │   │
│  │   Date: 12/16/2024                               │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
│  ... (more orders)                                       │
│                                                          │
│                          [Close]  [Process 0 Orders]    │
└─────────────────────────────────────────────────────────┘
```

### Processing State

```
┌─────────────────────────────────────────────────────────┐
│  Batch OCR Processing                                   │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🔄 Processing...                                 │   │
│  │                                                  │   │
│  │ ████████████░░░░░░░░  67%                       │   │
│  │                                                  │   │
│  │ 67% complete                                    │   │
│  └─────────────────────────────────────────────────┘   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Results State

```
┌─────────────────────────────────────────────────────────┐
│  Processing Results                                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│     ┌───────┐    ┌───────┐    ┌───────┐               │
│     │   ✓   │    │   ✗   │    │   ⚠   │               │
│     │  12   │    │   2   │    │   1   │               │
│     │Processed│  │Failed │    │Skipped│               │
│     └───────┘    └───────┘    └───────┘               │
│                                                          │
│  Successfully Extracted:                                 │
│  ┌──────────────────────────────────────────────────┐  │
│  │ #a1b2c3d4          [1234567890123]               │  │
│  │ #e5f6g7h8          [9876543210987]               │  │
│  │ ... (10 more)                                    │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│  Errors:                                                 │
│  ┌──────────────────────────────────────────────────┐  │
│  │ #i9j0k1l2: Could not extract reference number   │  │
│  │ #m3n4o5p6: Failed to fetch image                │  │
│  └──────────────────────────────────────────────────┘  │
│                                                          │
│                          [Close]  [Process 0 Orders]    │
└─────────────────────────────────────────────────────────┘
```

## Processing Logic

### Server-Side OCR for Images

**File:** `src/lib/gcashReaders/readReceipt.server.ts`

```typescript
1. Fetch image from MinIO URL
2. Convert to Buffer
3. Initialize Tesseract.js worker with language data
4. Run OCR recognition
5. Parse text with regex patterns (same as client-side)
6. Extract reference number
7. Return structured data
```

**Advantages over Client-Side:**

- ✅ Consistent processing environment
- ✅ Can process images without user interaction
- ✅ No browser performance dependency
- ✅ Batch processing capability

### PDF Parsing (Server-Side)

**File:** `src/lib/gcashReaders/readInvoice.ts`

```typescript
1. Fetch PDF from MinIO URL
2. Convert to Buffer
3. Use pdfreader to extract text with coordinates
4. Map coordinates to table columns
5. Extract transactions
6. Get most recent transaction's reference number
7. Return structured data
```

## Error Handling

### Common Errors and Solutions

| Error Message                          | Cause                             | Solution                     |
| -------------------------------------- | --------------------------------- | ---------------------------- |
| "Could not extract reference number"   | Poor image quality, wrong format  | Re-upload with clearer image |
| "Failed to fetch image"                | Image URL invalid or inaccessible | Check MinIO storage          |
| "Order already has a reference number" | Duplicate processing attempt      | Skipped (no action needed)   |
| "Order has no receipt image"           | No receipt uploaded               | Skipped (no action needed)   |
| "Invalid password provided for PDF"    | Password-protected PDF            | Use image receipt instead    |

### Skipped Orders

Orders are automatically skipped if:

- `gcashReferenceNumber` already exists (not `null`)
- `receiptImageUrl` is `null` (no receipt uploaded)

These don't count as failures - they're legitimate skips.

## Best Practices

### Before Processing

1. **Review Order List**
   - Check that orders are legitimate
   - Verify receipt images are readable
   - Remove any test orders

2. **Start Small**
   - Process a few orders first (test run)
   - Review results for accuracy
   - Then process larger batches

3. **Check Duplicates**
   - Look for duplicate reference numbers after processing
   - Some customers may have used same payment screenshot

### During Processing

- ⏱️ **Be Patient**: Processing takes ~5-10 seconds per order
- 🔄 **Don't Refresh**: Let the process complete
- 📊 **Watch Progress**: Monitor the progress bar

### After Processing

1. **Review Extracted Numbers**
   - Spot-check reference numbers against receipt images
   - Verify they look like valid GCash ref numbers (typically 13 digits)

2. **Handle Failures**
   - Review failed orders individually
   - Check if receipts need to be re-uploaded
   - Consider manual entry for consistently failing images

3. **Check for Duplicates**
   - Run duplicate detection in main orders dashboard
   - Investigate any duplicate reference numbers

4. **Export Updated Data**
   - Export to Excel to verify all ref numbers
   - Validate against GCash transaction history if available

## Performance Considerations

### Processing Time

- **Images**: ~5-10 seconds per image
- **PDFs**: ~1-3 seconds per PDF
- **Batch of 50 orders**: ~5-8 minutes

### Server Load

- Processing runs sequentially (one order at a time)
- Each order is independent (failure doesn't affect others)
- Progress updates in real-time

### Resource Usage

- **Memory**: ~50-100MB per concurrent OCR operation
- **CPU**: High during OCR processing
- **Network**: Fetches images from MinIO storage

## Troubleshooting

### Button Not Appearing

**Problem:** "Batch OCR Processing" button not visible

**Solutions:**

1. Verify you're logged in as Shop Admin
2. Check `isShopAdmin: true` in database
3. Refresh the page

### No Orders Found

**Problem:** "No orders need OCR processing" message

**Possible Reasons:**

1. ✅ All orders already have reference numbers (good!)
2. No orders have receipt images
3. Database query issue

**Verification:**

```sql
SELECT COUNT(*) FROM "Order"
WHERE "receiptImageUrl" IS NOT NULL
AND "gcashReferenceNumber" IS NULL;
```

### Processing Stuck

**Problem:** Progress bar not moving

**Solutions:**

1. Wait 30 seconds (OCR can be slow)
2. Check browser console for errors
3. Check server logs
4. Refresh page and try again with fewer orders

### All Orders Failing

**Problem:** Every order shows error

**Possible Causes:**

1. MinIO storage connection issue
2. Tesseract.js not installed properly
3. Language data not downloaded

**Check:**

```bash
# Verify Tesseract.js is installed
npm list tesseract.js

# Check for language data directory
ls lang-data/
```

## Technical Details

### Database Query

Orders needing OCR are fetched with:

```typescript
await prisma.order.findMany({
	where: {
		receiptImageUrl: { not: null },
		gcashReferenceNumber: null,
	},
	select: {
		id: true,
		receiptImageUrl: true,
		totalAmount: true,
		status: true,
		createdAt: true,
		user: {
			select: {
				name: true,
				email: true,
			},
		},
	},
	orderBy: { createdAt: "desc" },
});
```

### Processing Flow

```typescript
// For each selected order:
const result = await processOrderReceipt(orderId);

// processOrderReceipt does:
1. Fetch order with receipt URL
2. Check if already has ref number (skip if yes)
3. Determine file type (PDF vs image)
4. If PDF:
   - Fetch PDF from URL
   - Run parseGcashPdf(buffer)
   - Get most recent transaction
5. If Image:
   - Fetch image from URL
   - Run parseGcashReceiptFromUrl(url)
   - Extract via server-side OCR
6. Update order with gcashReferenceNumber
7. Return success/failure result
```

### State Management

```typescript
// Component state
const [orders, setOrders] = useState<OrderNeedingOcr[]>([]);
const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
const [processing, setProcessing] = useState(false);
const [progress, setProgress] = useState(0);
const [results, setResults] = useState<ProcessingResults | null>(null);

// Progress calculation
setProgress((completed / total) * 100);
```

## API Reference

### Server Actions

#### `getOrdersNeedingOcr()`

Fetches all orders with receipts but no reference numbers.

**Returns:**

```typescript
{
  success: boolean;
  orders: OrderNeedingOcr[];
  count: number;
}
```

#### `processOrderReceipt(orderId: string)`

Processes a single order's receipt.

**Returns:**

```typescript
{
  success: boolean;
  referenceNumber?: string;
  message?: string;
  skipped?: boolean;
}
```

#### `batchProcessOrders(orderIds: string[])`

Processes multiple orders (currently unused, processes one-by-one instead).

**Returns:**

```typescript
{
	success: boolean;
	results: {
		processed: number;
		failed: number;
		skipped: number;
		extracted: Array<{ orderId: string; refNumber: string }>;
		errors: Array<{ orderId: string; error: string }>;
	}
	message: string;
}
```

## File Structure

```
src/
├── lib/
│   └── gcashReaders/
│       ├── parseReceipt.ts          # Shared parsing logic
│       ├── readReceipt.client.ts    # Client-side OCR (checkout)
│       ├── readReceipt.server.ts    # Server-side OCR (batch processing)
│       └── readInvoice.ts           # PDF parsing (both)
│
└── app/
    └── admin/
        └── orders/
            ├── batchOcrActions.ts   # Server actions
            ├── batch-ocr.tsx        # UI component
            └── orders-management.tsx # Main admin page (uses batch-ocr)
```

## Summary

The Batch OCR Processing feature provides a powerful way to retroactively process existing orders:

✅ **Automated**: No manual typing required
✅ **Bulk Processing**: Handle many orders at once
✅ **Progress Tracking**: Real-time feedback
✅ **Error Handling**: Clear reporting of issues
✅ **Flexible**: Supports both images and PDFs
✅ **Safe**: Skips orders that already have ref numbers
✅ **Detailed Results**: Complete summary of what happened

This complements the automatic extraction for new orders, ensuring all orders in your system have reference numbers for duplicate detection and record-keeping.
