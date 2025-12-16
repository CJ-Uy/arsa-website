# GCash Reference Number Feature - User Guide

## For Customers

### Checkout Process

#### 1. Upload Your GCash Receipt
After uploading your GCash payment screenshot, the system will automatically:

```
┌─────────────────────────────────────┐
│  📸 Receipt Uploaded                │
│  ✓ Receipt uploaded                 │
│  🔄 Extracting reference number...  │
└─────────────────────────────────────┘
```

#### 2. Reference Number Extracted
Once extracted, you'll see your reference number:

```
┌─────────────────────────────────────┐
│  📸 Receipt Uploaded                │
│  ✓ Receipt uploaded                 │
│  ┌─────────────────────────────┐    │
│  │ Ref No: 1234567890123       │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

#### 3. Duplicate Detection
If you try to use the same receipt for another order:

```
❌ Error: This GCash reference number has already been used
for another order (Order ID: a1b2c3d4).

Each payment can only be used for one order.
Please contact support if you believe this is an error.
```

### What to Do If OCR Fails

If the system can't read your reference number:
- ⚠️ You'll see a warning, but can still place your order
- The admin will verify your receipt manually
- Make sure your screenshot is clear and well-lit

### Tips for Best Results

✅ **DO:**
- Take a clear, well-lit screenshot
- Include the entire receipt in the image
- Use the original GCash screenshot

❌ **DON'T:**
- Crop important parts of the receipt
- Use blurry or dark images
- Edit the screenshot before uploading

---

## For Admins

### Order Management Dashboard

#### 1. Orders List View

Each order now shows the GCash reference number:

```
┌─────────────────────────────────────────────────────────────┐
│ #a1b2c3d4  [Pending]                                        │
│                                                              │
│ Customer: Juan Dela Cruz                                    │
│ Date: 12/17/2024                                            │
│ GCash Ref: 1234567890123                                    │
│ Total: ₱500.00                                              │
│                                                              │
│ [Status ▼] [👁] [🗑]                                        │
└─────────────────────────────────────────────────────────────┘
```

#### 2. Duplicate Payment Warning

Orders using the same reference number show a warning badge:

```
┌─────────────────────────────────────────────────────────────┐
│ #a1b2c3d4  [Pending]  [⚠️ Duplicate Payment]               │
│                                                              │
│ Customer: Juan Dela Cruz                                    │
│ Date: 12/17/2024                                            │
│ GCash Ref: 1234567890123  ← Same as another order          │
│ Total: ₱500.00                                              │
└─────────────────────────────────────────────────────────────┘
```

#### 3. Order Details Modal

View full reference number and duplicate warnings:

```
┌─────────────────────────────────────────────────────────────┐
│ Order Details - #a1b2c3d4                                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Customer Information                                        │
│ Name: Juan Dela Cruz                                        │
│ Email: juan@example.com                                     │
│ GCash Reference Number: 1234567890123                       │
│                                                              │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ ⚠️ This GCash reference number is used in multiple     │ │
│ │    orders. Please verify the payment.                  │ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                              │
│ Order Items                                                 │
│ ...                                                          │
└─────────────────────────────────────────────────────────────┘
```

#### 4. Excel Export

The exported Excel file now includes a "GCash Ref No" column:

| Order ID | Date | Customer | Email | ... | GCash Ref No | Notes | Receipt URL |
|----------|------|----------|-------|-----|--------------|-------|-------------|
| a1b2c3d4 | ... | Juan     | ...   | ... | 1234567890123 | ...   | ...         |

### How to Handle Duplicates

When you see duplicate payment warnings:

1. **Review Both Orders**
   - Check if they're from the same customer
   - Verify the total amounts
   - Check the timestamps

2. **Common Scenarios**
   - **Accidental Double Order**: Customer submitted twice by mistake
   - **Multiple Items**: Customer tried to split one payment across multiple orders
   - **Screenshot Reuse**: Customer reused old receipt screenshot

3. **Actions to Take**
   - **Cancel** duplicate/fraudulent orders
   - **Contact** customer for clarification
   - **Verify** receipt image matches reference number

### Admin Best Practices

✅ **Regular Checks**
- Review orders with duplicate ref numbers daily
- Cross-reference receipt images
- Verify payment amounts match order totals

✅ **Customer Communication**
- Explain one payment = one order policy
- Request new payment for legitimate additional orders
- Be understanding of genuine mistakes

❌ **Don't Automatically**
- Cancel without investigation
- Approve both orders without verification
- Ignore duplicate warnings

---

## Technical Details

### What is a GCash Reference Number?

The reference number is a unique identifier (usually 13 digits) that GCash assigns to each transaction. Example:
```
Ref No. 1234567890123 Dec 17, 2024 10:30 AM
         └── This part ──┘
```

### How OCR Extraction Works

1. **Upload**: User uploads GCash receipt screenshot
2. **OCR**: Tesseract.js reads text from image (browser-side)
3. **Parse**: Regex patterns extract the reference number
4. **Display**: Show extracted number to user
5. **Store**: Save with order in database

### Duplicate Detection Logic

```
For each order in database:
  If order has a GCash reference number:
    Count how many times it appears

If reference number appears > 1 time:
  Mark all orders with that reference number as duplicates
  Show warning badge in admin dashboard
```

### Data Flow

```
User Side:
  Receipt Upload → Client OCR → Extract Ref# → Display → Submit Order

Server Side:
  Receive Order → Check for Duplicate Ref# → Allow/Reject Order

Admin Side:
  Load Orders → Calculate Duplicates → Show Warnings → Export Data
```

---

## FAQ

### For Customers

**Q: What if the reference number doesn't appear after upload?**
A: Your order will still be processed. The admin will manually verify your receipt.

**Q: Can I use the same GCash payment for multiple orders?**
A: No, each payment can only be used for one order. Make separate payments for multiple orders.

**Q: What if I accidentally uploaded the wrong receipt?**
A: Click "Change Receipt" to upload the correct one before submitting your order.

### For Admins

**Q: What if a customer legitimately has duplicate orders?**
A: Each order requires a separate payment. Ask them to make a new payment for the additional order.

**Q: Can I manually add/edit reference numbers?**
A: Currently not implemented. This feature can be added if needed.

**Q: What about old orders without reference numbers?**
A: They show "N/A" in exports. The system is backward-compatible.

**Q: How accurate is the OCR extraction?**
A: ~90-95% accuracy with clear screenshots. Always verify against the receipt image.

---

## Support

If you encounter issues:
1. Check that the receipt screenshot is clear
2. Verify internet connection (OCR downloads language data)
3. Try a different browser (Chrome/Edge recommended)
4. Contact technical support with error details

## Changelog

### Version 1.0 (Initial Implementation)
- ✅ Automatic reference number extraction
- ✅ Duplicate order detection
- ✅ Admin dashboard warnings
- ✅ Excel export integration
- ✅ Client-side OCR processing

### Future Enhancements
- 🔄 Manual reference number editing
- 🔄 PDF invoice support
- 🔄 Batch receipt processing
- 🔄 Amount verification
- 🔄 Analytics dashboard
