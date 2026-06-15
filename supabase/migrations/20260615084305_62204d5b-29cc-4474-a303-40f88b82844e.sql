CREATE OR REPLACE FUNCTION public.get_email_registration_status(p_email text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_email text := lower(trim(p_email));
  v_has_active_account boolean := false;
  v_has_any_record boolean := false;
BEGIN
  IF v_email IS NULL OR v_email = '' THEN
    RETURN 'available';
  END IF;

  WITH matching_auth_users AS (
    SELECT id, email_confirmed_at
    FROM auth.users
    WHERE lower(email) = v_email
  )
  SELECT EXISTS (
    SELECT 1
    FROM matching_auth_users u
    WHERE u.email_confirmed_at IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.user_roles ur
        WHERE ur.user_id = u.id
      )
      AND (
        EXISTS (SELECT 1 FROM public.student_profiles sp WHERE sp.user_id = u.id)
        OR EXISTS (SELECT 1 FROM public.reciter_profiles rp WHERE rp.user_id = u.id)
        OR EXISTS (SELECT 1 FROM public.partner_profiles pp WHERE pp.user_id = u.id)
        OR EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = u.id)
      )
  ) INTO v_has_active_account;

  IF v_has_active_account THEN
    RETURN 'active';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE lower(email) = v_email
  ) OR EXISTS (
    SELECT 1 FROM public.student_profiles WHERE lower(email) = v_email
  ) INTO v_has_any_record;

  IF v_has_any_record THEN
    RETURN 'needs_activation';
  END IF;

  RETURN 'available';
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_email_registration_status(text) TO anon, authenticated, service_role;

CREATE OR REPLACE FUNCTION public.check_email_exists(p_email text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT public.get_email_registration_status(p_email) <> 'available';
$function$;

GRANT EXECUTE ON FUNCTION public.check_email_exists(text) TO anon, authenticated, service_role;