# Cloudflare Migration — Status & Handoff

This branch (`cloudflare-migration`) migrates the ARSA website from Node.js + Prisma + PostgreSQL + MinIO + Docker to Cloudflare Workers + D1 + R2 + KV + Drizzle ORM.

## Architecture Decisions

| Layer | From | To |
|-------|------|-----|
| Runtime | Node.js (Docker) | Cloudflare Workers via `@opennextjs/cloudflare` |
| DB | Postgres + Prisma | D1 (SQLite) + Drizzle ORM |
| Object storage | MinIO | R2 (S3-compatible) |
| Cache | In-memory Map | Cloudflare KV |
| Auth | Better Auth + Prisma adapter | Better Auth + Drizzle adapter |
| Email | Nodemailer + Resend | Resend only |
| Image optim | Sharp (server) | `browser-image-compression` (client) |
| OCR (receipts) | Tesseract client + server | Tesseract client only |
| OCR (PDF invoice) | `pdfreader` (Node-only) | `pdfjs-dist` client extractor |
| Backup | `/api/admin/backup` + archiver | `wrangler d1 export` + R2 dashboard |

Confirmed by user:
- **D1 starts blank.** Existing backup file will be uploaded after migration via the existing admin import UI.
- **Receipts stay public** in R2 (matches current MinIO behavior).
- **Phased rollout** on `cloudflare-migration` branch; main remains on the legacy stack until DNS cutover.
- **Account ID `c0316c17e2973be4ae27ddc85b94edab`** (org account, `Arsa.college.org@student.ateneo.edu`).
- **Worker named `arsa-website`** already exists in the dashboard with build command `npx opennextjs-cloudflare build`.
- **No `Co-Authored-By: Claude`** trailers in commits.

## What's Done

Foundation (commit `6a756a2`):
- `wrangler.jsonc`, `drizzle.config.ts`, `open-next.config.ts`, `.dev.vars.example`
- `src/db/schema.ts` — full 23-table Drizzle schema mirroring Prisma
- `src/lib/db.ts` — lazy Proxy client (native D1 in prod, HTTP REST in dev)
- `src/lib/r2.ts` — R2 binding wrapper preserving MinIO API surface
- `src/lib/cache.ts` — KV-backed cache with request dedup
- `src/lib/auth.ts` — Better Auth + drizzleAdapter
- `src/lib/email.ts` — Resend-only (Nodemailer removed)
- `src/lib/imageCompress.ts` — browser-image-compression helper
- `src/lib/gcashReaders/readInvoice.{ts,client.ts}` — pdfjs-dist client extractor
- `src/middleware.ts` — edge runtime
- `next.config.ts` — `initOpenNextCloudflareForDev()`
- Removed `archiver`, `pdfreader`, `nodemailer`, `minio`, `sharp` deps
- Removed `src/lib/backup.ts`, `/api/admin/backup`, `/admin/backup` page, server batch OCR

Codemodded to Drizzle (commits `a7723e2`, `020d963`, `bb8a067`, `1507258`, `0d336a5`, `296c244`):
- `src/lib/middleware/redirectMiddleware.ts`
- `src/lib/daily-stock.ts`, `src/lib/ticketSheetSync.ts`, `src/lib/googleSheets.ts`
- `src/app/layout.tsx`, `src/app/admin/layout.tsx`
- API routes: `/api/upload`, `/api/receipts/[filename]`, `/api/user/roles`, `/api/shop/track`, `/api/tickets/suggest`, `/api/admin/content`
- Admin actions: `banner`, `super`, `products`, `packages`, `orders` (main + settings + clientBatchOcr + invoiceActions), `tickets`, `redirects`, `pages`, `landing`, `email-logs/bulk-send-actions`, `sso26`, `orders/settingsActions`
- Public actions: `sso26`, `ticket-verify`, `shop/checkout/daily-stock-actions`

## What's Left (23 files)

### Action files (codemod to Drizzle)

| File | Lines | Notes |
|------|-------|-------|
| `src/app/shop/actions.ts` | 1104 | Cart + checkout. Most critical. ~28 Prisma calls. |
| `src/app/admin/events/actions.ts` | 1012 | Event mgmt + analytics. |
| `src/app/shop/events/2026/flower-fest-2026/actions.ts` | 333 | Custom event checkout. |

### Server Component pages (codemod Prisma reads to Drizzle)

These are SSR `page.tsx` files that fetch data via `prisma.X.findMany / findUnique` for initial render. Pattern is identical to completed work.

- `src/app/admin/page.tsx`
- `src/app/admin/banner/page.tsx`
- `src/app/admin/content/pages/page.tsx`
- `src/app/admin/email-logs/page.tsx`
- `src/app/admin/events/page.tsx`
- `src/app/admin/orders/page.tsx`
- `src/app/admin/packages/page.tsx`
- `src/app/admin/pages/page.tsx`
- `src/app/admin/products/page.tsx`
- `src/app/admin/redirects/page.tsx`
- `src/app/admin/settings/page.tsx`
- `src/app/admin/sso26/page.tsx`
- `src/app/admin/super/page.tsx`
- `src/app/admin/tickets/page.tsx`
- `src/app/page/[slug]/page.tsx`
- `src/app/shop/checkout/page.tsx`
- `src/app/shop/events/2026/flower-fest-2026/checkout/page.tsx`
- `src/app/shop/orders/[orderId]/page.tsx`
- `src/app/ticket-verify/page.tsx`

### Cleanup

- `src/lib/prisma.ts` — delete
- `src/generated/prisma/` — delete (already gitignored)
- `prisma/schema.prisma` — keep as reference or delete
- `package.json` — remove `@prisma/client`, `prisma` once the above are gone

## Codemod Patterns (from completed work)

### Imports

```ts
// Before
import { prisma } from "@/lib/prisma";

// After
import { eq, and, desc, asc, inArray, like, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { user, order, /* etc */ } from "@/db/schema";
```

### Query → Drizzle

| Prisma | Drizzle |
|--------|---------|
| `prisma.x.findUnique({ where: { id } })` | `db.query.x.findFirst({ where: eq(x.id, id) })` |
| `prisma.x.findMany({ where, orderBy, include })` | `db.query.x.findMany({ where, orderBy: [desc(x.col)], with })` |
| `prisma.x.create({ data })` | `await db.insert(x).values(data).returning()` (returns array) |
| `prisma.x.update({ where, data })` | `db.update(x).set(data).where(eq(x.id, id))` |
| `prisma.x.delete({ where })` | `db.delete(x).where(eq(x.id, id))` |
| `prisma.x.deleteMany({ where })` | `db.delete(x).where(predicate)` |
| `prisma.x.count({ where })` | `const [r] = await db.select({ c: count() }).from(x).where(...); r.c` |
| `prisma.x.upsert(...)` | `findFirst` + `update` or `insert` (D1 has no native upsert) |
| `prisma.$transaction([...])` | `db.batch([...])` for D1; or `db.transaction(async (tx) => ...)` |
| `select: { foo: true }` | `columns: { foo: true }` |
| `include: { y: true }` | `with: { y: true }` |
| `{ in: arr }` | `inArray(col, arr)` |
| `{ contains: q, mode: "insensitive" }` | `like(col, '%' + q.toLowerCase() + '%')` (SQLite LIKE is case-insensitive for ASCII) |
| `{ startsWith: s }` | `like(col, s + '%')` |
| `{ gt: x }` | `gt(col, x)` |
| `OR: [...]` | `or(...)` |
| Cascade FK | already declared in `src/db/schema.ts` |

### Table name quirks

- `prisma.package` → `db.query.packageTable` (since `package` is a JS reserved word). Imports: `import { packageTable } from "@/db/schema"`.
- `prisma.sSO26Nomination` → `db.query.sso26Nomination`. Imports: `import { sso26Nomination, sso26DdayVote } from "@/db/schema"`.
- Better Auth tables are lowercase: `user`, `session`, `account`, `verification`.

## Provisioning (when codemod completes)

```bash
# Login to wrangler as the ARSA org account
wrangler login

# Create D1
wrangler d1 create arsa-db
# Paste the database_id into wrangler.jsonc

# Create R2 buckets
wrangler r2 bucket create arsa-products
wrangler r2 bucket create arsa-receipts
wrangler r2 bucket create arsa-events
wrangler r2 bucket create arsa-content
# Attach a custom domain (e.g. r2.ateneoarsa.org) for public reads

# Create KV namespace
wrangler kv namespace create CACHE
# Paste the id into wrangler.jsonc

# Generate the initial schema SQL and apply it
pnpm db:generate
wrangler d1 migrations apply arsa-db --remote

# Generate Worker types
pnpm cf-typegen
```

`.dev.vars` for local development:
```
CLOUDFLARE_ACCOUNT_ID=c0316c17e2973be4ae27ddc85b94edab
CLOUDFLARE_D1_DATABASE_ID=<from `wrangler d1 create` output>
CLOUDFLARE_D1_TOKEN=<dashboard → My Profile → API Tokens → D1 read/write>
RESEND_API_KEY=...
TICKET_HMAC_SECRET=<openssl rand -hex 32>
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
R2_PUBLIC_DOMAIN=https://r2.ateneoarsa.org
GOOGLE_SHEETS_CREDENTIALS=<service-account JSON>
```

The Worker production secrets (set via `wrangler secret put <NAME>`) mirror the same variables.

## Verify

```bash
# Dev: Next.js + D1 HTTP fallback
pnpm dev

# Workers preview locally (uses native D1 binding)
pnpm preview

# Production build dry-run
wrangler deploy --dry-run

# Audit deps for CVEs
pnpm audit --prod
```

End-to-end smoke:
1. Sign in via Google OAuth → `/api/user/roles` returns flags.
2. Admin creates a product (compressed client-side, uploaded to R2 products bucket).
3. Customer adds to cart → checkout → client OCR extracts GCash ref → order persists in D1.
4. Admin opens `/admin/orders` and sees the order; sends confirmation email via Resend.
5. Admin generates tickets, exports for Mail Merge, scans via `/ticket-verify`.

## Why some things changed

- **Lazy Proxy on `db`** — Workers' `getCloudflareContext()` is only available inside a request; eager init at module scope crashes the isolate.
- **Application-level UUIDs** — D1/SQLite has no native `gen_random_uuid()`. All `id` columns default to `crypto.randomUUID()` via `$defaultFn`.
- **`db.batch()` for the redirect middleware** — middleware is called per request and we want atomic click increment + log insert. D1 batching gives us that.
- **`mode: "json"` columns** — Drizzle serializes JS objects to TEXT and parses on read, replicating Prisma's `Json?` ergonomics.
- **No Sharp** — Workers has no native bindings; image optimization moved client-side. Receipts stay raw to preserve OCR fidelity.
- **`Readable.from` → `Blob.stream()`** — `googleapis` Drive upload used Node's stream module; swapped for the Web ReadableStream API.
