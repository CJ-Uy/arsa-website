-- backfill_event_umbrella.sql
-- Backfill `event` and submodule rows from existing ShopEvent and TicketEvent.
-- ShopEvent IDs are preserved in `event.id` so existing FKs
-- (EventProduct.eventId, EventCategory.eventId, ShopClick.eventId,
--  ShopPurchase.eventId, Order.eventId) remain valid without re-pointing.
-- Run once per environment with: wrangler d1 execute arsa-db --file=...

-- 1. Backfill `event` from ShopEvent
INSERT INTO event (
  id, slug, name, description, status,
  startDate, endDate, heroImages, theme,
  priority, tabLabel, ogImage, metaTitle, metaDescription,
  createdAt, updatedAt
)
SELECT
  id,
  slug,
  name,
  description,
  CASE WHEN isActive = 1 THEN 'active' ELSE 'archived' END,
  startDate,
  endDate,
  COALESCE(heroImageUrls, '[]'),
  themeConfig,
  CASE WHEN isPriority = 1 THEN 1000 + tabOrder ELSE tabOrder END,
  tabLabel,
  NULL, NULL, NULL,
  createdAt,
  updatedAt
FROM ShopEvent;

-- 2. Backfill `event_shop` (every ShopEvent gets a shop row, enabled=1)
-- Note: old ShopEvent had a single `checkoutConfig` JSON blob;
-- new schema splits into checkoutFields (NULL for now) + checkoutConfig.
INSERT INTO event_shop (
  eventId, enabled,
  checkoutFields, checkoutConfig, hasCustomCheckout,
  exclusivePricing, codePath,
  dailyCutoffTime, deliveryLeadDays,
  isShopClosed, closureMessage,
  allowScheduledDelivery, minDeliveryDate, maxDeliveryDate,
  blockedDeliverySlots,
  lastToggledAt, createdAt, updatedAt
)
SELECT
  id,
  1,
  NULL,
  checkoutConfig,
  hasCustomCheckout,
  0,
  componentPath,
  dailyCutoffTime, deliveryLeadDays,
  isShopClosed, closureMessage,
  allowScheduledDelivery, minDeliveryDate, maxDeliveryDate,
  blockedDeliverySlots,
  (strftime('%s', 'now') * 1000),
  createdAt,
  updatedAt
FROM ShopEvent;

-- 3. Backfill `event` from TicketEvent (skip rows whose id or slug already exists)
INSERT INTO event (
  id, slug, name, description, status,
  startDate, endDate, heroImages, theme,
  priority, createdAt, updatedAt
)
SELECT
  id,
  lower(replace(replace(replace(name, ' ', '-'), '''', ''), '"', '')),
  name,
  description,
  CASE WHEN isActive = 1 THEN 'active' ELSE 'archived' END,
  date, date,
  '[]',
  NULL,
  0,
  createdAt,
  updatedAt
FROM TicketEvent
WHERE id NOT IN (SELECT id FROM event)
  AND lower(replace(replace(replace(name, ' ', '-'), '''', ''), '"', ''))
      NOT IN (SELECT slug FROM event);

-- 4. Backfill `event_tickets` (one row per TicketEvent matched to an event row)
INSERT INTO event_tickets (
  eventId, enabled, defaultActive, sheetSyncEnabled,
  lastToggledAt, createdAt, updatedAt
)
SELECT
  COALESCE(
    (SELECT e.id FROM event e WHERE e.id = te.id),
    (SELECT e.id FROM event e WHERE e.slug = lower(replace(replace(replace(te.name, ' ', '-'), '''', ''), '"', '')))
  ) AS eventId,
  1, 1, 0,
  (strftime('%s', 'now') * 1000),
  te.createdAt,
  te.updatedAt
FROM TicketEvent te
WHERE COALESCE(
  (SELECT e.id FROM event e WHERE e.id = te.id),
  (SELECT e.id FROM event e WHERE e.slug = lower(replace(replace(replace(te.name, ' ', '-'), '''', ''), '"', '')))
) IS NOT NULL;
