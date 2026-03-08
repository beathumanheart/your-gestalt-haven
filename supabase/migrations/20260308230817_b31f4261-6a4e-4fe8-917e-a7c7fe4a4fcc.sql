
CREATE OR REPLACE FUNCTION public.get_booked_slots(target_date date)
RETURNS TABLE(start_time timestamptz, end_time timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT b.start_time, b.end_time
  FROM public.bookings b
  WHERE b.start_time::date = target_date
    AND b.status != 'cancelled'
$$;
