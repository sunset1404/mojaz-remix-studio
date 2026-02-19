
-- Function to check if email already exists in student_profiles or reciter_profiles
CREATE OR REPLACE FUNCTION public.check_email_exists(p_email text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.student_profiles WHERE lower(email) = lower(p_email)
  );
$$;

-- Function to check if phone already exists in student_profiles or reciter_profiles
CREATE OR REPLACE FUNCTION public.check_phone_exists(p_phone text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.student_profiles WHERE phone = p_phone
    UNION ALL
    SELECT 1 FROM public.reciter_profiles WHERE phone = p_phone
  );
$$;
