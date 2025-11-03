# ARSA Website

Official website for the ARSA dorm system featuring a complete e-commerce shop for merchandise, services, and payments.

## 🚀 Features

- **URL Redirect System** - Custom short URLs with click tracking
- **Event Calendar** - Browse upcoming ARSA events
- **Publications** - View ARSA newsletters and resources
- **Merch Showcase** - Interactive gacha system for viewing merchandise
- **E-Commerce Shop** - Full shopping experience with:
  - Google OAuth student email authentication
  - Product catalog (Merch, Arsari-Sari Store, Services)
  - Shopping cart
  - GCash payment with receipt upload
  - Order tracking
  - Admin dashboard for order & product management

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router) with React 19
- **Styling**: Tailwind CSS v4
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Better Auth with Google OAuth
- **File Storage**: MinIO (S3-compatible)
- **UI Components**: Radix UI + shadcn/ui
- **Forms**: react-hook-form with Zod validation
- **Deployment**: Docker + Docker Compose

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

- Browse products by category
- Add items to cart
- Google OAuth login (student email required)
- Upload GCash payment receipt
- Track order status
- View order history

### Admin Features

- View all orders with status filtering
- Update order status (pending → paid → confirmed → completed)
- View payment receipts
- Add/edit/delete products
- Upload product images
- Manage stock and availability

## 🔐 Authentication

- Uses Better Auth with Google OAuth
- Restricts access to @student.ateneo.edu emails
- Session-based authentication
- Protected admin routes

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

The app is configured for Docker deployment with standalone output:

```bash
docker-compose up -d
```

See [dockerfile](dockerfile) and [docker-compose.yaml](docker-compose.yaml) for details.

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

See [SHOP_SETUP.md](SHOP_SETUP.md#troubleshooting) for common issues and solutions.

## 📄 License

Copyright © 2025 ARSA

---

Made with ❤️ by the ARSA team
