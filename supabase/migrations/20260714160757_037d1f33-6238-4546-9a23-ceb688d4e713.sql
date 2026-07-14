ALTER TABLE public.reciter_profiles
ADD COLUMN IF NOT EXISTS is_available boolean NOT NULL DEFAULT false;

UPDATE public.reciter_profiles
SET is_available = false
WHERE is_available IS NULL;

ALTER TABLE public.reciter_profiles
ALTER COLUMN is_available SET DEFAULT false,
ALTER COLUMN is_available SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_reciter_profiles_available_recent
ON public.reciter_profiles (last_seen_at DESC)
WHERE is_available = true AND status = 'approved';

COMMENT ON COLUMN public.reciter_profiles.is_available IS
'Effective reciter availability advertised by the active app session; false when backgrounded or busy.';