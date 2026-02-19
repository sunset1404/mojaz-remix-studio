
ALTER TABLE public.reciter_profiles
ADD COLUMN IF NOT EXISTS certification_text text;
