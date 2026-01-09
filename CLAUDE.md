# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> 📚 **Additional Documentation**: See the [docs/](docs/) folder for detailed guides on specific features and deployment.

## Project Overview

This is the ARSA (Ateneo Resident Students Association) website - a Next.js 15 application for a university dormitory system. The site is a comprehensive platform with:

- **Public Pages**: Home, About, Calendar, Publications (Bridges Magazine), Merchandise showcase with gacha system, Resources, Contact
- **E-Commerce Shop**: Full-featured shop with cart, checkout, order history, and GCash payment integration with OCR
- **Admin Dashboard**: Product management, order management with verification workflow, banner management
- **URL Shortener**: Custom short URL system with click tracking and analytics
- **Authentication**: Better Auth with Google OAuth integration
- **Storage**: MinIO (S3-compatible) for product images and receipt storage

## Development Commands

```bash
# Development server (with Turbopack)
npm run dev

# Production build (with Turbopack)
npm run build

# Start production server
npm start

# Linting
npm run lint

# Database management
npx prisma generate      # Generate Prisma client after schema changes
npx prisma db push       # Apply schema changes (safer than migrate for existing data)
npx prisma migrate dev   # Create and apply migrations (development)
npx prisma studio        # Open Prisma Studio for database management
```

## Tech Stack

- **Framework**: Next.js 15 (App Router) with React 19
- **Styling**: Tailwind CSS v4 with PostCSS
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Better Auth with Google OAuth
- **Storage**: MinIO (S3-compatible object storage)
- **OCR**: Tesseract.js (client-side browser OCR)
- **UI Components**: 57 shadcn/ui components (Radix UI primitives + Tailwind)
- **Forms**: react-hook-form with Zod validation
- **Notifications**: Sonner for toast notifications
- **Excel Export**: XLSX library for order exports
- **Deployment**: Docker + Docker Compose (standalone output mode)

## Architecture

### Database and ORM

- **Prisma Schema**: [prisma/schema.prisma](prisma/schema.prisma)
- **Generated Client Output**: `src/generated/prisma/` (custom location)
- **Singleton Prisma Client**: [src/lib/prisma.ts](src/lib/prisma.ts) (prevents multiple instances in development)

#### Database Models

**Authentication (Better Auth)**

- `User` - User accounts with admin role flags (`isShopAdmin`, `isRedirectsAdmin`), student ID, name fields
- `Session` - Session management with IP address and user agent tracking
- `Account` - OAuth provider accounts (Google)
- `Verification` - Email verification tokens

**E-Commerce Shop**

- `Product` - Products with multiple images, size variants (XXXS-XXXL), pre-order support, categories (merch/arsari-sari/other)
- `CartItem` - Shopping cart with size-aware items
- `Order` - Orders with status workflow, receipt storage, GCash reference numbers, customer notes
- `OrderItem` - Order line items with size and price snapshots

**URL Redirect System**

- `Redirects` - Short URL codes with click tracking and analytics

**Content Management**

- `Banner` - Site-wide announcements with countdown timer support

### Middleware Architecture

The application uses a chainable middleware pattern in [src/middleware.ts](src/middleware.ts):

1. **Entry Point**: All requests matching the matcher config flow through the main middleware
2. **Redirect Middleware** ([src/lib/middleware/redirectMiddleware.ts](src/lib/middleware/redirectMiddleware.ts)):
   - Intercepts all non-static paths
   - Checks if the path matches a redirect code in the database
   - Updates click tracking and performs redirects
   - Returns `undefined` to continue to Next.js routing if no redirect found
3. **Extensible Design**: Additional middleware can be chained by adding more checks after the redirect middleware

### Caching System

**In-Memory Cache** ([src/lib/cache.ts](src/lib/cache.ts)):

- Reduces database queries for remote databases
- Request deduplication (prevents cache stampede)
- Automatic cleanup of expired entries
- Cache key generators for products, cart, orders, redirects
- Cache statistics API endpoint at `/api/cache-stats`

### Storage System

**MinIO Integration** ([src/lib/minio.ts](src/lib/minio.ts)):

- S3-compatible object storage for product images and receipts
- Automatic bucket creation and management
- Presigned URL generation for secure access
- SSL/TLS support with self-signed certificates
- Public bucket policies for OCR processing
- Upload endpoint at `/api/upload`
- Receipt serving at `/api/receipts/[filename]`

**Image Optimization**:

- Sharp library processes images once at upload time
- Conversion to WebP format
- Resizing to max 1200x1200px
- Quality set to 85%
- No runtime processing (server resource efficient)

### URL Redirect System

The core feature that enables custom short URLs (e.g., `domain.com/shortcode` → full URL):

- **Dashboard**: [src/app/redirects/page.tsx](src/app/redirects/page.tsx) - Server Component that fetches initial data
- **Client UI**: [src/app/redirects/dashboardClient.tsx](src/app/redirects/dashboardClient.tsx) - Interactive dashboard for CRUD operations
- **Server Actions**: [src/app/redirects/actions.ts](src/app/redirects/actions.ts):
  - `verifyCredentials()`: Authentication check
  - `createRedirect()`, `updateRedirect()`, `deleteRedirect()`: Redirect management with validation
- **Middleware**: Handles the actual redirects at runtime and tracks click analytics

### Component Structure

**Main Components** ([src/components/main/](src/components/main/)):

- `Header.tsx` - Navigation with responsive mobile menu, user dropdown, role-based admin links
- `Footer.tsx` - Site footer with social media links and contact info
- `theme-provider.tsx` - next-themes integration for dark mode
- `theme-toggle.tsx` - Theme switcher component
- `announcement-banner.tsx` - Dismissible banner with countdown timer support

**Feature Components** ([src/components/features/](src/components/features/)):

- `gacha-banner.tsx` - Interactive gacha system for merchandise with rarity tiers (5★/4★/3★)
- `event-card.tsx` - Event display with attendance tracking
- `product-image-carousel.tsx` - Multi-image carousel with zoom, swipe gestures, thumbnails
- `cart-counter.tsx` - Shopping cart item counter badge

**Layout Components**:

- `layout-wrapper.tsx` - Wraps pages with header/footer and manages banner positioning

**UI Components** ([src/components/ui/](src/components/ui/)): 57 shadcn/ui components including:

- Forms: button, input, textarea, checkbox, radio-group, select, switch, slider
- Overlays: dialog, sheet, drawer, popover, hover-card, tooltip, alert-dialog
- Navigation: dropdown-menu, context-menu, navigation-menu, menubar, tabs
- Display: card, badge, alert, avatar, separator, skeleton
- Data: table, calendar, chart, progress
- Layout: accordion, collapsible, resizable, scroll-area, sidebar
- Advanced: command, carousel, sonner (toasts), form (react-hook-form integration)

### App Router Pages

All pages use the App Router structure in [src/app/](src/app/):

**Public Routes**:

- `/` - Home page with events, stats, quick actions, social media links
- `/about` - About ARSA with council/directory information
- `/calendar` - Event calendar
- `/publications` - Publications and Bridges magazine
- `/merch` - Merchandise showcase with gacha system
- `/resources` - Resource links and venue booking
- `/contact` - Contact information and grievance forms

**Shop Routes** (Authentication Required):

- `/shop` - Shop homepage with product browsing, filtering, sorting
- `/shop/cart` - Shopping cart with quantity management
- `/shop/checkout` - Checkout with GCash payment and receipt upload (OCR)
- `/shop/orders` - Order history
- `/shop/orders/[orderId]` - Individual order details

**Admin Routes** (isShopAdmin Required):

- `/admin` - Admin dashboard homepage
- `/admin/orders` - Order management with Excel export, tabbed interface (Orders/Verify)
- `/admin/orders` (Verify Tab) - OCR processing, invoice upload, manual verification
- `/admin/products` - Product management with CRUD operations
- `/admin/banner` - Banner/announcement management with countdown timers

**Redirect Dashboard** (isRedirectsAdmin Required):

- `/redirects` - URL redirect management with click analytics

**Error Pages**:

- `/not-found` - Custom 404 page

### API Routes

Located in [src/app/api/](src/app/api/):

- `/api/auth/[...all]` - Better Auth routes (sign in, sign out, OAuth callbacks)
- `/api/upload` - File upload endpoint (receipts, product images)
- `/api/receipts/[filename]` - Receipt file serving
- `/api/user/roles` - Fetch current user's admin roles
- `/api/health` - Health check endpoint
- `/api/cache-stats` - Cache statistics endpoint

### Server Actions

Located throughout the app:

- `src/app/shop/actions.ts` - Shop operations (cart management, order creation)
- `src/app/shop/gcashActions.ts` - GCash PDF reference extraction
- `src/app/admin/orders/actions.ts` - Order management, status updates, Excel export
- `src/app/admin/orders/batchOcrActions.ts` - Server-side batch OCR (legacy)
- `src/app/admin/orders/clientBatchOcrActions.ts` - Client-side batch OCR actions
- `src/app/admin/orders/invoiceActions.ts` - Invoice upload and OCR processing
- `src/app/admin/products/actions.ts` - Product CRUD operations
- `src/app/admin/banner/actions.ts` - Banner management
- `src/app/redirects/actions.ts` - URL redirect CRUD with authentication

### Styling

- **Global Styles**: [src/app/globals.css](src/app/globals.css)
- **Tailwind v4**: PostCSS configuration with Tailwind CSS v4
- **Fonts**: Geist and Geist Mono (auto-optimized via next/font)
- **Theme System**: CSS variables for light/dark modes with next-themes
- **Notifications**: Sonner for toast notifications (configured in root layout)
- **Mobile-First**: Responsive design with Tailwind breakpoints (sm, md, lg, xl)

## Shop System & GCash Integration

### GCash Reference Number Auto-Extraction

The checkout system includes **automatic GCash reference number extraction** using client-side OCR:

**OCR Processing** ([src/lib/gcashReaders/](src/lib/gcashReaders/)):

- `readReceipt.client.ts` - Client-side OCR using Tesseract.js (runs in browser)
- `readReceipt.server.ts` - Server-side OCR (currently not in use, client-side preferred)
- `parseReceipt.ts` - Parses OCR text to extract reference numbers, amounts, recipient info
- `readInvoice.ts` - PDF invoice parser for GCash transaction history
- `parseInvoiceTable.ts` - Extracts transaction tables from invoice OCR text

**Features**:

- Automatic extraction from receipt screenshots during checkout
- Handles reference numbers with spaces (e.g., "1234 567 890")
- Robust regex patterns for OCR errors
- ~8-12 seconds per receipt processing time
- Duplicate detection: Server-side validation prevents using same payment for multiple orders
- Admin visibility: Reference numbers displayed in admin dashboard with duplicate warnings
- Excel export: Includes "GCash Ref No" column in order exports
- Batch reprocessing: Admin can reprocess existing orders to extract missing reference numbers
- Invoice verification: Upload GCash transaction history PDFs for automatic matching

**Documentation**: See [docs/](docs/) folder for complete documentation:

- [docs/README.md](docs/README.md) - Documentation index and navigation
- [docs/QUICK_REFERENCE.md](docs/QUICK_REFERENCE.md) - Quick reference for developers
- [docs/GCASH.md](docs/GCASH.md) - Complete OCR implementation reference
- [docs/IMPLEMENTATION_SUMMARY.md](docs/IMPLEMENTATION_SUMMARY.md) - Technical implementation details
- [docs/FEATURE_GUIDE.md](docs/FEATURE_GUIDE.md) - User and admin guides
- [docs/PDF_IMAGE_SUPPORT.md](docs/PDF_IMAGE_SUPPORT.md) - Image vs PDF detailed guide
- [docs/BATCH_OCR_GUIDE.md](docs/BATCH_OCR_GUIDE.md) - Batch processing for existing orders
- [docs/CLIENT_SIDE_OCR.md](docs/CLIENT_SIDE_OCR.md) - Client-side OCR implementation

### Order Management

**Customer Flow**:
Cart → Checkout → GCash Payment → Receipt Upload → Auto-extraction → Order Creation

**Order Status Workflow**:
`pending` → `paid` → `confirmed` → `completed` (or `cancelled`)

**Admin Dashboard** ([src/app/admin/orders/](src/app/admin/orders/)):

- Tabbed interface (Orders tab / Verify tab)
- View all orders with filtering by status
- Update order status
- Delete orders
- Detect duplicate GCash reference numbers with visual badges
- Excel export with transaction information
- Batch OCR reprocessing for existing orders
- Invoice upload and automatic transaction matching
- Manual verification dashboard for unmatched payments

**Excel Export Format**:

- Order ID, Order Date, Customer Name, Email, Student ID
- Product Name, Description, Size, Quantity
- Unit Price, Item Total, Order Total
- Order Status, GCash Ref No, Notes, Receipt URL
- Properly formatted with transaction info only on first row per order

## Docker Deployment

The application is containerized for production:

**Multi-stage Dockerfile** ([dockerfile](dockerfile)):

1. `deps` - Install dependencies
2. `builder` - Generate Prisma client and build Next.js
3. `runner` - Minimal production image with standalone output (~150MB vs ~500MB)

**Features**:

- Standalone output mode enabled in [next.config.ts](next.config.ts)
- Alpine Linux base for minimal image size
- CA certificates for SSL/TLS support
- Binary targets for Alpine in Prisma schema
- Environment variables from `.env` file
- Security: Runs as non-root user (nextjs:nodejs)
- Resource limits in docker-compose.yaml

**Docker Compose** ([docker-compose.yaml](docker-compose.yaml)):

- Service definition with health checks
- Resource limits (memory, CPU)
- Logging configuration
- Environment variable management

## Important Notes

### Database Workflow

**Always run** `npx prisma generate` after modifying [prisma/schema.prisma](prisma/schema.prisma) to regenerate the client in `src/generated/prisma/`.

**Use** `npx prisma db push` to apply schema changes to the database (safer than migrate for existing data).

**Generated client location**: The Prisma client is generated in a custom location (`src/generated/prisma/`) instead of the default `node_modules/.prisma/client`. This is configured in the Prisma schema with `output = "../src/generated/prisma"`.

### Authentication

The system uses **Better Auth** for user authentication:

- Google OAuth only (no email/password login)
- Auto-populates `firstName` and `lastName` from Google OAuth
- Session-based authentication with IP and user agent tracking
- Admin access controlled via `isShopAdmin` and `isRedirectsAdmin` flags on User model
- Role-based access control for admin dashboards
- User roles fetched from `/api/user/roles` endpoint

### Build Configuration

- **ESLint**: Errors are ignored during builds (`ignoreDuringBuilds: true`)
- **Turbopack**: Used for faster builds and development
- **Standalone Output**: Creates minimal production bundle for Docker
- **Image Optimization**: Disabled (images pre-optimized with Sharp at upload)
- **Console Removal**: Production builds remove `console.log` statements
- **Memory Optimizations**: Configured in next.config.ts for large builds

### Path Aliases

- `@/` maps to `src/` (configured in [tsconfig.json](tsconfig.json))

### Server Components vs Client Components

- **Most pages are Server Components** by default (can directly query database)
- **Client Components** marked with `"use client"` directive:
  - Interactive components: gacha-banner, product carousel, cart counter
  - Dashboard clients: shop-client, cart-client, checkout-client, orders-management
  - Form components: All forms with react-hook-form
- **Server Actions** use `"use server"` directive and are located in `actions.ts` files

### Mobile Responsiveness

The application is designed **mobile-first** with responsive Tailwind classes:

- Responsive grid layouts: `grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Mobile navigation: Hamburger menu with slide-out drawer
- Touch-friendly buttons: Appropriate sizes for mobile interaction
- Responsive spacing: `px-4 sm:px-6 lg:px-8`
- Product carousel: Swipe gestures for mobile, thumbnails for desktop
- Conditional rendering: Different UI for mobile vs desktop where appropriate

**Note**: Tables in admin dashboards may require horizontal scrolling on mobile devices.

## Recent Features

### GCash Invoice OCR (Latest)

- Upload GCash transaction history PDFs
- OCR extraction of transaction tables
- Automatic matching of transactions with orders by reference number
- Manual verification dashboard for unmatched payments

### Client-Side Batch OCR

- Moved from server-side to client-side OCR processing
- Uses Tesseract.js in browser for faster processing
- Batch reprocessing feature to fix false positives
- Collapsible section in admin dashboard

### Banner System

- Dismissible announcement banners
- Countdown timer support with `{timer}` placeholder
- Minimized banner at bottom when dismissed
- Persistent state via localStorage

### Product Image Carousel

- Multiple images per product
- Zoom in/out feature (click to toggle)
- Touch swipe gestures for mobile
- Thumbnail navigation for desktop
- Dot indicators for mobile

### Performance Optimizations

- In-memory caching system with request deduplication
- Upload-time image optimization
- Standalone Docker output mode
- Efficient database queries with Prisma

## Configuration Files

- **package.json** - Dependencies and scripts
- **next.config.ts** - Next.js configuration (standalone output, image optimization, compiler options)
- **tsconfig.json** - TypeScript configuration with path aliases
- **prisma/schema.prisma** - Database schema with custom Prisma client output
- **dockerfile** - Multi-stage Docker build
- **docker-compose.yaml** - Service definition with resource limits
- **postcss.config.mjs** - PostCSS with Tailwind CSS v4
- **.env.example** - Example environment variables
- **.env.docker.example** - Docker-specific environment template
- **.prettierrc.json** - Prettier code formatting
- **eslint.config.mjs** - ESLint configuration
- **components.json** - shadcn/ui component configuration

## Development Tips

1. **Database changes**: Always run `npx prisma generate` after schema changes
2. **Cache management**: Use `/api/cache-stats` to monitor cache performance
3. **OCR testing**: Test with real GCash receipts, processing time is ~8-12 seconds
4. **Image uploads**: Images are automatically optimized to WebP at 1200x1200px max
5. **Admin access**: Set `isShopAdmin` or `isRedirectsAdmin` flags directly in database
6. **Docker deployment**: Use standalone output mode for minimal image size
7. **Mobile testing**: Test on actual mobile devices for touch gestures and responsiveness

## Useful Links

- **Documentation**: [docs/README.md](docs/README.md)
- **Quick Reference**: [docs/QUICK_REFERENCE.md](docs/QUICK_REFERENCE.md)
- **Deployment Guide**: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)
- **GCash OCR**: [docs/GCASH.md](docs/GCASH.md)
- **Shop Setup**: [docs/SHOP_SETUP.md](docs/SHOP_SETUP.md)
