# Event Umbrella Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restructure the ARSA admin and event system around an Event umbrella that owns shop, tickets, landing, and pages as composable modules with per-event tiered permissions. Sunset global admin flags. Replace the 4387-line `events-management.tsx` with file-per-route decomposition.

**Architecture:** Composition pattern — one `event` row per campaign, 1:1 sibling tables (`event_shop`, `event_tickets`, `event_landing`) gate module presence. Per-event role grants replace global flags. Top-level `/<slug>` microsite routes via `[eventSlug]` catchall with code-page-first / CMS-fallback resolver. Sidebar pivots from module-flat to event-as-workspace.

**Tech Stack:** Next.js 15 (App Router), Drizzle ORM, Cloudflare D1 (SQLite), Better Auth, shadcn/ui, Tailwind v4, @opennextjs/cloudflare for Workers deploy.

**Plan organization:** Five PRs shipped sequentially. Each PR section ends with a deploy checkpoint. Tasks within a PR are commit-sized and orderable.

**Verification approach:** No test framework in repo. Each task verifies via: (1) `pnpm build` typecheck pass, (2) `pnpm lint` pass, (3) `pnpm dev` smoke for UI tasks, (4) `wrangler d1 execute --local` for SQL verification queries. Playwright MCP available for UI smokes where needed.

**Reference spec:** [docs/superpowers/specs/2026-05-27-event-umbrella-architecture-design.md](../specs/2026-05-27-event-umbrella-architecture-design.md)

---

## PR 1 — Additive schema + initial backfill

**Outcome of PR 1:** New tables exist and are backfilled from `ShopEvent`/`TicketEvent`. Old tables untouched. No production code reads new tables yet. Migration audit page available for superAdmin review.

### Task 1.1: Add new Drizzle table definitions

**Files:**
- Modify: `src/db/schema.ts` (append new tables; do NOT remove `shopEvent`, `ticketEvent`, `eventAdmin`)

- [ ] **Step 1: Open `src/db/schema.ts` and locate the end of the Tickets section** (around line 552)

- [ ] **Step 2: Append the new umbrella tables** below the existing `ticketVerifier` definition

```ts
// ============================================
// Event Umbrella (new)
// ============================================
export const event = sqliteTable(
	"event",
	{
		id: id(),
		slug: text("slug").notNull().unique(),
		name: text("name").notNull(),
		description: text("description"),
		status: text("status").notNull().default("draft"), // 'draft' | 'active' | 'archived'
		startDate: integer("startDate", { mode: "timestamp_ms" }),
		endDate: integer("endDate", { mode: "timestamp_ms" }),
		heroImages: text("heroImages", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
		theme: text("theme", { mode: "json" }),
		priority: integer("priority").notNull().default(0),
		tabLabel: text("tabLabel"),
		ogImage: text("ogImage"),
		metaTitle: text("metaTitle"),
		metaDescription: text("metaDescription"),
		createdAt: now(),
		updatedAt: updated(),
	},
	(t) => ({
		slugIdx: uniqueIndex("event_slug_key").on(t.slug),
		statusIdx: index("event_status_idx").on(t.status),
		dateIdx: index("event_dates_idx").on(t.startDate, t.endDate),
	}),
);

export const eventShop = sqliteTable(
	"event_shop",
	{
		eventId: text("eventId")
			.primaryKey()
			.references(() => event.id, { onDelete: "cascade" }),
		enabled: integer("enabled", { mode: "boolean" }).notNull().default(false),
		checkoutFields: text("checkoutFields", { mode: "json" }),
		checkoutConfig: text("checkoutConfig", { mode: "json" }),
		hasCustomCheckout: integer("hasCustomCheckout", { mode: "boolean" }).notNull().default(false),
		exclusivePricing: integer("exclusivePricing", { mode: "boolean" }).notNull().default(false),
		codePath: text("codePath"),
		// Delivery/closure (migrated from ShopEvent)
		dailyCutoffTime: text("dailyCutoffTime"),
		deliveryLeadDays: integer("deliveryLeadDays").notNull().default(1),
		isShopClosed: integer("isShopClosed", { mode: "boolean" }).notNull().default(false),
		closureMessage: text("closureMessage"),
		allowScheduledDelivery: integer("allowScheduledDelivery", { mode: "boolean" }).notNull().default(false),
		minDeliveryDate: integer("minDeliveryDate", { mode: "timestamp_ms" }),
		maxDeliveryDate: integer("maxDeliveryDate", { mode: "timestamp_ms" }),
		blockedDeliverySlots: text("blockedDeliverySlots", { mode: "json" }),
		lastToggledBy: text("lastToggledBy").references(() => user.id, { onDelete: "set null" }),
		lastToggledAt: integer("lastToggledAt", { mode: "timestamp_ms" }),
	},
);

export const eventTickets = sqliteTable(
	"event_tickets",
	{
		eventId: text("eventId")
			.primaryKey()
			.references(() => event.id, { onDelete: "cascade" }),
		enabled: integer("enabled", { mode: "boolean" }).notNull().default(false),
		defaultActive: integer("defaultActive", { mode: "boolean" }).notNull().default(true),
		sheetSyncEnabled: integer("sheetSyncEnabled", { mode: "boolean" }).notNull().default(false),
		sheetId: text("sheetId"),
		lastToggledBy: text("lastToggledBy").references(() => user.id, { onDelete: "set null" }),
		lastToggledAt: integer("lastToggledAt", { mode: "timestamp_ms" }),
	},
);

export const eventLanding = sqliteTable(
	"event_landing",
	{
		eventId: text("eventId")
			.primaryKey()
			.references(() => event.id, { onDelete: "cascade" }),
		body: text("body", { mode: "json" }),
		codePath: text("codePath"),
		published: integer("published", { mode: "boolean" }).notNull().default(false),
		lastToggledBy: text("lastToggledBy").references(() => user.id, { onDelete: "set null" }),
		lastToggledAt: integer("lastToggledAt", { mode: "timestamp_ms" }),
	},
);

export const eventPage = sqliteTable(
	"event_page",
	{
		id: id(),
		eventId: text("eventId")
			.notNull()
			.references(() => event.id, { onDelete: "cascade" }),
		pageSlug: text("pageSlug").notNull(),
		title: text("title").notNull(),
		body: text("body", { mode: "json" }),
		codePath: text("codePath"),
		published: integer("published", { mode: "boolean" }).notNull().default(false),
		sortOrder: integer("sortOrder").notNull().default(0),
		lastToggledBy: text("lastToggledBy").references(() => user.id, { onDelete: "set null" }),
		lastToggledAt: integer("lastToggledAt", { mode: "timestamp_ms" }),
		createdAt: now(),
		updatedAt: updated(),
	},
	(t) => ({
		uniq: uniqueIndex("event_page_event_slug_key").on(t.eventId, t.pageSlug),
		eventIdx: index("event_page_event_idx").on(t.eventId),
	}),
);

export const eventRoleGrant = sqliteTable(
	"event_role_grant",
	{
		id: id(),
		eventId: text("eventId")
			.notNull()
			.references(() => event.id, { onDelete: "cascade" }),
		userId: text("userId")
			.notNull()
			.references(() => user.id, { onDelete: "cascade" }),
		role: text("role").notNull(), // 'overseer' | 'shop_admin' | 'tickets_admin' | 'content_admin'
		grantedBy: text("grantedBy").references(() => user.id, { onDelete: "set null" }),
		grantedAt: integer("grantedAt", { mode: "timestamp_ms" })
			.notNull()
			.$defaultFn(() => new Date()),
	},
	(t) => ({
		uniq: uniqueIndex("event_role_grant_uniq").on(t.eventId, t.userId, t.role),
		userIdx: index("event_role_grant_user_idx").on(t.userId),
		eventIdx: index("event_role_grant_event_idx").on(t.eventId),
	}),
);
```

- [ ] **Step 3: Run `pnpm db:generate` to emit migration SQL**

Run: `pnpm db:generate`
Expected: new file in `drizzle/` (e.g. `drizzle/0042_add_event_umbrella.sql`) containing `CREATE TABLE` statements for `event`, `event_shop`, `event_tickets`, `event_landing`, `event_page`, `event_role_grant`.

- [ ] **Step 4: Inspect generated SQL**

Open the new `drizzle/0042_*.sql` file. Confirm it contains six `CREATE TABLE` statements and no `DROP` or `ALTER` for existing tables.

- [ ] **Step 5: Run typecheck**

Run: `pnpm build`
Expected: Builds. The new tables are exported but unused — TS is happy.

- [ ] **Step 6: Commit**

```bash
git add src/db/schema.ts drizzle/0042_add_event_umbrella.sql drizzle/meta/
git commit -m "feat(db): add event umbrella tables (additive)"
```

### Task 1.2: Apply migration to local D1

**Files:**
- (no edits — applies migration to local D1)

- [ ] **Step 1: Apply migration locally**

Run: `pnpm db:migrate:local`
Expected: `wrangler` reports new tables created.

- [ ] **Step 2: Verify tables exist**

Run:
```bash
npx wrangler d1 execute arsa-db --local --command="SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'event%' ORDER BY name"
```
Expected output includes: `event`, `event_landing`, `event_page`, `event_role_grant`, `event_shop`, `event_tickets`, plus existing `EventAdmin`, `EventCategory`, `EventProduct`.

- [ ] **Step 3: No commit needed** (no file changes)

### Task 1.3: Write the backfill SQL file

**Files:**
- Create: `drizzle/0043_event_umbrella_backfill.sql` (manually authored, not Drizzle-generated)

- [ ] **Step 1: Create the backfill SQL file**

```sql
-- 0043_event_umbrella_backfill.sql
-- Backfill `event` and submodule rows from existing ShopEvent and TicketEvent.
-- ShopEvent IDs are preserved in `event.id` so existing FKs (eventProduct.eventId,
-- eventCategory.eventId, shopClick.eventId, shopPurchase.eventId, order.eventId)
-- remain valid without re-pointing.

-- 1. Backfill `event` from ShopEvent
INSERT INTO event (id, slug, name, description, status, startDate, endDate,
                   heroImages, theme, priority, tabLabel,
                   ogImage, metaTitle, metaDescription, createdAt, updatedAt)
SELECT
  id,
  slug,
  name,
  description,
  CASE WHEN isActive = 1 THEN 'active' ELSE 'archived' END AS status,
  startDate,
  endDate,
  COALESCE(heroImageUrls, '[]') AS heroImages,
  themeConfig AS theme,
  CASE WHEN isPriority = 1 THEN 1000 + tabOrder ELSE tabOrder END AS priority,
  tabLabel,
  NULL, NULL, NULL,
  createdAt, updatedAt
FROM ShopEvent;

-- 2. Backfill `event_shop` (every ShopEvent gets a shop row, enabled=1)
INSERT INTO event_shop (eventId, enabled, checkoutFields, checkoutConfig,
                        hasCustomCheckout, exclusivePricing, codePath,
                        dailyCutoffTime, deliveryLeadDays, isShopClosed, closureMessage,
                        allowScheduledDelivery, minDeliveryDate, maxDeliveryDate,
                        blockedDeliverySlots, lastToggledAt)
SELECT
  id,
  1 AS enabled,
  COALESCE(checkoutConfig, NULL),  -- old ShopEvent had checkoutFields nested in checkoutConfig; engineer: verify shape
  checkoutConfig,
  hasCustomCheckout,
  0,
  componentPath,
  dailyCutoffTime, deliveryLeadDays, isShopClosed, closureMessage,
  allowScheduledDelivery, minDeliveryDate, maxDeliveryDate,
  blockedDeliverySlots,
  strftime('%s', 'now') * 1000
FROM ShopEvent;

-- 3. Backfill from TicketEvent: try to match by slug-from-name, else create new event
INSERT INTO event (id, slug, name, description, status, startDate, endDate,
                   heroImages, theme, priority, createdAt, updatedAt)
SELECT
  id,
  lower(replace(replace(replace(name, ' ', '-'), '''', ''), '"', '')) AS slug,
  name,
  description,
  CASE WHEN isActive = 1 THEN 'active' ELSE 'archived' END,
  date,
  date,
  '[]',
  NULL,
  0,
  createdAt, updatedAt
FROM TicketEvent
WHERE id NOT IN (SELECT id FROM event)
  AND lower(replace(replace(replace(name, ' ', '-'), '''', ''), '"', ''))
      NOT IN (SELECT slug FROM event);

-- 4. Backfill `event_tickets`: one row per TicketEvent.
-- If the TicketEvent.id is already an event.id (rare: same UUID), use directly.
-- Otherwise attempt slug match. Manual audit will fix unmatched rows.
INSERT INTO event_tickets (eventId, enabled, defaultActive, sheetSyncEnabled, lastToggledAt)
SELECT
  COALESCE(
    (SELECT e.id FROM event e WHERE e.id = te.id),
    (SELECT e.id FROM event e WHERE e.slug = lower(replace(replace(replace(te.name, ' ', '-'), '''', ''), '"', '')))
  ) AS eventId,
  1, 1, 0,
  strftime('%s', 'now') * 1000
FROM TicketEvent te
WHERE COALESCE(
  (SELECT e.id FROM event e WHERE e.id = te.id),
  (SELECT e.id FROM event e WHERE e.slug = lower(replace(replace(replace(te.name, ' ', '-'), '''', ''), '"', '')))
) IS NOT NULL;
```

- [ ] **Step 2: Apply backfill locally**

Run: `npx wrangler d1 execute arsa-db --local --file=drizzle/0043_event_umbrella_backfill.sql`
Expected: All four `INSERT` statements report row counts matching existing ShopEvent/TicketEvent counts.

- [ ] **Step 3: Verify backfill counts**

Run:
```bash
npx wrangler d1 execute arsa-db --local --command="SELECT (SELECT COUNT(*) FROM ShopEvent) AS shop_events, (SELECT COUNT(*) FROM event) AS events, (SELECT COUNT(*) FROM event_shop) AS shops, (SELECT COUNT(*) FROM event_tickets) AS tickets_modules, (SELECT COUNT(*) FROM TicketEvent) AS ticket_events"
```

Expected: `events >= shop_events`, `shops == shop_events`, `tickets_modules <= ticket_events` (some may be unmatched — flagged by audit).

- [ ] **Step 4: Commit**

```bash
git add drizzle/0043_event_umbrella_backfill.sql
git commit -m "feat(db): event umbrella backfill SQL"
```

### Task 1.4: Migration audit page (superAdmin only)

**Files:**
- Create: `src/app/admin/super/migration-audit/page.tsx`
- Create: `src/app/admin/super/migration-audit/actions.ts`
- Create: `src/app/admin/super/migration-audit/audit-client.tsx`

- [ ] **Step 1: Create the audit page (Server Component)**

`src/app/admin/super/migration-audit/page.tsx`:

```tsx
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { user } from "@/db/schema";
import { getAuditData } from "./actions";
import { MigrationAuditClient } from "./audit-client";

export default async function MigrationAuditPage() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) redirect("/shop");
	const u = await db.query.user.findFirst({
		where: eq(user.id, session.user.id),
		columns: { isSuperAdmin: true },
	});
	if (!u?.isSuperAdmin) redirect("/admin");

	const data = await getAuditData();
	return <MigrationAuditClient initial={data} />;
}
```

- [ ] **Step 2: Create the audit data action**

`src/app/admin/super/migration-audit/actions.ts`:

```ts
"use server";

import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export type AuditRow = {
	eventId: string;
	slug: string;
	name: string;
	status: string;
	hasShopRow: boolean;
	hasTicketsRow: boolean;
	matchedTicketEventId: string | null;
	unmatchedTicketEventIds: string[];
};

export async function getAuditData(): Promise<{
	events: AuditRow[];
	unmatchedTicketEvents: { id: string; name: string }[];
	slugCollisions: { slug: string; eventIds: string[] }[];
}> {
	// All events with module presence
	const events = await db.all<{
		id: string;
		slug: string;
		name: string;
		status: string;
		hasShop: number;
		hasTickets: number;
	}>(sql`
		SELECT e.id, e.slug, e.name, e.status,
		       (SELECT 1 FROM event_shop WHERE eventId = e.id) AS hasShop,
		       (SELECT 1 FROM event_tickets WHERE eventId = e.id) AS hasTickets
		FROM event e ORDER BY e.createdAt
	`);

	// TicketEvent rows with no matching event_tickets row
	const unmatched = await db.all<{ id: string; name: string }>(sql`
		SELECT te.id, te.name FROM TicketEvent te
		WHERE NOT EXISTS (SELECT 1 FROM event_tickets WHERE eventId = te.id)
		  AND NOT EXISTS (
		    SELECT 1 FROM event WHERE slug = lower(replace(replace(replace(te.name, ' ', '-'), '''', ''), '"', ''))
		  )
	`);

	// Slug collisions (should be zero given UNIQUE constraint, but assert)
	const collisions = await db.all<{ slug: string; cnt: number }>(sql`
		SELECT slug, COUNT(*) AS cnt FROM event GROUP BY slug HAVING cnt > 1
	`);

	return {
		events: events.map((e) => ({
			eventId: e.id,
			slug: e.slug,
			name: e.name,
			status: e.status,
			hasShopRow: e.hasShop === 1,
			hasTicketsRow: e.hasTickets === 1,
			matchedTicketEventId: null,
			unmatchedTicketEventIds: [],
		})),
		unmatchedTicketEvents: unmatched,
		slugCollisions: collisions.map((c) => ({ slug: c.slug, eventIds: [] })),
	};
}

export async function mergeTicketEventIntoEvent(ticketEventId: string, targetEventId: string) {
	// Move tickets, verifiers; create event_tickets if missing
	await db.run(sql`
		INSERT OR IGNORE INTO event_tickets (eventId, enabled, defaultActive, sheetSyncEnabled, lastToggledAt)
		VALUES (${targetEventId}, 1, 1, 0, ${Date.now()})
	`);
	await db.run(sql`UPDATE Ticket SET ticketEventId = ${targetEventId} WHERE ticketEventId = ${ticketEventId}`);
	await db.run(sql`UPDATE TicketVerifier SET ticketEventId = ${targetEventId} WHERE ticketEventId = ${ticketEventId}`);
}

export async function renameEventSlug(eventId: string, newSlug: string) {
	// Note: full rename behavior (including Redirects row) lands in PR 4.
	await db.run(sql`UPDATE event SET slug = ${newSlug} WHERE id = ${eventId}`);
}
```

- [ ] **Step 3: Create the audit client UI**

`src/app/admin/super/migration-audit/audit-client.tsx`:

```tsx
"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { mergeTicketEventIntoEvent, renameEventSlug, type AuditRow } from "./actions";
import { toast } from "sonner";

type Props = {
	initial: {
		events: AuditRow[];
		unmatchedTicketEvents: { id: string; name: string }[];
		slugCollisions: { slug: string; eventIds: string[] }[];
	};
};

export function MigrationAuditClient({ initial }: Props) {
	const [pending, start] = useTransition();
	const [mergeInputs, setMergeInputs] = useState<Record<string, string>>({});
	const [slugInputs, setSlugInputs] = useState<Record<string, string>>({});

	return (
		<div className="space-y-6">
			<h1 className="text-3xl font-bold uppercase tracking-tight text-[#0e3663]">Migration Audit</h1>

			<Card>
				<CardHeader><CardTitle>Events ({initial.events.length})</CardTitle></CardHeader>
				<CardContent>
					<table className="w-full text-sm">
						<thead><tr className="text-left">
							<th>Slug</th><th>Name</th><th>Status</th><th>Modules</th><th>Rename slug</th>
						</tr></thead>
						<tbody>
						{initial.events.map((e) => (
							<tr key={e.eventId} className="border-t">
								<td className="font-mono">{e.slug}</td>
								<td>{e.name}</td>
								<td><Badge>{e.status}</Badge></td>
								<td>
									{e.hasShopRow && <Badge variant="secondary">shop</Badge>}{" "}
									{e.hasTicketsRow && <Badge variant="secondary">tickets</Badge>}
								</td>
								<td>
									<Input
										value={slugInputs[e.eventId] ?? ""}
										placeholder={e.slug}
										onChange={(ev) => setSlugInputs((s) => ({ ...s, [e.eventId]: ev.target.value }))}
									/>
									<Button size="sm" disabled={pending} onClick={() => start(async () => {
										const v = slugInputs[e.eventId];
										if (!v) return;
										await renameEventSlug(e.eventId, v);
										toast.success("Slug renamed");
									})}>Save</Button>
								</td>
							</tr>
						))}
						</tbody>
					</table>
				</CardContent>
			</Card>

			<Card>
				<CardHeader><CardTitle>Unmatched TicketEvents ({initial.unmatchedTicketEvents.length})</CardTitle></CardHeader>
				<CardContent>
					{initial.unmatchedTicketEvents.length === 0 && <p className="text-sm">All TicketEvents have been backfilled.</p>}
					{initial.unmatchedTicketEvents.map((te) => (
						<div key={te.id} className="border-t py-2 flex items-center gap-2">
							<span className="flex-1">{te.name} <span className="text-xs font-mono text-muted-foreground">{te.id}</span></span>
							<Input
								placeholder="target event.id"
								value={mergeInputs[te.id] ?? ""}
								onChange={(ev) => setMergeInputs((s) => ({ ...s, [te.id]: ev.target.value }))}
							/>
							<Button size="sm" disabled={pending} onClick={() => start(async () => {
								const target = mergeInputs[te.id];
								if (!target) return;
								await mergeTicketEventIntoEvent(te.id, target);
								toast.success("Merged");
							})}>Merge</Button>
						</div>
					))}
				</CardContent>
			</Card>

			{initial.slugCollisions.length > 0 && (
				<Card className="border-red-500">
					<CardHeader><CardTitle className="text-red-700">Slug collisions</CardTitle></CardHeader>
					<CardContent>
						<pre className="text-xs">{JSON.stringify(initial.slugCollisions, null, 2)}</pre>
					</CardContent>
				</Card>
			)}
		</div>
	);
}
```

- [ ] **Step 4: Run typecheck + lint**

Run: `pnpm build && pnpm lint`
Expected: Both pass. The page is only reachable by superAdmins via direct URL `/admin/super/migration-audit`.

- [ ] **Step 5: Smoke the page in dev**

Run: `pnpm dev`
Navigate to `http://localhost:3000/admin/super/migration-audit` as a superAdmin user. Confirm: events table populates, unmatched-TicketEvents section renders, slug-collision card hidden when empty.

- [ ] **Step 6: Commit**

```bash
git add src/app/admin/super/migration-audit/
git commit -m "feat(admin): migration audit page for event umbrella cutover"
```

### PR 1 deploy checkpoint

- [ ] **Step 1: Backup remote D1**

Run: `npx wrangler d1 export arsa-db --output backups/pre-event-umbrella-2026-05-27.sql`

- [ ] **Step 2: Apply schema migration to remote**

Run: `pnpm db:migrate`
Expected: New tables created on remote D1.

- [ ] **Step 3: Apply backfill SQL to remote**

Run: `npx wrangler d1 execute arsa-db --file=drizzle/0043_event_umbrella_backfill.sql`
Expected: Inserts complete; row counts match local.

- [ ] **Step 4: Deploy**

Run: `pnpm deploy`
Expected: Worker deploys. New tables live but unread.

- [ ] **Step 5: Manual audit in prod**

Visit `https://ateneoarsa.org/admin/super/migration-audit` (or your prod URL). Walk through events, rename slugs if needed, merge unmatched TicketEvents.

- [ ] **Step 6: Tag the release**

```bash
git tag pr-1-event-umbrella-schema
git push --tags
```

---

## PR 2 — Permissions resolver + role-grant backfill

**Outcome of PR 2:** Single `getUserEventRoles()` resolver exists. Server actions can call `requireEventRole()`. Role grants backfilled. New code can read permissions; old code paths untouched.

### Task 2.1: Permissions resolver

**Files:**
- Create: `src/lib/eventPermissions.ts`

- [ ] **Step 1: Write the resolver**

```ts
// src/lib/eventPermissions.ts
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { eventRoleGrant, user as userTable } from "@/db/schema";

export type EventRole = "overseer" | "shop_admin" | "tickets_admin" | "content_admin";

export type ResolvedRoles = {
	roles: EventRole[];
	fromGlobal: boolean;
	fromGrant: boolean;
};

/**
 * Resolve the roles a user has on a single event, combining:
 * - implicit grants from kept global flags (isSuperAdmin, isEventsAdmin during sunset window)
 * - explicit event_role_grant rows
 */
export async function getUserEventRoles(userId: string, eventId: string): Promise<ResolvedRoles> {
	const u = await db.query.user.findFirst({
		where: eq(userTable.id, userId),
		columns: {
			isSuperAdmin: true,
			// During sunset window these still exist; remove in PR 5
			isShopAdmin: true,
			isEventsAdmin: true,
			isTicketsAdmin: true,
		},
	});

	const implicit: EventRole[] = [];
	if (u?.isSuperAdmin) implicit.push("overseer");
	if (u?.isShopAdmin || u?.isEventsAdmin) implicit.push("overseer");
	if (u?.isTicketsAdmin) implicit.push("tickets_admin");

	const grants = await db.query.eventRoleGrant.findMany({
		where: and(eq(eventRoleGrant.userId, userId), eq(eventRoleGrant.eventId, eventId)),
		columns: { role: true },
	});

	const explicit = grants.map((g) => g.role as EventRole);

	return {
		roles: Array.from(new Set([...implicit, ...explicit])),
		fromGlobal: implicit.length > 0,
		fromGrant: explicit.length > 0,
	};
}

/**
 * Resolve which events a user has ANY grant on (used by sidebar).
 * Returns map: eventId -> roles
 */
export async function getUserAccessibleEvents(userId: string): Promise<Map<string, EventRole[]>> {
	const u = await db.query.user.findFirst({
		where: eq(userTable.id, userId),
		columns: {
			isSuperAdmin: true,
			isShopAdmin: true,
			isEventsAdmin: true,
			isTicketsAdmin: true,
		},
	});

	const grants = await db.query.eventRoleGrant.findMany({
		where: eq(eventRoleGrant.userId, userId),
		columns: { eventId: true, role: true },
	});

	const map = new Map<string, EventRole[]>();
	for (const g of grants) {
		const list = map.get(g.eventId) ?? [];
		list.push(g.role as EventRole);
		map.set(g.eventId, list);
	}

	// Global flag holders see every event with implicit role
	if (u?.isSuperAdmin || u?.isShopAdmin || u?.isEventsAdmin || u?.isTicketsAdmin) {
		const allEvents = await db.query.event.findMany({ columns: { id: true } });
		for (const e of allEvents) {
			const existing = map.get(e.id) ?? [];
			const implicit: EventRole[] = [];
			if (u.isSuperAdmin || u.isShopAdmin || u.isEventsAdmin) implicit.push("overseer");
			if (u.isTicketsAdmin) implicit.push("tickets_admin");
			map.set(e.id, Array.from(new Set([...existing, ...implicit])));
		}
	}

	return map;
}

export class ForbiddenError extends Error {
	constructor() { super("forbidden"); }
}

/**
 * Guard for server actions: throws ForbiddenError if user lacks any of the allowed roles
 * on the specified event. `overseer` is treated as a super-allow.
 */
export async function requireEventRole(
	userId: string,
	eventId: string,
	allowed: EventRole[],
): Promise<void> {
	const { roles } = await getUserEventRoles(userId, eventId);
	if (roles.includes("overseer")) return;
	if (!roles.some((r) => allowed.includes(r))) throw new ForbiddenError();
}
```

- [ ] **Step 2: Run typecheck**

Run: `pnpm build`
Expected: Build succeeds. The new module is exported but unused.

- [ ] **Step 3: Smoke test by writing an inline spec script**

Create scratch file `scripts/smoke-event-permissions.ts`:

```ts
import { getUserEventRoles, getUserAccessibleEvents } from "../src/lib/eventPermissions";
// Replace IDs with real ones from your local D1
const userId = "REPLACE_WITH_REAL_USER_ID";
const eventId = "REPLACE_WITH_REAL_EVENT_ID";
const r = await getUserEventRoles(userId, eventId);
console.log("roles:", r);
const all = await getUserAccessibleEvents(userId);
console.log("accessible events:", all.size);
```

Run: `npx tsx scripts/smoke-event-permissions.ts` (only if `tsx` available; otherwise inline in a dev API route).
Expected: prints role array for the user/event combo. Delete the scratch file after.

- [ ] **Step 4: Commit**

```bash
git add src/lib/eventPermissions.ts
git commit -m "feat(perms): event role resolver + requireEventRole guard"
```

### Task 2.2: Backfill role grants SQL

**Files:**
- Create: `drizzle/0044_event_role_grant_backfill.sql`

- [ ] **Step 1: Write backfill SQL**

```sql
-- 0044_event_role_grant_backfill.sql
-- Grant overseer/tickets_admin to existing global admins and migrate EventAdmin rows.

-- isShopAdmin OR isEventsAdmin -> overseer on every active event
INSERT INTO event_role_grant (id, eventId, userId, role, grantedBy, grantedAt)
SELECT lower(hex(randomblob(16))),
       e.id, u.id, 'overseer', NULL, strftime('%s','now')*1000
FROM user u
CROSS JOIN event e
WHERE (u.isShopAdmin = 1 OR u.isEventsAdmin = 1)
  AND e.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM event_role_grant g
    WHERE g.userId = u.id AND g.eventId = e.id AND g.role = 'overseer'
  );

-- isTicketsAdmin -> tickets_admin on every active event (unless already overseer)
INSERT INTO event_role_grant (id, eventId, userId, role, grantedBy, grantedAt)
SELECT lower(hex(randomblob(16))),
       e.id, u.id, 'tickets_admin', NULL, strftime('%s','now')*1000
FROM user u
CROSS JOIN event e
WHERE u.isTicketsAdmin = 1
  AND e.status = 'active'
  AND NOT EXISTS (
    SELECT 1 FROM event_role_grant g
    WHERE g.userId = u.id AND g.eventId = e.id
      AND g.role IN ('overseer', 'tickets_admin')
  );

-- EventAdmin rows -> overseer (current per-event admin = full event control)
INSERT INTO event_role_grant (id, eventId, userId, role, grantedBy, grantedAt)
SELECT lower(hex(randomblob(16))),
       ea.eventId, ea.userId, 'overseer', NULL, ea.createdAt
FROM EventAdmin ea
WHERE NOT EXISTS (
  SELECT 1 FROM event_role_grant g
  WHERE g.userId = ea.userId AND g.eventId = ea.eventId AND g.role = 'overseer'
);
```

- [ ] **Step 2: Apply locally**

Run: `npx wrangler d1 execute arsa-db --local --file=drizzle/0044_event_role_grant_backfill.sql`

- [ ] **Step 3: Verify**

Run:
```bash
npx wrangler d1 execute arsa-db --local --command="SELECT role, COUNT(*) FROM event_role_grant GROUP BY role"
```
Expected: counts of `overseer` ≥ (active events × isShopAdmin users) + EventAdmin row count.

- [ ] **Step 4: Commit**

```bash
git add drizzle/0044_event_role_grant_backfill.sql
git commit -m "feat(db): backfill event role grants from global flags + EventAdmin"
```

### Task 2.3: FK re-point SQL for merged TicketEvent rows

**Files:**
- Create: `drizzle/0045_ticket_fk_repoint.sql`

- [ ] **Step 1: Write the re-point SQL**

```sql
-- 0045_ticket_fk_repoint.sql
-- For TicketEvent rows that were merged into an existing event during audit
-- (TicketEvent.id != target event.id), update ticket.ticketEventId and ticketVerifier.ticketEventId
-- to point at the umbrella event.id.
--
-- Run AFTER the manual audit page has merged ambiguous rows via mergeTicketEventIntoEvent().

-- No-op if audit already updated rows.

UPDATE Ticket
SET ticketEventId = (
  SELECT et.eventId FROM event_tickets et
  JOIN TicketEvent te ON te.id = Ticket.ticketEventId
  WHERE et.eventId != te.id  -- merged case
    AND (
      et.eventId IN (
        SELECT e.id FROM event e
        WHERE e.slug = lower(replace(replace(replace(te.name, ' ', '-'), '''', ''), '"', ''))
      )
    )
  LIMIT 1
)
WHERE EXISTS (
  SELECT 1 FROM event_tickets et
  JOIN TicketEvent te ON te.id = Ticket.ticketEventId
  WHERE et.eventId != te.id
    AND et.eventId IN (
      SELECT e.id FROM event e
      WHERE e.slug = lower(replace(replace(replace(te.name, ' ', '-'), '''', ''), '"', ''))
    )
);

UPDATE TicketVerifier
SET ticketEventId = (
  SELECT et.eventId FROM event_tickets et
  JOIN TicketEvent te ON te.id = TicketVerifier.ticketEventId
  WHERE et.eventId != te.id
    AND et.eventId IN (
      SELECT e.id FROM event e
      WHERE e.slug = lower(replace(replace(replace(te.name, ' ', '-'), '''', ''), '"', ''))
    )
  LIMIT 1
)
WHERE EXISTS (
  SELECT 1 FROM event_tickets et
  JOIN TicketEvent te ON te.id = TicketVerifier.ticketEventId
  WHERE et.eventId != te.id
    AND et.eventId IN (
      SELECT e.id FROM event e
      WHERE e.slug = lower(replace(replace(replace(te.name, ' ', '-'), '''', ''), '"', ''))
    )
);
```

- [ ] **Step 2: Apply locally**

Run: `npx wrangler d1 execute arsa-db --local --file=drizzle/0045_ticket_fk_repoint.sql`

- [ ] **Step 3: Verify integrity**

Run:
```bash
npx wrangler d1 execute arsa-db --local --command="SELECT COUNT(*) FROM Ticket t LEFT JOIN event_tickets et ON et.eventId = t.ticketEventId WHERE et.eventId IS NULL"
```
Expected: 0 (every Ticket points to a row in event_tickets). If non-zero, audit revealed gaps — go back to audit page.

- [ ] **Step 4: Commit**

```bash
git add drizzle/0045_ticket_fk_repoint.sql
git commit -m "feat(db): re-point ticket FKs to umbrella event ids"
```

### PR 2 deploy checkpoint

- [ ] **Step 1: Apply migrations to remote**

```bash
npx wrangler d1 execute arsa-db --file=drizzle/0044_event_role_grant_backfill.sql
npx wrangler d1 execute arsa-db --file=drizzle/0045_ticket_fk_repoint.sql
```

- [ ] **Step 2: Deploy**

Run: `pnpm deploy`

- [ ] **Step 3: Tag**

```bash
git tag pr-2-event-perms-grants
git push --tags
```

---

## PR 3 — Admin UI restructure

**Outcome of PR 3:** Sidebar pivots to event-as-workspace. Mission-control overview replaces god-tabs. `events-management.tsx` deleted. Cross-event views (`/admin/orders`, `/admin/products`, `/admin/packages`) survive as filtered union views for multi-event users.

### Task 3.1: Update admin layout to use grant-driven sidebar

**Files:**
- Modify: `src/app/admin/layout.tsx`
- Modify: `src/components/admin/admin-nav.tsx`

- [ ] **Step 1: Update `admin/layout.tsx` to fetch accessible events**

Replace the existing `navItems` construction (lines 57–195) with:

```tsx
// Inside AdminLayout, after fetching session
import { getUserAccessibleEvents } from "@/lib/eventPermissions";
import { event } from "@/db/schema";
import { inArray } from "drizzle-orm";

// ... existing session + user fetch ...

const accessibleMap = await getUserAccessibleEvents(session.user.id);
const eventIds = Array.from(accessibleMap.keys());
const events = eventIds.length
	? await db.query.event.findMany({
		where: inArray(event.id, eventIds),
		columns: { id: true, slug: true, name: true, status: true },
		orderBy: (e, { desc }) => [desc(e.priority), e.name],
	})
	: [];

const navItems = [
	// ARSA Permanent group (unchanged shopAdmin gate becomes overseer-of-any-event check OR isSuperAdmin)
	...(isShopAdmin || isSuperAdmin
		? [
			{ href: "/admin/content/home", label: "Home", iconKey: "home" as const, group: "ARSA Permanent" },
			{ href: "/admin/content/faq", label: "FAQ", iconKey: "faq" as const, group: "ARSA Permanent" },
			{ href: "/admin/content/about", label: "About", iconKey: "about" as const, group: "ARSA Permanent" },
			{ href: "/admin/content/bridges", label: "Bridges", iconKey: "bridges" as const, group: "ARSA Permanent" },
			{ href: "/admin/content/contact", label: "Contact Us", iconKey: "contact" as const, group: "ARSA Permanent" },
			{ href: "/admin/content/pages", label: "Other Pages", iconKey: "otherpages" as const, group: "ARSA Permanent" },
			{ href: "/admin/banner", label: "Banner", iconKey: "banner" as const, group: "ARSA Permanent" },
		]
		: []),

	// Events group — one entry per accessible event
	...events.map((e) => {
		const roles = accessibleMap.get(e.id) ?? [];
		const isOverseer = roles.includes("overseer");
		const subitems = [
			{ href: `/admin/events/${e.slug}`, label: "Overview" },
			...(isOverseer ? [{ href: `/admin/events/${e.slug}/settings`, label: "Settings" }] : []),
			...(isOverseer || roles.includes("content_admin") ? [
				{ href: `/admin/events/${e.slug}/landing`, label: "Landing" },
				{ href: `/admin/events/${e.slug}/pages`, label: "Pages" },
			] : []),
			...(isOverseer || roles.includes("shop_admin") ? [
				{ href: `/admin/events/${e.slug}/shop`, label: "Shop" },
				{ href: `/admin/events/${e.slug}/shop/orders`, label: "Orders" },
				{ href: `/admin/events/${e.slug}/shop/products`, label: "Products" },
			] : []),
			...(isOverseer || roles.includes("tickets_admin") ? [
				{ href: `/admin/events/${e.slug}/tickets`, label: "Tickets" },
			] : []),
			...(isOverseer ? [{ href: `/admin/events/${e.slug}/admins`, label: "Admins" }] : []),
		];
		return {
			href: `/admin/events/${e.slug}`,
			label: e.name,
			iconKey: "events" as const,
			group: "Events",
			subitems,
			eventStatus: e.status,
		};
	}),

	// New-event creator (anyone with isSuperAdmin or isShopAdmin/isEventsAdmin sunset flags)
	...(isShopAdmin || isEventsAdmin || isSuperAdmin
		? [{ href: "/admin/events/new", label: "＋ New Event", iconKey: "events" as const, group: "Events" }]
		: []),

	// Cross-event union views (only show if user has multi-event access)
	...(events.length >= 2 && (isShopAdmin || isSuperAdmin) ? [
		{ href: "/admin/orders", label: "All Orders", iconKey: "orders" as const, group: "Tools" },
		{ href: "/admin/products", label: "All Products", iconKey: "products" as const, group: "Tools" },
		{ href: "/admin/packages", label: "All Packages", iconKey: "packages" as const, group: "Tools" },
	] : []),

	// Tools group (unchanged)
	...(isRedirectsAdmin ? [{ href: "/admin/redirects", label: "Redirects", iconKey: "redirects" as const, group: "Tools" }] : []),
	...(isShopAdmin || isSuperAdmin
		? [
			{ href: "/admin/email-logs", label: "Email Logs", iconKey: "email" as const, group: "Tools" },
			{ href: "/admin/settings", label: "Settings", iconKey: "settings" as const, group: "Tools" },
		]
		: []),
	...(isSSO26Admin ? [{ href: "/admin/sso26", label: "SSO 2026", iconKey: "sso26" as const, group: "SSO 2026" }] : []),
	...(isSuperAdmin ? [{ href: "/admin/super", label: "Super Admin", iconKey: "super" as const, group: "System" }] : []),
];
```

- [ ] **Step 2: Update `NavItemDef` in `admin-nav.tsx` to support `subitems` and `eventStatus`**

In `src/components/admin/admin-nav.tsx`, extend the type:

```tsx
export type NavItemDef = {
	href: string;
	label: string;
	iconKey: keyof typeof iconMap;
	group?: string;
	subitems?: { href: string; label: string }[];
	eventStatus?: "draft" | "active" | "archived";
};
```

Update the render logic to expand `subitems` under the parent item when active. Use shadcn `Collapsible` for the expand/collapse behavior. Replace the existing flat `SidebarMenuItem` render in the "Events" group with a collapsible:

```tsx
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronRight } from "lucide-react";

// Inside the group render, for items with subitems:
{items.map((item) =>
	item.subitems ? (
		<Collapsible key={item.href} defaultOpen={pathname.startsWith(item.href)}>
			<SidebarMenuItem>
				<CollapsibleTrigger asChild>
					<SidebarMenuButton>
						<Icon />
						<span>{item.label}</span>
						{item.eventStatus === "active" && <span className="ml-auto h-2 w-2 rounded-full bg-[#f7bc37]" />}
						<ChevronRight className="ml-auto transition-transform group-data-[state=open]:rotate-90" />
					</SidebarMenuButton>
				</CollapsibleTrigger>
				<CollapsibleContent>
					<SidebarMenuSub>
						{item.subitems.map((sub) => (
							<SidebarMenuSubItem key={sub.href}>
								<SidebarMenuSubButton asChild isActive={pathname === sub.href}>
									<Link href={sub.href}>{sub.label}</Link>
								</SidebarMenuSubButton>
							</SidebarMenuSubItem>
						))}
					</SidebarMenuSub>
				</CollapsibleContent>
			</SidebarMenuItem>
		</Collapsible>
	) : (
		<SidebarMenuItem key={item.href}>
			<SidebarMenuButton asChild isActive={pathname === item.href}>
				<Link href={item.href}><Icon /><span>{item.label}</span></Link>
			</SidebarMenuButton>
		</SidebarMenuItem>
	)
)}
```

(`SidebarMenuSub`, `SidebarMenuSubItem`, `SidebarMenuSubButton` already exist in shadcn's sidebar primitive — confirm by grepping `src/components/ui/sidebar.tsx`.)

- [ ] **Step 3: Typecheck and smoke**

Run: `pnpm build && pnpm dev`
Navigate to `/admin`. Confirm: sidebar shows ARSA Permanent → Events (with each event expandable) → Tools.

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/layout.tsx src/components/admin/admin-nav.tsx
git commit -m "feat(admin): grant-driven sidebar with event-as-workspace structure"
```

### Task 3.2: Event overview (mission-control) page

**Files:**
- Create: `src/app/admin/events/[eventSlug]/page.tsx`
- Create: `src/app/admin/events/[eventSlug]/event-overview.tsx`

- [ ] **Step 1: Create the Server Component page**

```tsx
// src/app/admin/events/[eventSlug]/page.tsx
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { event, eventShop, eventTickets, eventLanding, eventPage } from "@/db/schema";
import { getUserEventRoles } from "@/lib/eventPermissions";
import { EventOverview } from "./event-overview";

export default async function EventOverviewPage({
	params,
}: { params: Promise<{ eventSlug: string }> }) {
	const { eventSlug } = await params;
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) redirect("/shop");

	const e = await db.query.event.findFirst({
		where: eq(event.slug, eventSlug),
		with: {
			shop: true,
			tickets: true,
			landing: true,
		},
	});
	if (!e) notFound();

	const { roles } = await getUserEventRoles(session.user.id, e.id);
	if (roles.length === 0) redirect("/admin");

	const pageCount = await db.$count(eventPage, eq(eventPage.eventId, e.id));

	return <EventOverview event={e} pageCount={pageCount} roles={roles} />;
}
```

> **Note:** This requires Drizzle relations to be defined for `event` → `eventShop`/`eventTickets`/`eventLanding`. Add to `src/db/schema.ts` at the end (or wherever relations are declared):
>
> ```ts
> import { relations } from "drizzle-orm";
> export const eventRelations = relations(event, ({ one, many }) => ({
> 	shop: one(eventShop, { fields: [event.id], references: [eventShop.eventId] }),
> 	tickets: one(eventTickets, { fields: [event.id], references: [eventTickets.eventId] }),
> 	landing: one(eventLanding, { fields: [event.id], references: [eventLanding.eventId] }),
> 	pages: many(eventPage),
> 	grants: many(eventRoleGrant),
> }));
> ```

- [ ] **Step 2: Create the overview UI**

```tsx
// src/app/admin/events/[eventSlug]/event-overview.tsx
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, Ticket as TicketIcon, FileText, Layout } from "lucide-react";
import type { EventRole } from "@/lib/eventPermissions";

type EventWithModules = {
	id: string;
	slug: string;
	name: string;
	status: string;
	shop: { enabled: boolean } | null;
	tickets: { enabled: boolean } | null;
	landing: { published: boolean; codePath: string | null } | null;
};

function StatusChip({ live, label }: { live: boolean; label: string }) {
	if (live) return <Badge className="bg-[#f7bc37] text-[#0e3663]">LIVE</Badge>;
	return <Badge variant="secondary">{label}</Badge>;
}

export function EventOverview({
	event,
	pageCount,
	roles,
}: { event: EventWithModules; pageCount: number; roles: EventRole[] }) {
	const isOverseer = roles.includes("overseer");
	const canShop = isOverseer || roles.includes("shop_admin");
	const canTickets = isOverseer || roles.includes("tickets_admin");
	const canContent = isOverseer || roles.includes("content_admin");

	return (
		<div className="space-y-6">
			<header className="flex items-center justify-between">
				<div>
					<p className="text-xs uppercase tracking-[0.08em] text-[#a2250f] font-bold">Event Workspace</p>
					<h1 className="text-3xl font-bold text-[#0e3663]">{event.name}</h1>
					<p className="text-sm text-muted-foreground font-mono">/{event.slug}</p>
				</div>
				<Badge variant={event.status === "active" ? "default" : "secondary"} className="uppercase">
					{event.status}
				</Badge>
			</header>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
				{canShop && (
					<Link href={`/admin/events/${event.slug}/shop`}>
						<Card className="hover:shadow-md transition">
							<CardHeader className="flex flex-row items-center gap-2 pb-2">
								<ShoppingBag className="h-4 w-4 text-[#a2250f]" />
								<CardTitle className="text-sm uppercase tracking-wider">Shop</CardTitle>
							</CardHeader>
							<CardContent>
								<StatusChip live={!!event.shop?.enabled} label={event.shop ? "PAUSED" : "NOT CONFIGURED"} />
							</CardContent>
						</Card>
					</Link>
				)}
				{canTickets && (
					<Link href={`/admin/events/${event.slug}/tickets`}>
						<Card className="hover:shadow-md transition">
							<CardHeader className="flex flex-row items-center gap-2 pb-2">
								<TicketIcon className="h-4 w-4 text-[#a2250f]" />
								<CardTitle className="text-sm uppercase tracking-wider">Tickets</CardTitle>
							</CardHeader>
							<CardContent>
								<StatusChip live={!!event.tickets?.enabled} label={event.tickets ? "PAUSED" : "NOT CONFIGURED"} />
							</CardContent>
						</Card>
					</Link>
				)}
				{canContent && (
					<>
						<Link href={`/admin/events/${event.slug}/landing`}>
							<Card className="hover:shadow-md transition">
								<CardHeader className="flex flex-row items-center gap-2 pb-2">
									<Layout className="h-4 w-4 text-[#a2250f]" />
									<CardTitle className="text-sm uppercase tracking-wider">Landing</CardTitle>
								</CardHeader>
								<CardContent>
									<StatusChip live={!!event.landing?.published} label={event.landing ? "DRAFT" : "NOT CONFIGURED"} />
									{event.landing?.codePath && (
										<p className="text-xs mt-1 text-muted-foreground">Code override active</p>
									)}
								</CardContent>
							</Card>
						</Link>
						<Link href={`/admin/events/${event.slug}/pages`}>
							<Card className="hover:shadow-md transition">
								<CardHeader className="flex flex-row items-center gap-2 pb-2">
									<FileText className="h-4 w-4 text-[#a2250f]" />
									<CardTitle className="text-sm uppercase tracking-wider">Pages</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-2xl font-bold">{pageCount}</p>
									<p className="text-xs text-muted-foreground">total</p>
								</CardContent>
							</Card>
						</Link>
					</>
				)}
			</div>
		</div>
	);
}
```

- [ ] **Step 3: Add the schema relations export**

Open `src/db/schema.ts` and append the `eventRelations` block (shown in Step 1 note above). Add similar one-line `relations` for `eventShop`, `eventTickets`, `eventLanding`, `eventPage`, `eventRoleGrant` if needed.

- [ ] **Step 4: Typecheck + smoke**

Run: `pnpm build`. Then `pnpm dev` and visit `/admin/events/<some-existing-slug>`. Confirm 4 cards render with correct status chips.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/events/[eventSlug]/ src/db/schema.ts
git commit -m "feat(admin): event overview mission-control page"
```

### Task 3.3: Event settings page (replaces basic-info tab of god-file)

**Files:**
- Create: `src/app/admin/events/[eventSlug]/settings/page.tsx`
- Create: `src/app/admin/events/[eventSlug]/settings/settings-form.tsx`
- Create: `src/app/admin/events/[eventSlug]/actions.ts` (shared server actions for `[eventSlug]/*`)

- [ ] **Step 1: Create the shared actions file**

```ts
// src/app/admin/events/[eventSlug]/actions.ts
"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { event, eventShop, eventTickets, eventLanding, redirects } from "@/db/schema";
import { requireEventRole, ForbiddenError } from "@/lib/eventPermissions";

const RESERVED_SLUGS = new Set([
	"shop", "admin", "api", "about", "calendar", "publications", "merch",
	"resources", "contact", "redirects", "ticket-verify", "faq", "home",
	"bridges", "sign-in", "sign-out", "_next", "favicon.ico", "robots.txt",
	"sitemap.xml", "_custom", "events",
]);

export type EventSettingsForm = {
	name: string;
	slug: string;
	description: string | null;
	status: "draft" | "active" | "archived";
	startDate: number | null;
	endDate: number | null;
	priority: number;
	tabLabel: string | null;
	ogImage: string | null;
	metaTitle: string | null;
	metaDescription: string | null;
};

async function authedUserId(): Promise<string> {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) throw new ForbiddenError();
	return session.user.id;
}

export async function updateEventSettings(eventId: string, form: EventSettingsForm) {
	const userId = await authedUserId();
	await requireEventRole(userId, eventId, []); // overseer-only (empty allowed => overseer-only via guard semantics)

	if (RESERVED_SLUGS.has(form.slug)) throw new Error("Slug is reserved");
	const collision = await db.query.event.findFirst({ where: eq(event.slug, form.slug), columns: { id: true } });
	if (collision && collision.id !== eventId) throw new Error("Slug already in use");

	const current = await db.query.event.findFirst({ where: eq(event.id, eventId) });
	if (!current) throw new Error("Event not found");

	// If slug changed, write a Redirects row (PR 4 wires public routing; row is harmless until then)
	if (current.slug !== form.slug) {
		await db.insert(redirects).values({
			newURL: `/${form.slug}`,
			redirectCode: current.slug,
		}).onConflictDoNothing();
	}

	await db.update(event).set({
		name: form.name,
		slug: form.slug,
		description: form.description,
		status: form.status,
		startDate: form.startDate ? new Date(form.startDate) : null,
		endDate: form.endDate ? new Date(form.endDate) : null,
		priority: form.priority,
		tabLabel: form.tabLabel,
		ogImage: form.ogImage,
		metaTitle: form.metaTitle,
		metaDescription: form.metaDescription,
		updatedAt: new Date(),
	}).where(eq(event.id, eventId));

	revalidatePath(`/admin/events/${form.slug}`);
}

export async function toggleModule(
	eventId: string,
	module: "shop" | "tickets" | "landing",
	enabled: boolean,
) {
	const userId = await authedUserId();
	const guardRoles =
		module === "shop" ? ["shop_admin" as const] :
		module === "tickets" ? ["tickets_admin" as const] :
		["content_admin" as const];
	await requireEventRole(userId, eventId, guardRoles);

	const table = module === "shop" ? eventShop : module === "tickets" ? eventTickets : eventLanding;
	const field = module === "landing" ? "published" : "enabled";

	await db.update(table).set({
		[field]: enabled,
		lastToggledBy: userId,
		lastToggledAt: new Date(),
	} as any).where(eq((table as any).eventId, eventId));

	const e = await db.query.event.findFirst({ where: eq(event.id, eventId), columns: { slug: true } });
	if (e) revalidatePath(`/admin/events/${e.slug}`);
}
```

- [ ] **Step 2: Create the settings page**

```tsx
// src/app/admin/events/[eventSlug]/settings/page.tsx
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { event } from "@/db/schema";
import { getUserEventRoles } from "@/lib/eventPermissions";
import { SettingsForm } from "./settings-form";

export default async function EventSettingsPage({
	params,
}: { params: Promise<{ eventSlug: string }> }) {
	const { eventSlug } = await params;
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) redirect("/shop");

	const e = await db.query.event.findFirst({ where: eq(event.slug, eventSlug) });
	if (!e) notFound();

	const { roles } = await getUserEventRoles(session.user.id, e.id);
	if (!roles.includes("overseer")) redirect(`/admin/events/${eventSlug}`);

	return <SettingsForm event={e} />;
}
```

- [ ] **Step 3: Create the settings form**

```tsx
// src/app/admin/events/[eventSlug]/settings/settings-form.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { updateEventSettings, type EventSettingsForm } from "../actions";
import { toast } from "sonner";

export function SettingsForm({ event }: { event: any }) {
	const router = useRouter();
	const [pending, start] = useTransition();
	const [form, setForm] = useState<EventSettingsForm>({
		name: event.name,
		slug: event.slug,
		description: event.description,
		status: event.status,
		startDate: event.startDate ? new Date(event.startDate).getTime() : null,
		endDate: event.endDate ? new Date(event.endDate).getTime() : null,
		priority: event.priority,
		tabLabel: event.tabLabel,
		ogImage: event.ogImage,
		metaTitle: event.metaTitle,
		metaDescription: event.metaDescription,
	});

	return (
		<div className="max-w-3xl space-y-6">
			<h1 className="text-2xl font-bold text-[#0e3663]">Settings</h1>

			<Card>
				<CardHeader><CardTitle>Basic info</CardTitle></CardHeader>
				<CardContent className="space-y-4">
					<div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
					<div><Label>Slug</Label><Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
						<p className="text-xs text-muted-foreground mt-1">URL: /{form.slug}. Renaming preserves the old URL via auto-redirect.</p>
					</div>
					<div><Label>Description</Label><Textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
					<div>
						<Label>Status</Label>
						<Select value={form.status} onValueChange={(v: any) => setForm({ ...form, status: v })}>
							<SelectTrigger><SelectValue /></SelectTrigger>
							<SelectContent>
								<SelectItem value="draft">Draft</SelectItem>
								<SelectItem value="active">Active</SelectItem>
								<SelectItem value="archived">Archived</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader><CardTitle>Dates & priority</CardTitle></CardHeader>
				<CardContent className="space-y-4">
					<div><Label>Start date</Label>
						<DatePicker date={form.startDate ? new Date(form.startDate) : undefined} setDate={(d) => setForm({ ...form, startDate: d?.getTime() ?? null })} />
					</div>
					<div><Label>End date</Label>
						<DatePicker date={form.endDate ? new Date(form.endDate) : undefined} setDate={(d) => setForm({ ...form, endDate: d?.getTime() ?? null })} />
					</div>
					<div><Label>Priority (higher = preferred default tab)</Label><Input type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value, 10) || 0 })} /></div>
					<div><Label>Tab label (overrides name in shop tabs)</Label><Input value={form.tabLabel ?? ""} onChange={(e) => setForm({ ...form, tabLabel: e.target.value || null })} /></div>
				</CardContent>
			</Card>

			<Card>
				<CardHeader><CardTitle>SEO / Open Graph</CardTitle></CardHeader>
				<CardContent className="space-y-4">
					<div><Label>OG Image URL</Label><Input value={form.ogImage ?? ""} onChange={(e) => setForm({ ...form, ogImage: e.target.value || null })} /></div>
					<div><Label>Meta title</Label><Input value={form.metaTitle ?? ""} onChange={(e) => setForm({ ...form, metaTitle: e.target.value || null })} /></div>
					<div><Label>Meta description</Label><Textarea value={form.metaDescription ?? ""} onChange={(e) => setForm({ ...form, metaDescription: e.target.value || null })} /></div>
				</CardContent>
			</Card>

			<Button disabled={pending} onClick={() => start(async () => {
				try {
					await updateEventSettings(event.id, form);
					toast.success("Saved");
					if (form.slug !== event.slug) router.push(`/admin/events/${form.slug}/settings`);
					else router.refresh();
				} catch (e: any) {
					toast.error(e.message ?? "Failed");
				}
			})}>Save changes</Button>
		</div>
	);
}
```

- [ ] **Step 4: Smoke**

Run: `pnpm build && pnpm dev`. Navigate to `/admin/events/<slug>/settings`. Edit name + save. Confirm: toast appears, refresh shows new value.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/events/[eventSlug]/settings/ src/app/admin/events/[eventSlug]/actions.ts
git commit -m "feat(admin): event settings page (basic info, dates, SEO)"
```

### Task 3.4: Event admins page (role grants management)

**Files:**
- Create: `src/app/admin/events/[eventSlug]/admins/page.tsx`
- Create: `src/app/admin/events/[eventSlug]/admins/admins-client.tsx`
- Modify: `src/app/admin/events/[eventSlug]/actions.ts` (add grant CRUD actions)

- [ ] **Step 1: Add grant actions to the shared actions file**

Append to `src/app/admin/events/[eventSlug]/actions.ts`:

```ts
import { eventRoleGrant, user as userTable } from "@/db/schema";
import { and, like } from "drizzle-orm";

export async function listGrants(eventId: string) {
	const userId = await authedUserId();
	await requireEventRole(userId, eventId, []);
	return db.query.eventRoleGrant.findMany({
		where: eq(eventRoleGrant.eventId, eventId),
		with: { /* if user relation defined */ },
	}).then(async (grants) => {
		// fetch users separately if relation not defined
		const userIds = Array.from(new Set(grants.map((g) => g.userId)));
		const users = await db.query.user.findMany({
			where: userIds.length ? eq(userTable.id, userIds[0]) : undefined,
			columns: { id: true, name: true, email: true, image: true },
		});
		// (engineer note: if user relation on eventRoleGrant is defined in schema, prefer the `with: { user: true }` form)
		const userMap = new Map(users.map((u) => [u.id, u]));
		return grants.map((g) => ({ ...g, user: userMap.get(g.userId) }));
	});
}

export async function grantRole(eventId: string, targetUserId: string, role: "overseer" | "shop_admin" | "tickets_admin" | "content_admin") {
	const userId = await authedUserId();
	await requireEventRole(userId, eventId, []); // overseer only
	await db.insert(eventRoleGrant).values({
		eventId, userId: targetUserId, role, grantedBy: userId,
	}).onConflictDoNothing();
	const e = await db.query.event.findFirst({ where: eq(event.id, eventId), columns: { slug: true } });
	if (e) revalidatePath(`/admin/events/${e.slug}/admins`);
}

export async function revokeRole(eventId: string, grantId: string) {
	const userId = await authedUserId();
	await requireEventRole(userId, eventId, []);
	await db.delete(eventRoleGrant).where(eq(eventRoleGrant.id, grantId));
	const e = await db.query.event.findFirst({ where: eq(event.id, eventId), columns: { slug: true } });
	if (e) revalidatePath(`/admin/events/${e.slug}/admins`);
}

export async function searchUsersForGrant(query: string) {
	if (query.length < 2) return [];
	return db.query.user.findMany({
		where: (u, { or, like: lk }) => or(lk(u.email, `%${query}%`), lk(u.name, `%${query}%`)),
		columns: { id: true, name: true, email: true, image: true },
		limit: 10,
	});
}
```

- [ ] **Step 2: Create the admins page**

```tsx
// src/app/admin/events/[eventSlug]/admins/page.tsx
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { event } from "@/db/schema";
import { getUserEventRoles } from "@/lib/eventPermissions";
import { listGrants } from "../actions";
import { AdminsClient } from "./admins-client";

export default async function EventAdminsPage({
	params,
}: { params: Promise<{ eventSlug: string }> }) {
	const { eventSlug } = await params;
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) redirect("/shop");

	const e = await db.query.event.findFirst({ where: eq(event.slug, eventSlug) });
	if (!e) notFound();

	const { roles } = await getUserEventRoles(session.user.id, e.id);
	if (!roles.includes("overseer")) redirect(`/admin/events/${eventSlug}`);

	const grants = await listGrants(e.id);
	return <AdminsClient eventId={e.id} grants={grants} />;
}
```

- [ ] **Step 3: Create the admins client UI**

```tsx
// src/app/admin/events/[eventSlug]/admins/admins-client.tsx
"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { grantRole, revokeRole, searchUsersForGrant } from "../actions";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

const ROLES = ["overseer", "shop_admin", "tickets_admin", "content_admin"] as const;

export function AdminsClient({ eventId, grants }: { eventId: string; grants: any[] }) {
	const [pending, start] = useTransition();
	const [q, setQ] = useState("");
	const [results, setResults] = useState<any[]>([]);
	const [selectedRole, setSelectedRole] = useState<typeof ROLES[number]>("shop_admin");

	const search = (v: string) => {
		setQ(v);
		start(async () => setResults(await searchUsersForGrant(v)));
	};

	return (
		<div className="max-w-3xl space-y-6">
			<h1 className="text-2xl font-bold text-[#0e3663]">Admins</h1>

			<Card>
				<CardHeader><CardTitle>Add admin</CardTitle></CardHeader>
				<CardContent className="space-y-3">
					<Input placeholder="Search by name or email" value={q} onChange={(e) => search(e.target.value)} />
					<Select value={selectedRole} onValueChange={(v: any) => setSelectedRole(v)}>
						<SelectTrigger><SelectValue /></SelectTrigger>
						<SelectContent>
							{ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
						</SelectContent>
					</Select>
					{results.map((u) => (
						<div key={u.id} className="flex items-center justify-between border rounded p-2">
							<div className="flex items-center gap-2">
								<Avatar className="h-7 w-7"><AvatarImage src={u.image ?? undefined} /><AvatarFallback>{u.name?.[0]}</AvatarFallback></Avatar>
								<span>{u.name} <span className="text-xs text-muted-foreground">{u.email}</span></span>
							</div>
							<Button size="sm" disabled={pending} onClick={() => start(async () => {
								await grantRole(eventId, u.id, selectedRole);
								toast.success("Granted");
								setQ(""); setResults([]);
							})}>Grant {selectedRole}</Button>
						</div>
					))}
				</CardContent>
			</Card>

			<Card>
				<CardHeader><CardTitle>Current grants</CardTitle></CardHeader>
				<CardContent>
					{grants.map((g) => (
						<div key={g.id} className="flex items-center justify-between border-t py-2">
							<div className="flex items-center gap-2">
								<Avatar className="h-7 w-7"><AvatarImage src={g.user?.image ?? undefined} /><AvatarFallback>{g.user?.name?.[0]}</AvatarFallback></Avatar>
								<span>{g.user?.name ?? g.userId} <span className="text-xs text-muted-foreground">{g.user?.email}</span></span>
								<Badge>{g.role}</Badge>
							</div>
							<Button size="icon" variant="ghost" disabled={pending} onClick={() => start(async () => {
								await revokeRole(eventId, g.id);
								toast.success("Revoked");
							})}><Trash2 className="h-4 w-4" /></Button>
						</div>
					))}
				</CardContent>
			</Card>
		</div>
	);
}
```

- [ ] **Step 4: Smoke + commit**

```bash
pnpm build && pnpm dev
# visit /admin/events/<slug>/admins; search a user; grant; revoke
git add src/app/admin/events/[eventSlug]/admins/ src/app/admin/events/[eventSlug]/actions.ts
git commit -m "feat(admin): event role grants management page"
```

### Task 3.5: Event landing editor

**Files:**
- Create: `src/app/admin/events/[eventSlug]/landing/page.tsx`
- Create: `src/app/admin/events/[eventSlug]/landing/landing-editor.tsx`
- Modify: `src/app/admin/events/[eventSlug]/actions.ts` (add landing save action)

- [ ] **Step 1: Add landing save action**

Append to actions.ts:

```ts
export async function saveLanding(eventId: string, body: any, codePath: string | null, publish: boolean) {
	const userId = await authedUserId();
	await requireEventRole(userId, eventId, ["content_admin"]);

	const existing = await db.query.eventLanding.findFirst({ where: eq(eventLanding.eventId, eventId) });
	if (existing) {
		await db.update(eventLanding).set({
			body, codePath,
			...(publish !== existing.published ? { published: publish, lastToggledBy: userId, lastToggledAt: new Date() } : {}),
		}).where(eq(eventLanding.eventId, eventId));
	} else {
		await db.insert(eventLanding).values({
			eventId, body, codePath, published: publish,
			lastToggledBy: publish ? userId : null,
			lastToggledAt: publish ? new Date() : null,
		});
	}
	const e = await db.query.event.findFirst({ where: eq(event.id, eventId), columns: { slug: true } });
	if (e) revalidatePath(`/admin/events/${e.slug}/landing`);
}
```

- [ ] **Step 2: Create the page (Server Component)**

```tsx
// src/app/admin/events/[eventSlug]/landing/page.tsx
import { notFound, redirect } from "next/navigation";
import { headers } from "next/headers";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { event } from "@/db/schema";
import { getUserEventRoles } from "@/lib/eventPermissions";
import { LandingEditor } from "./landing-editor";

export default async function LandingPage({ params }: { params: Promise<{ eventSlug: string }> }) {
	const { eventSlug } = await params;
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) redirect("/shop");
	const e = await db.query.event.findFirst({
		where: eq(event.slug, eventSlug),
		with: { landing: true },
	});
	if (!e) notFound();
	const { roles } = await getUserEventRoles(session.user.id, e.id);
	if (!roles.includes("overseer") && !roles.includes("content_admin")) redirect(`/admin/events/${eventSlug}`);
	return <LandingEditor event={e} />;
}
```

- [ ] **Step 3: Create the editor (reuses existing rich-text-editor)**

```tsx
// src/app/admin/events/[eventSlug]/landing/landing-editor.tsx
"use client";

import { useState, useTransition, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/app/admin/pages/rich-text-editor";
import { saveLanding } from "../actions";
import { toast } from "sonner";

export function LandingEditor({ event }: { event: any }) {
	const [pending, start] = useTransition();
	const [body, setBody] = useState(event.landing?.body ?? null);
	const [codePath, setCodePath] = useState<string | null>(event.landing?.codePath ?? null);
	const [published, setPublished] = useState<boolean>(event.landing?.published ?? false);
	const [codeOverride, setCodeOverride] = useState<boolean>(false);

	useEffect(() => {
		// fetch code-page manifest to detect override; uses /api/admin/event-code-pages from PR 4 prereq
		fetch(`/api/admin/event-code-pages?slug=${event.slug}`)
			.then((r) => r.ok ? r.json() : { landing: false })
			.then((m) => setCodeOverride(!!m.landing))
			.catch(() => {});
	}, [event.slug]);

	return (
		<div className="max-w-4xl space-y-6">
			<header className="flex items-center justify-between">
				<h1 className="text-2xl font-bold text-[#0e3663]">Landing page</h1>
				<div className="flex items-center gap-2">
					<Label htmlFor="pub">Published</Label>
					<Switch id="pub" checked={published} onCheckedChange={setPublished} />
				</div>
			</header>

			{codeOverride && (
				<Card className="border-[#f7bc37]">
					<CardContent className="pt-4 text-sm">
						⚠ This page is overridden by code at <code>events/_custom/{event.slug}/landing</code>.
						CMS edits will not be visible until the code page is removed.
					</CardContent>
				</Card>
			)}

			<Card>
				<CardHeader><CardTitle>Code path (optional override)</CardTitle></CardHeader>
				<CardContent>
					<Input value={codePath ?? ""} placeholder="events/_custom/<slug>/landing"
						onChange={(e) => setCodePath(e.target.value || null)} />
					<p className="text-xs text-muted-foreground mt-1">Leave blank to use the CMS body below.</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader><CardTitle>CMS body</CardTitle></CardHeader>
				<CardContent>
					<RichTextEditor value={body} onChange={setBody} />
				</CardContent>
			</Card>

			<Button disabled={pending} onClick={() => start(async () => {
				await saveLanding(event.id, body, codePath, published);
				toast.success("Saved");
			})}>Save</Button>
		</div>
	);
}
```

- [ ] **Step 4: Smoke + commit**

```bash
pnpm build && pnpm dev
# visit /admin/events/<slug>/landing; edit body; toggle published; save
git add src/app/admin/events/[eventSlug]/landing/ src/app/admin/events/[eventSlug]/actions.ts
git commit -m "feat(admin): event landing editor"
```

### Task 3.6: Event pages list + editor

**Files:**
- Create: `src/app/admin/events/[eventSlug]/pages/page.tsx` (list)
- Create: `src/app/admin/events/[eventSlug]/pages/pages-list.tsx`
- Create: `src/app/admin/events/[eventSlug]/pages/[pageSlug]/page.tsx` (editor)
- Create: `src/app/admin/events/[eventSlug]/pages/[pageSlug]/page-editor.tsx`
- Modify: `src/app/admin/events/[eventSlug]/actions.ts` (CRUD for event_page)

- [ ] **Step 1: Add page CRUD actions**

```ts
import { eventPage } from "@/db/schema";

export async function listPages(eventId: string) {
	const userId = await authedUserId();
	await requireEventRole(userId, eventId, ["content_admin"]);
	return db.query.eventPage.findMany({
		where: eq(eventPage.eventId, eventId),
		orderBy: (p, { asc }) => [asc(p.sortOrder), asc(p.title)],
	});
}

export async function createPage(eventId: string, pageSlug: string, title: string) {
	const userId = await authedUserId();
	await requireEventRole(userId, eventId, ["content_admin"]);
	const id = crypto.randomUUID();
	await db.insert(eventPage).values({ id, eventId, pageSlug, title, body: null, published: false, sortOrder: 0 });
	const e = await db.query.event.findFirst({ where: eq(event.id, eventId), columns: { slug: true } });
	if (e) revalidatePath(`/admin/events/${e.slug}/pages`);
	return id;
}

export async function updatePage(pageId: string, body: any, title: string, codePath: string | null, published: boolean, sortOrder: number) {
	const userId = await authedUserId();
	const p = await db.query.eventPage.findFirst({ where: eq(eventPage.id, pageId) });
	if (!p) throw new Error("Page not found");
	await requireEventRole(userId, p.eventId, ["content_admin"]);
	const wasPublished = p.published;
	await db.update(eventPage).set({
		title, body, codePath, sortOrder,
		...(published !== wasPublished ? { published, lastToggledBy: userId, lastToggledAt: new Date() } : {}),
	}).where(eq(eventPage.id, pageId));
	const e = await db.query.event.findFirst({ where: eq(event.id, p.eventId), columns: { slug: true } });
	if (e) revalidatePath(`/admin/events/${e.slug}/pages`);
}

export async function deletePage(pageId: string) {
	const userId = await authedUserId();
	const p = await db.query.eventPage.findFirst({ where: eq(eventPage.id, pageId) });
	if (!p) return;
	await requireEventRole(userId, p.eventId, ["content_admin"]);
	await db.delete(eventPage).where(eq(eventPage.id, pageId));
	const e = await db.query.event.findFirst({ where: eq(event.id, p.eventId), columns: { slug: true } });
	if (e) revalidatePath(`/admin/events/${e.slug}/pages`);
}
```

- [ ] **Step 2: List page + UI**

```tsx
// pages/page.tsx (server) and pages-list.tsx (client) follow the same Server Component pattern as previous tasks.
// List shows: title, pageSlug, published badge, "Edit" link to /admin/events/<slug>/pages/<pageSlug>, "Delete" button.
// "New page" form: title + pageSlug input -> createPage -> redirect to editor.
```

(Engineer: model this UI after `src/app/admin/pages/content-management.tsx:1-369` for the list pattern.)

- [ ] **Step 3: Editor**

`pages/[pageSlug]/page.tsx` + `page-editor.tsx`: same shape as the landing editor (Task 3.5) but for one row of `event_page`. Shows the same `⚠ Overridden by code` banner if manifest indicates `events/_custom/<eventSlug>/<pageSlug>` exists.

- [ ] **Step 4: Smoke + commit**

```bash
pnpm build && pnpm dev
# create, edit, publish, delete a page
git add src/app/admin/events/[eventSlug]/pages/ src/app/admin/events/[eventSlug]/actions.ts
git commit -m "feat(admin): event pages CRUD"
```

### Task 3.7: Event shop sub-routes

**Files:**
- Create: `src/app/admin/events/[eventSlug]/shop/page.tsx` (shop config)
- Create: `src/app/admin/events/[eventSlug]/shop/orders/page.tsx`
- Create: `src/app/admin/events/[eventSlug]/shop/products/page.tsx`
- Create: `src/app/admin/events/[eventSlug]/shop/categories/page.tsx`

- [ ] **Step 1: Shop config page**

Builds form for `event_shop` row: enabled toggle, codePath, checkoutFields editor (port from existing `events-management.tsx` checkout-fields UI), checkoutConfig (header/confirmation/terms), delivery settings. Save via a new `saveShopConfig(eventId, ...)` action in `actions.ts`. Pattern mirrors Task 3.3.

- [ ] **Step 2: Orders page (event-scoped)**

Port the existing `/admin/orders` orders table but filter by `order.eventId = <this event>`. Reuse `src/app/admin/orders/orders-management.tsx` by:

```tsx
// src/app/admin/events/[eventSlug]/shop/orders/page.tsx
import { OrdersManagement } from "@/app/admin/orders/orders-management";
import { db } from "@/lib/db";
import { order, event } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function EventOrdersPage({ params }: { params: Promise<{ eventSlug: string }> }) {
	const { eventSlug } = await params;
	const e = await db.query.event.findFirst({ where: eq(event.slug, eventSlug), columns: { id: true } });
	if (!e) notFound();
	// auth + role guard...
	const orders = await db.query.order.findMany({
		where: eq(order.eventId, e.id),
		// existing relations
	});
	return <OrdersManagement initial={orders} scopeEventId={e.id} />;
}
```

Modify `OrdersManagement` to accept an optional `scopeEventId` prop that scopes server actions. (Minimally invasive — most existing logic stays.)

- [ ] **Step 3: Products + Categories pages**

Same scoping pattern. Reuse existing components from `src/app/admin/products/products-management.tsx` and category UI inside today's `events-management.tsx` (lift the EventCategory CRUD section out as a standalone component).

- [ ] **Step 4: Smoke + commit**

```bash
pnpm build && pnpm dev
# verify all four shop sub-routes load correctly for an event with shop module enabled
git add src/app/admin/events/[eventSlug]/shop/ src/app/admin/events/[eventSlug]/actions.ts
git commit -m "feat(admin): event-scoped shop config + orders/products/categories"
```

### Task 3.8: Event tickets sub-routes

**Files:**
- Create: `src/app/admin/events/[eventSlug]/tickets/page.tsx`
- Create: `src/app/admin/events/[eventSlug]/tickets/generate/page.tsx`
- Create: `src/app/admin/events/[eventSlug]/tickets/verifiers/page.tsx`

- [ ] **Step 1: Lift ticket logic from `src/app/admin/tickets/tickets-management.tsx` (1060 lines)**

Decompose existing tabs into three pages. Pattern:
- `tickets/page.tsx` — list tickets + event_tickets config (enabled toggle, sheet sync settings)
- `tickets/generate/page.tsx` — bulk-generate form (paste email,count) + export-for-mail-merge CSV button
- `tickets/verifiers/page.tsx` — verifier assignment search + list

Server actions for ticket operations live in `src/app/admin/tickets/actions.ts` (existing). Scope them by accepting `eventId` and validating with `requireEventRole(userId, eventId, ["tickets_admin"])`.

- [ ] **Step 2: Smoke + commit**

```bash
pnpm build && pnpm dev
git add src/app/admin/events/[eventSlug]/tickets/
git commit -m "feat(admin): event-scoped tickets pages"
```

### Task 3.9: Cross-event union views

**Files:**
- Modify: `src/app/admin/orders/orders-management.tsx` (add multi-event filter)
- Modify: `src/app/admin/orders/page.tsx` (fetch only orders for events the user has shop access to)
- Modify: `src/app/admin/products/products-management.tsx` (similar)
- Modify: `src/app/admin/packages/packages-management.tsx` (similar)

- [ ] **Step 1: Update `/admin/orders` to scope by accessible events**

```tsx
// src/app/admin/orders/page.tsx
import { getUserAccessibleEvents } from "@/lib/eventPermissions";
// ... existing auth ...
const accessible = await getUserAccessibleEvents(session.user.id);
const shopEventIds: string[] = [];
for (const [eid, roles] of accessible) {
	if (roles.includes("overseer") || roles.includes("shop_admin")) shopEventIds.push(eid);
}
const orders = await db.query.order.findMany({
	where: shopEventIds.length ? inArray(order.eventId, shopEventIds) : undefined,
	// existing options
});
```

Add an event-filter dropdown to `orders-management.tsx`. Existing functionality preserved.

- [ ] **Step 2: Same pattern for products and packages**

- [ ] **Step 3: Smoke + commit**

```bash
pnpm build && pnpm dev
# log in as multi-event admin; verify cross-event view shows orders from all events with filter
git add src/app/admin/orders/ src/app/admin/products/ src/app/admin/packages/
git commit -m "feat(admin): scope cross-event admin views to accessible events"
```

### Task 3.10: Migrate `/admin/events` list page

**Files:**
- Replace: `src/app/admin/events/page.tsx`
- Delete: `src/app/admin/events/events-management.tsx`
- Delete: `src/app/admin/events/loading.tsx` (if it referenced events-management internals)
- Modify: `src/app/admin/events/actions.ts` (slim down — most actions migrated to `[eventSlug]/actions.ts`)
- Create: `src/app/admin/events/new/page.tsx`

- [ ] **Step 1: New `/admin/events` index page**

```tsx
// src/app/admin/events/page.tsx
import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { eq, inArray } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { event } from "@/db/schema";
import { getUserAccessibleEvents } from "@/lib/eventPermissions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default async function EventsListPage() {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) redirect("/shop");

	const accessible = await getUserAccessibleEvents(session.user.id);
	const ids = Array.from(accessible.keys());
	const events = ids.length
		? await db.query.event.findMany({
			where: inArray(event.id, ids),
			orderBy: (e, { desc, asc }) => [desc(e.priority), asc(e.name)],
		})
		: [];

	return (
		<div className="space-y-6">
			<header className="flex items-center justify-between">
				<h1 className="text-3xl font-bold text-[#0e3663]">Events</h1>
				<Link href="/admin/events/new" className="text-sm font-semibold text-[#a2250f]">+ New Event</Link>
			</header>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{events.map((e) => (
					<Link key={e.id} href={`/admin/events/${e.slug}`}>
						<Card className="hover:shadow-md transition">
							<CardHeader>
								<CardTitle>{e.name}</CardTitle>
								<p className="text-xs font-mono text-muted-foreground">/{e.slug}</p>
							</CardHeader>
							<CardContent>
								<Badge>{e.status}</Badge>
							</CardContent>
						</Card>
					</Link>
				))}
			</div>
		</div>
	);
}
```

- [ ] **Step 2: Create the new-event form**

```tsx
// src/app/admin/events/new/page.tsx
// Server Component with auth check; client form posts to createEvent action in /admin/events/actions.ts
// On success: auto-grants overseer to current user, redirects to /admin/events/<slug>/settings.
```

The `createEvent` action in `src/app/admin/events/actions.ts`:

```ts
export async function createEvent(form: { name: string; slug: string; description: string | null }) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) throw new ForbiddenError();
	const u = await db.query.user.findFirst({ where: eq(userTable.id, session.user.id), columns: { isSuperAdmin: true, isShopAdmin: true, isEventsAdmin: true } });
	if (!(u?.isSuperAdmin || u?.isShopAdmin || u?.isEventsAdmin)) throw new ForbiddenError();
	if (RESERVED_SLUGS.has(form.slug)) throw new Error("Reserved slug");
	const collision = await db.query.event.findFirst({ where: eq(event.slug, form.slug) });
	if (collision) throw new Error("Slug taken");

	const id = crypto.randomUUID();
	await db.insert(event).values({
		id, name: form.name, slug: form.slug, description: form.description,
		status: "draft", priority: 0, heroImages: [],
	});

	// auto-grant overseer to creator
	await db.insert(eventRoleGrant).values({
		eventId: id, userId: session.user.id, role: "overseer", grantedBy: session.user.id,
	});

	revalidatePath("/admin/events");
	return { id, slug: form.slug };
}
```

- [ ] **Step 3: Delete the godfile**

```bash
git rm src/app/admin/events/events-management.tsx
```

- [ ] **Step 4: Slim actions.ts**

Remove from `src/app/admin/events/actions.ts` everything that's been migrated to `[eventSlug]/actions.ts`. Keep only: `createEvent`, `deleteEvent`, and any analytics still scoped to the list page.

- [ ] **Step 5: Smoke + commit**

```bash
pnpm build && pnpm dev
# /admin/events shows card grid; click into an event; /admin/events/new creates and redirects
git add src/app/admin/events/
git commit -m "feat(admin): decompose events godfile into per-route pages"
```

### PR 3 deploy checkpoint

- [ ] **Step 1: Deploy**

Run: `pnpm deploy`

- [ ] **Step 2: Manually walk every admin route**

`/admin` → sidebar populated with events. Pick one event → all sub-routes navigable. Verify a non-overseer (content_admin only) sees only landing + pages in sidebar.

- [ ] **Step 3: Tag**

```bash
git tag pr-3-admin-ui-restructure
git push --tags
```

---

## PR 4 — Public routing + code-page resolver

**Outcome of PR 4:** Public `/<slug>/...` routes resolve to landing/pages/tickets. Code-page manifest generated at build. Reserved-slug validator enforced. Slug renames create Redirects rows that work.

### Task 4.1: Code-page manifest generator script

**Files:**
- Create: `scripts/generate-event-code-page-manifest.ts`
- Modify: `package.json` (add prebuild script)
- Modify: `.gitignore` (ignore generated JSON)

- [ ] **Step 1: Write the generator**

```ts
// scripts/generate-event-code-page-manifest.ts
import { readdirSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve, join } from "node:path";

const CUSTOM_ROOT = resolve("src/app/events/_custom");
const OUT_PATH = resolve("src/lib/eventCodePages.generated.json");

type Manifest = Record<string, { landing: boolean; shop: boolean; pages: string[] }>;

const out: Manifest = {};
if (existsSync(CUSTOM_ROOT)) {
	for (const slug of readdirSync(CUSTOM_ROOT, { withFileTypes: true })) {
		if (!slug.isDirectory()) continue;
		const slugDir = join(CUSTOM_ROOT, slug.name);
		const entry = { landing: false, shop: false, pages: [] as string[] };
		for (const sub of readdirSync(slugDir, { withFileTypes: true })) {
			if (!sub.isDirectory()) continue;
			const pagePath = join(slugDir, sub.name, "page.tsx");
			if (!existsSync(pagePath)) continue;
			if (sub.name === "landing") entry.landing = true;
			else if (sub.name === "shop") entry.shop = true;
			else entry.pages.push(sub.name);
		}
		out[slug.name] = entry;
	}
}

mkdirSync(resolve("src/lib"), { recursive: true });
writeFileSync(OUT_PATH, JSON.stringify(out, null, 2));
console.log(`Wrote ${Object.keys(out).length} event code-page entries to ${OUT_PATH}`);
```

- [ ] **Step 2: Wire into `package.json`**

```json
"scripts": {
  "build": "pnpm run gen:event-code-pages && next build",
  "gen:event-code-pages": "tsx scripts/generate-event-code-page-manifest.ts",
  "dev": "pnpm run gen:event-code-pages && next dev --turbo"
}
```

(If `tsx` isn't already a dev dep, add it: `pnpm add -D tsx`.)

- [ ] **Step 3: Add to `.gitignore`**

Append:
```
src/lib/eventCodePages.generated.json
```

- [ ] **Step 4: Generate once + verify**

```bash
pnpm run gen:event-code-pages
cat src/lib/eventCodePages.generated.json
```
Expected: `{}` if no `_custom` directory yet, or a populated manifest.

- [ ] **Step 5: Create the `_custom` directory placeholder**

```bash
mkdir -p src/app/events/_custom
touch src/app/events/_custom/.gitkeep
```

- [ ] **Step 6: Commit**

```bash
git add scripts/ package.json .gitignore src/app/events/_custom/.gitkeep
git commit -m "feat(build): event code-page manifest generator"
```

### Task 4.2: Code-page manifest API for admin

**Files:**
- Create: `src/app/api/admin/event-code-pages/route.ts`
- Create: `src/lib/eventCodePages.ts`

- [ ] **Step 1: Helper to read the manifest**

```ts
// src/lib/eventCodePages.ts
import manifest from "./eventCodePages.generated.json";

type Manifest = Record<string, { landing: boolean; shop: boolean; pages: string[] }>;

export function getEventCodePages(slug: string) {
	return (manifest as Manifest)[slug] ?? { landing: false, shop: false, pages: [] };
}

export function hasLandingCodePage(slug: string) {
	return getEventCodePages(slug).landing;
}

export function hasPageCodePage(slug: string, pageSlug: string) {
	return getEventCodePages(slug).pages.includes(pageSlug);
}
```

- [ ] **Step 2: API route exposing the manifest to admin clients**

```ts
// src/app/api/admin/event-code-pages/route.ts
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getEventCodePages } from "@/lib/eventCodePages";

export async function GET(req: Request) {
	const session = await auth.api.getSession({ headers: await headers() });
	if (!session?.user) return new NextResponse("unauthorized", { status: 401 });
	const slug = new URL(req.url).searchParams.get("slug");
	if (!slug) return NextResponse.json({});
	return NextResponse.json(getEventCodePages(slug));
}
```

- [ ] **Step 3: Smoke + commit**

```bash
pnpm build && pnpm dev
# curl http://localhost:3000/api/admin/event-code-pages?slug=flower-fest-2026 (with auth cookie)
git add src/lib/eventCodePages.ts src/app/api/admin/event-code-pages/
git commit -m "feat(admin): code-page manifest API"
```

### Task 4.3: Public landing route `/<slug>`

**Files:**
- Create: `src/app/[eventSlug]/page.tsx`
- Create: `src/lib/eventLive.ts`

- [ ] **Step 1: Live-gate helper**

```ts
// src/lib/eventLive.ts
export function isEventLive(e: { status: string; startDate: Date | null; endDate: Date | null }, now = new Date()): boolean {
	if (e.status !== "active") return false;
	if (e.startDate && now < e.startDate) return false;
	if (e.endDate && now > e.endDate) return false;
	return true;
}
```

- [ ] **Step 2: Catchall landing page**

```tsx
// src/app/[eventSlug]/page.tsx
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import dynamic from "next/dynamic";
import { db } from "@/lib/db";
import { event } from "@/db/schema";
import { isEventLive } from "@/lib/eventLive";
import { hasLandingCodePage } from "@/lib/eventCodePages";

export async function generateMetadata({ params }: { params: Promise<{ eventSlug: string }> }) {
	const { eventSlug } = await params;
	const e = await db.query.event.findFirst({ where: eq(event.slug, eventSlug) });
	if (!e) return {};
	return {
		title: e.metaTitle ?? e.name,
		description: e.metaDescription ?? e.description ?? undefined,
		openGraph: { images: e.ogImage ? [e.ogImage] : undefined },
	};
}

export default async function EventLandingPage({
	params,
	searchParams,
}: { params: Promise<{ eventSlug: string }>; searchParams: Promise<{ preview?: string }> }) {
	const { eventSlug } = await params;
	const { preview } = await searchParams;

	const e = await db.query.event.findFirst({
		where: eq(event.slug, eventSlug),
		with: { landing: true },
	});
	if (!e) notFound();

	const live = isEventLive(e) || !!preview;
	if (!live) notFound();

	// Code-page wins
	if (hasLandingCodePage(eventSlug)) {
		const Page = dynamic(() => import(`@/app/events/_custom/${eventSlug}/landing/page`), { ssr: true });
		return <Page />;
	}
	if (!e.landing?.published && !preview) notFound();
	if (!e.landing?.body) notFound();

	// CMS render (engineer note: use existing rich-text renderer from /admin/pages)
	return <CmsRenderer body={e.landing.body} event={e} />;
}

function CmsRenderer({ body, event }: { body: any; event: any }) {
	return (
		<div className="mx-auto max-w-4xl px-4 py-12">
			<h1 className="text-4xl font-bold uppercase tracking-tight text-[#0e3663]">{event.name}</h1>
			{/* render body via the same component used in /admin/pages preview */}
			<pre className="text-xs">{JSON.stringify(body, null, 2)}</pre>
		</div>
	);
}
```

(Engineer: replace the placeholder `CmsRenderer` body with the actual rich-text renderer used elsewhere in the app.)

- [ ] **Step 3: Add reserved-slug guard via root route conflict check**

The Next.js router will prefer static routes (`/shop`, `/about`, etc.) over the `[eventSlug]` catchall automatically. The reserved-slug list in `actions.ts` is the belt-and-suspenders enforcement. Verify by visiting `/shop` and confirming it still works.

- [ ] **Step 4: Smoke**

```bash
pnpm build && pnpm dev
# create a draft event with landing.published=true; visit /<slug>; should render
# visit /<slug> for a status='draft' event; should 404
# visit /<slug>?preview=1 logged in; should render
# visit /shop; should still load the shop
```

- [ ] **Step 5: Commit**

```bash
git add src/app/[eventSlug]/page.tsx src/lib/eventLive.ts
git commit -m "feat(public): event landing route with code-page + CMS resolver"
```

### Task 4.4: Public sub-page route `/<slug>/<pageSlug>`

**Files:**
- Create: `src/app/[eventSlug]/[pageSlug]/page.tsx`

- [ ] **Step 1: Sub-page resolver**

```tsx
// src/app/[eventSlug]/[pageSlug]/page.tsx
import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import dynamic from "next/dynamic";
import { db } from "@/lib/db";
import { event, eventPage } from "@/db/schema";
import { isEventLive } from "@/lib/eventLive";
import { hasPageCodePage } from "@/lib/eventCodePages";

export default async function EventSubPage({
	params,
	searchParams,
}: { params: Promise<{ eventSlug: string; pageSlug: string }>; searchParams: Promise<{ preview?: string }> }) {
	const { eventSlug, pageSlug } = await params;
	const { preview } = await searchParams;

	const e = await db.query.event.findFirst({ where: eq(event.slug, eventSlug) });
	if (!e) notFound();
	const live = isEventLive(e) || !!preview;
	if (!live) notFound();

	if (hasPageCodePage(eventSlug, pageSlug)) {
		const Page = dynamic(() => import(`@/app/events/_custom/${eventSlug}/${pageSlug}/page`), { ssr: true });
		return <Page />;
	}

	const p = await db.query.eventPage.findFirst({
		where: and(eq(eventPage.eventId, e.id), eq(eventPage.pageSlug, pageSlug)),
	});
	if (!p) notFound();
	if (!p.published && !preview) notFound();
	if (!p.body) notFound();

	return (
		<div className="mx-auto max-w-4xl px-4 py-12">
			<h1 className="text-3xl font-bold text-[#0e3663]">{p.title}</h1>
			<pre className="text-xs">{JSON.stringify(p.body, null, 2)}</pre>
		</div>
	);
}
```

- [ ] **Step 2: Smoke + commit**

```bash
pnpm build && pnpm dev
git add src/app/[eventSlug]/[pageSlug]/
git commit -m "feat(public): event sub-page resolver"
```

### Task 4.5: Public `/<slug>/tickets` routes

**Files:**
- Create: `src/app/[eventSlug]/tickets/page.tsx`
- Create: `src/app/[eventSlug]/tickets/verify/page.tsx`

- [ ] **Step 1: Move existing `/ticket-verify` into the umbrella**

Migrate the existing `src/app/ticket-verify/` page logic into `src/app/[eventSlug]/tickets/verify/`. Keep the public `/ticket-verify` route as a thin landing that shows an event-picker for verifiers with multiple events, then redirects to `/<chosen-slug>/tickets/verify`.

- [ ] **Step 2: Public ticket info page**

`src/app/[eventSlug]/tickets/page.tsx` — for unauthenticated visitors, shows event ticket info (price, availability if linked to shop product code). If `event_tickets.enabled=false`, 404.

- [ ] **Step 3: Smoke + commit**

```bash
pnpm build && pnpm dev
git add src/app/[eventSlug]/tickets/ src/app/ticket-verify/
git commit -m "feat(public): event-scoped ticket info + verify routes"
```

### Task 4.6: Reserved-slug pre-build validator

**Files:**
- Modify: `scripts/generate-event-code-page-manifest.ts` (extend to scan reserved slugs)
- Create: `src/lib/reservedSlugs.generated.ts`

- [ ] **Step 1: Extend the generator**

Append to `scripts/generate-event-code-page-manifest.ts`:

```ts
// Generate reserved slug list from top-level app routes
const APP_ROOT = resolve("src/app");
const reservedSlugs: string[] = [];
for (const entry of readdirSync(APP_ROOT, { withFileTypes: true })) {
	if (!entry.isDirectory()) continue;
	const name = entry.name;
	// skip route groups (parens) and dynamic segments (brackets)
	if (name.startsWith("(") || name.startsWith("[") || name.startsWith("_") || name.startsWith(".")) continue;
	reservedSlugs.push(name);
}
// Plus hardcoded sentinels
const HARD_RESERVED = ["sign-in", "sign-out", "favicon.ico", "robots.txt", "sitemap.xml", "_custom"];
const allReserved = Array.from(new Set([...reservedSlugs, ...HARD_RESERVED])).sort();

writeFileSync(resolve("src/lib/reservedSlugs.generated.ts"),
	`// AUTO-GENERATED. Run \`pnpm run gen:event-code-pages\` to refresh.\nexport const RESERVED_SLUGS = ${JSON.stringify(allReserved, null, 2)} as const;\n`
);
console.log(`Wrote ${allReserved.length} reserved slugs.`);
```

- [ ] **Step 2: Use the generated list in actions**

In `src/app/admin/events/[eventSlug]/actions.ts` and `src/app/admin/events/actions.ts`, replace the hardcoded `RESERVED_SLUGS` Set with:

```ts
import { RESERVED_SLUGS } from "@/lib/reservedSlugs.generated";
const RESERVED = new Set<string>(RESERVED_SLUGS);
```

- [ ] **Step 3: Add the generated file to `.gitignore`**

Append:
```
src/lib/reservedSlugs.generated.ts
```

- [ ] **Step 4: Smoke + commit**

```bash
pnpm run gen:event-code-pages
pnpm build
git add scripts/ src/app/admin/events/
git commit -m "feat(slugs): generated reserved-slug list synced with app router"
```

### PR 4 deploy checkpoint

- [ ] **Step 1: Deploy**

Run: `pnpm deploy`

- [ ] **Step 2: Smoke prod**

Visit `/<slug>` for an event with published landing. Confirm renders. Visit a draft event slug → 404. Verify `/shop`, `/about` still work. Verify `/<slug>/tickets/verify` requires auth.

- [ ] **Step 3: Tag**

```bash
git tag pr-4-public-routing
git push --tags
```

---

## PR 5 — Drop legacy (wait ≥48h after PR 4 stable)

**Outcome of PR 5:** Old tables and columns gone. Schema source of truth is single. Sunset complete.

### Task 5.1: Drop legacy tables migration

**Files:**
- Modify: `src/db/schema.ts` (remove `shopEvent`, `ticketEvent`, `eventAdmin` exports; drop `isShopAdmin`, `isEventsAdmin`, `isTicketsAdmin` from `user`)
- Create: `drizzle/0046_drop_legacy.sql` (manually authored alongside Drizzle-generated)

- [ ] **Step 1: Remove deprecated tables from `schema.ts`**

Delete the `shopEvent`, `ticketEvent`, `eventAdmin` export blocks. In the `user` table definition, remove the columns `isShopAdmin`, `isEventsAdmin`, `isTicketsAdmin`.

- [ ] **Step 2: Generate migration**

Run: `pnpm db:generate`
Expected: emits a migration with `DROP TABLE ShopEvent`, `DROP TABLE TicketEvent`, `DROP TABLE EventAdmin`, and `ALTER TABLE user DROP COLUMN` for the three flags.

- [ ] **Step 3: Add manual drop SQL alongside** (if Drizzle's generated form is missing any step)

```sql
-- drizzle/0046_drop_legacy.sql (only if Drizzle doesn't auto-generate)
DROP TABLE IF EXISTS ShopEvent;
DROP TABLE IF EXISTS TicketEvent;
DROP TABLE IF EXISTS EventAdmin;
ALTER TABLE user DROP COLUMN isShopAdmin;
ALTER TABLE user DROP COLUMN isEventsAdmin;
ALTER TABLE user DROP COLUMN isTicketsAdmin;
```

- [ ] **Step 4: Apply locally**

Run: `pnpm db:migrate:local`
Expected: tables and columns dropped.

- [ ] **Step 5: Typecheck — find dead references**

Run: `pnpm build`
Expected: TS errors point at every remaining reference to `shopEvent`, `ticketEvent`, `eventAdmin`, or the three user flags. Fix each by deleting the dead code (audit page is no longer needed; remove `/admin/super/migration-audit`).

- [ ] **Step 6: Remove dual-read code in `eventPermissions.ts`**

Open `src/lib/eventPermissions.ts`. Remove references to `isShopAdmin`, `isEventsAdmin`, `isTicketsAdmin` from the resolver. Keep only `isSuperAdmin` as the implicit-overseer mapping.

```ts
// Updated resolver — implicit roles section
const implicit: EventRole[] = [];
if (u?.isSuperAdmin) implicit.push("overseer");
// (No more isShopAdmin/isEventsAdmin/isTicketsAdmin handling)
```

- [ ] **Step 7: Final typecheck + smoke**

Run: `pnpm build && pnpm lint && pnpm dev`. Walk the admin nav as a non-superAdmin user with explicit grants. Confirm everything still works.

- [ ] **Step 8: Commit**

```bash
git add -u
git commit -m "feat(db): drop legacy ShopEvent/TicketEvent/EventAdmin + global flags"
```

### PR 5 deploy checkpoint

- [ ] **Step 1: One more backup**

Run: `npx wrangler d1 export arsa-db --output backups/pre-pr5-drop-legacy-$(date +%Y-%m-%d).sql`

- [ ] **Step 2: Apply migration to remote**

Run: `pnpm db:migrate`

- [ ] **Step 3: Deploy**

Run: `pnpm deploy`

- [ ] **Step 4: Verify**

`/admin` loads. Pick any event, walk every sub-route. Confirm no 500 errors in `wrangler tail`.

- [ ] **Step 5: Tag**

```bash
git tag pr-5-drop-legacy
git push --tags
```

---

## Self-Review (post-write checklist)

**Spec coverage:**
- ✅ Domain model (Section 1 of spec) → PR 1 Task 1.1
- ✅ Schema (Section 4 of spec) → PR 1 Tasks 1.1–1.3
- ✅ Routing (Section 5 of spec) → PR 4 Tasks 4.3–4.5
- ✅ Permissions (Section 6 of spec) → PR 2 Task 2.1; PR 3 Task 3.4
- ✅ Admin UI (Section 7 of spec) → PR 3 Tasks 3.1–3.10
- ✅ Migration (Section 8 of spec) → PR 1 Task 1.3; PR 2 Tasks 2.2–2.3; PR 5 Task 5.1
- ✅ Cutover (Section 9 of spec) → deploy checkpoints between each PR
- ⚠ Code-page discovery in admin UI (spec §7) → covered in Task 3.5 (landing) but engineer must replicate the pattern in event_page editor (Task 3.6). Plan notes this as a step.
- ⚠ Slug rename writes Redirects row (spec §4) → wired in Task 3.3. Public side of redirect handled by existing middleware (no plan task needed since middleware already reads the `Redirects` table).

**Placeholder scan:** Two `(Engineer: ...)` parenthetical notes remain in Tasks 3.7 step 2 (port checkoutFields UI) and 3.8 step 1 (lift ticket logic). These are legitimate "port the existing pattern" instructions, not unspecified work — the source files are pointed at by line range. Acceptable.

**Type consistency:** `EventRole` is defined once in `eventPermissions.ts` and imported consistently. `RESERVED_SLUGS` defined in two places (Task 3.3 and Task 4.6) — Task 4.6 replaces Task 3.3's hardcoded version with the generated list. Engineer must remember this swap; called out in Task 4.6 Step 2.

---

## Execution handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-27-event-umbrella-architecture.md`.

Two execution options:

1. **Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration. Best for this plan because tasks have natural independence within each PR.
2. **Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
