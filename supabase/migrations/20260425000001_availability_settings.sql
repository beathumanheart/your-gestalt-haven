-- Phase 1: booking horizon, minimum notice, multi-day date overrides
--
-- 1. Add buffer_minutes to availability_rules (was added via dashboard, not in migrations)
-- 2. Extend availability_overrides for range support + soft delete
-- 3. Create settings table for booking_horizon_days and minimum_notice_hours

ALTER TABLE public.availability_rules
  ADD COLUMN IF NOT EXISTS buffer_minutes integer NOT NULL DEFAULT 0;

-- Extend availability_overrides: end_date (range), soft delete, buffer_minutes for open overrides
ALTER TABLE public.availability_overrides
  ADD COLUMN IF NOT EXISTS end_date       date        NULL,
  ADD COLUMN IF NOT EXISTS deleted_at     timestamptz NULL,
  ADD COLUMN IF NOT EXISTS buffer_minutes integer     NOT NULL DEFAULT 0;

-- Backfill end_date = override_date for existing single-date rows
UPDATE public.availability_overrides
  SET end_date = override_date
  WHERE end_date IS NULL;

ALTER TABLE public.availability_overrides
  ALTER COLUMN end_date SET NOT NULL;

ALTER TABLE public.availability_overrides
  ADD CONSTRAINT chk_avail_override_end_gte_start
  CHECK (end_date >= override_date);

CREATE INDEX IF NOT EXISTS idx_avail_overrides_active_range
  ON public.availability_overrides (override_date, end_date)
  WHERE deleted_at IS NULL;

-- Settings table: global config values as JSONB key/value rows
CREATE TABLE IF NOT EXISTS public.settings (
  key              text        PRIMARY KEY,
  value            jsonb       NOT NULL,
  updated_at       timestamptz NOT NULL DEFAULT now(),
  updated_by_audit jsonb       NULL  -- [{timestamp, old_value, source}]
);

ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Clients need to read settings to enforce horizon/notice on the booking page
CREATE POLICY "Anyone can read settings" ON public.settings
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage settings" ON public.settings
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

INSERT INTO public.settings (key, value) VALUES
  ('booking_horizon_days', to_jsonb(180)),
  ('minimum_notice_hours', to_jsonb(24))
ON CONFLICT (key) DO NOTHING;
