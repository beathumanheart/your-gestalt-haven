ALTER TABLE public.session_types 
ADD COLUMN pricing_type text NOT NULL DEFAULT 'fixed',
ADD COLUMN min_price numeric NULL,
ADD COLUMN max_price numeric NULL;