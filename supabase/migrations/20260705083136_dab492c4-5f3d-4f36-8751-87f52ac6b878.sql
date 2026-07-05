
-- ==========================================================
-- 1) GIFT SUBSCRIPTIONS
-- ==========================================================
DROP POLICY IF EXISTS "Admins can view all gift subscriptions" ON public.gift_subscriptions;
DROP POLICY IF EXISTS "Users can view their own gifts" ON public.gift_subscriptions;
DROP POLICY IF EXISTS "Users can redeem gifts" ON public.gift_subscriptions;
DROP POLICY IF EXISTS "Users can create gift subscriptions" ON public.gift_subscriptions;

CREATE POLICY "Admins can view all gift subscriptions"
  ON public.gift_subscriptions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Senders can view own gifts"
  ON public.gift_subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = sender_id);

CREATE POLICY "Redeemers can view redeemed gifts"
  ON public.gift_subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = redeemed_by);

CREATE POLICY "Users can create gift subscriptions"
  ON public.gift_subscriptions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = sender_id);
-- No UPDATE policy for regular users: redemption goes through redeem_gift_by_code() SECURITY DEFINER RPC.

CREATE POLICY "Admins can update gift subscriptions"
  ON public.gift_subscriptions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ==========================================================
-- 2) RECITER PROFILES — hide PII columns via directory view
-- ==========================================================
DROP POLICY IF EXISTS "Authenticated can view approved reciter profiles" ON public.reciter_profiles;

-- Public directory view exposes safe columns only (no id_number / no phone)
DROP VIEW IF EXISTS public.reciter_directory;
CREATE VIEW public.reciter_directory
WITH (security_invoker = false) AS
SELECT
  id, user_id, full_name, preferred_track, stamp_url, signature_url,
  city, nationality, profession, qualifications, quran_certifications,
  teaching_experience, preferred_days, preferred_times, gender,
  reciter_type, status, last_seen_at, created_at
FROM public.reciter_profiles
WHERE status = 'approved';

GRANT SELECT ON public.reciter_directory TO authenticated, anon;

-- ==========================================================
-- 3) STUDENT PROFILES — authenticated-only
-- ==========================================================
DROP POLICY IF EXISTS "Reciters can view their assigned students" ON public.student_profiles;

CREATE POLICY "Reciters can view their assigned students"
  ON public.student_profiles FOR SELECT TO authenticated
  USING (auth.uid() = assigned_reciter_id);

-- ==========================================================
-- 4) CERTIFICATES — authenticated-only for owner rows
-- ==========================================================
DROP POLICY IF EXISTS "Users can view their own certificates" ON public.certificates;
DROP POLICY IF EXISTS "Users can insert their own certificates" ON public.certificates;
DROP POLICY IF EXISTS "Users can update their own certificates" ON public.certificates;
DROP POLICY IF EXISTS "Users can delete their own certificates" ON public.certificates;
DROP POLICY IF EXISTS "Admins can view all certificates" ON public.certificates;

CREATE POLICY "Users can view their own certificates"
  ON public.certificates FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own certificates"
  ON public.certificates FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own certificates"
  ON public.certificates FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own certificates"
  ON public.certificates FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all certificates"
  ON public.certificates FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ==========================================================
-- 5) USER ROLES — remove insert policy, add admin RPC
-- ==========================================================
DROP POLICY IF EXISTS "Admins can insert user roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;

CREATE OR REPLACE FUNCTION public.admin_assign_role(_target_user uuid, _role public.app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'unauthorized: admin role required';
  END IF;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_target_user, _role)
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_assign_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_assign_role(uuid, public.app_role) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_revoke_role(_target_user uuid, _role public.app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'unauthorized: admin role required';
  END IF;
  DELETE FROM public.user_roles WHERE user_id = _target_user AND role = _role;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_revoke_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_revoke_role(uuid, public.app_role) TO authenticated;

-- ==========================================================
-- 6) VIDEO_CALL_SESSIONS — hide access_token
-- ==========================================================
REVOKE SELECT (access_token) ON public.video_call_sessions FROM anon, authenticated;
-- service_role retains full access for edge functions.

-- ==========================================================
-- 7) SECURITY DEFINER function EXECUTE hardening
-- ==========================================================
-- Internal / trigger / cron-only functions: revoke from PUBLIC, anon, authenticated
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_update_achievements_on_certificate() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_update_achievements_on_session() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_exam_committee_members() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.email_queue_dispatch() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.email_queue_wake() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recalculate_student_achievements(uuid) FROM PUBLIC, anon, authenticated;

-- Authenticated-only helpers (not anon):
REVOKE EXECUTE ON FUNCTION public.redeem_gift_by_code(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_gift_by_code(text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_exam_registration_counts(uuid[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_exam_registration_counts(uuid[]) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_scheduled_admission_exams() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_scheduled_admission_exams() TO authenticated;

-- Functions needed by signup flow (anon must call): keep both anon + authenticated
-- check_email_exists, check_phone_exists, get_email_registration_status — no change (default has EXECUTE to PUBLIC).

-- RLS helpers used inside policies (must remain executable by the invoking role):
-- has_role, is_exam_committee_member — no change.
