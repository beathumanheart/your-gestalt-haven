# Phase 3 — Step 3.2: Apply Schema to New Supabase

Run each block in **Supabase Dashboard → SQL Editor → New query**.
Run them in order. Verify each succeeds (green checkmark, no red errors) before
moving to the next.

---

## Migration 1 of 12 — Core tables, roles, RLS

```sql
-- Role system
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

CREATE POLICY "Users can read own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Session types
CREATE TABLE public.session_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  price DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.session_types ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active session types" ON public.session_types
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage session types" ON public.session_types
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Weekly availability rules
CREATE TABLE public.availability_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.availability_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active availability" ON public.availability_rules
  FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage availability" ON public.availability_rules
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Date-specific overrides
CREATE TABLE public.availability_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  override_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  is_available BOOLEAN NOT NULL DEFAULT false,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.availability_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view overrides" ON public.availability_overrides
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage overrides" ON public.availability_overrides
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Bookings
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_type_id UUID REFERENCES public.session_types(id) NOT NULL,
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  google_meet_link TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create bookings" ON public.bookings
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Clients can view own bookings by email" ON public.bookings
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage all bookings" ON public.bookings
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Timestamp triggers
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public
AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER update_session_types_updated_at
  BEFORE UPDATE ON public.session_types FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
```

---

## Migration 2 of 12 — Tighten bookings SELECT policy

```sql
DROP POLICY "Clients can view own bookings by email" ON public.bookings;

CREATE POLICY "Admins can read all bookings" ON public.bookings
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
```

---

## Migration 3 of 12 — Expand app_role enum

```sql
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'editor';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'client';
```

---

## Migration 4 of 12 — Fix bookings INSERT policy for anon users

```sql
DROP POLICY IF EXISTS "Anyone can create bookings" ON public.bookings;
CREATE POLICY "Anyone can create bookings" ON public.bookings
  FOR INSERT TO anon, authenticated WITH CHECK (true);
```

---

## Migration 5 of 12 — get_booked_slots function (initial)

```sql
CREATE OR REPLACE FUNCTION public.get_booked_slots(target_date date)
RETURNS TABLE(start_time timestamptz, end_time timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT b.start_time, b.end_time
  FROM public.bookings b
  WHERE b.start_time::date = target_date
    AND b.status != 'cancelled'
$$;
```

---

## Migration 6 of 12 — Add client_timezone to bookings

```sql
ALTER TABLE public.bookings ADD COLUMN IF NOT EXISTS client_timezone text DEFAULT 'UTC';
```

---

## Migration 7 of 12 — Add pricing columns to session_types

```sql
ALTER TABLE public.session_types
  ADD COLUMN pricing_type text NOT NULL DEFAULT 'fixed',
  ADD COLUMN min_price numeric NULL,
  ADD COLUMN max_price numeric NULL;
```

---

## Migration 8 of 12 — Add notification email columns to session_types

```sql
ALTER TABLE public.session_types
  ADD COLUMN notification_email_1 text DEFAULT NULL,
  ADD COLUMN notification_email_2 text DEFAULT NULL,
  ADD COLUMN show_second_email boolean NOT NULL DEFAULT false;
```

---

## Migration 9 of 12 — Add client_email_2 to bookings

```sql
ALTER TABLE public.bookings ADD COLUMN client_email_2 text DEFAULT NULL;
```

---

## Migration 10 of 12 — Add bilingual columns to session_types

```sql
ALTER TABLE public.session_types ADD COLUMN name_ru text, ADD COLUMN description_ru text;
```

---

## Migration 11 of 12 — Add slug to session_types

```sql
-- Add slug column (no UPDATE needed — table is empty in fresh install)
ALTER TABLE public.session_types ADD COLUMN slug text UNIQUE;
ALTER TABLE public.session_types ALTER COLUMN slug SET NOT NULL;
```

> **Note:** The original migration populated slugs from existing names. On a fresh
> database the table is empty so the UPDATE is omitted. The seed file inserts rows
> with slugs already set.

---

## Migration 12 of 12 — Fix get_booked_slots range query

```sql
CREATE OR REPLACE FUNCTION public.get_booked_slots(target_date date)
RETURNS TABLE(start_time timestamptz, end_time timestamptz)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = 'public'
AS $$
  SELECT b.start_time, b.end_time
  FROM public.bookings b
  WHERE b.start_time < (target_date + 1)::timestamptz
    AND b.end_time   > target_date::timestamptz
    AND b.status    != 'cancelled'
$$;
```

---

## Supplementary — Schema columns missing from migration files

> **Important:** The live Lovable Supabase has two columns that were added directly
> via the dashboard without generating migration files. Run this after Migration 12:

```sql
-- buffer_minutes on availability_rules (used by booking widget slot logic)
ALTER TABLE public.availability_rules
  ADD COLUMN IF NOT EXISTS buffer_minutes integer NOT NULL DEFAULT 0;

-- show_price on session_types (controls price display in frontend)
ALTER TABLE public.session_types
  ADD COLUMN IF NOT EXISTS show_price boolean NOT NULL DEFAULT false;
```

---

## Post-apply verification

Run these two queries to confirm everything landed correctly.

**Table/column count:**
```sql
SELECT table_name, COUNT(column_name) AS cols
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY table_name
ORDER BY table_name;
```

Expected output:

| table_name | cols |
|---|---|
| availability_overrides | 7 |
| availability_rules | 7 |
| bookings | 14 |
| profiles | 5 |
| session_types | 21 |
| user_roles | 3 |

**RLS check:**
```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

Expected: every app table has `rowsecurity = true`.

**Function check:**
```sql
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
ORDER BY routine_name;
```

Expected: `get_booked_slots`, `handle_new_user`, `has_role`, `update_updated_at`.
