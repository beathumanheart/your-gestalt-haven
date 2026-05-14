-- Hidden offers: unlisted booking pages sent via email to specific people.
-- Each offer has its own slug, title, description, conditions, and price.
-- Bookings made via an offer reference hidden_offer_id instead of session_type_id.

-- ── 1. hidden_offers table ────────────────────────────────────────────────────

CREATE TABLE public.hidden_offers (
  id                 uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  slug               text        UNIQUE NOT NULL,
  name               text        NOT NULL,   -- internal label (admin-facing)
  title              text        NOT NULL,   -- shown on the booking page (h1)
  description        text        NOT NULL,   -- markdown
  conditions         text        NOT NULL,   -- markdown; always required
  notification_email text        NULL,       -- therapist notification override; falls back to SENDER_EMAIL
  price_cents        integer     NOT NULL DEFAULT 0,
  duration_minutes   integer     NOT NULL DEFAULT 60,
  language           text        NOT NULL DEFAULT 'en',
  is_active          boolean     NOT NULL DEFAULT true,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hidden_offers ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can read offers that are currently active.
-- This is needed for the public booking page to load offer details.
CREATE POLICY "public_read_active_hidden_offers"
  ON public.hidden_offers FOR SELECT
  USING (is_active = true);

-- Genia (admin email, matches VITE_PUBLIC_ADMIN_EMAIL) can read ALL offers,
-- including inactive ones, so the admin UI can list and edit them.
-- Using auth.jwt() ->> 'email' rather than has_role() gives an independent
-- second layer of control that survives role-table accidents.
CREATE POLICY "admin_read_all_hidden_offers"
  ON public.hidden_offers FOR SELECT
  USING ((auth.jwt() ->> 'email') = 'be@humanheart.life');

-- Only the admin email may create, update, or delete offers.
CREATE POLICY "admin_write_hidden_offers"
  ON public.hidden_offers FOR INSERT
  WITH CHECK ((auth.jwt() ->> 'email') = 'be@humanheart.life');

CREATE POLICY "admin_update_hidden_offers"
  ON public.hidden_offers FOR UPDATE
  USING  ((auth.jwt() ->> 'email') = 'be@humanheart.life')
  WITH CHECK ((auth.jwt() ->> 'email') = 'be@humanheart.life');

CREATE POLICY "admin_delete_hidden_offers"
  ON public.hidden_offers FOR DELETE
  USING ((auth.jwt() ->> 'email') = 'be@humanheart.life');

-- Reuse the existing update_updated_at() trigger function
CREATE TRIGGER update_hidden_offers_updated_at
  BEFORE UPDATE ON public.hidden_offers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- ── 2. Alter bookings to support offer bookings ───────────────────────────────

-- session_type_id was NOT NULL; relax it so offer bookings (which have no
-- session type) can be stored.
ALTER TABLE public.bookings
  ALTER COLUMN session_type_id DROP NOT NULL;

-- FK to hidden_offers; NULL for regular (session-type) bookings.
ALTER TABLE public.bookings
  ADD COLUMN hidden_offer_id      uuid        NULL REFERENCES public.hidden_offers(id),
  ADD COLUMN conditions_accepted_at timestamptz NULL;

-- Exactly one of session_type_id or hidden_offer_id must be set on every booking.
-- This prevents orphaned rows and makes the data model unambiguous.
ALTER TABLE public.bookings
  ADD CONSTRAINT bookings_one_source_check CHECK (
    (session_type_id IS NOT NULL AND hidden_offer_id IS NULL) OR
    (session_type_id IS NULL     AND hidden_offer_id IS NOT NULL)
  );

-- Index to support admin queries filtered by offer (e.g. booking counts per offer).
CREATE INDEX idx_bookings_hidden_offer_id
  ON public.bookings (hidden_offer_id)
  WHERE hidden_offer_id IS NOT NULL;
