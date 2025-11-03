# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

## Important Notes

### Database Workflow

Always run `npx prisma generate` after modifying [prisma/schema.prisma](prisma/schema.prisma) to regenerate the client in `src/generated/prisma/`.

### Authentication

The redirect dashboard uses basic authentication with plain text passwords stored in the `Credentials` table. This is not production-ready security.

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
