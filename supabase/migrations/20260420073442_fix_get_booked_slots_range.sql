-- Fix get_booked_slots to use a range overlap query instead of a date cast.
-- The previous implementation used start_time::date = target_date which was fragile:
-- it always cast to UTC date, causing mismatches when a client's local date differs
-- from the UTC date (e.g. UTC-5 users booking late evening).
-- The new query returns every booking whose window overlaps the full UTC calendar day
-- [target_date 00:00 UTC, target_date+1 00:00 UTC), which is correct for all timezones
-- now that bookings are stored as proper UTC ISO timestamps.

CREATE OR REPLACE FUNCTION public.get_booked_slots(target_date date)
RETURNS TABLE(start_time timestamptz, end_time timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT b.start_time, b.end_time
  FROM public.bookings b
  WHERE b.start_time < (target_date + 1)::timestamptz
    AND b.end_time   > target_date::timestamptz
    AND b.status    != 'cancelled'
$$;
