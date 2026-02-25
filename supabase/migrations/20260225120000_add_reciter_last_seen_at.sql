-- Track last seen time for reciter presence fallback
ALTER TABLE public.reciter_profiles
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_reciter_profiles_last_seen_at
ON public.reciter_profiles(last_seen_at);
