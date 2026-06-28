
-- 1. user_roles: remove self-assignment escalation
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;

-- 2. student_hour_credits: prevent users from changing their own balance
DROP POLICY IF EXISTS "Students can update their own credits" ON public.student_hour_credits;
DROP POLICY IF EXISTS "Students can insert their own credits" ON public.student_hour_credits;

-- 3. gift_subscriptions: remove broad SELECT, add secure redeem RPC
DROP POLICY IF EXISTS "Users can lookup gift by code" ON public.gift_subscriptions;

CREATE OR REPLACE FUNCTION public.redeem_gift_by_code(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_gift public.gift_subscriptions;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'unauthenticated');
  END IF;
  SELECT * INTO v_gift FROM public.gift_subscriptions
   WHERE gift_code = upper(trim(p_code)) AND status = 'pending'
   LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_found');
  END IF;
  UPDATE public.gift_subscriptions
     SET status = 'redeemed', redeemed_by = v_user, redeemed_at = now()
   WHERE id = v_gift.id AND status = 'pending';
  RETURN jsonb_build_object(
    'success', true,
    'gift_id', v_gift.id,
    'plan_name', v_gift.plan_name,
    'duration_months', v_gift.duration_months
  );
END;
$$;
REVOKE ALL ON FUNCTION public.redeem_gift_by_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.redeem_gift_by_code(text) TO authenticated;

-- 4. reciter_profiles: restrict to authenticated (no anon PII)
DROP POLICY IF EXISTS "Anyone can view approved reciter profiles" ON public.reciter_profiles;
CREATE POLICY "Authenticated can view approved reciter profiles"
  ON public.reciter_profiles FOR SELECT
  TO authenticated
  USING (status = 'approved');

-- 5. student_profiles: remove anon access; expose count via secure RPC
DROP POLICY IF EXISTS "Anyone can read exam registrations count" ON public.student_profiles;

CREATE OR REPLACE FUNCTION public.get_exam_registration_counts(p_exam_ids uuid[])
RETURNS TABLE(exam_id uuid, registered_count bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT selected_exam_id, COUNT(*)::bigint
  FROM public.student_profiles
  WHERE selected_exam_id = ANY(p_exam_ids)
  GROUP BY selected_exam_id;
$$;
REVOKE ALL ON FUNCTION public.get_exam_registration_counts(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_exam_registration_counts(uuid[]) TO anon, authenticated;

-- 6. exams: restrict listing to authenticated; expose anon-safe RPC for signup flow
DROP POLICY IF EXISTS "Anyone can view scheduled admission exams" ON public.exams;
CREATE POLICY "Authenticated can view scheduled admission exams"
  ON public.exams FOR SELECT
  TO authenticated
  USING (type = 'admission' AND status = 'scheduled');

CREATE OR REPLACE FUNCTION public.get_scheduled_admission_exams()
RETURNS TABLE(
  id uuid,
  date text,
  "time" text,
  capacity int,
  committee_member_1_name text,
  committee_member_2_name text,
  committee_member_3_name text,
  registered_count bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT e.id, e.date, e."time", e.capacity,
         e.committee_member_1_name, e.committee_member_2_name, e.committee_member_3_name,
         (SELECT COUNT(*)::bigint FROM public.student_profiles sp WHERE sp.selected_exam_id = e.id)
  FROM public.exams e
  WHERE e.type = 'admission' AND e.status = 'scheduled'
  ORDER BY e.date ASC;
$$;
REVOKE ALL ON FUNCTION public.get_scheduled_admission_exams() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_scheduled_admission_exams() TO anon, authenticated;

-- 7. whatsapp_message_events: drop always-true INSERT policy (service role bypasses RLS)
DROP POLICY IF EXISTS "Service role inserts events" ON public.whatsapp_message_events;

-- 8. Revoke PUBLIC EXECUTE on internal / trigger SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trigger_update_achievements_on_certificate() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.trigger_update_achievements_on_session() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.notify_exam_committee_members() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.recalculate_student_achievements(uuid) FROM PUBLIC;

-- Tighten public-facing SECURITY DEFINER helpers (callable by anon/authenticated, not PUBLIC)
REVOKE EXECUTE ON FUNCTION public.check_phone_exists(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_phone_exists(text) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.check_email_exists(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_email_exists(text) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.get_email_registration_status(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_email_registration_status(text) TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.is_exam_committee_member(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_exam_committee_member(uuid, uuid) TO authenticated;

-- 9. Pin search_path on remaining mutable-path functions
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public;
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public;

-- 10. Remove broad listing policies on public storage buckets
-- Direct public file URLs (storage/v1/object/public/...) keep working; only listing is blocked.
DROP POLICY IF EXISTS "Avatars are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Public read certificates" ON storage.objects;
DROP POLICY IF EXISTS "Reciter assets are publicly readable" ON storage.objects;
