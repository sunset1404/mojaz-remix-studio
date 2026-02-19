
-- Fix student_profiles RLS: drop restrictive policies and recreate as permissive
DROP POLICY IF EXISTS "Admins can view all student profiles" ON public.student_profiles;
DROP POLICY IF EXISTS "Admins can update all student profiles" ON public.student_profiles;
DROP POLICY IF EXISTS "Users can insert their own student profile" ON public.student_profiles;
DROP POLICY IF EXISTS "Users can update their own student profile" ON public.student_profiles;
DROP POLICY IF EXISTS "Users can view their own student profile" ON public.student_profiles;

CREATE POLICY "Admins can view all student profiles"
  ON public.student_profiles FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all student profiles"
  ON public.student_profiles FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own student profile"
  ON public.student_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own student profile"
  ON public.student_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own student profile"
  ON public.student_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Fix reciter_profiles RLS similarly
DROP POLICY IF EXISTS "Admins can view all reciter profiles" ON public.reciter_profiles;
DROP POLICY IF EXISTS "Admins can update all reciter profiles" ON public.reciter_profiles;
DROP POLICY IF EXISTS "Users can view their own reciter profile" ON public.reciter_profiles;
DROP POLICY IF EXISTS "Users can insert their own reciter profile" ON public.reciter_profiles;
DROP POLICY IF EXISTS "Users can update their own reciter profile" ON public.reciter_profiles;

CREATE POLICY "Admins can view all reciter profiles"
  ON public.reciter_profiles FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all reciter profiles"
  ON public.reciter_profiles FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own reciter profile"
  ON public.reciter_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own reciter profile"
  ON public.reciter_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reciter profile"
  ON public.reciter_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Fix partner_profiles RLS similarly
DROP POLICY IF EXISTS "Admins can view all partner profiles" ON public.partner_profiles;
DROP POLICY IF EXISTS "Admins can insert partner profiles" ON public.partner_profiles;
DROP POLICY IF EXISTS "Admins can update partner profiles" ON public.partner_profiles;
DROP POLICY IF EXISTS "Partners can view their own profile" ON public.partner_profiles;
DROP POLICY IF EXISTS "Partners can update their own profile" ON public.partner_profiles;

CREATE POLICY "Admins can view all partner profiles"
  ON public.partner_profiles FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert partner profiles"
  ON public.partner_profiles FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update partner profiles"
  ON public.partner_profiles FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Partners can view their own profile"
  ON public.partner_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Partners can update their own profile"
  ON public.partner_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);
