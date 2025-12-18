# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

> 📚 **Additional Documentation**: See the [docs/](docs/) folder for detailed guides on specific features and deployment.

## Project Overview

This is the ARSA (dorm system) website - a Next.js 15 application for a university dormitory system. The site includes features like a URL redirect system, event calendar, publications, merchandise showcase with a gacha system, and contact information.

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
npx prisma migrate dev   # Create and apply migrations (development)
npx prisma studio        # Open Prisma Studio for database management
```

## Tech Stack

- **Framework**: Next.js 15 (App Router) with React 19
- **Styling**: Tailwind CSS v4
- **Database**: PostgreSQL with Prisma ORM
- **UI Components**: Radix UI primitives + custom shadcn/ui components
- **Forms**: react-hook-form with Zod validation
- **Deployment**: Docker + Docker Compose (configured for standalone output)

## Architecture

### Database and ORM

- Prisma schema: [prisma/schema.prisma](prisma/schema.prisma)
- Generated client output: `src/generated/prisma/` (custom location)
- Singleton Prisma client: [src/lib/prisma.ts](src/lib/prisma.ts) (prevents multiple instances in development)
- Database models:
  - `Credentials`: Authentication for the redirect dashboard
  - `Redirects`: URL shortener system tracking redirects, clicks, and codes
  - `User`, `Session`, `Account`: Better Auth authentication models
  - `Product`, `CartItem`, `Order`, `OrderItem`: E-commerce/shop system
  - `Banner`: Homepage banner configuration with countdown support

### Middleware Architecture

The application uses a chainable middleware pattern in [src/middleware.ts](src/middleware.ts):

1. **Entry Point**: All requests matching the matcher config flow through the main middleware
2. **Redirect Middleware** ([src/lib/middleware/redirectMiddleware.ts](src/lib/middleware/redirectMiddleware.ts)):
   - Intercepts all non-static paths
   - Checks if the path matches a redirect code in the database
   - Updates click tracking and performs redirects
   - Returns `undefined` to continue to Next.js routing if no redirect found
3. **Extensible Design**: Additional middleware can be chained by adding more checks after the redirect middleware

### URL Redirect System

The core feature that enables custom short URLs (e.g., `domain.com/shortcode` → full URL):

- **Dashboard**: [src/app/redirects/page.tsx](src/app/redirects/page.tsx) - Server Component that fetches initial data
- **Client UI**: [src/app/redirects/dashboardClient.tsx](src/app/redirects/dashboardClient.tsx) - Interactive dashboard for CRUD operations
- **Server Actions**: [src/app/redirects/actions.ts](src/app/redirects/actions.ts):
  - `verifyCredentials()`: Simple authentication (note: passwords stored in plain text)
  - `createRedirect()`, `updateRedirect()`, `deleteRedirect()`: Redirect management with validation
- **Middleware**: Handles the actual redirects at runtime and tracks click analytics

### Component Structure

- **Main Components** ([src/components/main/](src/components/main/)):
  - `Header.tsx`: Navigation with responsive menu
  - `Footer.tsx`: Site footer with links
  - `theme-provider.tsx`: next-themes integration for dark mode
  - `theme-toggle.tsx`: Theme switcher component

- **Feature Components** ([src/components/features/](src/components/features/)):
  - `gacha-banner.tsx`: Interactive gacha system for merchandise with rarity tiers (5★/4★/3★)
  - `event-card.tsx`: Event display components

- **UI Components** ([src/components/ui/](src/components/ui/)): shadcn/ui components (Radix UI + Tailwind)

### App Router Pages

All pages use the App Router structure in [src/app/](src/app/):

- `/` - Home page
- `/about` - About ARSA
- `/calendar` - Event calendar
- `/publications` - Publications and resources
- `/merch` - Merchandise showcase with gacha system
- `/resources` - Resource links
- `/contact` - Contact information
- `/shop` - Shop system with cart and checkout
- `/admin` - Admin dashboard (protected, requires isShopAdmin)
- `/redirects` - URL redirect management dashboard (protected)

### Styling

- Global styles: [src/app/globals.css](src/app/globals.css)
- Tailwind v4 with PostCSS configuration
- Uses Geist and Geist Mono fonts (auto-optimized via next/font)
- Theme variables defined in CSS for light/dark modes
- Sonner for toast notifications (configured in root layout)

## Docker Deployment

The application is containerized for production:

- **Multi-stage Dockerfile** ([dockerfile](dockerfile)):
  1. `deps`: Install dependencies
  2. `builder`: Generate Prisma client and build Next.js
  3. `runner`: Minimal production image with standalone output
- **Standalone output mode** enabled in [next.config.ts](next.config.ts) for optimized Docker deployment
- **Environment**: Reads `DATABASE_URL` and other env vars from `.env`
- **Security**: Runs as non-root user (nextjs:nodejs)

## Shop System & GCash Integration

### GCash Reference Number Auto-Extraction

The checkout system includes automatic GCash reference number extraction:

- **OCR Processing**: Uses Tesseract.js for client-side OCR ([src/lib/gcashReaders/](src/lib/gcashReaders/))
- **Automatic Extraction**: Reference numbers extracted from receipt screenshots during checkout
- **Duplicate Detection**: Server-side validation prevents using same payment for multiple orders
- **Admin Visibility**: Reference numbers displayed in admin dashboard with duplicate warnings
- **Excel Export**: Includes "GCash Ref No" column in order exports

**Documentation**: See [docs/](docs/) folder for complete documentation:

- [docs/README.md](docs/README.md) - Documentation index and navigation
- [docs/QUICK_REFERENCE.md](docs/QUICK_REFERENCE.md) - Quick reference for developers
- [docs/GCASH.md](docs/GCASH.md) - Complete OCR implementation reference
- [docs/IMPLEMENTATION_SUMMARY.md](docs/IMPLEMENTATION_SUMMARY.md) - Technical implementation details
- [docs/FEATURE_GUIDE.md](docs/FEATURE_GUIDE.md) - User and admin guides
- [docs/PDF_IMAGE_SUPPORT.md](docs/PDF_IMAGE_SUPPORT.md) - Image vs PDF detailed guide
- [docs/BATCH_OCR_GUIDE.md](docs/BATCH_OCR_GUIDE.md) - Batch processing for existing orders

### Order Management

- **Customer Flow**: Cart → Checkout → GCash Payment → Receipt Upload → Auto-extraction → Order Creation
- **Admin Dashboard**: [src/app/admin/orders/](src/app/admin/orders/) - View orders, update status, detect duplicates
- **Duplicate Detection**: Visual badges and warnings for orders sharing the same GCash reference number
- **Excel Export**: Full order data with reference numbers for external processing

## Important Notes

### Database Workflow

Always run `npx prisma generate` after modifying [prisma/schema.prisma](prisma/schema.prisma) to regenerate the client in `src/generated/prisma/`.

Use `npx prisma db push` to apply schema changes to the database (safer than migrate for existing data).

### Authentication

The system uses Better Auth for user authentication with session management. Admin access controlled via `isShopAdmin` flag on User model.

### Build Configuration

- ESLint errors are ignored during builds (`ignoreDuringBuilds: true`)
- Turbopack is used for faster builds and development
- Standalone output mode creates a minimal production bundle

### Path Aliases

- `@/` maps to `src/` (configured in [tsconfig.json](tsconfig.json))

### Server Components vs Client Components

- Most pages are Server Components by default (can directly query database)
- Client Components marked with `"use client"` directive (e.g., gacha-banner, dashboard client)
- Server Actions in [src/app/redirects/actions.ts](src/app/redirects/actions.ts) use `"use server"` directive
