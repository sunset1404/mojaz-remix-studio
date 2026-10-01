-- Repair partner/supporter account infrastructure.
-- Idempotent by design so it can safely run on environments where parts already exist.

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'partner';

CREATE TABLE IF NOT EXISTS public.partner_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  full_name text NOT NULL,
  email text,
  phone text,
  organization_name text,
  total_support_amount numeric NOT NULL DEFAULT 0,
  cost_per_minute numeric NOT NULL DEFAULT 0.82,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_profiles
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS organization_name text,
  ADD COLUMN IF NOT EXISTS total_support_amount numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS cost_per_minute numeric NOT NULL DEFAULT 0.82,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS partner_profiles_user_id_uidx
  ON public.partner_profiles(user_id);

CREATE TABLE IF NOT EXISTS public.partner_students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL,
  student_id uuid NOT NULL,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'active'
);

CREATE UNIQUE INDEX IF NOT EXISTS partner_students_partner_student_uidx
  ON public.partner_students(partner_id, student_id);

CREATE TABLE IF NOT EXISTS public.partner_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL,
  student_id uuid NOT NULL,
  minutes_used numeric NOT NULL DEFAULT 0,
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_usage_logs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='partner_profiles'
      AND policyname='Partners can view their own profile'
  ) THEN
    CREATE POLICY "Partners can view their own profile"
      ON public.partner_profiles FOR SELECT
      TO authenticated
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='partner_profiles'
      AND policyname='Partners can update their own profile'
  ) THEN
    CREATE POLICY "Partners can update their own profile"
      ON public.partner_profiles FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='partner_profiles'
      AND policyname='Admins can view all partner profiles'
  ) THEN
    CREATE POLICY "Admins can view all partner profiles"
      ON public.partner_profiles FOR SELECT
      TO authenticated
      USING (public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='partner_profiles'
      AND policyname='Admins can insert partner profiles'
  ) THEN
    CREATE POLICY "Admins can insert partner profiles"
      ON public.partner_profiles FOR INSERT
      TO authenticated
      WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='partner_profiles'
      AND policyname='Admins can update partner profiles'
  ) THEN
    CREATE POLICY "Admins can update partner profiles"
      ON public.partner_profiles FOR UPDATE
      TO authenticated
      USING (public.has_role(auth.uid(), 'admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='partner_students'
      AND policyname='Partners can view their own students'
  ) THEN
    CREATE POLICY "Partners can view their own students"
      ON public.partner_students FOR SELECT
      TO authenticated
      USING (auth.uid() = partner_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='partner_students'
      AND policyname='Admins can view all partner students'
  ) THEN
    CREATE POLICY "Admins can view all partner students"
      ON public.partner_students FOR SELECT
      TO authenticated
      USING (public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='partner_students'
      AND policyname='Admins can insert partner students'
  ) THEN
    CREATE POLICY "Admins can insert partner students"
      ON public.partner_students FOR INSERT
      TO authenticated
      WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='partner_students'
      AND policyname='Admins can update partner students'
  ) THEN
    CREATE POLICY "Admins can update partner students"
      ON public.partner_students FOR UPDATE
      TO authenticated
      USING (public.has_role(auth.uid(), 'admin'))
      WITH CHECK (public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='partner_students'
      AND policyname='Admins can delete partner students'
  ) THEN
    CREATE POLICY "Admins can delete partner students"
      ON public.partner_students FOR DELETE
      TO authenticated
      USING (public.has_role(auth.uid(), 'admin'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='partner_usage_logs'
      AND policyname='Partners can view their own usage logs'
  ) THEN
    CREATE POLICY "Partners can view their own usage logs"
      ON public.partner_usage_logs FOR SELECT
      TO authenticated
      USING (auth.uid() = partner_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='partner_usage_logs'
      AND policyname='Admins can view all partner usage logs'
  ) THEN
    CREATE POLICY "Admins can view all partner usage logs"
      ON public.partner_usage_logs FOR SELECT
      TO authenticated
      USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END
$$;

CREATE OR REPLACE FUNCTION public.partner_account_health()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
  SELECT jsonb_build_object(
    'partner_role',
      EXISTS (
        SELECT 1
        FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        JOIN pg_enum e ON e.enumtypid = t.oid
        WHERE n.nspname = 'public'
          AND t.typname = 'app_role'
          AND e.enumlabel = 'partner'
      ),
    'partner_profiles', to_regclass('public.partner_profiles') IS NOT NULL,
    'partner_students', to_regclass('public.partner_students') IS NOT NULL,
    'partner_usage_logs', to_regclass('public.partner_usage_logs') IS NOT NULL
  );
$$;

REVOKE ALL ON FUNCTION public.partner_account_health() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.partner_account_health() TO authenticated;
GRANT EXECUTE ON FUNCTION public.partner_account_health() TO service_role;
