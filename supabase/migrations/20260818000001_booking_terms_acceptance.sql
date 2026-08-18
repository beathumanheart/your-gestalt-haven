-- Record which version of the offer agreement a client accepted, and when.
--
-- Distinct from conditions_accepted_at, which belongs to hidden offers and
-- records acceptance of that offer's own conditions block.
--
-- Both columns are written server-side by the process-booking Edge Function.
-- A client-supplied acceptance timestamp is worth nothing as evidence.

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS terms_version     text;

-- Deliberately NOT backfilled and deliberately nullable. Rows created before
-- the booking flow asked for consent have no acceptance record, and inventing
-- one would be worse than leaving it absent: NULL is the honest answer.
COMMENT ON COLUMN public.bookings.terms_accepted_at IS
  'Server-side timestamp of terms acceptance. NULL for bookings made before the consent step existed; never backfilled.';
COMMENT ON COLUMN public.bookings.terms_version IS
  'TERMS_VERSION shown to the client at acceptance, e.g. 2026-08-17. NULL for pre-consent bookings.';

-- Finding unaccepted bookings should not require a full scan once the table grows.
CREATE INDEX IF NOT EXISTS bookings_terms_accepted_at_idx
  ON public.bookings (terms_accepted_at)
  WHERE terms_accepted_at IS NULL;
