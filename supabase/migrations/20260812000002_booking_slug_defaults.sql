-- Make schema and Edge Function deploys order-independent.
--
-- 20260812000001 added bookings.slug / moderator_slug as NOT NULL with no
-- default. That made the two halves of a deploy mutually dependent in both
-- directions: a function deployed before the migration inserts into columns
-- that do not exist, and a migration applied before the function leaves the
-- old function omitting NOT NULL columns. The second case took booking
-- creation down in production on 2026-08-12.
--
-- A database-side default closes the second direction: an older function that
-- knows nothing about slugs still produces a valid row. The Edge Function
-- continues to generate slugs itself — it needs the values to build the email
-- links before the insert returns — so this is a safety net, not the primary
-- path.

-- The generator is SECURITY DEFINER and 20260812000001 revoked EXECUTE from
-- PUBLIC, which also removed the implicit grant every role inherits. A column
-- default is evaluated with the privileges of the role performing the INSERT,
-- so without this grant the default would fail with "permission denied for
-- function generate_booking_slug".
--
-- service_role only: that is the role the Edge Function uses. anon and
-- authenticated may INSERT into bookings under the "Anyone can create
-- bookings" policy, but the application always routes through the Edge
-- Function, and a direct anon insert that omits the slug already fails today
-- on the NOT NULL constraint. Leaving them without EXECUTE keeps that path
-- closed rather than quietly opening it.
GRANT EXECUTE ON FUNCTION public.generate_booking_slug(integer) TO service_role;

ALTER TABLE public.bookings
  ALTER COLUMN slug SET DEFAULT public.generate_booking_slug(),
  ALTER COLUMN moderator_slug SET DEFAULT public.generate_booking_slug();

-- The two tokens must never be equal: the client's link would then confer
-- moderator rights. Two independent calls to a CSPRNG generator make this
-- vanishingly unlikely rather than impossible, and the defaults above cannot
-- see each other's value within a single INSERT, so state the invariant.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'bookings_slug_distinct'
      AND conrelid = 'public.bookings'::regclass
  ) THEN
    ALTER TABLE public.bookings
      ADD CONSTRAINT bookings_slug_distinct CHECK (slug <> moderator_slug);
  END IF;
END;
$$;
