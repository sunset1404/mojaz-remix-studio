-- Make partner/student achievement metrics use the authoritative call source.
-- Calls/minutes come from video_call_sessions. Quran progress remains cumulative
-- from the latest completed progress saved in session_records.

DROP POLICY IF EXISTS "Admins can view all video call sessions" ON public.video_call_sessions;
CREATE POLICY "Admins can view all video call sessions"
ON public.video_call_sessions
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.recalculate_student_achievements(p_student_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sessions_count integer := 0;
  v_total_minutes numeric := 0;
  v_parts_from_sessions integer := 0;
  v_pages_from_sessions integer := 0;
  v_existing_parts integer := 0;
  v_existing_pages integer := 0;
  v_parts_memorized integer := 0;
  v_pages_memorized integer := 0;
  v_certificates_count integer := 0;
  v_completions integer := 0;
  v_commitment_rate numeric := 0;
  v_planned_days integer := 0;
  v_done_sessions integer := 0;
BEGIN
  -- A completed session is a real WebRTC call that actually started and ended.
  SELECT
    COUNT(*),
    COALESCE(
      SUM(
        EXTRACT(EPOCH FROM (ended_at - started_at)) / 60.0
      ),
      0
    )
  INTO v_sessions_count, v_total_minutes
  FROM public.video_call_sessions
  WHERE student_id = p_student_id
    AND started_at IS NOT NULL
    AND ended_at IS NOT NULL
    AND ended_at >= started_at;

  -- Quran progress fields are cumulative positions (0..604 pages, 0..30 parts).
  SELECT
    COALESCE(MAX(parts_reached), 0),
    COALESCE(MAX(pages_reached), 0)
  INTO v_parts_from_sessions, v_pages_from_sessions
  FROM public.session_records
  WHERE user_id = p_student_id
    AND status = 'مكتملة'
    AND (parts_reached IS NOT NULL OR pages_reached IS NOT NULL);

  -- Never erase previously confirmed cumulative progress when newer calls did
  -- not include Quran progress fields.
  SELECT
    COALESCE(parts_memorized, 0),
    COALESCE(pages_memorized, 0)
  INTO v_existing_parts, v_existing_pages
  FROM public.student_achievements
  WHERE student_id = p_student_id;

  v_parts_memorized := GREATEST(v_existing_parts, v_parts_from_sessions);
  v_pages_memorized := GREATEST(v_existing_pages, v_pages_from_sessions);
  v_parts_memorized := LEAST(v_parts_memorized, 30);
  v_pages_memorized := LEAST(v_pages_memorized, 604);

  v_completions := CASE
    WHEN v_parts_memorized >= 30 THEN 1
    ELSE 0
  END;

  SELECT COUNT(*)
  INTO v_certificates_count
  FROM public.certificates
  WHERE user_id = p_student_id;

  SELECT COALESCE(array_length(days, 1), 0)
  INTO v_planned_days
  FROM public.weekly_plans
  WHERE user_id = p_student_id
  LIMIT 1;

  IF v_planned_days > 0 THEN
    SELECT COUNT(*)
    INTO v_done_sessions
    FROM public.video_call_sessions
    WHERE student_id = p_student_id
      AND started_at IS NOT NULL
      AND ended_at IS NOT NULL
      AND ended_at >= started_at
      AND started_at >= date_trunc('week', now() - interval '1 day') + interval '1 day';

    v_commitment_rate := LEAST(
      ROUND((v_done_sessions::numeric / v_planned_days) * 100),
      100
    );
  END IF;

  INSERT INTO public.student_achievements (
    student_id,
    sessions_count,
    total_minutes,
    parts_memorized,
    pages_memorized,
    commitment_rate,
    certificates_count,
    completions,
    updated_at
  )
  VALUES (
    p_student_id,
    v_sessions_count,
    ROUND(v_total_minutes, 2),
    v_parts_memorized,
    v_pages_memorized,
    v_commitment_rate,
    v_certificates_count,
    v_completions,
    now()
  )
  ON CONFLICT (student_id) DO UPDATE SET
    sessions_count = EXCLUDED.sessions_count,
    total_minutes = EXCLUDED.total_minutes,
    parts_memorized = EXCLUDED.parts_memorized,
    pages_memorized = EXCLUDED.pages_memorized,
    commitment_rate = EXCLUDED.commitment_rate,
    certificates_count = EXCLUDED.certificates_count,
    completions = EXCLUDED.completions,
    updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_update_achievements_on_video_call()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_student_id := OLD.student_id;
  ELSE
    v_student_id := NEW.student_id;
  END IF;

  IF v_student_id IS NOT NULL THEN
    PERFORM public.recalculate_student_achievements(v_student_id);
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$;

DROP TRIGGER IF EXISTS trg_achievements_on_video_call_insert ON public.video_call_sessions;
CREATE TRIGGER trg_achievements_on_video_call_insert
AFTER INSERT ON public.video_call_sessions
FOR EACH ROW
EXECUTE FUNCTION public.trigger_update_achievements_on_video_call();

DROP TRIGGER IF EXISTS trg_achievements_on_video_call_update ON public.video_call_sessions;
CREATE TRIGGER trg_achievements_on_video_call_update
AFTER UPDATE OF started_at, ended_at, status ON public.video_call_sessions
FOR EACH ROW
EXECUTE FUNCTION public.trigger_update_achievements_on_video_call();

DROP TRIGGER IF EXISTS trg_achievements_on_video_call_delete ON public.video_call_sessions;
CREATE TRIGGER trg_achievements_on_video_call_delete
AFTER DELETE ON public.video_call_sessions
FOR EACH ROW
EXECUTE FUNCTION public.trigger_update_achievements_on_video_call();

-- Refresh existing achievement rows using the corrected source of truth.
DO $
DECLARE
  r record;
BEGIN
  FOR r IN SELECT user_id AS student_id FROM public.student_profiles LOOP
    PERFORM public.recalculate_student_achievements(r.student_id);
  END LOOP;
END;
$;
