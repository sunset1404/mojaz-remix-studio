ALTER TABLE public.reciter_profiles
ADD COLUMN reciter_type text NOT NULL DEFAULT 'general'
CHECK (reciter_type IN ('ijazah', 'general'));