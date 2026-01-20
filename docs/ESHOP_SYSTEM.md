# E-Shop System Architecture

## Complete E-Commerce Implementation Guide

This document provides a comprehensive, portable guide to implementing the ARSA e-shop system. Use this as a blueprint to recreate the e-commerce functionality in any other project.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Database Schema](#database-schema)
3. [Core Features](#core-features)
4. [Product System](#product-system)
5. [Package System](#package-system)
6. [Events System](#events-system)
7. [Cart System](#cart-system)
8. [Checkout Flow](#checkout-flow)
9. [Order Management](#order-management)
10. [Admin Interfaces](#admin-interfaces)
11. [Analytics](#analytics)
12. [Implementation Checklist](#implementation-checklist)

---

## System Overview

### Architecture Philosophy

The ARSA e-shop is built on these core principles:

1. **Event-First Organization**: Products are organized into themed event tabs
2. **Flexible Product Types**: Support for individual products and bundles (packages)
3. **Dynamic Pricing**: Base prices with event-specific overrides
4. **Custom Checkout**: Event-specific checkout fields and flows
5. **Role-Based Access**: Multiple admin levels for different responsibilities
6. **Size-Aware**: Full support for size variants with size-specific pricing
7. **Analytics-Driven**: Built-in click and purchase tracking

### Tech Stack Requirements

- **Backend**: Server-side rendering capability (Next.js App Router recommended)
- **Database**: PostgreSQL with ORM (Prisma recommended)
- **Storage**: S3-compatible object storage for images (MinIO recommended)
- **Authentication**: Session-based auth with role management
- **UI**: Component library (shadcn/ui recommended)
- **Forms**: react-hook-form with validation (Zod)
- **State Management**: URL state for tabs, local state for cart

---

## Database Schema

### Core Models

#### 1. Product Model

```prisma
model Product {
  id               String   @id @default(uuid())
  name             String
  description      String
  price            Float    // Base price
  category         String   // "merch", "arsari-sari", "other"
  image            String?  // Legacy single image
  imageUrls        String[] @default([])  // Multiple images for carousel
  stock            Int?     // Optional stock tracking
  isAvailable      Boolean  @default(true)
  isPreOrder       Boolean  @default(false)  // Stock shows order count instead
  isEventExclusive Boolean  @default(false)  // Only shows under assigned events
  availableSizes   String[] @default([])  // ["S", "M", "L", "XL"]
  sizePricing      Json?    // Size-specific pricing: { "S": 100, "M": 150 }
  specialNote      String?  // Warning shown during checkout
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  // Relations
  orderItems         OrderItem[]
  cartItems          CartItem[]
  packageItems       PackageItem[]
  packagePoolOptions PackagePoolOption[]
  eventProducts      EventProduct[]
}
```

**Key Features:**
- Multiple images for product carousel
- Optional stock tracking (or hide stock completely)
- Pre-order mode (stock count = number of orders)
- Size variants with optional size-specific pricing
- Event exclusivity flag
- Special checkout warnings

#### 2. Package Model (Product Bundles)

```prisma
model Package {
  id               String   @id @default(uuid())
  name             String
  description      String
  price            Float    // Bundle price (usually discounted)
  image            String?
  imageUrls        String[] @default([])
  isAvailable      Boolean  @default(true)
  isEventExclusive Boolean  @default(false)
  specialNote      String?
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  // Relations
  items         PackageItem[]      // Fixed items
  pools         PackagePool[]      // Selection pools
  cartItems     CartItem[]
  orderItems    OrderItem[]
  eventProducts EventProduct[]
}

// Fixed items always included
model PackageItem {
  id        String @id @default(uuid())
  packageId String
  productId String
  quantity  Int    @default(1)

  package Package @relation(fields: [packageId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id])

  @@index([packageId])
}

// Selection pools - "Pick X from Y"
model PackagePool {
  id          String @id @default(uuid())
  packageId   String
  name        String  // e.g., "Choose your shirts"
  selectCount Int     // How many to pick

  package Package             @relation(fields: [packageId], references: [id], onDelete: Cascade)
  options PackagePoolOption[]

  @@index([packageId])
}

model PackagePoolOption {
  id        String @id @default(uuid())
  poolId    String
  productId String

  pool    PackagePool @relation(fields: [poolId], references: [id], onDelete: Cascade)
  product Product     @relation(fields: [productId], references: [id])

  @@index([poolId])
}
```

**Key Features:**
- Fixed items (always included with quantity support)
- Selection pools ("Choose 3 from these 8 shirts")
- Same event assignment and pricing system as products
- Bundle pricing separate from individual item prices

#### 3. ShopEvent Model

```prisma
model ShopEvent {
  id            String   @id @default(uuid())
  name          String   // "Flower Fest 2026"
  slug          String   @unique  // "flower-fest-2026"
  description   String
  heroImage     String?
  heroImageUrls String[] @default([])

  // Tab behavior
  isActive   Boolean @default(true)
  isPriority Boolean @default(false)  // Makes it default landing tab
  tabOrder   Int     @default(0)
  tabLabel   String?  // Custom tab label (defaults to name)

  // Timing
  startDate DateTime
  endDate   DateTime

  // Custom component path for event-specific UI
  componentPath String?  // e.g., "flower-fest-2026"

  // Theme configuration (colors, animations)
  themeConfig Json?
  /*
  {
    "primaryColor": "#FF69B4",
    "secondaryColor": "#FFB6C1",
    "animation": "petals",  // confetti, hearts, snow, sparkles, petals, none
    "backgroundPattern": "floral",
    "tabGlow": true,
    "headerText": "Welcome to Flower Fest! 🌸"
  }
  */

  // Checkout customization
  checkoutConfig Json?
  /*
  {
    "headerMessage": "Special Flower Fest Checkout!",
    "additionalFields": [
      {
        "id": "room-number",
        "label": "Room Number",
        "type": "text",
        "required": true,
        "placeholder": "e.g., 301"
      }
    ],
    "termsMessage": "Custom terms for this event",
    "confirmationMessage": "Thank you for ordering!"
  }
  */

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  products EventProduct[]
  orders   Order[]
  admins   EventAdmin[]

  @@index([isActive])
  @@index([startDate, endDate])
}
```

**Key Features:**
- Date-range visibility (only shows between start and end dates)
- Priority system for default landing tab
- Custom theming (colors, animations, patterns)
- Custom checkout fields per event
- Event-specific admin assignments
- Custom React component support for unique event UIs

#### 4. EventProduct (Join Table)

```prisma
model EventProduct {
  id         String  @id @default(uuid())
  eventId    String
  productId  String?  // Either product OR package
  packageId  String?
  sortOrder  Int     @default(0)
  eventPrice Float?  // Override price for this event

  event   ShopEvent @relation(fields: [eventId], references: [id], onDelete: Cascade)
  product Product?  @relation(fields: [productId], references: [id])
  package Package?  @relation(fields: [packageId], references: [id])

  @@index([eventId])
  @@index([eventId, sortOrder])
}
```

**Key Features:**
- Many-to-many relationship (products/packages can be in multiple events)
- Event-specific pricing overrides
- Sort order control within events
- Cascade delete (removing event removes assignments)

#### 5. EventAdmin (Event-Specific Admins)

```prisma
model EventAdmin {
  id        String   @id @default(uuid())
  eventId   String
  userId    String
  createdAt DateTime @default(now())

  event ShopEvent @relation(fields: [eventId], references: [id], onDelete: Cascade)
  user  User      @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([eventId, userId])
  @@index([userId])
}
```

**Key Features:**
- Allows assigning specific users as admins for specific events
- Separate from global shop admins
- Many-to-many User ↔ ShopEvent

#### 6. CartItem Model

```prisma
model CartItem {
  id                String   @id @default(uuid())
  userId            String
  productId         String?  // Either product OR package
  packageId         String?
  quantity          Int      @default(1)
  size              String?  // For single products
  packageSelections Json?    // For packages with selections
  /*
  Example packageSelections for package with selection pool:
  {
    "fixedItems": {
      "product-id-1": { "size": "M" },
      "product-id-2": { "size": "L" }
    },
    "pools": {
      "pool-id-1": {
        "selections": [
          { "productId": "product-id-3", "size": "S" },
          { "productId": "product-id-4", "size": "M" }
        ]
      }
    }
  }
  */
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  user    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  product Product? @relation(fields: [productId], references: [id], onDelete: Cascade)
  package Package? @relation(fields: [packageId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([userId, productId, size])  // For deduplication
  @@index([userId, packageId])
}
```

**Key Features:**
- Stores size selections for products
- Stores complex selections for packages (fixed items + pool choices)
- User-scoped (each user has their own cart)
- Cascade delete on product/package deletion

#### 7. Order Model

```prisma
model Order {
  id                   String   @id @default(uuid())
  userId               String
  totalAmount          Float
  status               String   @default("pending")  // pending, paid, confirmed, completed, cancelled
  receiptImageUrl      String?  // GCash receipt
  gcashReferenceNumber String?  // Auto-extracted via OCR
  notes                String?  // Customer notes
  eventId              String?  // Which event this order is for
  eventData            Json?    // Responses to custom event checkout fields
  /*
  Example eventData:
  {
    "room-number": "301",
    "delivery-time": "2026-01-20T14:00:00Z",
    "special-request": "Please knock softly"
  }
  */
  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  user       User        @relation(fields: [userId], references: [id])
  orderItems OrderItem[]
  event      ShopEvent?  @relation(fields: [eventId], references: [id])

  @@index([userId])
  @@index([status])
  @@index([gcashReferenceNumber])  // For duplicate detection
  @@index([eventId])
}

model OrderItem {
  id                String  @id @default(uuid())
  orderId           String
  productId         String?  // Either product OR package
  packageId         String?
  quantity          Int
  price             Float    // Snapshot price at time of order
  size              String?  // For products
  packageSelections Json?    // For packages - snapshot of selections

  order   Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product Product? @relation(fields: [productId], references: [id])
  package Package? @relation(fields: [packageId], references: [id])

  @@index([orderId])
}
```

**Key Features:**
- Status workflow: pending → paid → confirmed → completed (or cancelled)
- GCash reference number for payment verification
- Event association for event-specific orders
- Custom event data (responses to event checkout fields)
- Price snapshots (order items store price at time of purchase)
- Cascade delete on order deletion

#### 8. Analytics Models

```prisma
// Click tracking
model ShopClick {
  id        String   @id @default(uuid())
  path      String   // "/shop", "/shop?tab=event-slug"
  eventId   String?  // If click was on event tab
  userAgent String?
  referer   String?
  clickedAt DateTime @default(now())

  @@index([clickedAt])
  @@index([path])
  @@index([eventId])
}

// Purchase tracking
model ShopPurchase {
  id          String   @id @default(uuid())
  orderId     String
  eventId     String?  // If purchase was for event
  totalAmount Float
  itemCount   Int
  purchasedAt DateTime @default(now())

  @@index([purchasedAt])
  @@index([eventId])
  @@index([eventId, purchasedAt])
}
```

**Key Features:**
- Separate from orders (for faster analytics queries)
- Event-specific tracking
- User agent and referer tracking for click analytics
- Date-indexed for time-series queries

#### 9. User Model Extensions

```prisma
model User {
  // ... other fields ...
  isShopAdmin      Boolean  @default(false)  // Full shop access
  isEventsAdmin    Boolean  @default(false)  // Full events access
  studentId        String?  // University student ID

  // Relations
  orders      Order[]
  cartItems   CartItem[]
  eventAdmins EventAdmin[]  // Events this user is admin for
}
```

**Admin Roles:**
- `isShopAdmin`: Full access to products, packages, orders, events
- `isEventsAdmin`: Full access to events (cannot manage admins)
- Event-specific admin (via `EventAdmin`): Access to assigned events only

---

## Core Features

### 1. Multi-Tab Shop Interface

**Implementation:**

```typescript
// Shop page structure
type ShopTab = "all" | "merch" | "arsari-sari" | "other" | string; // string for event slugs

// URL-based tab state
const [activeTab, setActiveTab] = useState<ShopTab>("all");

// Fetch products based on active tab
if (activeTab === "all") {
  // Show all non-event-exclusive products
  products = await prisma.product.findMany({
    where: {
      isAvailable: true,
      isEventExclusive: false,
    },
  });
} else if (["merch", "arsari-sari", "other"].includes(activeTab)) {
  // Show category products
  products = await prisma.product.findMany({
    where: {
      category: activeTab,
      isAvailable: true,
      isEventExclusive: false,
    },
  });
} else {
  // Event tab - fetch event with products
  const event = await prisma.shopEvent.findUnique({
    where: { slug: activeTab },
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

  // Apply event pricing overrides
  products = event.products.map(ep => ({
    ...(ep.product || ep.package),
    price: ep.eventPrice || (ep.product?.price || ep.package?.price),
  }));
}
```

### 2. Dynamic Event Tabs

**Tab Visibility Logic:**

```typescript
// Fetch active events
const now = new Date();
const activeEvents = await prisma.shopEvent.findMany({
  where: {
    isActive: true,
    startDate: { lte: now },
    endDate: { gte: now },
  },
  orderBy: [
    { isPriority: "desc" },  // Priority events first
    { tabOrder: "asc" },
  ],
});

// Determine default tab
const defaultTab = activeEvents.find(e => e.isPriority)?.slug || "all";
```

### 3. Size-Aware Product Display

**Price Display:**

```typescript
function getProductPriceDisplay(product: Product) {
  // If size-specific pricing exists
  if (product.sizePricing && product.availableSizes.length > 0) {
    const prices = product.availableSizes.map(size =>
      product.sizePricing[size] || product.price
    );
    const min = Math.min(...prices);
    const max = Math.max(...prices);

    if (min === max) {
      return `₱${min.toFixed(2)}`;
    }
    return `₱${min.toFixed(2)} - ₱${max.toFixed(2)}`;
  }

  return `₱${product.price.toFixed(2)}`;
}
```

### 4. Package Selection Interface

**Customer Flow:**

1. Add package to cart
2. If package has fixed items with sizes: Select size for each item
3. If package has selection pools: Choose X products from pool, then select sizes
4. Store all selections in `packageSelections` JSON field

**Example UI:**

```typescript
function PackageSelectionDialog({ package }: Props) {
  const [selections, setSelections] = useState({
    fixedItems: {},  // { productId: { size: "M" } }
    pools: {},  // { poolId: { selections: [{ productId, size }] } }
  });

  // Render fixed items with size selectors
  {package.items.map(item => (
    <div key={item.id}>
      <p>{item.product.name} x{item.quantity}</p>
      {item.product.availableSizes.length > 0 && (
        <SizeSelector
          sizes={item.product.availableSizes}
          selected={selections.fixedItems[item.productId]?.size}
          onChange={(size) => updateFixedItemSize(item.productId, size)}
        />
      )}
    </div>
  ))}

  // Render selection pools
  {package.pools.map(pool => (
    <div key={pool.id}>
      <p>Choose {pool.selectCount} from:</p>
      {pool.options.map(option => (
        <ProductCheckbox
          product={option.product}
          checked={isSelected(pool.id, option.productId)}
          onToggle={() => togglePoolSelection(pool.id, option)}
          max={pool.selectCount}
        />
      ))}
    </div>
  ))}
}
```

---

## Product System

### Product Creation Flow

**Admin Interface Requirements:**

1. **Basic Info:**
   - Name (required)
   - Description (required)
   - Base price (required)
   - Category selection (merch/arsari-sari/other)

2. **Images:**
   - Multiple image upload
   - Drag-to-reorder
   - First image = main display image
   - Rotate and remove functionality

3. **Event Assignment** (PROMINENT - near top of form):
   - List all active events
   - Checkbox to assign product to event
   - Optional event-specific price override
   - "Event Exclusive" toggle (hides from All/categories)
   - Message if no events exist: "Create an event first"

4. **Stock Management:**
   - Optional stock tracking (can be null)
   - Pre-order mode toggle
   - Availability toggle

5. **Size Variants:**
   - Checkbox selection: XXXS, XXS, XS, S, M, L, XL, XXL, XXXL
   - Optional size-specific pricing
   - Grid input for size prices (shows base price as placeholder)

6. **Special Note:**
   - Optional warning message
   - Displayed during checkout

### Server Action Example

```typescript
// src/app/admin/products/actions.ts
"use server";

export async function createProduct(data: ProductFormData) {
  // Validate input
  if (!data.name || !data.description || data.price <= 0) {
    return { success: false, message: "Invalid input" };
  }

  // Create product with event assignments
  const product = await prisma.product.create({
    data: {
      name: data.name,
      description: data.description,
      price: data.price,
      category: data.category,
      imageUrls: data.imageUrls,
      image: data.imageUrls[0] || null,  // First image as main
      stock: data.stock,
      isAvailable: data.isAvailable,
      isPreOrder: data.isPreOrder,
      isEventExclusive: data.isEventExclusive,
      availableSizes: data.availableSizes,
      sizePricing: data.sizePricing,
      specialNote: data.specialNote,
      eventProducts: {
        create: data.assignedEvents.map((event, index) => ({
          eventId: event.eventId,
          eventPrice: event.eventPrice,
          sortOrder: index,
        })),
      },
    },
  });

  return { success: true, product };
}
```

---

## Package System

### Package Types

#### 1. Fixed Items Package

**Example:** "Dorm Essentials Bundle"
- 1x Laundry Bag
- 2x Hangers
- 1x Storage Box
- Discounted price: ₱500 (vs ₱650 individually)

**Data Structure:**

```typescript
{
  package: {
    id: "pkg-1",
    name: "Dorm Essentials Bundle",
    price: 500,
    items: [
      { productId: "prod-1", quantity: 1 },  // Laundry Bag
      { productId: "prod-2", quantity: 2 },  // Hangers
      { productId: "prod-3", quantity: 1 },  // Storage Box
    ]
  }
}
```

#### 2. Selection Pool Package

**Example:** "Custom Shirt Bundle"
- Choose 3 shirts from 8 options
- Bundle price: ₱450 (vs ₱600 for 3 individual shirts)

**Data Structure:**

```typescript
{
  package: {
    id: "pkg-2",
    name: "Custom Shirt Bundle",
    price: 450,
    pools: [
      {
        id: "pool-1",
        name: "Choose your 3 shirts",
        selectCount: 3,
        options: [
          { productId: "shirt-1" },  // Option 1
          { productId: "shirt-2" },  // Option 2
          // ... 6 more options
        ]
      }
    ]
  }
}
```

#### 3. Mixed Package

**Example:** "Complete Outfit Bundle"
- 1x Pants (fixed)
- Choose 2 shirts from 5 options (pool)
- Bundle price: ₱800

**Data Structure:**

```typescript
{
  package: {
    id: "pkg-3",
    name: "Complete Outfit Bundle",
    price: 800,
    items: [
      { productId: "pants-1", quantity: 1 },  // Fixed item
    ],
    pools: [
      {
        id: "pool-1",
        name: "Choose 2 shirts",
        selectCount: 2,
        options: [
          { productId: "shirt-1" },
          { productId: "shirt-2" },
          { productId: "shirt-3" },
          { productId: "shirt-4" },
          { productId: "shirt-5" },
        ]
      }
    ]
  }
}
```

### Package Cart Storage

**packageSelections JSON Structure:**

```typescript
type PackageSelections = {
  fixedItems: {
    [productId: string]: {
      size?: string;  // If product has sizes
    };
  };
  pools: {
    [poolId: string]: {
      selections: Array<{
        productId: string;
        size?: string;  // If product has sizes
      }>;
    };
  };
};

// Example:
{
  "fixedItems": {
    "pants-1": { "size": "L" }
  },
  "pools": {
    "pool-1": {
      "selections": [
        { "productId": "shirt-1", "size": "M" },
        { "productId": "shirt-3", "size": "L" }
      ]
    }
  }
}
```

### Package Validation

```typescript
function validatePackageSelections(
  package: Package,
  selections: PackageSelections
): { valid: boolean; error?: string } {
  // Check all fixed items have selections if they need sizes
  for (const item of package.items) {
    if (item.product.availableSizes.length > 0) {
      if (!selections.fixedItems[item.productId]?.size) {
        return {
          valid: false,
          error: `Please select size for ${item.product.name}`,
        };
      }
    }
  }

  // Check all pools have correct number of selections
  for (const pool of package.pools) {
    const poolSelections = selections.pools[pool.id]?.selections || [];
    if (poolSelections.length !== pool.selectCount) {
      return {
        valid: false,
        error: `Please select exactly ${pool.selectCount} items for ${pool.name}`,
      };
    }

    // Check all selections have sizes if needed
    for (const selection of poolSelections) {
      const product = pool.options.find(
        opt => opt.productId === selection.productId
      )?.product;

      if (product?.availableSizes.length > 0 && !selection.size) {
        return {
          valid: false,
          error: `Please select size for ${product.name}`,
        };
      }
    }
  }

  return { valid: true };
}
```

---

## Events System

### Event Lifecycle

1. **Creation**: Admin creates event with dates, theme, checkout config
2. **Product Assignment**: Admin assigns products/packages to event
3. **Activation**: Event automatically appears as tab when current date is between start and end dates
4. **Customer Shopping**: Customers browse event-specific products with event theme
5. **Event Checkout**: Custom checkout fields appear if configured
6. **Order Association**: Orders are linked to events
7. **Analytics**: Track event-specific clicks and purchases
8. **Expiration**: Event tab disappears after end date

### Theme Configuration

**themeConfig JSON Schema:**

```typescript
type ThemeConfig = {
  primaryColor?: string;       // Hex color for primary theme
  secondaryColor?: string;     // Hex color for secondary theme
  animation?: "confetti" | "hearts" | "snow" | "sparkles" | "petals" | "none";
  backgroundPattern?: string;  // Custom background pattern
  tabGlow?: boolean;          // Add glow effect to event tab
  headerText?: string;        // Custom header message
};

// Example:
{
  "primaryColor": "#FF69B4",
  "secondaryColor": "#FFB6C1",
  "animation": "petals",
  "backgroundPattern": "floral",
  "tabGlow": true,
  "headerText": "Welcome to Flower Fest! 🌸"
}
```

### Checkout Configuration

**checkoutConfig JSON Schema:**

```typescript
type CheckoutField = {
  id: string;                // Unique field identifier
  label: string;             // Display label
  type: "text" | "textarea" | "select" | "checkbox" | "date";
  required: boolean;
  placeholder?: string;
  options?: string[];        // For select type
  maxLength?: number;        // For text/textarea
};

type CheckoutConfig = {
  headerMessage?: string;           // Custom header
  additionalFields: CheckoutField[]; // Custom fields
  termsMessage?: string;            // Custom terms
  confirmationMessage?: string;     // Custom confirmation
};

// Example:
{
  "headerMessage": "Special Flower Fest Checkout!",
  "additionalFields": [
    {
      "id": "room-number",
      "label": "Room Number",
      "type": "text",
      "required": true,
      "placeholder": "e.g., 301",
      "maxLength": 10
    },
    {
      "id": "delivery-preference",
      "label": "Delivery Preference",
      "type": "select",
      "required": true,
      "options": ["Morning", "Afternoon", "Evening"]
    },
    {
      "id": "special-instructions",
      "label": "Special Instructions",
      "type": "textarea",
      "required": false,
      "maxLength": 500
    }
  ],
  "termsMessage": "By completing this purchase, you agree to the Flower Fest terms.",
  "confirmationMessage": "Thank you for your Flower Fest order! 🌸"
}
```

### Custom Event Components

**Directory Structure:**

```
src/app/shop/events/
  2026/
    flower-fest-2026/
      index.tsx          # Main event component
      animations.tsx     # Custom animations (petals, sparkles, etc.)
```

**Event Component Interface:**

```typescript
// src/app/shop/events/2026/flower-fest-2026/index.tsx
interface EventComponentProps {
  event: ShopEvent;
  products: (Product | Package)[];
  onAddToCart: (item: Product | Package, options: any) => void;
}

export default function FlowerFest2026({ event, products, onAddToCart }: EventComponentProps) {
  return (
    <div className="flower-fest-theme">
      <PetalAnimation />
      <h1>Welcome to Flower Fest! 🌸</h1>
      {/* Custom layout and interactions */}
      <ProductGrid products={products} onAddToCart={onAddToCart} />
    </div>
  );
}
```

### Event Admin Management

**Three Access Levels:**

1. **Global Shop Admin (`isShopAdmin = true`):**
   - Full access to all events
   - Can assign/remove event-specific admins
   - Can delete events

2. **Global Events Admin (`isEventsAdmin = true`):**
   - Full access to all events
   - Cannot manage event admins
   - Cannot delete events

3. **Event-Specific Admin (via EventAdmin):**
   - Access only to assigned events
   - Can edit event details
   - Can assign products/packages to event
   - Cannot manage other admins
   - Cannot delete events

**Admin Assignment Interface:**

```typescript
// In event management dashboard
async function addEventAdmin(eventId: string, userEmail: string) {
  const user = await prisma.user.findUnique({
    where: { email: userEmail },
  });

  if (!user) {
    return { success: false, message: "User not found" };
  }

  await prisma.eventAdmin.create({
    data: {
      eventId,
      userId: user.id,
    },
  });

  return { success: true };
}
```

---

## Cart System

### Cart Operations

#### 1. Add Product to Cart

```typescript
async function addToCart(userId: string, productId: string, size?: string, quantity: number = 1) {
  // Check if item already exists in cart
  const existingItem = await prisma.cartItem.findFirst({
    where: {
      userId,
      productId,
      size: size || null,
    },
  });

  if (existingItem) {
    // Update quantity
    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: existingItem.quantity + quantity },
    });
  } else {
    // Create new cart item
    await prisma.cartItem.create({
      data: {
        userId,
        productId,
        size,
        quantity,
      },
    });
  }

  return { success: true };
}
```

#### 2. Add Package to Cart

```typescript
async function addPackageToCart(
  userId: string,
  packageId: string,
  packageSelections: PackageSelections,
  quantity: number = 1
) {
  // Validate selections
  const pkg = await prisma.package.findUnique({
    where: { id: packageId },
    include: {
      items: { include: { product: true } },
      pools: { include: { options: { include: { product: true } } } },
    },
  });

  const validation = validatePackageSelections(pkg, packageSelections);
  if (!validation.valid) {
    return { success: false, message: validation.error };
  }

  // Add to cart
  await prisma.cartItem.create({
    data: {
      userId,
      packageId,
      packageSelections,
      quantity,
    },
  });

  return { success: true };
}
```

#### 3. Get Cart with Calculations

```typescript
async function getCart(userId: string) {
  const cartItems = await prisma.cartItem.findMany({
    where: { userId },
    include: {
      product: true,
      package: {
        include: {
          items: { include: { product: true } },
          pools: { include: { options: { include: { product: true } } } },
        },
      },
    },
  });

  const items = cartItems.map(item => {
    let price: number;

    if (item.product) {
      // Product price
      if (item.size && item.product.sizePricing?.[item.size]) {
        price = item.product.sizePricing[item.size];
      } else {
        price = item.product.price;
      }
    } else if (item.package) {
      // Package price
      price = item.package.price;
    }

    return {
      ...item,
      unitPrice: price,
      totalPrice: price * item.quantity,
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);

  return {
    items,
    subtotal,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
  };
}
```

### Cart UI Patterns

**Cart Counter Badge:**

```typescript
function CartCounter({ userId }: Props) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    async function fetchCount() {
      const cart = await getCart(userId);
      setCount(cart.itemCount);
    }
    fetchCount();
  }, [userId]);

  if (count === 0) return null;

  return (
    <Link href="/shop/cart">
      <ShoppingCart />
      <Badge>{count}</Badge>
    </Link>
  );
}
```

---

## Checkout Flow

### Standard Checkout Flow

1. **Cart Review:**
   - Display all cart items
   - Show prices and quantities
   - Allow quantity adjustments
   - Calculate subtotal

2. **Checkout Form:**
   - Customer notes (optional)
   - Event-specific fields (if ordering from event)
   - Payment method selection (GCash)
   - Terms acceptance

3. **Payment:**
   - Customer pays via GCash
   - Takes screenshot of receipt
   - Uploads receipt

4. **Order Creation:**
   - Create order with pending status
   - Process receipt with OCR (extract reference number)
   - Create order items
   - Clear cart
   - Show confirmation

### Event-Specific Checkout

**When order is for an event, inject custom fields:**

```typescript
async function renderCheckoutForm(eventId?: string) {
  let customFields = [];

  if (eventId) {
    const event = await prisma.shopEvent.findUnique({
      where: { id: eventId },
      select: { checkoutConfig: true },
    });

    if (event?.checkoutConfig) {
      customFields = event.checkoutConfig.additionalFields;
    }
  }

  return (
    <form>
      {/* Standard fields */}
      <Textarea name="notes" label="Special Instructions" />

      {/* Event custom fields */}
      {customFields.map(field => (
        <DynamicField key={field.id} field={field} />
      ))}

      {/* Payment */}
      <FileUpload name="receipt" label="GCash Receipt" />
    </form>
  );
}
```

### Order Creation

```typescript
async function createOrder(data: CheckoutData) {
  const cart = await getCart(data.userId);

  // Extract event data if present
  const eventData = data.eventId ? {
    [field.id]: data[field.id]
  } : null;

  const order = await prisma.order.create({
    data: {
      userId: data.userId,
      totalAmount: cart.subtotal,
      status: "pending",
      receiptImageUrl: data.receiptUrl,
      gcashReferenceNumber: data.extractedRefNumber,  // From OCR
      notes: data.notes,
      eventId: data.eventId,
      eventData: eventData,
      orderItems: {
        create: cart.items.map(item => ({
          productId: item.productId,
          packageId: item.packageId,
          quantity: item.quantity,
          price: item.unitPrice,
          size: item.size,
          packageSelections: item.packageSelections,
        })),
      },
    },
    include: {
      orderItems: {
        include: {
          product: true,
          package: true,
        },
      },
    },
  });

  // Create analytics record
  await prisma.shopPurchase.create({
    data: {
      orderId: order.id,
      eventId: data.eventId,
      totalAmount: cart.subtotal,
      itemCount: cart.itemCount,
      purchasedAt: new Date(),
    },
  });

  // Clear cart
  await prisma.cartItem.deleteMany({
    where: { userId: data.userId },
  });

  return order;
}
```

---

## Order Management

### Order Status Workflow

```
pending → paid → confirmed → completed
           ↓
        cancelled
```

**Status Definitions:**

- **pending**: Order created, awaiting payment verification
- **paid**: Payment verified (GCash reference number confirmed)
- **confirmed**: Order confirmed by admin
- **completed**: Order fulfilled and delivered
- **cancelled**: Order cancelled

### Admin Order Interface

**Features Required:**

1. **Order List:**
   - Filter by status
   - Search by order ID, customer name, GCash ref
   - Sort by date
   - Pagination

2. **Order Details:**
   - Customer info (name, email, student ID)
   - Order items with prices
   - GCash reference number
   - Receipt image view
   - Event association (if applicable)
   - Event custom data (if applicable)
   - Customer notes

3. **Order Actions:**
   - Update status
   - Delete order
   - Export to Excel

4. **Duplicate Detection:**
   - Highlight orders with duplicate GCash reference numbers
   - Visual badge/warning

### Excel Export

**Export Format:**

```
Order ID | Order Date | Customer Name | Email | Student ID |
Product Name | Description | Size | Quantity | Unit Price | Item Total |
Order Total | Order Status | GCash Ref No | Notes | Receipt URL
```

**Implementation:**

```typescript
import * as XLSX from "xlsx";

async function exportOrdersToExcel(orders: Order[]) {
  const rows = [];

  for (const order of orders) {
    for (let i = 0; i < order.orderItems.length; i++) {
      const item = order.orderItems[i];
      const isFirstRow = i === 0;

      rows.push({
        // Order info (only on first row)
        "Order ID": isFirstRow ? order.id : "",
        "Order Date": isFirstRow ? order.createdAt.toLocaleDateString() : "",
        "Customer Name": isFirstRow ? order.user.name : "",
        "Email": isFirstRow ? order.user.email : "",
        "Student ID": isFirstRow ? order.user.studentId : "",

        // Item info (on every row)
        "Product Name": item.product?.name || item.package?.name,
        "Description": item.product?.description || item.package?.description,
        "Size": item.size || "N/A",
        "Quantity": item.quantity,
        "Unit Price": item.price,
        "Item Total": item.price * item.quantity,

        // Order totals (only on first row)
        "Order Total": isFirstRow ? order.totalAmount : "",
        "Order Status": isFirstRow ? order.status : "",
        "GCash Ref No": isFirstRow ? order.gcashReferenceNumber : "",
        "Notes": isFirstRow ? order.notes : "",
        "Receipt URL": isFirstRow ? order.receiptImageUrl : "",
      });
    }
  }

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");

  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  return new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}
```

---

## Admin Interfaces

### Product Management

**Required Features:**

1. Product list grid with images
2. Add/Edit product dialog
3. Image upload and management (multiple images)
4. Size selection and pricing
5. Event assignment (PROMINENT)
6. Stock management
7. Delete confirmation

**UI Pattern:**

```
+------------------+  +------------------+  +------------------+
|   Product Card   |  |   Product Card   |  |   Product Card   |
|   [Main Image]   |  |   [Main Image]   |  |   [Main Image]   |
|   Product Name   |  |   Product Name   |  |   Product Name   |
|   ₱150.00        |  |   ₱150.00        |  |   ₱150.00        |
|   [Edit] [Delete]|  |   [Edit] [Delete]|  |   [Edit] [Delete]|
+------------------+  +------------------+  +------------------+
```

### Package Management

**Required Features:**

1. Package list
2. Add/Edit package dialog with tabs:
   - Basic Info
   - Fixed Items (add products with quantities)
   - Selection Pools (create pools, add products)
   - Event Assignment
3. Package preview (show what's included)
4. Delete confirmation

### Event Management

**Required Features:**

1. Event list with status indicators
2. Add/Edit event dialog with tabs:
   - Basic Info (name, slug, dates, status)
   - Hero Images (multiple uploads)
   - Products (assign products/packages with pricing)
   - Theme (colors, animations, patterns)
   - Checkout (custom fields configuration)
   - Admins (assign event-specific admins)
   - Analytics (clicks and purchases graphs)
3. Event preview (show how it will look in shop)
4. Delete confirmation

### Order Management

**Required Features:**

1. Tabbed interface:
   - Orders Tab: All orders with filters
   - Verify Tab: Orders pending verification
2. Order status filters (pending, paid, confirmed, completed, cancelled)
3. Search functionality
4. Order detail view
5. Status update actions
6. Excel export
7. Receipt viewer
8. Duplicate GCash reference detection

---

## Analytics

### Click Tracking

**Implementation:**

```typescript
// Track shop page clicks
async function trackShopClick(path: string, eventId?: string) {
  await prisma.shopClick.create({
    data: {
      path,
      eventId,
      userAgent: req.headers["user-agent"],
      referer: req.headers.referer,
      clickedAt: new Date(),
    },
  });
}

// Usage: Track when user switches tabs
useEffect(() => {
  trackShopClick(`/shop?tab=${activeTab}`, eventId);
}, [activeTab]);
```

### Purchase Tracking

**Implementation:**

```typescript
// Automatically created during order creation
async function createOrder(data: CheckoutData) {
  const order = await prisma.order.create({ /* ... */ });

  // Track purchase for analytics
  await prisma.shopPurchase.create({
    data: {
      orderId: order.id,
      eventId: data.eventId,
      totalAmount: order.totalAmount,
      itemCount: order.orderItems.length,
      purchasedAt: new Date(),
    },
  });

  return order;
}
```

### Analytics Queries

**Event Performance:**

```typescript
async function getEventAnalytics(eventId: string, dateRange: { start: Date; end: Date }) {
  // Click analytics
  const clicks = await prisma.shopClick.groupBy({
    by: ["clickedAt"],
    where: {
      eventId,
      clickedAt: { gte: dateRange.start, lte: dateRange.end },
    },
    _count: true,
  });

  // Purchase analytics
  const purchases = await prisma.shopPurchase.groupBy({
    by: ["purchasedAt"],
    where: {
      eventId,
      purchasedAt: { gte: dateRange.start, lte: dateRange.end },
    },
    _sum: { totalAmount: true, itemCount: true },
    _count: true,
  });

  return {
    clicks: clicks.map(c => ({ date: c.clickedAt, count: c._count })),
    purchases: purchases.map(p => ({
      date: p.purchasedAt,
      orderCount: p._count,
      totalRevenue: p._sum.totalAmount,
      itemCount: p._sum.itemCount,
    })),
  };
}
```

---

## Implementation Checklist

### Database Setup

- [ ] Create all database models (Product, Package, ShopEvent, etc.)
- [ ] Set up proper indexes for performance
- [ ] Configure cascade deletes
- [ ] Set up Prisma client generation
- [ ] Test all relationships work correctly

### Authentication & Authorization

- [ ] Implement user authentication (session-based)
- [ ] Add admin role fields to User model
- [ ] Create role-checking middleware
- [ ] Implement event-specific admin system
- [ ] Protect admin routes with auth checks

### Product System

- [ ] Product CRUD admin interface
- [ ] Multiple image upload and management
- [ ] Size variant support
- [ ] Size-specific pricing
- [ ] Event assignment during creation
- [ ] Event-exclusive toggle
- [ ] Product display in shop

### Package System

- [ ] Package CRUD admin interface
- [ ] Fixed items management
- [ ] Selection pool creation
- [ ] Package selection UI for customers
- [ ] Package validation logic
- [ ] Package display in shop

### Events System

- [ ] Event CRUD admin interface
- [ ] Event timing and visibility logic
- [ ] Product/package assignment to events
- [ ] Event-specific pricing
- [ ] Theme configuration
- [ ] Checkout configuration
- [ ] Event-specific admin assignments
- [ ] Custom event components support
- [ ] Event tabs in shop interface

### Cart System

- [ ] Add to cart functionality (products)
- [ ] Add to cart functionality (packages)
- [ ] Cart display with calculations
- [ ] Cart item quantity management
- [ ] Size selection in cart
- [ ] Package selection storage
- [ ] Cart counter badge

### Checkout & Orders

- [ ] Checkout form (standard fields)
- [ ] Event-specific checkout fields
- [ ] Payment integration (GCash)
- [ ] Receipt upload
- [ ] Order creation logic
- [ ] Order confirmation page
- [ ] Order history for customers
- [ ] Order detail view for customers

### Admin Order Management

- [ ] Order list with filters
- [ ] Order detail view for admins
- [ ] Status update functionality
- [ ] Duplicate GCash detection
- [ ] Receipt viewer
- [ ] Excel export
- [ ] Order deletion

### Analytics

- [ ] Click tracking implementation
- [ ] Purchase tracking implementation
- [ ] Event analytics dashboard
- [ ] Analytics graphs (clicks, purchases over time)
- [ ] Event performance metrics

### UI/UX

- [ ] Responsive design (mobile-first)
- [ ] Image carousels for products
- [ ] Event theme rendering
- [ ] Event animations
- [ ] Loading states
- [ ] Error handling
- [ ] Toast notifications
- [ ] Confirmation dialogs

### Testing

- [ ] Test product creation and editing
- [ ] Test package creation with pools
- [ ] Test event creation and visibility
- [ ] Test cart operations
- [ ] Test checkout flow
- [ ] Test order creation
- [ ] Test admin interfaces
- [ ] Test different admin role permissions
- [ ] Test event-specific features
- [ ] Test analytics tracking

### Performance & Optimization

- [ ] Implement caching for frequently accessed data
- [ ] Optimize database queries (use includes, indexes)
- [ ] Image optimization at upload
- [ ] Lazy load images
- [ ] Pagination for long lists
- [ ] Debounce search inputs

### Documentation

- [ ] Document database schema
- [ ] Document API routes
- [ ] Document admin workflows
- [ ] Document deployment process
- [ ] Create user guides
- [ ] Create developer guides

---

## Additional Considerations

### Stock Management

**Pre-Order Mode:**
- When `isPreOrder = true`, stock count represents number of orders received
- Display shows "X orders received" instead of "X in stock"
- No stock limits applied

**Regular Mode:**
- Track inventory with `stock` field
- Prevent orders when stock = 0 (unless pre-order)
- Decrement stock on order creation (optional)

### Image Storage

- Use S3-compatible storage (MinIO recommended)
- Store multiple image URLs per product/package
- Optimize images at upload time (WebP, resize)
- Generate thumbnails for list views

### Price Calculations

**Priority:**
1. Event-specific price (if ordering from event and event price is set)
2. Size-specific price (if product has size and size-specific pricing exists)
3. Base price

### Event Date Handling

- Store dates in UTC
- Convert to user's timezone for display
- Check current date against start/end dates in user's timezone
- Handle timezone edge cases (event might be active in one timezone but not another)

### Permissions Edge Cases

- What happens if event-specific admin is promoted to shop admin?
- What happens if event is deleted while admin is viewing it?
- What happens if product is deleted while in someone's cart?

**Recommended Solutions:**
- EventAdmin records remain even if user becomes shop admin (redundant but safe)
- Redirect to events list if event is deleted during viewing
- Handle missing products gracefully in cart (show "Product no longer available")

---

## Conclusion

This e-shop system provides:

1. **Flexible Product Organization**: Categories, events, exclusivity
2. **Bundle Support**: Fixed and selection-based packages
3. **Event Theming**: Custom look and feel per event
4. **Custom Checkout**: Event-specific fields and flows
5. **Role-Based Access**: Multiple admin levels
6. **Analytics**: Built-in tracking and reporting
7. **Size Variants**: Full size support with pricing
8. **Image Galleries**: Multiple images per product
9. **Stock Management**: Optional tracking with pre-order mode
10. **Payment Integration**: GCash with OCR support

The system is designed to be:
- **Scalable**: Handles multiple events, products, and orders
- **Maintainable**: Clear separation of concerns
- **Extensible**: Easy to add new features
- **User-Friendly**: Intuitive interfaces for both customers and admins
- **Performant**: Optimized queries and caching
- **Flexible**: Configurable per event and product

Use this as a complete blueprint to implement a similar e-shop system in any project!
