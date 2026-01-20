# GCash OCR System

## Complete Implementation Guide for Payment Receipt Processing

This document provides a comprehensive, portable guide to implementing automatic GCash reference number extraction from receipt screenshots. Use this as a blueprint to add OCR-based payment verification to any e-commerce project.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Why OCR for Payment Verification](#why-ocr-for-payment-verification)
3. [Technology Stack](#technology-stack)
4. [Database Schema](#database-schema)
5. [Client-Side OCR Implementation](#client-side-ocr-implementation)
6. [Server-Side OCR Implementation](#server-side-ocr-implementation)
7. [Receipt Parsing Logic](#receipt-parsing-logic)
8. [Invoice Processing](#invoice-processing)
9. [Duplicate Detection](#duplicate-detection)
10. [Admin Verification Interface](#admin-verification-interface)
11. [Batch Processing](#batch-processing)
12. [Error Handling](#error-handling)
13. [Testing Strategies](#testing-strategies)
14. [Implementation Checklist](#implementation-checklist)

---

## System Overview

### What This System Does

The GCash OCR system automatically extracts payment reference numbers from GCash receipt screenshots uploaded by customers during checkout. This eliminates manual data entry and reduces payment verification errors.

**Key Features:**

1. **Automatic Extraction**: Customers upload receipt → System extracts reference number
2. **Client-Side Processing**: OCR runs in browser for better performance
3. **Duplicate Detection**: Prevents reuse of payment receipts
4. **Manual Verification**: Admin interface for unmatched payments
5. **Batch Processing**: Process multiple existing orders
6. **Invoice Matching**: Upload GCash transaction history for automatic matching

### Payment Flow

```
1. Customer completes GCash payment outside your app
2. Customer takes screenshot of GCash receipt
3. Customer uploads receipt during checkout
4. System processes receipt with OCR (8-12 seconds)
5. System extracts reference number automatically
6. Order is created with reference number
7. Admin can verify payment matches reference number
8. System warns if reference number was used before
```

---

## Why OCR for Payment Verification

### Problem Statement

In the Philippines, GCash is a popular payment method but lacks direct API integration for small merchants. The typical flow is:

1. Merchant provides GCash number
2. Customer sends money via GCash
3. Customer sends screenshot of receipt
4. Merchant manually verifies payment

**Pain Points:**

- Manual verification is time-consuming
- Human error in matching payments to orders
- Customers can accidentally reuse old screenshots
- No automatic tracking of reference numbers
- Difficult to match payments in bulk

### Solution: Automated OCR

**Benefits:**

- ✅ Automatic extraction (no manual typing)
- ✅ 95%+ accuracy with good receipt screenshots
- ✅ Duplicate detection (prevents reuse)
- ✅ Faster checkout experience
- ✅ Easier admin verification
- ✅ Bulk processing capability
- ✅ Invoice matching for batch verification

---

## Technology Stack

### Required Libraries

#### Client-Side OCR (Recommended)

```json
{
  "dependencies": {
    "tesseract.js": "^5.0.0"  // Client-side OCR engine
  }
}
```

**Why client-side?**
- Faster processing (runs in browser)
- No server load
- Better scalability
- Works offline after initial load

#### Server-Side OCR (Alternative)

```json
{
  "dependencies": {
    "tesseract.js": "^5.0.0",    // Node.js OCR
    "canvas": "^2.11.0",          // Image processing
    "pdf-parse": "^1.1.1",        // PDF parsing (for invoices)
    "sharp": "^0.32.0"            // Image optimization
  }
}
```

**When to use server-side:**
- Client device has limited resources
- Need to process PDFs (invoices)
- Want centralized processing control

### Storage Requirements

- **S3-compatible storage** for receipt images (MinIO, AWS S3, etc.)
- **PostgreSQL** with JSON field support for storing parsed data
- **File size limit**: 5-10MB per receipt image

---

## Database Schema

### Order Model with GCash Fields

```prisma
model Order {
  id                   String   @id @default(uuid())
  userId               String
  totalAmount          Float
  status               String   @default("pending")

  // GCash OCR Fields
  receiptImageUrl      String?  // URL to receipt image in storage
  gcashReferenceNumber String?  // Extracted reference number

  // Standard fields
  notes                String?
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  user       User        @relation(fields: [userId], references: [id])
  orderItems OrderItem[]

  @@index([userId])
  @@index([status])
  @@index([gcashReferenceNumber])  // CRITICAL: Index for duplicate detection
}
```

**Key Points:**

1. `receiptImageUrl`: Store receipt image URL (not base64 in database)
2. `gcashReferenceNumber`: Store extracted reference number
3. **INDEX on gcashReferenceNumber**: Essential for fast duplicate detection
4. Both fields nullable (old orders might not have them)

---

## Client-Side OCR Implementation

### Step 1: Setup Tesseract.js

```typescript
// src/lib/ocr/tesseract-client.ts
import { createWorker } from "tesseract.js";

let worker: Tesseract.Worker | null = null;

export async function initializeOCR() {
  if (worker) return worker;

  worker = await createWorker("eng", 1, {
    workerPath: "/tesseract/worker.min.js",
    langPath: "/tesseract/lang-data",
    corePath: "/tesseract/tesseract-core.wasm",
  });

  await worker.setParameters({
    tessedit_char_whitelist: "0123456789- ",  // Only numbers, hyphens, spaces
  });

  return worker;
}

export async function terminateOCR() {
  if (worker) {
    await worker.terminate();
    worker = null;
  }
}
```

### Step 2: Receipt Reader

```typescript
// src/lib/gcashReaders/readReceipt.client.ts
import { initializeOCR } from "./tesseract-client";
import { parseGCashReceipt } from "./parseReceipt";

export async function readGCashReceiptClient(file: File): Promise<{
  success: boolean;
  referenceNumber?: string;
  amount?: number;
  recipient?: string;
  rawText?: string;
  error?: string;
}> {
  try {
    // Initialize OCR worker
    const worker = await initializeOCR();

    // Convert file to image URL
    const imageUrl = URL.createObjectURL(file);

    // Process image with Tesseract
    const { data: { text } } = await worker.recognize(imageUrl);

    // Clean up
    URL.revokeObjectURL(imageUrl);

    // Parse the OCR text
    const parsed = parseGCashReceipt(text);

    if (!parsed.referenceNumber) {
      return {
        success: false,
        error: "Could not find reference number in receipt",
        rawText: text,
      };
    }

    return {
      success: true,
      referenceNumber: parsed.referenceNumber,
      amount: parsed.amount,
      recipient: parsed.recipient,
      rawText: text,
    };
  } catch (error) {
    console.error("OCR Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
```

### Step 3: React Component Integration

```typescript
// src/app/shop/checkout/checkout-client.tsx
"use client";

import { useState } from "react";
import { readGCashReceiptClient } from "@/lib/gcashReaders/readReceipt.client";

export function CheckoutForm() {
  const [processing, setProcessing] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState("");
  const [ocrError, setOcrError] = useState("");

  async function handleReceiptUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setProcessing(true);
    setOcrError("");

    try {
      // Upload to storage first
      const formData = new FormData();
      formData.append("file", file);
      formData.append("type", "receipt");

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!uploadRes.ok) {
        throw new Error("Failed to upload receipt");
      }

      const { url } = await uploadRes.json();

      // Process with OCR
      const ocrResult = await readGCashReceiptClient(file);

      if (ocrResult.success && ocrResult.referenceNumber) {
        setReferenceNumber(ocrResult.referenceNumber);
        // Store receipt URL for order creation
        setReceiptUrl(url);
      } else {
        setOcrError(ocrResult.error || "Failed to extract reference number");
      }
    } catch (error) {
      setOcrError("An error occurred during processing");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <form>
      {/* Receipt Upload */}
      <div>
        <label>Upload GCash Receipt</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleReceiptUpload}
          disabled={processing}
        />
        {processing && <p>Processing receipt... (8-12 seconds)</p>}
        {ocrError && <p className="text-red-500">{ocrError}</p>}
      </div>

      {/* Auto-filled Reference Number */}
      {referenceNumber && (
        <div>
          <label>GCash Reference Number</label>
          <input
            type="text"
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
            placeholder="1234567890123"
          />
          <p className="text-sm text-green-600">
            ✓ Automatically extracted from receipt
          </p>
        </div>
      )}

      {/* Other checkout fields... */}
    </form>
  );
}
```

---

## Server-Side OCR Implementation

### When to Use Server-Side

Use server-side OCR when:

1. Processing PDF invoices (Tesseract.js requires Node.js canvas for PDFs)
2. Batch processing existing orders
3. Admin-initiated reprocessing
4. Client devices are too slow

### Setup

```typescript
// src/lib/gcashReaders/readReceipt.server.ts
"use server";

import Tesseract from "tesseract.js";
import { parseGCashReceipt } from "./parseReceipt";

export async function readGCashReceiptServer(imageUrl: string) {
  try {
    // Fetch image from storage
    const response = await fetch(imageUrl);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Process with Tesseract
    const { data: { text } } = await Tesseract.recognize(buffer, "eng", {
      tessedit_char_whitelist: "0123456789- ",
    });

    // Parse the text
    const parsed = parseGCashReceipt(text);

    return {
      success: !!parsed.referenceNumber,
      referenceNumber: parsed.referenceNumber,
      amount: parsed.amount,
      recipient: parsed.recipient,
      rawText: text,
    };
  } catch (error) {
    console.error("Server OCR Error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
```

---

## Receipt Parsing Logic

### Understanding GCash Receipts

**Typical GCash Receipt Format:**

```
GCash

Amount Sent
₱ 500.00

To
Juan Dela Cruz
09171234567

Reference No.
1234567890123

Transaction Date
Jan 20, 2026 2:30 PM
```

**Key Information to Extract:**

1. **Reference Number**: 13-digit number (sometimes with spaces)
2. **Amount**: Payment amount
3. **Recipient**: Merchant name/number
4. **Date**: Transaction date (optional)

### Parsing Implementation

```typescript
// src/lib/gcashReaders/parseReceipt.ts

export interface ParsedReceipt {
  referenceNumber?: string;
  amount?: number;
  recipient?: string;
  date?: Date;
}

export function parseGCashReceipt(ocrText: string): ParsedReceipt {
  const result: ParsedReceipt = {};

  // Normalize text (remove extra spaces, convert to uppercase)
  const normalized = ocrText.replace(/\s+/g, " ").toUpperCase();

  // Extract Reference Number
  result.referenceNumber = extractReferenceNumber(normalized);

  // Extract Amount
  result.amount = extractAmount(normalized);

  // Extract Recipient
  result.recipient = extractRecipient(normalized);

  return result;
}

function extractReferenceNumber(text: string): string | undefined {
  // Patterns to match GCash reference numbers
  const patterns = [
    // Standard format: "Reference No." followed by 13 digits
    /REFERENCE\s*(?:NO\.?|NUMBER)?\s*:?\s*(\d{13})/i,

    // With spaces: "1234 567 890 123"
    /REFERENCE\s*(?:NO\.?|NUMBER)?\s*:?\s*(\d{4}\s*\d{3}\s*\d{3}\s*\d{3})/i,

    // OCR errors: "Ref" instead of "Reference"
    /REF(?:ERENCE)?\s*(?:NO\.?|NUMBER)?\s*:?\s*(\d{13})/i,

    // Just 13 digits in a row
    /(\d{13})/,

    // 13 digits with spaces/hyphens
    /(\d{4}[\s-]\d{3}[\s-]\d{3}[\s-]\d{3})/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      // Remove all non-digit characters
      const cleaned = match[1].replace(/\D/g, "");

      // Validate length
      if (cleaned.length === 13) {
        return cleaned;
      }
    }
  }

  return undefined;
}

function extractAmount(text: string): number | undefined {
  // Patterns to match amounts
  const patterns = [
    // "₱ 500.00" or "PHP 500.00"
    /(?:₱|PHP)\s*([0-9,]+\.?\d{0,2})/i,

    // "Amount: 500.00"
    /AMOUNT\s*:?\s*([0-9,]+\.?\d{0,2})/i,

    // "Amount Sent 500.00"
    /AMOUNT\s*SENT\s*([0-9,]+\.?\d{0,2})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      // Remove commas and convert to number
      const amount = parseFloat(match[1].replace(/,/g, ""));
      if (!isNaN(amount) && amount > 0) {
        return amount;
      }
    }
  }

  return undefined;
}

function extractRecipient(text: string): string | undefined {
  // Pattern to match recipient name/number after "To"
  const patterns = [
    /TO\s*:?\s*([A-Z\s]+)\s*(?:\d{11})/i,  // Name followed by mobile number
    /TO\s*:?\s*([A-Z][A-Z\s]{2,30})/i,     // Just name
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return undefined;
}
```

### Handling OCR Errors

**Common OCR Errors:**

| Actual | OCR Might Read | Fix |
|--------|----------------|-----|
| Reference No. | Ref No., Reference Number, RefNo | Multiple pattern variations |
| 1234567890123 | 1234 567 890 123 | Remove all spaces/hyphens |
| ₱ 500.00 | P 500.00, PHP 500.00 | Match multiple currency symbols |
| To: Juan | To Juan, T0 Juan | Flexible pattern matching |

**Robust Parsing Strategy:**

1. Try multiple patterns for each field
2. Handle common OCR character substitutions (0→O, 1→I, etc.)
3. Normalize text before parsing
4. Validate extracted data (length, format)
5. Fall back to manual entry if extraction fails

---

## Invoice Processing

### GCash Transaction History PDFs

Admins can download their GCash transaction history as a PDF and upload it for bulk verification.

**Invoice Format:**

```
GCash Transaction History
Account: 09171234567
Date Range: Jan 1-31, 2026

Date       | Type        | Reference No. | Amount   | Status
-----------|-------------|---------------|----------|----------
2026-01-20 | Money Sent  | 1234567890123 | ₱500.00  | Success
2026-01-19 | Money Sent  | 9876543210987 | ₱350.00  | Success
2026-01-18 | Money Sent  | 1111222233334 | ₱200.00  | Success
```

### PDF Invoice Parser

```typescript
// src/lib/gcashReaders/readInvoice.ts
"use server";

import pdf from "pdf-parse";
import { parseInvoiceTable } from "./parseInvoiceTable";

export async function processGCashInvoice(file: File) {
  try {
    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse PDF
    const data = await pdf(buffer);
    const text = data.text;

    // Extract transactions table
    const transactions = parseInvoiceTable(text);

    return {
      success: true,
      transactions,
      totalFound: transactions.length,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to parse PDF",
      transactions: [],
    };
  }
}
```

### Invoice Table Parser

```typescript
// src/lib/gcashReaders/parseInvoiceTable.ts

export interface InvoiceTransaction {
  date: string;
  referenceNumber: string;
  amount: number;
  status: string;
}

export function parseInvoiceTable(text: string): InvoiceTransaction[] {
  const transactions: InvoiceTransaction[] = [];

  // Split by lines
  const lines = text.split("\n");

  for (const line of lines) {
    // Look for lines containing reference numbers (13 digits)
    const refMatch = line.match(/(\d{13})/);
    if (!refMatch) continue;

    const referenceNumber = refMatch[1];

    // Extract amount
    const amountMatch = line.match(/₱\s*([0-9,]+\.?\d{0,2})/);
    const amount = amountMatch
      ? parseFloat(amountMatch[1].replace(/,/g, ""))
      : 0;

    // Extract date (various formats)
    const dateMatch = line.match(/(\d{4}-\d{2}-\d{2})|(\w{3}\s+\d{1,2},?\s+\d{4})/);
    const date = dateMatch ? dateMatch[0] : "";

    // Extract status
    const status = line.match(/success/i) ? "Success" : "Unknown";

    transactions.push({
      date,
      referenceNumber,
      amount,
      status,
    });
  }

  return transactions;
}
```

### Matching Invoices to Orders

```typescript
// src/app/admin/orders/invoiceActions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { processGCashInvoice } from "@/lib/gcashReaders/readInvoice";

export async function matchInvoiceToOrders(file: File) {
  // Parse invoice
  const { success, transactions } = await processGCashInvoice(file);

  if (!success) {
    return { success: false, message: "Failed to parse invoice" };
  }

  const matches = [];
  const unmatched = [];

  for (const transaction of transactions) {
    // Find order with this reference number
    const order = await prisma.order.findFirst({
      where: {
        gcashReferenceNumber: transaction.referenceNumber,
      },
      include: {
        user: true,
      },
    });

    if (order) {
      matches.push({
        order,
        transaction,
        amountMatches: Math.abs(order.totalAmount - transaction.amount) < 0.01,
      });
    } else {
      unmatched.push(transaction);
    }
  }

  return {
    success: true,
    matches,
    unmatched,
    stats: {
      totalTransactions: transactions.length,
      matched: matches.length,
      unmatched: unmatched.length,
    },
  };
}
```

---

## Duplicate Detection

### Why Duplicate Detection Matters

**Problem:** Customers might accidentally upload the same receipt screenshot for multiple orders, or intentionally try to reuse a payment receipt.

**Solution:** Check if reference number was already used before accepting the order.

### Implementation

#### 1. Server-Side Validation

```typescript
// src/app/shop/actions.ts
"use server";

import { prisma } from "@/lib/prisma";

export async function validateGCashReference(
  referenceNumber: string,
  excludeOrderId?: string  // Exclude current order when updating
) {
  if (!referenceNumber) return { valid: true };

  // Check if reference number exists in any other order
  const existingOrder = await prisma.order.findFirst({
    where: {
      gcashReferenceNumber: referenceNumber,
      id: excludeOrderId ? { not: excludeOrderId } : undefined,
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  if (existingOrder) {
    return {
      valid: false,
      isDuplicate: true,
      existingOrder: {
        id: existingOrder.id,
        customerName: existingOrder.user.name,
        orderDate: existingOrder.createdAt,
        amount: existingOrder.totalAmount,
      },
    };
  }

  return { valid: true, isDuplicate: false };
}

export async function createOrder(data: OrderData) {
  // Validate reference number before creating order
  const validation = await validateGCashReference(data.gcashReferenceNumber);

  if (!validation.valid) {
    return {
      success: false,
      message: `This GCash reference number was already used for Order #${validation.existingOrder.id}`,
    };
  }

  // Create order
  const order = await prisma.order.create({
    data: {
      // ... order data including gcashReferenceNumber
    },
  });

  return { success: true, order };
}
```

#### 2. Admin UI Duplicate Warning

```typescript
// src/app/admin/orders/orders-management.tsx
"use client";

export function OrdersList({ orders }: Props) {
  // Group orders by GCash reference number
  const refNumberCounts = new Map<string, number>();

  orders.forEach(order => {
    if (order.gcashReferenceNumber) {
      const count = refNumberCounts.get(order.gcashReferenceNumber) || 0;
      refNumberCounts.set(order.gcashReferenceNumber, count + 1);
    }
  });

  return (
    <table>
      {orders.map(order => (
        <tr key={order.id}>
          <td>{order.id}</td>
          <td>{order.user.name}</td>
          <td>
            {order.gcashReferenceNumber}
            {/* Show warning badge if duplicate */}
            {refNumberCounts.get(order.gcashReferenceNumber!) > 1 && (
              <Badge variant="destructive" className="ml-2">
                ⚠️ DUPLICATE
              </Badge>
            )}
          </td>
          <td>₱{order.totalAmount.toFixed(2)}</td>
        </tr>
      ))}
    </table>
  );
}
```

---

## Admin Verification Interface

### Order Verification Dashboard

**Features:**

1. **Orders Tab**: All orders with status filters
2. **Verify Tab**: Orders needing verification
3. **Receipt Viewer**: View receipt images
4. **Manual Entry**: Fallback for failed OCR
5. **Status Updates**: Mark as paid/confirmed

### Verify Tab Implementation

```typescript
// src/app/admin/orders/page.tsx

export default async function OrdersManagementPage() {
  // Fetch orders needing verification
  const pendingOrders = await prisma.order.findMany({
    where: {
      status: "pending",
      receiptImageUrl: { not: null },  // Has receipt uploaded
    },
    include: {
      user: true,
      orderItems: {
        include: {
          product: true,
          package: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <Tabs defaultValue="orders">
        <TabsList>
          <TabsTrigger value="orders">All Orders</TabsTrigger>
          <TabsTrigger value="verify">
            Verify ({pendingOrders.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="orders">
          {/* All orders list */}
        </TabsContent>

        <TabsContent value="verify">
          <VerifyTab orders={pendingOrders} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### Receipt Viewer

```typescript
// src/components/admin/receipt-viewer.tsx
"use client";

export function ReceiptViewer({ receiptUrl }: { receiptUrl: string }) {
  const [zoomed, setZoomed] = useState(false);

  return (
    <Dialog>
      <DialogTrigger>
        <Button variant="outline">View Receipt</Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <div className={`transition-transform ${zoomed ? "scale-150" : ""}`}>
          <img
            src={receiptUrl}
            alt="GCash Receipt"
            className="max-h-[80vh] mx-auto cursor-zoom-in"
            onClick={() => setZoomed(!zoomed)}
          />
        </div>
        <p className="text-sm text-muted-foreground text-center">
          Click image to zoom
        </p>
      </DialogContent>
    </Dialog>
  );
}
```

### Manual Reprocessing

```typescript
// src/app/admin/orders/actions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { readGCashReceiptServer } from "@/lib/gcashReaders/readReceipt.server";

export async function reprocessOrderReceipt(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { receiptImageUrl: true },
  });

  if (!order?.receiptImageUrl) {
    return { success: false, message: "No receipt to process" };
  }

  // Reprocess with OCR
  const result = await readGCashReceiptServer(order.receiptImageUrl);

  if (result.success && result.referenceNumber) {
    // Update order with extracted reference number
    await prisma.order.update({
      where: { id: orderId },
      data: {
        gcashReferenceNumber: result.referenceNumber,
      },
    });

    return {
      success: true,
      referenceNumber: result.referenceNumber,
    };
  }

  return {
    success: false,
    message: "Failed to extract reference number",
  };
}
```

---

## Batch Processing

### Batch Reprocess Existing Orders

**Use Case:** You added OCR functionality after orders were already created. Batch process all existing receipts.

```typescript
// src/app/admin/orders/batchOcrActions.ts
"use server";

import { prisma } from "@/lib/prisma";
import { readGCashReceiptServer } from "@/lib/gcashReaders/readReceipt.server";

export async function batchReprocessReceipts() {
  // Find orders with receipts but no reference number
  const orders = await prisma.order.findMany({
    where: {
      receiptImageUrl: { not: null },
      gcashReferenceNumber: null,
    },
    select: {
      id: true,
      receiptImageUrl: true,
    },
  });

  const results = {
    total: orders.length,
    success: 0,
    failed: 0,
    details: [] as any[],
  };

  for (const order of orders) {
    try {
      const ocrResult = await readGCashReceiptServer(order.receiptImageUrl!);

      if (ocrResult.success && ocrResult.referenceNumber) {
        // Update order
        await prisma.order.update({
          where: { id: order.id },
          data: {
            gcashReferenceNumber: ocrResult.referenceNumber,
          },
        });

        results.success++;
        results.details.push({
          orderId: order.id,
          status: "success",
          referenceNumber: ocrResult.referenceNumber,
        });
      } else {
        results.failed++;
        results.details.push({
          orderId: order.id,
          status: "failed",
          error: ocrResult.error || "No reference number found",
        });
      }
    } catch (error) {
      results.failed++;
      results.details.push({
        orderId: order.id,
        status: "error",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }

    // Add delay to prevent rate limiting / resource exhaustion
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return results;
}
```

### Batch UI Component

```typescript
// src/app/admin/orders/batch-ocr-ui.tsx
"use client";

export function BatchOCRProcessor() {
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);

  async function startBatchProcessing() {
    setProcessing(true);
    const results = await batchReprocessReceipts();
    setResults(results);
    setProcessing(false);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Batch Reprocess Receipts</CardTitle>
        <CardDescription>
          Reprocess all orders with receipts but no reference numbers
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!processing && !results && (
          <Button onClick={startBatchProcessing}>
            Start Batch Processing
          </Button>
        )}

        {processing && (
          <div>
            <Spinner />
            <p>Processing receipts... This may take several minutes.</p>
          </div>
        )}

        {results && (
          <div>
            <h3>Results:</h3>
            <p>Total: {results.total}</p>
            <p className="text-green-600">Success: {results.success}</p>
            <p className="text-red-600">Failed: {results.failed}</p>

            <details>
              <summary>View Details</summary>
              <pre>{JSON.stringify(results.details, null, 2)}</pre>
            </details>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

---

## Error Handling

### Common OCR Errors and Solutions

#### 1. Low Image Quality

**Problem:** Blurry or low-resolution images produce poor OCR results.

**Solution:**

```typescript
// Validate image quality before processing
async function validateReceiptImage(file: File): Promise<{
  valid: boolean;
  error?: string;
}> {
  // Check file size
  const minSize = 50 * 1024;  // 50KB minimum
  const maxSize = 10 * 1024 * 1024;  // 10MB maximum

  if (file.size < minSize) {
    return {
      valid: false,
      error: "Image is too small. Please upload a clearer screenshot.",
    };
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: "Image is too large. Maximum size is 10MB.",
    };
  }

  // Check image dimensions
  const img = await createImageBitmap(file);

  if (img.width < 300 || img.height < 300) {
    return {
      valid: false,
      error: "Image resolution is too low. Please upload a clearer screenshot.",
    };
  }

  return { valid: true };
}
```

#### 2. No Reference Number Found

**Problem:** OCR completes but can't find reference number in text.

**Solution:**

```typescript
// Provide manual entry fallback
{!referenceNumber && ocrComplete && (
  <div>
    <Alert variant="warning">
      <AlertTitle>Could not extract reference number</AlertTitle>
      <AlertDescription>
        Please enter it manually from your receipt.
      </AlertDescription>
    </Alert>
    <Input
      placeholder="Enter 13-digit reference number"
      value={manualRefNumber}
      onChange={(e) => setManualRefNumber(e.target.value)}
      maxLength={13}
    />
  </div>
)}
```

#### 3. Processing Timeout

**Problem:** OCR takes too long or hangs.

**Solution:**

```typescript
// Add timeout to OCR processing
async function readGCashReceiptWithTimeout(
  file: File,
  timeoutMs: number = 30000  // 30 second timeout
) {
  return Promise.race([
    readGCashReceiptClient(file),
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error("OCR timeout")), timeoutMs)
    ),
  ]);
}
```

### User-Friendly Error Messages

```typescript
const ERROR_MESSAGES = {
  "OCR timeout": "Processing took too long. Please try uploading the image again.",
  "No reference number found": "Could not find reference number. Please check if the image is clear and try again, or enter manually.",
  "Invalid file type": "Please upload an image file (JPG, PNG).",
  "Network error": "Failed to upload image. Please check your connection and try again.",
};

function getErrorMessage(error: string): string {
  return ERROR_MESSAGES[error] || "An unexpected error occurred. Please try again.";
}
```

---

## Testing Strategies

### 1. Unit Testing Parsing Logic

```typescript
// parseReceipt.test.ts
import { parseGCashReceipt } from "./parseReceipt";

describe("parseGCashReceipt", () => {
  it("should extract reference number from standard format", () => {
    const text = `
      GCash Receipt
      Reference No.
      1234567890123
      Amount: ₱500.00
    `;

    const result = parseGCashReceipt(text);
    expect(result.referenceNumber).toBe("1234567890123");
    expect(result.amount).toBe(500);
  });

  it("should extract reference number with spaces", () => {
    const text = "Reference No. 1234 567 890 123";
    const result = parseGCashReceipt(text);
    expect(result.referenceNumber).toBe("1234567890123");
  });

  it("should handle OCR errors (Ref instead of Reference)", () => {
    const text = "Ref No. 1234567890123";
    const result = parseGCashReceipt(text);
    expect(result.referenceNumber).toBe("1234567890123");
  });
});
```

### 2. Integration Testing with Real Receipts

Create a test suite with actual GCash receipt screenshots:

```typescript
// ocr.integration.test.ts
import { readGCashReceiptServer } from "./readReceipt.server";
import fs from "fs";
import path from "path";

describe("OCR Integration Tests", () => {
  const testReceiptsDir = path.join(__dirname, "test-receipts");

  it("should extract from clear receipt", async () => {
    const imagePath = path.join(testReceiptsDir, "clear-receipt.jpg");
    const imageUrl = `file://${imagePath}`;

    const result = await readGCashReceiptServer(imageUrl);

    expect(result.success).toBe(true);
    expect(result.referenceNumber).toMatch(/^\d{13}$/);
  });

  it("should handle blurry receipt", async () => {
    const imagePath = path.join(testReceiptsDir, "blurry-receipt.jpg");
    const imageUrl = `file://${imagePath}`;

    const result = await readGCashReceiptServer(imageUrl);

    // May succeed or fail, but should not crash
    expect(result.success).toBeDefined();
  });
});
```

### 3. Manual Testing Checklist

- [ ] Upload clear GCash receipt screenshot
- [ ] Upload blurry receipt (should handle gracefully)
- [ ] Upload non-receipt image (should fail gracefully)
- [ ] Upload receipt with spaces in reference number
- [ ] Try duplicate reference number (should show warning)
- [ ] Test manual entry fallback
- [ ] Test batch processing
- [ ] Test invoice upload and matching
- [ ] Test admin verification interface
- [ ] Test Excel export with reference numbers

---

## Implementation Checklist

### Database Setup

- [ ] Add `receiptImageUrl` field to Order model
- [ ] Add `gcashReferenceNumber` field to Order model
- [ ] Add index on `gcashReferenceNumber` for duplicate detection
- [ ] Run migrations

### Storage Setup

- [ ] Configure S3-compatible storage (MinIO, AWS S3, etc.)
- [ ] Create bucket for receipts
- [ ] Set up presigned URL generation
- [ ] Implement upload endpoint (`/api/upload`)

### Client-Side OCR

- [ ] Install tesseract.js
- [ ] Create OCR worker initialization
- [ ] Implement client-side receipt reader
- [ ] Add receipt parsing logic
- [ ] Create checkout component with OCR integration
- [ ] Add loading states
- [ ] Add error handling
- [ ] Add manual entry fallback

### Server-Side OCR (Optional)

- [ ] Install tesseract.js and dependencies
- [ ] Implement server-side receipt reader
- [ ] Create batch processing endpoint
- [ ] Implement PDF invoice parser
- [ ] Create invoice matching logic

### Duplicate Detection

- [ ] Implement validation function
- [ ] Add duplicate check before order creation
- [ ] Create admin UI duplicate warnings
- [ ] Add visual badges for duplicates

### Admin Interface

- [ ] Create orders management page
- [ ] Add Verify tab for pending orders
- [ ] Implement receipt viewer component
- [ ] Add manual reprocess button
- [ ] Create batch processing UI
- [ ] Add invoice upload interface
- [ ] Implement invoice matching display

### Order Management

- [ ] Update order creation to accept reference number
- [ ] Add reference number to order confirmation
- [ ] Display reference number in order details
- [ ] Include reference number in Excel exports
- [ ] Add reference number to email notifications (if applicable)

### Testing

- [ ] Unit test parsing logic
- [ ] Integration test with real receipts
- [ ] Test duplicate detection
- [ ] Test batch processing
- [ ] Test invoice matching
- [ ] Test error scenarios
- [ ] Test manual entry fallback
- [ ] User acceptance testing

### Documentation

- [ ] Document OCR setup for developers
- [ ] Create user guide for uploading receipts
- [ ] Document admin verification process
- [ ] Create troubleshooting guide

---

## Performance Considerations

### OCR Processing Time

**Expected times:**

- Client-side: 8-12 seconds per receipt
- Server-side: 10-15 seconds per receipt
- Batch processing: ~10 seconds per receipt (sequential)

**Optimization strategies:**

1. **Client-side processing** (recommended)
   - Offloads work to client
   - No server resource usage
   - Better scalability

2. **Image preprocessing**
   - Resize to reasonable dimensions (max 1200px)
   - Convert to grayscale
   - Enhance contrast

3. **Caching**
   - Cache OCR results in database
   - Don't reprocess same receipt

4. **Async processing**
   - Process in background
   - Show progress indicator
   - Allow user to continue browsing

### Storage Optimization

**Receipt images:**

- Store original image in storage
- Generate thumbnail for admin list view
- Consider compression (WebP format)
- Set retention policy (delete after X months)

---

## Security Considerations

### Receipt Image Privacy

**Best practices:**

1. **Access Control:**
   - Only order owner and admins can view receipt
   - Use presigned URLs with expiration
   - Don't expose direct file URLs

2. **Data Retention:**
   - Delete receipts after order completion (optional)
   - Or retain for audit period (e.g., 1 year)
   - Implement automated cleanup

3. **Sensitive Data:**
   - Receipts may contain mobile numbers
   - Consider redacting/blurring sensitive info
   - Comply with privacy regulations (GDPR, etc.)

### Reference Number Security

**Considerations:**

1. **Validation:**
   - Always validate format (13 digits)
   - Check duplicate before accepting
   - Don't trust client-side validation alone

2. **Storage:**
   - Store as plain text (no encryption needed)
   - Index for fast duplicate detection
   - Include in audit logs

---

## Conclusion

This GCash OCR system provides:

1. **Automatic Extraction**: 95%+ accuracy for clear receipts
2. **Client-Side Processing**: Faster, more scalable
3. **Duplicate Detection**: Prevents payment receipt reuse
4. **Manual Fallback**: When OCR fails, users can enter manually
5. **Batch Processing**: Process existing orders retroactively
6. **Invoice Matching**: Bulk verification with GCash transaction history
7. **Admin Interface**: Easy verification and management
8. **Error Handling**: Graceful degradation

**Key Success Factors:**

- ✅ Clear user instructions (how to take good screenshot)
- ✅ Fast processing (8-12 seconds acceptable)
- ✅ Manual fallback (always available)
- ✅ Duplicate detection (prevents fraud)
- ✅ Admin verification (human oversight)

Use this as a complete blueprint to implement OCR-based payment verification in any e-commerce project, especially for GCash or similar payment receipt systems!
