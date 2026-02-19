
-- Add stamp and signature columns to reciter_profiles
ALTER TABLE public.reciter_profiles
ADD COLUMN stamp_url text,
ADD COLUMN signature_url text;
