-- repoint_ticket_fks.sql
-- For TicketEvent rows merged into an existing event during audit
-- (TicketEvent.id != target event.id), re-point ticket.ticketEventId
-- and TicketVerifier.ticketEventId to the umbrella event.id.
--
-- Run AFTER the audit page has merged ambiguous rows via mergeTicketEventIntoEvent().
-- Safe to re-run: WHERE clauses are idempotent (no-op if already repointed).

UPDATE Ticket
SET ticketEventId = (
  SELECT et.eventId FROM event_tickets et
  JOIN TicketEvent te ON te.id = Ticket.ticketEventId
  WHERE et.eventId != te.id
    AND et.eventId IN (
      SELECT e.id FROM event e
      WHERE e.slug = lower(replace(replace(replace(te.name, ' ', '-'), '''', ''), '"', ''))
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
