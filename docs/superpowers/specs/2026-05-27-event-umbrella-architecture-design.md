# Event Umbrella Architecture — Design Spec

**Date:** 2026-05-27
**Status:** Draft, pending user approval
**Scope:** Architecture-first slice. Visual polish of admin pages is deferred to a follow-up spec.

## 1. Problem

The ARSA admin and event system has grown organically:

- `ShopEvent` and `TicketEvent` are separate, unconnected tables. A campaign like "Flower Fest 2026" exists in two places if it sells products and issues tickets.
- "Custom event home page" is squeezed into `ShopEvent.customComponentPath` (a single code dir per shop event). "Additional pages" have no home.
- Event-specific admin scope (`EventAdmin`) only governs the shop side. Tickets and content are governed by separate global flags.
- The admin UI is module-flat: Orders / Products / Events / Tickets are siblings in the sidebar, even though most operations are scoped to a single event.
- `src/app/admin/events/events-management.tsx` is 4387 lines and contains the entire event editor.

Goal: re-shape the data model and admin routing around an **Event umbrella** that owns shop, tickets, landing, and pages as composable modules, with per-event tiered permissions.

## 2. Decisions captured during brainstorm

| Decision | Outcome |
|---|---|
| Focus | Architecture first; visual polish deferred |
| Event model | **Umbrella / campaign** — one Event row is the parent |
| Modules | Landing, Shop, Tickets, CMS pages, **dev-deployed code pages** |
| Page source precedence | Code page → CMS page → 404 |
| URL shape | Top-level `/<slug>/...` for microsite. `/shop` stays canonical (event renders as tab there). Tickets nest at `/<slug>/tickets`. |
| Landing default | Blank until configured (no auto-generated template) |
| Migration aggressiveness | **Hard reset** — rename `ShopEvent` → `event`, absorb `TicketEvent` into umbrella |
| Schema shape | **Composition** — separate module tables, presence + `enabled` flag both required for "live" |
| Admin scope | **Per-module grants + per-event overseer**. Global flags `isShopAdmin`, `isEventsAdmin`, `isTicketsAdmin` are **sunset** — only `isSuperAdmin` remains as implicit-everything grant. |

## 3. Domain model

```
event                  ← umbrella (slug, name, dates, status, hero, theme, SEO)
├── event_shop         ← present iff shop module is configured (enabled flag = live)
│   ├── event_product
│   └── event_category
├── event_tickets      ← present iff ticket module configured (enabled flag = live)
│   ├── ticket
│   └── ticket_verifier
├── event_landing      ← microsite root at /<slug> (published flag = live)
├── event_page         ← 0..N admin/dev pages at /<slug>/<pageSlug>
└── event_role_grant   ← (eventId, userId, role) — per-module + overseer
```

**Why composition over flags-on-Event or polymorphic event_module:**
- Type-safe FKs from existing `Product`, `Ticket`, `Order` tables map cleanly to module tables
- Per-module admin grants resolve to enum values, not JSON inference
- Adding future modules (`event_calendar`, `event_polls`) is one new sibling table
- Module config stays SQL-queryable instead of opaque JSON

**Out of umbrella:** `/admin/content/*` (Home, FAQ, About, Bridges, Contact, Banner) remains ARSA-permanent content, NOT migrated to events.

## 4. Schema (Drizzle)

All new tables use the project's existing conventions: `crypto.randomUUID()` IDs, integer millisecond timestamps, JSON columns via `mode: "json"`.

### `event`
```ts
event {
  id              text PK
  slug            text unique               // top-level URL segment
  name            text
  description     text nullable
  status          text                      // 'draft' | 'active' | 'archived'
  startDate       timestamp nullable        // optional — events can be permanent
  endDate         timestamp nullable
  heroImages      json (string[])
  theme           json (ThemeConfig)
  priority        int default 0
  ogImage         text nullable
  metaTitle       text nullable
  metaDescription text nullable
  createdAt, updatedAt
}
```

### `event_shop` (1:1 with event; presence = module configured)
```ts
event_shop {
  eventId           text PK FK → event.id
  enabled           bool default false      // ← live-to-public toggle
  checkoutFields    json (CheckoutField[])
  checkoutConfig    json
  exclusivePricing  bool default false
  codePath          text nullable           // custom shop UI override
  lastToggledBy     text FK → user.id nullable
  lastToggledAt     timestamp nullable
}
```

> **Audit field semantics:** `lastToggledBy` / `lastToggledAt` track transitions of the `enabled` flag (or `published` for landing/page) ONLY. They are NOT updated on every row edit. Set on row creation if `enabled=true` at insert.

### `event_tickets`
```ts
event_tickets {
  eventId           text PK FK → event.id
  enabled           bool default false
  defaultActive     bool default true
  sheetSyncEnabled  bool default false
  sheetId           text nullable
  lastToggledBy     text FK → user.id nullable
  lastToggledAt     timestamp nullable
}
```

### `event_landing`
```ts
event_landing {
  eventId           text PK FK → event.id
  body              json nullable           // rich-text content
  codePath          text nullable           // 'events/_custom/<slug>/landing' override
  published         bool default false
  lastToggledBy     text FK → user.id nullable
  lastToggledAt     timestamp nullable
}
```

### `event_page`
```ts
event_page {
  id              text PK
  eventId         text FK → event.id
  pageSlug        text
  title           text
  body            json nullable
  codePath        text nullable
  published       bool default false
  sortOrder       int default 0
  lastToggledBy   text FK → user.id nullable
  lastToggledAt   timestamp nullable
  unique(eventId, pageSlug)
}
```

### `event_role_grant`
```ts
event_role_grant {
  id          text PK
  eventId     text FK → event.id
  userId      text FK → user.id
  role        text  // 'overseer' | 'shop_admin' | 'tickets_admin' | 'content_admin'
  grantedBy   text FK → user.id
  grantedAt   timestamp
  unique(eventId, userId, role)
}
```

### Re-pointed existing tables (FK target change only)
- `event_product.eventId` → `event.id` (was `ShopEvent.id`)
- `event_category.eventId` → `event.id`
- `ticket.eventId` → `event.id` (was `TicketEvent.id`)
- `ticket_verifier.eventId` → `event.id`
- `shop_click.eventId` → `event.id`
- `shop_purchase.eventId` → `event.id`
- `order.eventId` → `event.id`

### Dropped
- `ShopEvent` → renamed to `event` (Step 1 migration keeps IDs identical)
- `TicketEvent` → merged into `event`
- `EventAdmin` → replaced by `event_role_grant` (role='overseer')
- `user.isShopAdmin`, `user.isEventsAdmin`, `user.isTicketsAdmin` columns

### Reserved slug list (rejected at creation by validator)
`shop, admin, api, about, calendar, publications, merch, resources, contact, redirects, ticket-verify, faq, home, bridges, sign-in, sign-out, _next, favicon.ico, robots.txt, sitemap.xml, _custom`

This list MUST stay in sync with top-level static routes. A pre-build script that scans `src/app/*/page.tsx` and emits the reserved list is the durable solution.

### Behavior rules

| Rule | Definition |
|---|---|
| `event_live` (computed on read) | `status='active' AND (startDate IS NULL OR now >= startDate) AND (endDate IS NULL OR now <= endDate)` |
| Module live | `event_live AND (event_shop.enabled OR event_tickets.enabled OR event_landing.published OR event_page.published)` per module |
| Slug rename | Writes a row to existing `Redirects` table mapping `<old-slug>` → `/<new-slug>`. Blocked if new slug reserved or taken. |
| Default `/shop` tab | Highest `event.priority` among `event_live AND event_shop.enabled=true`. Tie-break: earliest `startDate`. |
| Preview mode | Signed `?preview=<token>` OR authenticated user with any `event_role_grant` on this event. |
| Auto-grant on creation | User who creates an event is auto-granted `overseer` on that event. |

## 5. Routing

### Public routes (new)
| Route | Handler | Notes |
|---|---|---|
| `/<slug>` | `src/app/[eventSlug]/page.tsx` | Landing. 404 if unpublished. |
| `/<slug>/<pageSlug>` | `src/app/[eventSlug]/[pageSlug]/page.tsx` | Sub-page. Code > CMS > 404. |
| `/<slug>/tickets` | `src/app/[eventSlug]/tickets/page.tsx` | Public ticket info / buy link. |
| `/<slug>/tickets/verify` | `src/app/[eventSlug]/tickets/verify/page.tsx` | Verifier scan UI. |
| `/shop?event=<slug>` | unchanged | Existing event-tab behavior. |

### Code-page resolver

File layout for dev-deployed pages:
```
src/app/events/_custom/<event-slug>/
  landing/page.tsx         ← overrides /<slug>
  <page-slug>/page.tsx     ← overrides /<slug>/<page-slug>
  shop/page.tsx            ← optional override for shop tab
```

Resolution pseudocode in `[eventSlug]/page.tsx`:
```ts
const event = await db.query.event.findFirst({ where: eq(slug, params.eventSlug), with: { landing: true }});
if (!event || !isLive(event)) return notFound();

const manifest = await getCodePageManifest();   // build-time JSON
if (manifest[params.eventSlug]?.landing) {
  const Page = await dynamicImport(`events/_custom/${params.eventSlug}/landing`);
  return <Page event={event} />;
}
if (event.landing?.published && event.landing.body) {
  return <CmsRenderer body={event.landing.body} event={event} />;
}
return notFound();
```

**Code-page manifest** is generated at build time by a `prebuild` script (`scripts/generate-event-code-page-manifest.ts`) wired into `package.json`:

```jsonc
"scripts": {
  "build": "pnpm run gen:event-code-pages && next build",
  "gen:event-code-pages": "tsx scripts/generate-event-code-page-manifest.ts"
}
```

The script globs `src/app/events/_custom/**/page.tsx` and writes `src/lib/eventCodePages.generated.json`. The file is gitignored. Worker reads the JSON at runtime; no fs access needed. The same JSON is exposed via `/api/admin/event-code-pages` so admin editors can show "overridden by code" warnings.

### Middleware
Existing redirect middleware (`src/lib/middleware/redirectMiddleware.ts`) stays. Adds a pre-check: if the first path segment matches an `event.slug`, skip redirect lookup and fall through to Next routing. Event slugs win over short-URL codes on collision (validator should warn admin at slug creation).

## 6. Permissions

### Role enum
`overseer | shop_admin | tickets_admin | content_admin`

### Capabilities
| Role | Can do |
|---|---|
| `overseer` | Edit event row, all modules, manage role grants for this event |
| `shop_admin` | `event_shop` config, `event_product`, `event_category`, daily-stock overrides, orders for this event |
| `tickets_admin` | `event_tickets` config, ticket generation, verifier assignment |
| `content_admin` | `event_landing`, `event_page` (CMS + codePath settings) |

### Global flag treatment

| Global flag | After migration |
|---|---|
| `isShopAdmin` | **Dropped column**. Existing users get `overseer` grant on every active event. |
| `isEventsAdmin` | **Dropped column**. Same migration. |
| `isTicketsAdmin` | **Dropped column**. Existing users get `tickets_admin` grant on every active event. |
| `isSuperAdmin` | **Kept**. Implicit `overseer` on every event + can manage global flags. |
| `isRedirectsAdmin`, `isSSO26Admin`, `isBackupAdmin` | **Kept** — not event-scoped. |

### Resolver
Single function `getUserEventRoles(userId, eventId)` in `src/lib/eventPermissions.ts` returns the union of explicit `event_role_grant` rows + implicit grants from kept global flags. Every event-scoped server action starts with `requireEventRole(eventId, [...allowed])` which treats `overseer` as a super-allow.

## 7. Admin UI structure

### Sidebar groups
1. **ARSA Permanent** — Home, FAQ, About, Bridges, Contact, Banner (unchanged)
2. **Events** — one entry per event the user has any grant on, expandable to module sub-routes
3. **Tools** — Redirects, Email Logs, Settings (unchanged)

The sidebar's "Events" group is computed server-side in `src/app/admin/layout.tsx` from `getUserEventRoles()` results — only modules the user can access appear under each event.

### Event overview = mission control
`/admin/events/<slug>` is a card grid: SHOP / TICKETS / LANDING / PAGES with live/paused chip + count summaries + click-through. No tabs, no megafile.

### Cross-event admin views (for users with grants on multiple events)

Some operations are most naturally viewed as a union across events:
- **All orders** — `/admin/orders` survives, shows orders from every event the user has `shop_admin` or `overseer` on. Excel export retains existing cross-event format.
- **All products** — `/admin/products` survives similarly. Filters by event.
- **All packages** — `/admin/packages` survives similarly.

These cross-event views are filters over the same data the per-event views read; no separate tables. They appear in the sidebar's **Tools** group under "All Orders / All Products / All Packages" when the user has the relevant role on ≥2 events. Single-event users go straight to the per-event route.

### Route decomposition (replaces `events-management.tsx`)
```
src/app/admin/events/
├── page.tsx                        ← list/grid of all events
├── new/page.tsx                    ← create event
└── [eventSlug]/
    ├── page.tsx                    ← mission-control overview
    ├── settings/page.tsx           ← event row fields (name, dates, theme, SEO)
    ├── admins/page.tsx             ← event_role_grant management
    ├── landing/page.tsx            ← edit event_landing
    ├── pages/
    │   ├── page.tsx                ← list event_page
    │   └── [pageSlug]/page.tsx     ← edit one event_page
    ├── shop/
    │   ├── page.tsx                ← event_shop config
    │   ├── orders/page.tsx
    │   ├── products/page.tsx
    │   └── categories/page.tsx
    └── tickets/
        ├── page.tsx                ← event_tickets config + list
        ├── generate/page.tsx
        └── verifiers/page.tsx
```

Each `page.tsx` is single-purpose, can be a Server Component where possible, ≤ ~400 lines.

### Code-page discovery in admin
Admin editors for `event_landing` and `event_page` read the same code-page manifest the public router uses. When `codePath` exists, the editor shows a warning banner: "⚠ This page is overridden by code at `events/_custom/<slug>/<pageSlug>`. CMS edits will not be visible until the code page is removed."

### Visual treatment (deferred but constrained)
Same shadcn primitives, forced light mode, Lexend Deca. Mission-control cards use brand-palette status chips per DESIGN.md §7:
- LIVE → saffron pill on navy
- PAUSED → cream pill on navy
- DRAFT → cream pill on maroon

Full visual polish pass is a follow-up spec.

## 8. Migration plan

### Pre-deploy
1. `wrangler d1 export arsa-db --output backups/pre-event-umbrella-2026-05-27.sql`
2. Generate code-page manifest locally and commit with PR.
3. 30-min admin maintenance window banner ("Admin temporarily read-only"). Public site stays up.

### Step 1 — Add new tables (no destructive ops)
`CREATE TABLE event, event_shop, event_tickets, event_landing, event_page, event_role_grant`. Empty.

### Step 2 — Backfill `event` from `ShopEvent` + `TicketEvent`
- Every `ShopEvent` row → `event` + `event_shop` (enabled=1, copy checkoutFields/config). IDs preserved so existing FKs remain valid.
- Every `TicketEvent` row → if a slug-matched `event` exists, merge by creating `event_tickets` against that event's ID. Else create new `event` + `event_tickets`.

### Step 3 — Manual audit
A temporary `/admin/super/migration-audit` page lists backfilled events, flags merge candidates and slug collisions, and lets superAdmin rename/merge before proceeding to Step 4.

### Step 4 — Re-point FK columns
- `event_product`, `event_category`: no change needed (IDs preserved).
- `ticket`, `ticket_verifier`: for rows whose `TicketEvent` was merged into an existing event, update `eventId` to the umbrella event's ID.
- `shop_click`, `shop_purchase`, `order`: no change needed (IDs preserved).

### Step 5 — Backfill role grants
- `isShopAdmin OR isEventsAdmin` → `overseer` grants on every active event
- `isTicketsAdmin` → `tickets_admin` grants on every active event
- Existing `EventAdmin` rows → `overseer` grants

### Step 6 — Drop legacy (waits 48h after PR 4)
- `DROP TABLE ShopEvent, TicketEvent, EventAdmin`
- `ALTER TABLE user DROP COLUMN isShopAdmin, isEventsAdmin, isTicketsAdmin`

## 9. Cutover & rollout

### PR sequence
1. **PR 1 — Schema + Steps 1+2 migration.** No code path change in production. Tables exist, `event` backfilled, old tables intact. Old code still reads `ShopEvent`. **Drizzle note:** during transition (PRs 1–4), `src/db/schema.ts` defines BOTH the new `event*` tables AND the old `shopEvent`, `ticketEvent`, `eventAdmin` tables. Both are exported. Code reads whichever it needs. Removed in PR 5.
2. **Manual audit gate** via temporary `/admin/super/migration-audit`. SuperAdmin approves before PR 2.
3. **PR 2 — Steps 4+5 (FK re-points + role grants).** Dual-read code: server actions check `event` first, fall back to `ShopEvent`. Both schemas live.
4. **PR 3 — Admin UI route restructure.** New `/admin/events/[eventSlug]/...` routes go live alongside legacy. Legacy routes redirect to new paths. New sidebar shipped. Old `events-management.tsx` deleted.
5. **PR 4 — Public routing.** `[eventSlug]/page.tsx` catchall, code-page resolver, reserved-slug enforcement, `/<slug>/tickets` route.
6. **PR 5 — Drop legacy (Step 6 SQL).** Only after PR 4 has been stable in prod for ≥48 hours.

### Rollback
- **PR 1–2:** revert deploy; tables exist but unused. No data loss.
- **PR 3–4:** revert deploy; new routes 404 but data is migrated. Old code paths still work since legacy isn't dropped yet.
- **PR 5:** restore from Step-1 backup. This is why PR 5 waits 48h.

### No feature flags
Single-tenant admin tool with a small user base. Adding flags doubles code paths for no observable benefit. The PR sequence is the rollout gate.

## 10. Out of scope (defer to follow-up specs)

- Full visual polish of admin pages against DESIGN.md (separate spec)
- `/events` public index page (one route, can be added post-migration)
- Event cloning / duplicate-from-previous-year
- Role-grant email notifications
- Custom domains per event
- Per-event email branding
- Ticket-scan analytics consolidation

## 11. Open questions

None blocking. Recorded clarifications during brainstorm:
- `isShopAdmin` mapping → **sunset, migrate to grants** (confirmed)
- Date semantics → **computed-on-read live gate** (confirmed)
- URL shape → **top-level `/<slug>` with `/shop` canonical** (confirmed)
- Page sources → **code-precedence + CMS-fallback** (confirmed)

## 12. References

- Current schema: [src/db/schema.ts](../../../src/db/schema.ts)
- Current admin layout: [src/app/admin/layout.tsx](../../../src/app/admin/layout.tsx)
- Current event editor (4387 lines): [src/app/admin/events/events-management.tsx](../../../src/app/admin/events/events-management.tsx)
- Brand spec: [DESIGN.md](../../../DESIGN.md)
- Project context: [CLAUDE.md](../../../CLAUDE.md)
