
CREATE OR REPLACE FUNCTION public.check_phone_exists(p_phone text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.student_profiles sp
    JOIN auth.users u ON u.id = sp.user_id
    WHERE sp.phone = p_phone
      AND u.email_confirmed_at IS NOT NULL
    UNION ALL
    SELECT 1
    FROM public.reciter_profiles rp
    JOIN auth.users u ON u.id = rp.user_id
    WHERE rp.phone = p_phone
      AND u.email_confirmed_at IS NOT NULL
  );
$function$;
