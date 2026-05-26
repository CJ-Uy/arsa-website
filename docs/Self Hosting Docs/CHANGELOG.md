# Changelog

All notable changes to the ARSA website project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Known Issues

- Admin tables may require horizontal scrolling on mobile devices
- Stats cards on admin orders page cramped on tablets (5 columns)
- Footer email text may overflow on small screens
- Redirects table lacks horizontal scroll wrapper for mobile

## [1.5.0] - 2025-01-09

### Added

- **GCash Invoice OCR Feature**: Upload GCash transaction history PDFs for automatic transaction matching
  - OCR extraction of transaction tables from PDF invoices
  - Automatic matching of transactions with orders by reference number
  - Manual verification dashboard for unmatched payments ([src/app/admin/orders/ManualVerificationDashboard.tsx](src/app/admin/orders/ManualVerificationDashboard.tsx))
  - Invoice upload component ([src/app/admin/orders/InvoiceUpload.tsx](src/app/admin/orders/InvoiceUpload.tsx))
  - Invoice parsing utilities ([src/lib/gcashReaders/readInvoice.ts](src/lib/gcashReaders/readInvoice.ts), [src/lib/gcashReaders/parseInvoiceTable.ts](src/lib/gcashReaders/parseInvoiceTable.ts))

### Changed

- Updated reference number parsing to handle spaces (e.g., "1234 567 890") ([src/lib/gcashReaders/parseReceipt.ts](src/lib/gcashReaders/parseReceipt.ts))
- Improved regex patterns in receipt parser for better OCR error handling

### Fixed

- Reference number extraction now properly handles GCash receipts with formatted spaces

## [1.4.0] - 2024-12-XX

### Added

- **Client-Side Batch OCR**: Moved OCR processing from server to browser
  - Uses Tesseract.js in browser for faster processing without server load
  - Batch reprocessing feature to extract missing reference numbers from existing orders
  - Collapsible batch OCR section in admin orders dashboard
  - Processing time: ~8-12 seconds per receipt
  - Files: [src/app/admin/orders/ClientBatchOcr.tsx](src/app/admin/orders/ClientBatchOcr.tsx), [src/app/admin/orders/clientBatchOcrActions.ts](src/app/admin/orders/clientBatchOcrActions.ts)

- **Admin Orders Page Redesign**: Tabbed interface for better organization
  - Orders tab: View and manage all orders
  - Verify tab: OCR processing, invoice upload, manual verification
  - Improved layout with collapsible sections
  - Documentation: [docs/ADMIN_ORDERS_REDESIGN.md](docs/ADMIN_ORDERS_REDESIGN.md)

### Changed

- Switched from server-side to client-side OCR processing for better performance
- Updated Excel export format to show transaction info only on first row per order

### Deprecated

- Server-side batch OCR ([src/app/admin/orders/batchOcrActions.ts](src/app/admin/orders/batchOcrActions.ts)) - kept for reference but not actively used

## [1.3.0] - 2024-12-XX

### Added

- **Banner System**: Site-wide announcement banners with countdown timers
  - Dismissible banners with persistent state via localStorage
  - Countdown timer support with `{timer}` placeholder
  - Minimized banner at bottom when dismissed
  - Admin management interface at `/admin/banner`
  - Files: [src/components/main/announcement-banner.tsx](src/components/main/announcement-banner.tsx), [src/app/admin/banner/page.tsx](src/app/admin/banner/page.tsx)

- **Product Image Carousel Enhancements**
  - Multiple images per product support
  - Zoom in/out feature (click to toggle object-cover/object-contain)
  - Touch swipe gestures for mobile navigation
  - Thumbnail navigation for desktop
  - Dot indicators for mobile
  - Component: [src/components/features/product-image-carousel.tsx](src/components/features/product-image-carousel.tsx)

### Changed

- Updated layout wrapper to manage banner positioning dynamically
- Enhanced product model to support multiple image URLs array

## [1.2.0] - 2024-12-XX

### Added

- **In-Memory Caching System**: Reduces database load for remote deployments
  - Request deduplication to prevent cache stampede
  - Automatic cleanup of expired entries
  - Cache key generators for products, cart, orders, redirects
  - Cache statistics API endpoint at `/api/cache-stats`
  - Implementation: [src/lib/cache.ts](src/lib/cache.ts)
  - Documentation: [docs/PERFORMANCE.md](docs/PERFORMANCE.md)

- **Upload-Time Image Optimization**
  - Sharp library processes images once at upload
  - Conversion to WebP format
  - Resizing to max 1200x1200px
  - Quality set to 85%
  - Server resource efficient (no runtime processing)

### Changed

- Disabled Next.js Image component optimization (images pre-optimized at upload)
- Added console.log removal in production builds
- Optimized Prisma queries with proper includes and selects

## [1.1.0] - 2024-11-XX

### Added

- **GCash OCR Auto-Extraction**: Automatic reference number extraction from receipts
  - Client-side OCR using Tesseract.js
  - Automatic extraction during checkout process
  - Duplicate detection: Prevents reusing payment references
  - Admin dashboard with duplicate warnings
  - Excel export includes "GCash Ref No" column
  - Processing time: ~8-12 seconds per receipt
  - Implementation: [src/lib/gcashReaders/](src/lib/gcashReaders/)
  - Documentation: [docs/GCASH.md](docs/GCASH.md), [docs/CLIENT_SIDE_OCR.md](docs/CLIENT_SIDE_OCR.md)

- **Comprehensive Documentation**
  - 19 documentation files in [docs/](docs/) folder
  - Deployment guides ([docs/DEPLOYMENT.md](docs/DEPLOYMENT.md), [docs/DOCKER.md](docs/DOCKER.md), [docs/COOLIFY.md](docs/COOLIFY.md))
  - Feature guides ([docs/FEATURE_GUIDE.md](docs/FEATURE_GUIDE.md), [docs/BATCH_OCR_GUIDE.md](docs/BATCH_OCR_GUIDE.md))
  - Quick reference ([docs/QUICK_REFERENCE.md](docs/QUICK_REFERENCE.md))

- **Excel Export for Orders**
  - Full order data export with customer information
  - GCash reference numbers included
  - Proper formatting for multi-item orders
  - Configurable column widths

### Changed

- Enhanced order model with `gcashReferenceNumber` field (indexed for duplicate detection)
- Updated checkout flow to include OCR processing step

## [1.0.0] - 2024-11-XX

### Added

- **Initial Release**: Full-featured ARSA website

#### Public Pages

- Home page with events, stats, quick actions, social media links
- About page with council/directory information
- Calendar page for events
- Publications page for Bridges magazine
- Merchandise showcase with gacha system (5★/4★/3★ rarity)
- Resources page with venue booking and inventory
- Contact page with grievance forms

#### E-Commerce Shop System

- Product browsing with filtering and sorting
- Shopping cart with size selection
- Checkout process with GCash payment
- Order history and tracking
- Product categories: merch, arsari-sari, other
- Size variants: XXXS to XXXL
- Pre-order support
- Stock tracking

#### Admin Dashboard

- Product management (CRUD operations)
- Order management with status updates
- Order status workflow: pending → paid → confirmed → completed
- User authentication with role-based access control

#### URL Redirect System

- Custom short URL creation (e.g., domain.com/shortcode → full URL)
- Click tracking and analytics
- CRUD operations for redirect management
- Separate admin dashboard at `/redirects`

#### Authentication

- Better Auth integration
- Google OAuth only
- Auto-populate firstName/lastName from OAuth
- Session-based authentication
- Role-based access control (isShopAdmin, isRedirectsAdmin)

#### Storage

- MinIO (S3-compatible) object storage
- Product image storage
- Receipt image storage
- SSL/TLS support with self-signed certificates
- Public bucket policies

#### Technical Foundation

- Next.js 15 with App Router
- React 19
- TypeScript
- Tailwind CSS v4
- PostgreSQL with Prisma ORM
- 57 shadcn/ui components
- Docker containerization with multi-stage build
- Standalone output mode (~150MB image)

#### Developer Experience

- Custom Prisma client output location
- Path aliases (@/ → src/)
- ESLint and Prettier configuration
- Hot reload with Turbopack
- Comprehensive development commands

## Architecture Decisions

### Why Client-Side OCR?

- **Performance**: Offloads processing from server to user's browser
- **Scalability**: No server resources consumed during OCR processing
- **Cost**: Reduces server compute costs for high-volume processing
- **User Experience**: Immediate feedback during checkout process

### Why MinIO?

- **S3 Compatibility**: Standard API, easy migration to AWS S3 if needed
- **Self-Hosted**: Complete control over storage and costs
- **Docker Integration**: Easy deployment alongside main application
- **SSL/TLS Support**: Secure storage with certificate management

### Why Standalone Output?

- **Image Size**: ~150MB vs ~500MB for standard Node.js image
- **Deployment Speed**: Faster image pulls and container startup
- **Security**: Minimal dependencies reduce attack surface
- **Cost**: Smaller images = lower storage and bandwidth costs

### Why Custom Prisma Output?

- **Docker Compatibility**: Consistent paths between development and production
- **Build Optimization**: Cleaner separation of generated code
- **Version Control**: Easier to gitignore generated files

## Migration Guide

### Upgrading from 1.0.0 to 1.1.0

1. Add `gcashReferenceNumber` field to Order model in schema.prisma
2. Run `npx prisma db push` to apply schema changes
3. Install Tesseract.js: `npm install tesseract.js`
4. Deploy new OCR reader files to `src/lib/gcashReaders/`
5. Update checkout component to include OCR processing

### Upgrading from 1.1.0 to 1.2.0

1. Deploy cache system file: `src/lib/cache.ts`
2. Install Sharp library: `npm install sharp`
3. Update upload endpoint to use Sharp for image optimization
4. Configure Next.js to disable built-in image optimization

### Upgrading from 1.2.0 to 1.3.0

1. Add `Banner` model to schema.prisma
2. Run `npx prisma db push`
3. Deploy banner components and admin page
4. Update product model to support `imageUrls` array
5. Migrate existing product images to array format

### Upgrading from 1.3.0 to 1.4.0

1. Deploy new client-side batch OCR components
2. Update admin orders page with tabbed interface
3. Update Excel export format
4. Test batch reprocessing feature with existing orders

### Upgrading from 1.4.0 to 1.5.0

1. Deploy invoice OCR utilities to `src/lib/gcashReaders/`
2. Add invoice-related server actions
3. Deploy InvoiceUpload and ManualVerificationDashboard components
4. Update admin orders page to include Verify tab
5. Test invoice upload and transaction matching

## Security Notes

### Authentication

- Google OAuth only - no password storage
- Session-based authentication with IP and user agent tracking
- Admin roles controlled via database flags
- No public user registration (manual admin assignment)

### File Storage

- Receipt images stored in MinIO with restricted access
- Presigned URLs for temporary secure access
- Public bucket policy required for OCR processing
- SSL/TLS encryption for data in transit

### Docker Security

- Non-root user (nextjs:nodejs) for container execution
- Multi-stage builds minimize attack surface
- Alpine Linux base for minimal image size
- Regular dependency updates via npm

## Performance Metrics

### Image Optimization

- Before: ~2MB average product image
- After: ~200KB WebP image at 1200x1200px
- Reduction: ~90% file size

### Docker Image Size

- Standard Node.js image: ~500MB
- Standalone output: ~150MB
- Reduction: ~70% image size

### Database Query Optimization

- In-memory caching reduces query load by ~60%
- Request deduplication prevents cache stampede
- Proper Prisma includes reduce N+1 queries

### OCR Processing

- Average processing time: 8-12 seconds per receipt
- Client-side processing: 0 server load
- Success rate: ~85-90% for clear images

## Future Roadmap

### Planned Features

- [ ] CMS integration (Strapi) for dynamic content management
- [ ] Real-time event calendar with calendar subscriptions
- [ ] Email notifications for order status updates
- [ ] Push notifications for announcements
- [ ] Advanced analytics dashboard for admins
- [ ] Inventory management with low stock alerts
- [ ] Automated invoice reconciliation
- [ ] QR code generation for orders
- [ ] Mobile app (React Native)

### Under Consideration

- [ ] Multi-language support (English/Filipino)
- [ ] Payment gateway integration (GCash API)
- [ ] SMS notifications via Twilio
- [ ] Barcode scanning for inventory
- [ ] Student ID card integration
- [ ] Resident feedback system
- [ ] Maintenance request tracking
- [ ] Room assignment management

## Contributors

- Development Team: ARSA Web Development Team
- Project Maintainer: [Your Name/Team]
- Documentation: AI-assisted with Claude Code

## License

[Your License Here]

---

For more information, see the [full documentation](docs/README.md).
