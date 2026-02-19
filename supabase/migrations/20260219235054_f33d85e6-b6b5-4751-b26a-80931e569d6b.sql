
-- Update check_email_exists to also check auth.users table
-- This catches users who registered but whose profile wasn't saved to student_profiles
CREATE OR REPLACE FUNCTION public.check_email_exists(p_email text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.student_profiles WHERE lower(email) = lower(p_email)
    UNION ALL
    SELECT 1 FROM public.reciter_profiles rp
      JOIN auth.users u ON u.id = rp.user_id
      WHERE lower(u.email) = lower(p_email)
    UNION ALL
    SELECT 1 FROM auth.users WHERE lower(email) = lower(p_email)
  );
$$;
