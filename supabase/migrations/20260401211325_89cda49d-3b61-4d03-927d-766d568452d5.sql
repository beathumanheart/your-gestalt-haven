
-- Add slug column
ALTER TABLE public.session_types ADD COLUMN slug text UNIQUE;

-- Populate slugs from existing names
UPDATE public.session_types
SET slug = lower(regexp_replace(regexp_replace(name, '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'));

-- Make slug NOT NULL after populating
ALTER TABLE public.session_types ALTER COLUMN slug SET NOT NULL;
