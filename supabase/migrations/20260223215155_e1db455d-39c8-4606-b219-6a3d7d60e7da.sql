
-- Tighten bookings SELECT: only admins or matching client email (via edge function)
DROP POLICY "Clients can view own bookings by email" ON public.bookings;

-- Only admins can SELECT bookings (public booking creation stays open, reads go through edge functions)
CREATE POLICY "Admins can read all bookings" ON public.bookings
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
