
-- ==========================================================
-- Split sensitive reciter columns to protected table
-- ==========================================================
CREATE TABLE IF NOT EXISTS public.reciter_sensitive_data (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  id_number text,
  phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.reciter_sensitive_data TO authenticated;
GRANT ALL ON public.reciter_sensitive_data TO service_role;

ALTER TABLE public.reciter_sensitive_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner reads own sensitive"
  ON public.reciter_sensitive_data FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Owner inserts own sensitive"
  ON public.reciter_sensitive_data FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Owner updates own sensitive"
  ON public.reciter_sensitive_data FOR UPDATE TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage sensitive"
  ON public.reciter_sensitive_data FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_reciter_sensitive_updated
  BEFORE UPDATE ON public.reciter_sensitive_data
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Backfill from existing columns
INSERT INTO public.reciter_sensitive_data (user_id, id_number, phone)
SELECT user_id, id_number, phone
FROM public.reciter_profiles
WHERE user_id IS NOT NULL
ON CONFLICT (user_id) DO UPDATE SET
  id_number = EXCLUDED.id_number,
  phone = EXCLUDED.phone;

-- Drop the sensitive columns from reciter_profiles
ALTER TABLE public.reciter_profiles DROP COLUMN IF EXISTS id_number;
ALTER TABLE public.reciter_profiles DROP COLUMN IF EXISTS phone;

-- ==========================================================
-- Recreate reciter_directory as security_invoker (safe columns)
-- and restore a narrow SELECT policy on reciter_profiles
-- ==========================================================
DROP VIEW IF EXISTS public.reciter_directory;

-- Re-add SELECT policy for approved reciters (safe: sensitive cols now removed)
CREATE POLICY "Authenticated can view approved reciter profiles"
  ON public.reciter_profiles FOR SELECT TO authenticated
  USING (status = 'approved');

CREATE VIEW public.reciter_directory
WITH (security_invoker = true) AS
SELECT
  id, user_id, full_name, preferred_track, stamp_url, signature_url,
  city, nationality, profession, qualifications, quran_certifications,
  teaching_experience, preferred_days, preferred_times, gender,
  reciter_type, status, last_seen_at, created_at
FROM public.reciter_profiles
WHERE status = 'approved';

GRANT SELECT ON public.reciter_directory TO authenticated;
