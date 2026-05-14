-- Replace the single-language hidden_offers schema with bilingual fields,
-- matching the EN/RU pattern used by session_types (name/name_ru, description/description_ru).

-- 1. Add bilingual columns (all nullable initially to allow backfill before constraints)
ALTER TABLE public.hidden_offers
  ADD COLUMN title_en       text,
  ADD COLUMN title_ru       text,
  ADD COLUMN description_en text,
  ADD COLUMN description_ru text,
  ADD COLUMN conditions_en  text,
  ADD COLUMN conditions_ru  text;

-- 2. Backfill from old single-language columns based on the language column value.
--    Offers created in EN get their content in the _en columns; RU in _ru.
--    Any language value other than 'ru' is treated as EN (safe default).
UPDATE public.hidden_offers
  SET title_en       = title,
      description_en = description,
      conditions_en  = conditions
  WHERE language != 'ru';

UPDATE public.hidden_offers
  SET title_ru       = title,
      description_ru = description,
      conditions_ru  = conditions
  WHERE language = 'ru';

-- 3. Drop the old single-language columns
ALTER TABLE public.hidden_offers
  DROP COLUMN title,
  DROP COLUMN description,
  DROP COLUMN conditions,
  DROP COLUMN language;

-- 4. Enforce that at least one full language set is present.
--    A "full set" means all three fields (title, description, conditions) are non-null.
--    Partial sets (e.g. title_en filled, description_en null) are allowed as long as
--    the other language provides a complete set — the admin form enforces no-partial
--    policy on the client side as a stricter layer on top.
ALTER TABLE public.hidden_offers
  ADD CONSTRAINT hidden_offers_has_language_check CHECK (
    (title_en IS NOT NULL AND description_en IS NOT NULL AND conditions_en IS NOT NULL) OR
    (title_ru IS NOT NULL AND description_ru IS NOT NULL AND conditions_ru IS NOT NULL)
  );
