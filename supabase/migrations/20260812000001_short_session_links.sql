-- Short session links (humanheart.life/s/<slug>) replacing raw JaaS URLs in email and .ics.
--
-- The slug is the ONLY secret protecting a session room, so it is treated as a
-- capability token: CSPRNG-generated, unique, and unreadable through the anon key.

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- ── Slug generator ─────────────────────────────────────────────
-- 12 chars of base62 ≈ 71 bits of entropy. Rejection sampling (cutoff 248)
-- keeps the distribution uniform; the TS generator in the edge function uses
-- the same alphabet and the same cutoff.
CREATE OR REPLACE FUNCTION public.generate_booking_slug(p_len integer DEFAULT 12)
RETURNS text
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = 'public', 'extensions'
AS $$
DECLARE
  alphabet CONSTANT text := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  candidate text;
  byte_val integer;
BEGIN
  LOOP
    candidate := '';
    WHILE length(candidate) < p_len LOOP
      byte_val := get_byte(gen_random_bytes(1), 0);
      -- 248 = 4 * 62; bytes at or above it would bias the low end of the alphabet
      IF byte_val < 248 THEN
        candidate := candidate || substr(alphabet, (byte_val % 62) + 1, 1);
      END IF;
    END LOOP;

    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.bookings
      WHERE slug = candidate OR moderator_slug = candidate
    );
  END LOOP;

  RETURN candidate;
END;
$$;

-- ── Booking columns ────────────────────────────────────────────
-- slug           → client join link  (/s/<slug>) and cancel link (/c/<slug>)
-- moderator_slug → practitioner join link; separate token so the client's link
--                  can never confer moderator rights.
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS moderator_slug text,
  -- iCalendar SEQUENCE. Bumped on cancel/reschedule so clients treat the new
  -- .ics as an update rather than a second, orphaned event.
  ADD COLUMN IF NOT EXISTS calendar_sequence integer NOT NULL DEFAULT 0;

-- Backfill every existing row (not just future ones) so the NOT NULL below holds
-- and old confirmation links can be re-sent if needed.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT id FROM public.bookings WHERE slug IS NULL OR moderator_slug IS NULL LOOP
    UPDATE public.bookings
      SET slug           = COALESCE(slug, public.generate_booking_slug()),
          moderator_slug = COALESCE(moderator_slug, public.generate_booking_slug())
      WHERE id = r.id;
  END LOOP;
END;
$$;

ALTER TABLE public.bookings
  ALTER COLUMN slug SET NOT NULL,
  ALTER COLUMN moderator_slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS bookings_slug_key ON public.bookings (slug);
CREATE UNIQUE INDEX IF NOT EXISTS bookings_moderator_slug_key ON public.bookings (moderator_slug);

-- ── Lock down public reads of bookings ─────────────────────────
-- The previous policy was `FOR SELECT USING (true)`, which exposed every
-- booking row — client_email, notes, and now the slug — to anyone holding the
-- anon key. Nothing in the SPA reads this table outside the admin pages;
-- public availability goes through get_booked_slots(), which is SECURITY DEFINER.
DROP POLICY IF EXISTS "Clients can view own bookings by email" ON public.bookings;

-- ── Per-session-type calendar summary ──────────────────────────
-- What the client's calendar shows. NULL falls back to a deliberately
-- non-specific default ("Session with Genia") rather than the service name,
-- since this string syncs to third-party calendar infrastructure.
ALTER TABLE public.session_types
  ADD COLUMN IF NOT EXISTS calendar_summary text;
ALTER TABLE public.hidden_offers
  ADD COLUMN IF NOT EXISTS calendar_summary text;

-- ── Rate limiting ──────────────────────────────────────────────
-- Fixed-window counter. The join endpoint is guessable-by-construction
-- (slug is the only secret), so unauthenticated lookups are capped per IP.
-- `hits` rather than `count` so nothing in the upsert below can be mistaken
-- for the aggregate function.
CREATE TABLE IF NOT EXISTS public.rate_limits (
  bucket       text PRIMARY KEY,
  hits         integer NOT NULL DEFAULT 0,
  window_start timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
-- No policies: reachable only by the service role (which bypasses RLS).

CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_bucket text,
  p_max integer,
  p_window_seconds integer
)
RETURNS boolean
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  current_hits integer;
BEGIN
  INSERT INTO public.rate_limits AS rl (bucket, hits, window_start)
  VALUES (p_bucket, 1, now())
  ON CONFLICT (bucket) DO UPDATE
    SET hits = CASE
                 WHEN rl.window_start < now() - make_interval(secs => p_window_seconds)
                 THEN 1
                 ELSE rl.hits + 1
               END,
        window_start = CASE
                 WHEN rl.window_start < now() - make_interval(secs => p_window_seconds)
                 THEN now()
                 ELSE rl.window_start
               END
  RETURNING rl.hits INTO current_hits;

  RETURN current_hits <= p_max;
END;
$$;

-- Housekeeping: drop buckets nobody has touched in a day.
CREATE OR REPLACE FUNCTION public.prune_rate_limits()
RETURNS void
LANGUAGE sql
VOLATILE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  DELETE FROM public.rate_limits WHERE window_start < now() - interval '1 day';
$$;

REVOKE ALL ON FUNCTION public.check_rate_limit(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.prune_rate_limits() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.generate_booking_slug(integer) FROM PUBLIC, anon, authenticated;
