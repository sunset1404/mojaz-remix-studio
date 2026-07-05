
-- Re-add the columns back to reciter_profiles
ALTER TABLE public.reciter_profiles ADD COLUMN IF NOT EXISTS id_number text;
ALTER TABLE public.reciter_profiles ADD COLUMN IF NOT EXISTS phone text;

-- Backfill from sensitive table
UPDATE public.reciter_profiles rp
SET id_number = sd.id_number, phone = sd.phone
FROM public.reciter_sensitive_data sd
WHERE rp.user_id = sd.user_id;

-- Drop the sensitive-data table (no longer needed)
DROP TABLE IF EXISTS public.reciter_sensitive_data CASCADE;

-- Recreate the reciter_directory view (safe columns for public directory)
DROP VIEW IF EXISTS public.reciter_directory;

-- Replace the broad SELECT policy: only self + admin get full row access
DROP POLICY IF EXISTS "Authenticated can view approved reciter profiles" ON public.reciter_profiles;
-- Existing "Users can view their own reciter profile" and "Admins can view all reciter profiles" remain.

-- Directory view: security_definer semantics (bypasses RLS on underlying table) so listings work
CREATE VIEW public.reciter_directory
WITH (security_invoker = false) AS
SELECT
  id, user_id, full_name, preferred_track, stamp_url, signature_url,
  city, nationality, profession, qualifications, quran_certifications,
  teaching_experience, preferred_days, preferred_times, gender,
  reciter_type, status, last_seen_at, created_at
FROM public.reciter_profiles
WHERE status = 'approved';

GRANT SELECT ON public.reciter_directory TO authenticated, anon;
