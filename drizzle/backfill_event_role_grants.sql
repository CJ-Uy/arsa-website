-- backfill_event_role_grants.sql
-- Backfill event_role_grant rows from global admin flags and EventAdmin rows.
-- Run after backfill_event_umbrella.sql populates the event table.

-- isShopAdmin OR isEventsAdmin -> overseer on every event
INSERT INTO event_role_grant (id, eventId, userId, role, grantedBy, grantedAt)
SELECT lower(hex(randomblob(16))),
       e.id, u.id, 'overseer', NULL, strftime('%s','now')*1000
FROM user u
CROSS JOIN event e
WHERE (u.isShopAdmin = 1 OR u.isEventsAdmin = 1)
  AND NOT EXISTS (
    SELECT 1 FROM event_role_grant g
    WHERE g.userId = u.id AND g.eventId = e.id AND g.role = 'overseer'
  );

-- isTicketsAdmin -> tickets_admin on every event (skip if already overseer)
INSERT INTO event_role_grant (id, eventId, userId, role, grantedBy, grantedAt)
SELECT lower(hex(randomblob(16))),
       e.id, u.id, 'tickets_admin', NULL, strftime('%s','now')*1000
FROM user u
CROSS JOIN event e
WHERE u.isTicketsAdmin = 1
  AND NOT EXISTS (
    SELECT 1 FROM event_role_grant g
    WHERE g.userId = u.id AND g.eventId = e.id
      AND g.role IN ('overseer', 'tickets_admin')
  );

-- EventAdmin rows -> overseer (per-event admin = full event control)
INSERT INTO event_role_grant (id, eventId, userId, role, grantedBy, grantedAt)
SELECT lower(hex(randomblob(16))),
       ea.eventId, ea.userId, 'overseer', NULL, ea.createdAt
FROM EventAdmin ea
WHERE NOT EXISTS (
  SELECT 1 FROM event_role_grant g
  WHERE g.userId = ea.userId AND g.eventId = ea.eventId AND g.role = 'overseer'
);
