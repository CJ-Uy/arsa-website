# ARSA Shop Setup Guide

This guide will help you set up the ARSA Shop feature with authentication and payment processing.

## Prerequisites

- PostgreSQL database
- Google OAuth credentials (for student email authentication)

## Setup Steps

### 1. Database Setup

Run the Prisma migration to create the necessary tables:

```bash
npx prisma migrate dev --name add_shop_tables
```

This will create tables for:

- Users (authentication)
- Sessions and Accounts (Better Auth)
- Products
- Cart Items
- Orders and Order Items

### 2. Environment Variables

Copy `.env.example` to `.env` and fill in the required values:

```bash
cp .env.example .env
```

Required variables:

- `DATABASE_URL`: Your PostgreSQL connection string
- `BETTER_AUTH_SECRET`: Generate with `openssl rand -base64 32`
- `BETTER_AUTH_URL`: Your app URL (e.g., `http://localhost:3000`)
- `GOOGLE_CLIENT_ID`: From Google Cloud Console
- `GOOGLE_CLIENT_SECRET`: From Google Cloud Console

### 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)
6. Copy the Client ID and Client Secret to your `.env` file

### 4. Seed Products (Optional)

Create some initial products by running:

```bash
npx tsx scripts/seed-products.ts
```

Or manually add products through the database:

```typescript
await prisma.product.create({
	data: {
		name: "ARSA T-Shirt",
		description: "Official ARSA merchandise",
		price: 250.0,
		category: "merch",
		stock: 50,
		isAvailable: true,
	},
});
```

## Features

### Customer Features

1. **Browse Products** - View products by category (Merch, Arsari-Sari, Services)
2. **Shopping Cart** - Add items, update quantities, remove items
3. **Google Sign-In** - Required before checkout (student email)
4. **Checkout** - Upload GCash receipt screenshot
5. **Order Tracking** - View order history and status

### Payment Flow

1. Customer adds items to cart
2. At checkout, customer sees payment instructions
3. Customer sends money via GCash to the specified number
4. Customer uploads screenshot of GCash receipt
5. Order is created with "pending" status
6. Admin reviews and updates order status

### Order Statuses

- `pending` - Order submitted, awaiting verification
- `paid` - Payment verified
- `confirmed` - Order confirmed, ready for pickup
- `completed` - Order completed
- `cancelled` - Order cancelled

## Admin Features

### Admin Dashboard Access

1. **Mark a User as Admin**:

   ```sql
   UPDATE "User" SET "isAdmin" = true WHERE email = 'admin@student.ateneo.edu';
   ```

2. **Access Admin Dashboard**:
   - Sign in with the admin account
   - Click on your profile picture → "Admin Dashboard"
   - Or navigate to `/admin`

### Admin Dashboard Features

**Order Management** (`/admin/orders`):

- View all orders with filtering by status
- See order details including:
  - Customer information
  - Order items and totals
  - Payment receipt images
  - Order notes
- Update order status (pending → paid → confirmed → completed)
- Delete orders
- Statistics dashboard showing order counts by status

**Product Management** (`/admin/products`):

- Add new products with:
  - Name, description, price
  - Category (Merch, Arsari-Sari, Services)
  - Stock quantity
  - Product images (uploaded to MinIO)
  - Availability toggle
- Edit existing products
- Delete products
- Image upload directly from the dashboard

### Protected Routes

Admin routes are protected by middleware that checks:

1. User is authenticated
2. User has `isAdmin = true` in database

Non-admin users will be redirected to `/shop` if they try to access admin routes.

## File Upload with MinIO

The shop uses MinIO for file storage (receipts and product images):

1. **Setup MinIO**:
   - Download and run MinIO: https://min.io/download
   - Or use Docker: `docker run -p 9000:9000 -p 9001:9001 minio/minio server /data --console-address ":9001"`
   - Access MinIO Console at http://localhost:9001
   - Default credentials: `minioadmin` / `minioadmin`

2. **Configure Environment Variables** (already in `.env`):

   ```
   MINIO_ENDPOINT="localhost"
   MINIO_PORT="9000"
   MINIO_USE_SSL="false"
   MINIO_ACCESS_KEY="minioadmin"
   MINIO_SECRET_KEY="minioadmin"
   ```

3. **Buckets are auto-created** on first upload:
   - `products` - Product images (public read)
   - `receipts` - Payment receipts (private)

For production:

- Use a proper MinIO server or S3-compatible service
- Update `MINIO_USE_SSL="true"` and use proper credentials
- Configure CORS if needed

## Security Considerations

1. **Student Email Validation** - Consider adding email domain validation to ensure only student emails can register
2. **Rate Limiting** - Add rate limiting to prevent abuse
3. **File Upload Security** - Validate file types and sizes
4. **Admin Authorization** - Implement proper admin role checks

## Troubleshooting

### "Session not found" errors

- Make sure `BETTER_AUTH_SECRET` is set
- Clear browser cookies and try again

### Google OAuth errors

- Verify redirect URIs in Google Cloud Console
- Check that `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` are correct

### Database connection issues

- Verify `DATABASE_URL` is correct
- Ensure PostgreSQL is running
- Run `npx prisma generate` after schema changes

## Routes

### Customer Routes

- `/shop` - Main shop page
- `/shop/cart` - Shopping cart (requires login)
- `/shop/checkout` - Checkout page (requires login)
- `/shop/orders` - Order history (requires login)
- `/shop/orders/[orderId]` - Order details (requires login)

### Admin Routes (requires admin privileges)

- `/admin` - Admin dashboard (redirects to orders)
- `/admin/orders` - Order management
- `/admin/products` - Product management

### API Routes

- `/api/auth/[...all]` - Better Auth authentication endpoints
- `/api/upload` - File upload endpoint (MinIO)
