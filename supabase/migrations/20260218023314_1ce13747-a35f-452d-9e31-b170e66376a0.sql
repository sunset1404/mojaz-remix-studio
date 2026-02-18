
-- 1. Add 'partner' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'partner';

-- 2. Partner profiles table
CREATE TABLE public.partner_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  full_name text NOT NULL,
  phone text,
  organization_name text,
  total_support_amount numeric NOT NULL DEFAULT 0,
  cost_per_minute numeric NOT NULL DEFAULT 0.82,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can view their own profile"
  ON public.partner_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Partners can update their own profile"
  ON public.partner_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_partner_profiles_updated_at
  BEFORE UPDATE ON public.partner_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Partner students assignment table
CREATE TABLE public.partner_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL,
  student_id uuid NOT NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'active',
  UNIQUE(partner_id, student_id)
);

ALTER TABLE public.partner_students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can view their own students"
  ON public.partner_students FOR SELECT
  USING (auth.uid() = partner_id);

-- 4. Partner usage logs table
CREATE TABLE public.partner_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL,
  student_id uuid NOT NULL,
  minutes_used numeric NOT NULL DEFAULT 0,
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can view their own usage logs"
  ON public.partner_usage_logs FOR SELECT
  USING (auth.uid() = partner_id);

-- 5. Student achievements table
CREATE TABLE public.student_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL UNIQUE,
  pages_memorized integer NOT NULL DEFAULT 0,
  parts_memorized integer NOT NULL DEFAULT 0,
  completions integer NOT NULL DEFAULT 0,
  certificates_count integer NOT NULL DEFAULT 0,
  sessions_count integer NOT NULL DEFAULT 0,
  total_minutes numeric NOT NULL DEFAULT 0,
  commitment_rate numeric NOT NULL DEFAULT 0,
  nationality text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.student_achievements ENABLE ROW LEVEL SECURITY;

-- Partners can view achievements of their assigned students
CREATE POLICY "Partners can view their students achievements"
  ON public.student_achievements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.partner_students ps
      WHERE ps.student_id = student_achievements.student_id
        AND ps.partner_id = auth.uid()
        AND ps.status = 'active'
    )
  );

-- Students can view their own achievements
CREATE POLICY "Students can view their own achievements"
  ON public.student_achievements FOR SELECT
  USING (auth.uid() = student_id);

CREATE TRIGGER update_student_achievements_updated_at
  BEFORE UPDATE ON public.student_achievements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
