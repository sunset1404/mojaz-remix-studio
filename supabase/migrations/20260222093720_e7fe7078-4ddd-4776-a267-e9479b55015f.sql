ALTER TABLE public.certificates 
  ADD COLUMN IF NOT EXISTS reciter_signature_url text,
  ADD COLUMN IF NOT EXISTS reciter_stamp_url text;