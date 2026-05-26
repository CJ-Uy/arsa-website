# Admin Orders Page Redesign

## Overview

The admin orders page has been redesigned with a tabbed interface separating order management from verification workflows.

## Changes Made

### 1. ✅ Tabbed Interface

The page now has two main tabs:

- **Orders Tab**: View and manage all orders, export to Excel
- **Verify Tab**: OCR processing, invoice upload, and manual verification dashboard

### 2. ✅ Fixed Excel Export Format

**Problem**: When an order had multiple items, transaction-level information (Order Total, GCash Ref No, Receipt URL) was repeated on every row.

**Solution**: [actions.ts:104-110](src/app/admin/orders/actions.ts#L104-L110)

- Order Total, GCash Ref No, and Receipt URL now only appear on the **first item** of each order
- Other rows for the same order show empty strings for these columns
- Makes the Excel export cleaner and easier to read

**Example**:

**Before**:

```
Order ID | Product    | Order Total | GCash Ref No | Receipt URL
123      | T-Shirt    | 500         | 1234567890   | https://...
123      | Hoodie     | 500         | 1234567890   | https://...
```

**After**:

```
Order ID | Product    | Order Total | GCash Ref No | Receipt URL
123      | T-Shirt    | 500         | 1234567890   | https://...
123      | Hoodie     |             |              |
```

### 3. ✅ Invoice Upload with OCR

**Location**: Verify Tab

**File**: [InvoiceUpload.tsx](src/app/admin/orders/InvoiceUpload.tsx)

**Features**:

- Upload multiple invoice images or PDF (PDF OCR coming soon)
- Automatically extract transactions using OCR
- Expected format: Table with columns "Date and Time | Description | Reference No. | Debit | Credit"
- Reference numbers must be 13 digits
- Matches extracted transactions with orders in database
- Shows matched vs unmatched count

**Usage**:

1. Go to Admin → Orders → Verify tab
2. Click "Upload GCash Invoice" card
3. Select invoice image files (can select multiple)
4. Wait for OCR processing
5. View extracted transactions and match results

### 4. ✅ Invoice Table Parser

**File**: [parseInvoiceTable.ts](src/lib/gcashReaders/parseInvoiceTable.ts)

Parses GCash invoice tables from OCR text:

- Extracts: Date/Time, Description, Reference Number, Debit, Credit
- Filters out header rows
- Handles various date formats (Dec 08, 2025 or 12/08/2025)
- Identifies debits (Send Money) vs credits

### 5. ✅ Manual Verification Dashboard

**Location**: Verify Tab

**File**: [ManualVerificationDashboard.tsx](src/app/admin/orders/ManualVerificationDashboard.tsx)

**Features**:

- Auto-loads on tab open
- Shows all orders that need manual verification:
  - Orders with receipt but no reference number
  - Orders with unverified reference numbers (future enhancement)
- Displays order details, customer info, and direct link to view receipt
- Refresh button to reload

**Purpose**: Helps admin quickly find and verify orders where OCR failed or reference numbers couldn't be auto-matched.

### 6. ✅ Updated OCR Regex

**File**: [parseReceipt.ts](src/lib/gcashReaders/parseReceipt.ts:33)

**Fixed**: Reference numbers with spaces are now handled correctly

**Examples**:

- `Ref No. 1234567890 Dec 08, 2025` ✅
- `Ref No. 1234 567 890 Dec 08, 2025` ✅ (spaces removed)
- `Ref No. 1234 567 890   Dec 08, 2025` ✅ (multiple spaces before date)

## New Files Created

1. **[InvoiceUpload.tsx](src/app/admin/orders/InvoiceUpload.tsx)** - Invoice upload UI
2. **[ManualVerificationDashboard.tsx](src/app/admin/orders/ManualVerificationDashboard.tsx)** - Verification dashboard UI
3. **[invoiceActions.ts](src/app/admin/orders/invoiceActions.ts)** - Server actions for invoice processing
4. **[parseInvoiceTable.ts](src/lib/gcashReaders/parseInvoiceTable.ts)** - Invoice table OCR parser

## Files Modified

1. **[orders-management.tsx](src/app/admin/orders/orders-management.tsx)** - Added tabs, moved OCR to Verify tab
2. **[actions.ts](src/app/admin/orders/actions.ts)** - Fixed Excel export format
3. **[parseReceipt.ts](src/lib/gcashReaders/parseReceipt.ts)** - Updated regex for spaced reference numbers

## Architecture

### Verify Tab Workflow

```
┌─────────────────────────────────────────────┐
│           VERIFY TAB                        │
├─────────────────────────────────────────────┤
│                                             │
│  1. Client-Side Batch OCR (Collapsible)    │
│     - Process receipt images               │
│     - Extract reference numbers            │
│                                             │
│  2. Invoice Upload                          │
│     - Upload GCash invoice images/PDF      │
│     - OCR extract transactions             │
│     - Match with orders                    │
│                                             │
│  3. Manual Verification Dashboard          │
│     - Shows unverified orders              │
│     - Quick access to receipts             │
│                                             │
└─────────────────────────────────────────────┘
```

## Usage Guide

### For Admins

**Processing New Orders**:

1. Orders Tab → Export to Excel to see all orders
2. Verify Tab → Batch OCR → Process New
3. Verify Tab → Upload invoice to cross-verify
4. Verify Tab → Check Manual Verification Dashboard for any failures

**Fixing False Positives**:

1. Verify Tab → Batch OCR → Load All Orders
2. Verify Tab → Batch OCR → Reprocess All
3. This will re-extract and update all reference numbers

**Invoice Verification**:

1. Verify Tab → Invoice Upload
2. Upload screenshot(s) of GCash transaction history
3. System automatically matches transactions with orders
4. Check matched/unmatched counts

## Future Enhancements

- [ ] PDF invoice support (with password protection)
- [ ] Store invoice verification results in database
- [ ] Mark orders as "verified by invoice" vs "not verified"
- [ ] Filter manual verification dashboard by verification status
- [ ] Batch update order status from verification dashboard
- [ ] Export unverified orders to Excel

## Testing

Test the changes locally:

```bash
npm run dev
```

Then:

1. Go to `/admin/orders`
2. Test switching between tabs
3. Test Excel export (check that transaction info doesn't repeat)
4. Test batch OCR in Verify tab
5. Test uploading an invoice image
6. Test manual verification dashboard

## Deployment

No special environment variables needed. Just deploy as normal:

```bash
git add .
git commit -m "Redesign admin orders with verification workflow"
git push
```
