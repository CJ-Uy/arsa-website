# ARSA Website

Official website for the ARSA (Ateneo Resident Students Association) dorm system — a comprehensive Next.js platform for a university dormitory with a full e-commerce shop, event management, GCash payments, and more.

📚 **[View Full Documentation →](docs/README.md)**

## Features

- **Public Pages** — Home, About, Calendar, Publications (Bridges Magazine), Merch showcase with gacha system, Resources, Contact
- **E-Commerce Shop** — Full shopping experience with Google OAuth auth, product catalog, size selection, pre-orders, cart, GCash payment with receipt OCR, and order tracking
- **Shop Events System** — Event-based product tabs with custom themes, animations, hero images, event-specific pricing, checkout fields, and analytics
- **Package System** — Product bundles with fixed items and "Pick N from X" selection pools
- **Admin Dashboard** — Role-based admin access for products, packages, events, orders, banners, email logs, and settings
- **Google Sheets Sync** — Automatic order syncing to a configurable Google Sheets spreadsheet
- **Email Notifications** — Order confirmation emails via SMTP or Resend, with admin bulk email support
- **Daily Stock Overrides** — Per-day stock and availability overrides for products
- **Delivery Scheduling** — Configurable delivery date/time slot selection at checkout
- **URL Shortener** — Custom short URLs with click tracking and analytics
- **In-Memory Cache** — Reduces database load with request deduplication
- **GCash OCR** — Client-side Tesseract.js receipt scanning and PDF invoice matching

## Tech Stack

- **Framework**: Next.js 15 (App Router) with React 19
- **Styling**: Tailwind CSS v4
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Better Auth with Google OAuth
- **File Storage**: MinIO (S3-compatible object storage)
- **Image Optimization**: Sharp (upload-time optimization to WebP)
- **OCR**: Tesseract.js (client-side browser OCR)
- **UI Components**: 57 shadcn/ui components (Radix UI + Tailwind)
- **Forms**: react-hook-form with Zod validation
- **Notifications**: Sonner (toast notifications)
- **Charts**: Recharts (analytics dashboards)
- **Email**: Nodemailer (SMTP) or Resend
- **Google APIs**: googleapis (Sheets sync)
- **Excel Export**: XLSX / ExcelJS
- **Deployment**: Docker + Docker Compose (standalone output mode)
- **Package Manager**: pnpm

## Prerequisites

- Node.js 20+
- PostgreSQL database
- MinIO server (or S3-compatible storage)
- Google OAuth credentials

## Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Environment Variables

Copy `.env.example` to `.env` and configure:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/arsa_website"

# Better Auth
BETTER_AUTH_SECRET="generate-with-openssl-rand-base64-32"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Google OAuth
GOOGLE_CLIENT_ID="your-client-id"
GOOGLE_CLIENT_SECRET="your-client-secret"

# MinIO
MINIO_ENDPOINT="localhost"
MINIO_PORT="9000"
MINIO_USE_SSL="false"
MINIO_ACCESS_KEY="minioadmin"
MINIO_SECRET_KEY="minioadmin"
MINIO_BUCKET_PRODUCTS="products"
MINIO_BUCKET_RECEIPTS="receipts"
MINIO_BUCKET_EVENTS="events"

# Google Sheets Sync (optional)
GOOGLE_SHEETS_CREDENTIALS='{...service account JSON...}'

# Email (SMTP or Resend — pick one)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
# RESEND_API_KEY="re_..."

# Cron (for automated sync jobs)
CRON_SECRET="your-random-secret"

# Port
PORT=3000
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

**Option B:** Download from https://min.io/download

Then create buckets and set permissions:

```bash
node scripts/setup-buckets.js
```

### 5. Grant Admin Access

After first login, set admin flags directly in the database via Prisma Studio (`npx prisma studio`) or SQL:

```sql
-- Full shop admin (products, packages, orders, events, banners)
UPDATE "User" SET "isShopAdmin" = true WHERE email = 'your-email@ateneo.edu';

-- Events-only admin (events management, no orders/products)
UPDATE "User" SET "isEventsAdmin" = true WHERE email = 'your-email@ateneo.edu';

-- URL redirects admin
UPDATE "User" SET "isRedirectsAdmin" = true WHERE email = 'your-email@ateneo.edu';
```

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
arsa-website/
├── docs/                          # Documentation (see docs/README.md)
├── prisma/
│   └── schema.prisma              # Database schema
├── public/                        # Static assets
├── scripts/                       # Utility scripts
│   ├── setup-buckets.js           # Configure MinIO buckets
│   ├── test-minio.js              # Test MinIO connection
│   ├── export-redirects.ts        # Export URL redirects
│   └── import-redirects.ts        # Import URL redirects
├── src/
│   ├── app/                       # Next.js App Router
│   │   ├── admin/                 # Admin dashboard
│   │   │   ├── banner/            # Banner management
│   │   │   ├── email-logs/        # Email logs & bulk send
│   │   │   ├── events/            # Event CRUD & analytics
│   │   │   ├── orders/            # Order management & OCR
│   │   │   ├── packages/          # Package bundle management
│   │   │   ├── products/          # Product management
│   │   │   └── settings/          # Admin settings (email, sheets)
│   │   ├── shop/                  # E-commerce shop
│   │   │   ├── cart/
│   │   │   ├── checkout/
│   │   │   ├── events/            # Custom event pages
│   │   │   └── orders/
│   │   ├── redirects/             # URL shortener dashboard
│   │   ├── api/                   # API routes
│   │   └── (public pages)/        # about, calendar, contact, merch, etc.
│   ├── components/
│   │   ├── admin/                 # Admin nav, theme forcer
│   │   ├── features/              # Gacha, events, carousel, packages, etc.
│   │   ├── main/                  # Header, Footer, Banner, theme
│   │   ├── shop/                  # Delivery schedule selector
│   │   └── ui/                    # 57 shadcn/ui components
│   ├── generated/prisma/          # Generated Prisma client
│   ├── hooks/                     # Custom React hooks
│   ├── lib/
│   │   ├── auth.ts                # Better Auth config
│   │   ├── auth-client.ts         # Client-side auth
│   │   ├── cache.ts               # In-memory cache
│   │   ├── daily-stock.ts         # Daily stock override system
│   │   ├── deliveryScheduling.ts  # Delivery date/time logic
│   │   ├── email.ts               # Email sending (SMTP/Resend)
│   │   ├── email-logs.ts          # Email audit logging
│   │   ├── gcashReaders/          # GCash OCR parsers
│   │   ├── googleSheets.ts        # Google Sheets API
│   │   ├── middleware/            # Redirect middleware
│   │   ├── minio.ts               # MinIO utilities
│   │   ├── prisma.ts              # Prisma client singleton
│   │   └── utils.ts               # General utilities
│   └── middleware.ts              # Request middleware entry point
├── CLAUDE.md                      # AI assistant instructions
├── docker-compose.yaml
├── dockerfile
└── README.md
```

## Routes

### Public Routes

- `/` — Home
- `/about` — About ARSA
- `/calendar` — Event calendar
- `/publications` — Publications & Bridges magazine
- `/merch` — Merchandise showcase with gacha system
- `/resources` — Resource links & venue booking
- `/contact` — Contact info & grievance forms

### Shop Routes (Authentication Required)

- `/shop` — Shop with event tabs, filtering, and sorting
- `/shop/cart` — Shopping cart
- `/shop/checkout` — Checkout with GCash payment & OCR receipt upload
- `/shop/orders` — Order history
- `/shop/orders/[orderId]` — Order details

### Admin Routes (isShopAdmin or isEventsAdmin Required)

- `/admin` — Admin dashboard
- `/admin/orders` — Order management, OCR reprocessing, invoice matching
- `/admin/products` — Product CRUD with event assignment
- `/admin/packages` — Package bundle management
- `/admin/events` — Event management, themes, checkout config, analytics
- `/admin/banner` — Banner/announcement management
- `/admin/email-logs` — Email audit logs & bulk email sender
- `/admin/settings` — Email config, Google Sheets sync settings

### Redirect Dashboard (isRedirectsAdmin Required)

- `/redirects` — URL redirect management with click analytics

## Admin Roles

| Role                 | Access                                                             |
| -------------------- | ------------------------------------------------------------------ |
| `isShopAdmin`        | Full access: products, packages, orders, events, banners, settings |
| `isEventsAdmin`      | Events only (cannot manage products/packages/orders)               |
| `isRedirectsAdmin`   | URL redirect system only                                           |
| Event-specific admin | Assigned events only (via `EventAdmin` model)                      |

## Available Scripts

```bash
# Development
npm run dev          # Start dev server (Turbopack)
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint

# Database
npx prisma generate  # Generate Prisma client
npx prisma db push   # Sync schema with database
npx prisma studio    # Open Prisma Studio

# MinIO
node scripts/test-minio.js      # Test MinIO connection
node scripts/setup-buckets.js   # Setup MinIO buckets
```

## Shop Events System

Events appear as tabs in the shop during their active date range. Each event supports:

- Custom themes (colors, animations: confetti/hearts/snow/sparkles/petals)
- Multiple hero images in a carousel
- Event-specific pricing per product/package
- Event-exclusive products (hidden outside the event tab)
- Product categories within events (e.g., "Solo Flowers", "Bouquets")
- Product codes that generate purchase codes on order (e.g., `LLY_01-28-26-15:33_1`)
- Custom checkout fields (text, textarea, select, checkbox, date)
- Custom terms, confirmation messages, and header text
- Click & purchase analytics with conversion rate charts
- Event-specific admin access control

## Package System

Packages are product bundles with two content types:

- **Fixed Items** — Products always included (with quantity support)
- **Selection Pools** — "Pick N from these options" (e.g., "Choose 3 shirts from 8")

## GCash Payment & OCR

The checkout flow auto-extracts GCash reference numbers from uploaded receipts:

- Client-side OCR using Tesseract.js (~8–12 seconds per receipt)
- Duplicate reference detection across orders
- Admin can upload GCash transaction history PDFs for automatic order matching
- Batch reprocessing to extract references from existing orders

## Performance & Optimization

- **Upload-time image optimization** — Sharp resizes to max 1200×1200px, converts to WebP at 85% quality
- **No runtime image processing** — Images served directly from MinIO
- **In-memory cache** — Reduces database queries with request deduplication and automatic expiry
- **Standalone Docker output** — ~150MB production image vs ~500MB
- **Console removal** — Production builds strip `console.log` statements

## Deployment

```bash
# Build and start with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

**Production environment variables to update:**

```env
BETTER_AUTH_URL="https://yourdomain.com"
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
MINIO_ENDPOINT="minio-s3.yourdomain.com"
MINIO_USE_SSL="true"
```

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) and [docs/COOLIFY.md](docs/COOLIFY.md) for full deployment guides.

## Documentation

| Document                                                           | Description                   |
| ------------------------------------------------------------------ | ----------------------------- |
| [docs/README.md](docs/README.md)                                   | Documentation index           |
| [docs/QUICK_REFERENCE.md](docs/QUICK_REFERENCE.md)                 | Quick developer reference     |
| [docs/SHOP_SETUP.md](docs/SHOP_SETUP.md)                           | Shop system setup guide       |
| [docs/ESHOP_SYSTEM.md](docs/ESHOP_SYSTEM.md)                       | E-commerce architecture       |
| [docs/GCASH.md](docs/GCASH.md)                                     | GCash OCR implementation      |
| [docs/GOOGLE_SHEETS_SYNC.md](docs/GOOGLE_SHEETS_SYNC.md)           | Google Sheets integration     |
| [docs/BULK_EMAIL_GUIDE.md](docs/BULK_EMAIL_GUIDE.md)               | Bulk email guide              |
| [docs/DAILY_STOCK_INTEGRATION.md](docs/DAILY_STOCK_INTEGRATION.md) | Daily stock overrides         |
| [docs/DELIVERY_CUTOFF_SETUP.md](docs/DELIVERY_CUTOFF_SETUP.md)     | Delivery scheduling setup     |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)                           | Deployment guide              |
| [docs/DOCKER.md](docs/DOCKER.md)                                   | Docker setup                  |
| [docs/CUSTOM_EVENT_PAGES.md](docs/CUSTOM_EVENT_PAGES.md)           | Custom event page development |

## Troubleshooting

**Images not loading in production:**

- Ensure MinIO is accessible and `MINIO_ENDPOINT` / `MINIO_USE_SSL` are set correctly
- Check SSL certificates are properly configured

**OAuth not working:**

- Verify `BETTER_AUTH_URL` and `NEXT_PUBLIC_APP_URL` match your production domain
- Check Google OAuth redirect URIs include your production URL

**Database connection issues:**

- Verify `DATABASE_URL` format and credentials
- Run `npx prisma db push` after schema changes
- Run `npx prisma generate` after schema changes and restart the dev server

**Google Sheets not syncing:**

- Verify `GOOGLE_SHEETS_CREDENTIALS` service account JSON is valid
- Ensure the service account has Editor access to the spreadsheet
- Configure the spreadsheet ID in Admin → Settings

**Email not sending:**

- Check SMTP credentials or `RESEND_API_KEY` in environment variables
- Configure sender email in Admin → Settings → Email Configuration

## License

Copyright © 2025 ARSA

---

Made with ❤️ by the ARSA team
