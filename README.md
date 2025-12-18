# ARSA Website

Official website for the ARSA dorm system featuring a complete e-commerce shop for merchandise, services, and payments.

📚 **[View Full Documentation →](docs/README.md)**

## 🚀 Features

- **URL Redirect System** - Custom short URLs with click tracking
- **Event Calendar** - Browse upcoming ARSA events
- **Publications** - View ARSA newsletters and resources
- **Merch Showcase** - Interactive gacha system for viewing merchandise
- **E-Commerce Shop** - Full shopping experience with:
  - Google OAuth student email authentication (auto-populates name from Google)
  - Product catalog with categories (Merch, Arsari-Sari Store, Other)
  - Product size selection (XS, S, M, L, XL, XXL)
  - Pre-order mode for out-of-stock items
  - Shopping cart with size-aware items
  - GCash payment with receipt upload
  - Order tracking with detailed history
  - Customer information (first name, last name, student ID)
  - Admin dashboard for order & product management

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router) with React 19
- **Styling**: Tailwind CSS v4
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Better Auth with Google OAuth
- **File Storage**: MinIO (S3-compatible object storage)
- **Image Optimization**: Sharp (upload-time optimization to WebP)
- **UI Components**: Radix UI + shadcn/ui
- **Forms**: react-hook-form with Zod validation
- **Notifications**: Sonner (toast notifications)
- **Deployment**: Docker + Docker Compose (standalone output mode)

## 📋 Prerequisites

- Node.js 20+
- PostgreSQL database
- MinIO server (or S3-compatible storage)
- Google OAuth credentials

## 🔧 Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/arsa_website"

# Better Auth
BETTER_AUTH_SECRET="generate-with-openssl-rand-base64-32"
BETTER_AUTH_URL="http://localhost:3000"

# Google OAuth
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"

# MinIO
MINIO_ENDPOINT="localhost"
MINIO_PORT="9000"
MINIO_USE_SSL="false"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
```

### 3. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# (Optional) Open Prisma Studio
npx prisma studio
```

### 4. MinIO Setup

**Option A: Docker**

```bash
docker run -p 9000:9000 -p 9001:9001 minio/minio server /data --console-address ":9001"
```

**Option B: Download from** https://min.io/download

Then create buckets and set permissions:

```bash
node scripts/setup-buckets.js
```

### 5. Mark Admin User

After first login, mark your account as admin:

```sql
UPDATE "User" SET "isAdmin" = true WHERE email = 'your-email@student.ateneo.edu';
```

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
arsa-website/
├── prisma/
│   └── schema.prisma          # Database schema
├── public/                     # Static assets
├── scripts/                    # Utility scripts
│   ├── setup-buckets.js       # Configure MinIO buckets
│   └── test-minio.js          # Test MinIO connection
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── admin/            # Admin dashboard
│   │   ├── shop/        # E-commerce shop
│   │   ├── api/              # API routes
│   │   └── ...               # Other pages
│   ├── components/
│   │   ├── main/             # Header, Footer, etc.
│   │   ├── features/         # Gacha, events, etc.
│   │   └── ui/               # shadcn/ui components
│   ├── lib/
│   │   ├── auth.ts           # Better Auth config
│   │   ├── auth-client.ts    # Client-side auth
│   │   ├── minio.ts          # MinIO utilities
│   │   └── prisma.ts         # Prisma client
│   └── middleware.ts          # Redirect middleware
├── CLAUDE.md                  # AI assistant instructions
├── SHOP_SETUP.md              # Detailed shop setup guide
└── README.md                  # This file
```

## 🏪 Shop Features

### Customer Features

- **Product Browsing**: Browse products by category (All, Merch, Arsari-Sari, Other)
- **Size Selection**: Choose sizes (XS-XXL) for applicable products
- **Pre-Orders**: Order products even when out of stock (if pre-order enabled)
- **Shopping Cart**: Add items with size-aware cart management
- **Authentication**: Google OAuth login (student email required) with loading indicators
- **Checkout**:
  - Auto-populated name from Google account
  - Optional first name, last name, and student ID fields
  - GCash payment with QR code
  - Receipt upload with preview
  - Special instructions/notes
- **Order Tracking**:
  - View order history with sizes displayed
  - Track order status (pending → paid → confirmed → completed)
  - View detailed order information

### Admin Features

- **Order Management**:
  - View all orders with status filtering
  - Update order status
  - View payment receipts
  - See customer information (name, email, student ID)
  - View order items with sizes
- **Product Management**:
  - Add/edit/delete products
  - Upload product images (auto-optimized to WebP)
  - Configure available sizes per product
  - Set pre-order mode
  - Manage stock and availability
  - Organize by categories

## 🔐 Authentication

- Uses Better Auth with Google OAuth
- Auto-populates user name from Google account
- Restricts access to @student.ateneo.edu emails (configurable)
- Session-based authentication
- Protected admin routes (shop admin and redirects admin)

## ⚡ Performance & Optimization

### Image Optimization Strategy

This application is optimized for **weak servers** with minimal CPU/memory resources:

- **Upload-Time Optimization**: Product images are optimized once when uploaded by admins
  - Automatically resized to max 1200x1200px (maintains aspect ratio)
  - Converted to WebP format (~70% smaller than JPEG)
  - Quality set to 85% (excellent quality, smaller file size)
- **No Runtime Processing**: Images served directly from MinIO storage
- **Next.js Image Optimization Disabled**: Reduces server load significantly
- **Browser-Native Lazy Loading**: Uses standard `<img loading="lazy">` tags

### Server Resource Usage

- **Low Memory Footprint**: No image processing during page requests
- **Low CPU Usage**: Only processes images during admin uploads (infrequent)
- **Fast Page Loads**: Pre-optimized images load quickly
- **Bandwidth Efficient**: WebP format reduces bandwidth by ~70%

### SSL/TLS Support

- **CA Certificates**: Bundled in Docker image for secure HTTPS connections
- **MinIO Integration**: Secure connections to object storage
- **OAuth Security**: Secure Google authentication flow

## 📦 Available Scripts

```bash
npm run dev          # Start development server (Turbopack)
npm run build        # Build for production (Turbopack)
npm start            # Start production server
npm run lint         # Run ESLint

npx prisma generate  # Generate Prisma client
npx prisma studio    # Open Prisma Studio
npx prisma db push   # Sync schema with database

node scripts/test-minio.js      # Test MinIO connection
node scripts/setup-buckets.js   # Setup MinIO buckets
```

## 🚢 Deployment

The app is configured for Docker deployment with standalone output mode for optimal performance:

### Docker Features

- **Multi-stage Build**: Optimized build process with separate stages
- **Standalone Output**: Minimal production bundle (~150MB vs ~500MB)
- **Alpine Linux**: Lightweight base image with security updates
- **CA Certificates**: Bundled for SSL/TLS support
- **Non-root User**: Runs as `nextjs` user for security
- **Sharp Integration**: Native image processing with Alpine-compatible binaries

### Quick Start

```bash
# Build and start with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Environment Variables

Ensure your `.env` file includes production values:

```env
# Production URLs
BETTER_AUTH_URL="https://yourdomain.com"
MINIO_ENDPOINT="minio-s3.yourdomain.com"
MINIO_USE_SSL="true"
```

See [dockerfile](dockerfile) and [docker-compose.yaml](docker-compose.yaml) for configuration details.

## 📚 Documentation

- [CLAUDE.md](CLAUDE.md) - Instructions for Claude Code AI
- [SHOP_SETUP.md](SHOP_SETUP.md) - Detailed shop setup guide
- [Next.js Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [Better Auth Docs](https://www.better-auth.com/docs)
- [MinIO Docs](https://min.io/docs/minio/linux/index.html)

## 📝 Routes

### Public Routes

- `/` - Home
- `/about` - About ARSA
- `/calendar` - Event calendar
- `/publications` - Publications
- `/merch` - Merchandise showcase
- `/resources` - Resource links
- `/contact` - Contact info

### Shop Routes (Authentication Required)

- `/shop` - Shop homepage
- `/shop/cart` - Shopping cart
- `/shop/checkout` - Checkout with receipt upload
- `/shop/orders` - Order history
- `/shop/orders/[id]` - Order details

### Admin Routes (Admin Only)

- `/admin` - Admin dashboard
- `/admin/orders` - Order management
- `/admin/products` - Product management

### Redirect Dashboard

- `/redirects` - URL redirect management (protected)

## 🐛 Troubleshooting

### Common Issues

**Images not loading in production:**

- Ensure MinIO is accessible from production server
- Check SSL certificates are properly configured
- Verify `MINIO_ENDPOINT` and `MINIO_USE_SSL` environment variables
- Images are served as `<img>` tags (not Next.js Image component) for maximum compatibility

**OAuth not working:**

- Verify `BETTER_AUTH_URL` matches your production domain
- Check Google OAuth redirect URIs include your production URL
- Ensure email domain restrictions are properly configured

**Database connection issues:**

- Verify `DATABASE_URL` format and credentials
- Check PostgreSQL is accessible from Docker container
- Run `npx prisma db push` after schema changes

**Performance issues:**

- Images are pre-optimized at upload time (WebP, 1200px max)
- Next.js image optimization is disabled to save server resources
- Use CDN for static assets if needed

See [SHOP_SETUP.md](SHOP_SETUP.md#troubleshooting) for more detailed solutions.

## 🏗️ Architecture Decisions

### Why Regular `<img>` Tags Instead of Next.js Image?

We use native `<img>` tags throughout the application for several reasons:

1. **Server Resource Efficiency**: Next.js Image component runs an optimization server that processes images on-demand, consuming significant CPU and memory
2. **Pre-Optimization**: Images are optimized once at upload time using Sharp (resized, converted to WebP)
3. **Weak Server Friendly**: Perfect for low-resource environments (shared hosting, small VPS)
4. **SSL Compatibility**: Avoids SSL certificate validation issues in Docker containers
5. **Simplicity**: Direct serving from MinIO without intermediate processing

### Database Schema Design

- **Custom Prisma Output**: Generated client in `src/generated/prisma/` for better organization
- **Size-Aware Cart**: Cart items include `size` field for products with size variants
- **Composite Indexes**: Used instead of unique constraints due to nullable size fields
- **User Information**: Stores `firstName`, `lastName`, `studentId` for order fulfillment
- **Pre-Order Support**: `isPreOrder` flag enables selling out-of-stock items

### Middleware Architecture

- **Chainable Middleware**: Request flows through redirect middleware first, then Next.js routing
- **Database Lookup**: Checks all paths against redirect codes for SEO-friendly URLs
- **Click Tracking**: Records analytics data for each redirect hit

## 📄 License

Copyright © 2025 ARSA

---

Made with ❤️ by the ARSA team
