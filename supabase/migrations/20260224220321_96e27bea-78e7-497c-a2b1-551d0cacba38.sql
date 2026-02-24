
-- Expand the app_role enum with granular roles
-- admin = full access (read, write, manage users & settings)
-- editor = read + write (manage bookings & availability, no user management)
-- client = client-specific permissions (view own bookings, book sessions)
-- user = basic authenticated user
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'editor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'client';
