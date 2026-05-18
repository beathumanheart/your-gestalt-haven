-- Replace hours-based minimum_notice_hours with minutes-based booking_min_lead_time_minutes.
-- Stored in minutes for sub-hour flexibility; displayed in hours in admin UI.
-- Default: 1200 minutes (20 hours).

-- 1. Add new setting (minutes-based)
INSERT INTO public.settings (key, value)
VALUES ('booking_min_lead_time_minutes', to_jsonb(1200));

-- 2. Remove the old hours-based setting
DELETE FROM public.settings WHERE key = 'minimum_notice_hours';

-- 3. Per-offer lead time override on hidden_offers.
--    NULL means "use the global default".
--    0 means "no minimum lead time (same-day allowed)".
--    Max 10080 minutes = 1 week.
ALTER TABLE public.hidden_offers
  ADD COLUMN min_lead_time_minutes integer NULL
  CONSTRAINT hidden_offers_lead_time_range
    CHECK (min_lead_time_minutes IS NULL OR
           (min_lead_time_minutes >= 0 AND min_lead_time_minutes <= 10080));
