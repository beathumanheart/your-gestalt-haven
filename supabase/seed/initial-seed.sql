-- Initial seed for humanheart-life
-- Run AFTER all migrations in phase3-schema.md are applied.
-- Run in: Supabase Dashboard → SQL Editor → New query

-- ── Step 1: Create the admin user ────────────────────────────────
--
-- You cannot create auth users via SQL directly. Use the Supabase Dashboard:
--
--   Authentication → Users → Add user → Email & Password
--   Email:    be@humanheart.life   (or your admin email)
--   Password: generate with `openssl rand -base64 24`
--
-- After creating the user, note the UUID shown in the Users list.
-- Then run the block below, replacing <ADMIN_USER_UUID> with that UUID.

-- ── Step 2: Assign admin role ────────────────────────────────────
-- Replace <ADMIN_USER_UUID> with the UUID from step 1.

INSERT INTO public.user_roles (user_id, role)
VALUES ('<ADMIN_USER_UUID>', 'admin');

-- Verify:
-- SELECT u.email, r.role FROM auth.users u JOIN public.user_roles r ON r.user_id = u.id;

-- ── Step 3: Seed session types ───────────────────────────────────
-- Minimum set needed for the booking widget to show options.
-- Edit names, descriptions, prices, and durations to match your actual offerings.
-- The admin dashboard (SessionTypeManager) can also manage these after login.

INSERT INTO public.session_types (
  name, name_ru,
  description, description_ru,
  duration_minutes,
  pricing_type, price, min_price, max_price, currency,
  show_price,
  is_active, sort_order,
  slug,
  notification_email_1
) VALUES
(
  'Individual Session',
  'Индивидуальная сессия',
  'One-on-one Gestalt therapy session.',
  'Индивидуальная сессия гештальт-терапии.',
  50,
  'fixed', 80.00, NULL, NULL, 'EUR',
  true,
  true, 1,
  'individual-session',
  'be@humanheart.life'
),
(
  'Initial Consultation',
  'Первичная консультация',
  'A first meeting to discuss your goals and how we might work together.',
  'Первая встреча, чтобы обсудить ваши цели и то, как мы могли бы работать вместе.',
  30,
  'fixed', 40.00, NULL, NULL, 'EUR',
  true,
  true, 0,
  'initial-consultation',
  'be@humanheart.life'
);

-- ── Step 4: Seed availability rules ─────────────────────────────
-- Example: Monday–Friday, 10:00–18:00, 15-minute buffer between slots.
-- Edit days and times to match actual schedule.
-- day_of_week: 0=Sunday, 1=Monday ... 6=Saturday

INSERT INTO public.availability_rules (day_of_week, start_time, end_time, buffer_minutes, is_active)
VALUES
  (1, '10:00', '18:00', 15, true),  -- Monday
  (2, '10:00', '18:00', 15, true),  -- Tuesday
  (3, '10:00', '18:00', 15, true),  -- Wednesday
  (4, '10:00', '18:00', 15, true),  -- Thursday
  (5, '10:00', '18:00', 15, true);  -- Friday
