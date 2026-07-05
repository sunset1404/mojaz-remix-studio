
-- Drop the flagged view; we'll rely on column-level GRANTs instead
DROP VIEW IF EXISTS public.reciter_directory;

-- Restore broad SELECT policy for approved reciters (safe cols only, since sensitive
-- columns are revoked at column level below)
DROP POLICY IF EXISTS "Authenticated can view approved reciter profiles" ON public.reciter_profiles;
CREATE POLICY "Authenticated can view approved reciter profiles"
  ON public.reciter_profiles FOR SELECT TO authenticated
  USING (status = 'approved');

-- Revoke column-level SELECT on sensitive columns from all client roles
REVOKE SELECT (id_number, phone) ON public.reciter_profiles FROM anon, authenticated, PUBLIC;

-- Owner and admins fetch sensitive data via SECURITY DEFINER RPCs
CREATE OR REPLACE FUNCTION public.get_my_reciter_sensitive()
RETURNS TABLE(id_number text, phone text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT rp.id_number, rp.phone
  FROM public.reciter_profiles rp
  WHERE rp.user_id = auth.uid();
$$;

REVOKE EXECUTE ON FUNCTION public.get_my_reciter_sensitive() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_reciter_sensitive() TO authenticated;

CREATE OR REPLACE FUNCTION public.get_reciter_sensitive_admin(_user_id uuid)
RETURNS TABLE(user_id uuid, id_number text, phone text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  RETURN QUERY
    SELECT rp.user_id, rp.id_number, rp.phone
    FROM public.reciter_profiles rp
    WHERE rp.user_id = _user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_reciter_sensitive_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_reciter_sensitive_admin(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.list_reciter_sensitive_admin()
RETURNS TABLE(user_id uuid, id_number text, phone text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  RETURN QUERY
    SELECT rp.user_id, rp.id_number, rp.phone
    FROM public.reciter_profiles rp;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.list_reciter_sensitive_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.list_reciter_sensitive_admin() TO authenticated;
