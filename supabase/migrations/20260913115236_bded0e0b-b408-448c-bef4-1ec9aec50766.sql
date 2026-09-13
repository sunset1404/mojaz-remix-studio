ALTER TABLE public.student_profiles ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.reciter_profiles ADD COLUMN IF NOT EXISTS deleted_at timestamptz;
ALTER TABLE public.partner_profiles ADD COLUMN IF NOT EXISTS deleted_at timestamptz;