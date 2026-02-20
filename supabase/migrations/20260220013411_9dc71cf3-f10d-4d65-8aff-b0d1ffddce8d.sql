
-- 1. Add progress tracking columns to session_records
ALTER TABLE public.session_records 
  ADD COLUMN IF NOT EXISTS pages_reached integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS parts_reached integer DEFAULT NULL;

-- 2. Function to parse Arabic duration text to minutes (e.g. "45 دقيقة" -> 45)
CREATE OR REPLACE FUNCTION public.parse_duration_minutes(duration_text text)
RETURNS integer
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  nums text;
  result integer;
BEGIN
  -- Extract only digits from the text
  nums := regexp_replace(duration_text, '[^0-9]', '', 'g');
  IF nums = '' OR nums IS NULL THEN
    RETURN 0;
  END IF;
  BEGIN
    result := nums::integer;
  EXCEPTION WHEN others THEN
    result := 0;
  END;
  RETURN COALESCE(result, 0);
END;
$$;

-- 3. Main function to recalculate all achievement stats for a student
CREATE OR REPLACE FUNCTION public.recalculate_student_achievements(p_student_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sessions_count integer := 0;
  v_total_minutes integer := 0;
  v_parts_memorized integer := 0;
  v_pages_memorized integer := 0;
  v_certificates_count integer := 0;
  v_completions integer := 0;
  v_commitment_rate numeric := 0;
  v_planned_days integer := 0;
  v_done_sessions integer := 0;
BEGIN
  -- Sessions count & total minutes from completed sessions
  SELECT 
    COUNT(*),
    COALESCE(SUM(parse_duration_minutes(duration)), 0)
  INTO v_sessions_count, v_total_minutes
  FROM session_records
  WHERE user_id = p_student_id AND status = 'مكتملة';

  -- Max pages and parts reached (cumulative progress)
  SELECT 
    COALESCE(MAX(parts_reached), 0),
    COALESCE(MAX(pages_reached), 0)
  INTO v_parts_memorized, v_pages_memorized
  FROM session_records
  WHERE user_id = p_student_id 
    AND status = 'مكتملة'
    AND (parts_reached IS NOT NULL OR pages_reached IS NOT NULL);

  -- Completions = full Quran completions (each 30 parts = 1 completion)
  v_completions := FLOOR(v_parts_memorized / 30);

  -- Certificates count from certificates table
  SELECT COUNT(*)
  INTO v_certificates_count
  FROM certificates
  WHERE user_id = p_student_id;

  -- Commitment rate: sessions done this week vs planned days
  SELECT COALESCE(array_length(days, 1), 0)
  INTO v_planned_days
  FROM weekly_plans
  WHERE user_id = p_student_id
  LIMIT 1;

  IF v_planned_days > 0 THEN
    -- Count sessions in current week (last 7 days)
    SELECT COUNT(*)
    INTO v_done_sessions
    FROM session_records
    WHERE user_id = p_student_id
      AND status = 'مكتملة'
      AND created_at >= date_trunc('week', now() - interval '1 day') + interval '1 day'; -- week starts Saturday
    
    -- Weekly commitment rate capped at 100
    v_commitment_rate := LEAST(ROUND((v_done_sessions::numeric / v_planned_days) * 100), 100);
  END IF;

  -- Upsert the achievements record
  INSERT INTO student_achievements (
    student_id, sessions_count, total_minutes, parts_memorized,
    pages_memorized, commitment_rate, certificates_count, completions, updated_at
  ) VALUES (
    p_student_id, v_sessions_count, v_total_minutes, v_parts_memorized,
    v_pages_memorized, v_commitment_rate, v_certificates_count, v_completions, now()
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

-- 4. Add unique constraint on student_id in student_achievements (needed for ON CONFLICT)
ALTER TABLE public.student_achievements 
  DROP CONSTRAINT IF EXISTS student_achievements_student_id_key;
ALTER TABLE public.student_achievements 
  ADD CONSTRAINT student_achievements_student_id_key UNIQUE (student_id);

-- 5. Trigger function for session_records changes
CREATE OR REPLACE FUNCTION public.trigger_update_achievements_on_session()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id uuid;
BEGIN
  -- Get the student_id (user_id in session_records)
  IF TG_OP = 'DELETE' THEN
    v_student_id := OLD.user_id;
  ELSE
    v_student_id := NEW.user_id;
  END IF;

  PERFORM recalculate_student_achievements(v_student_id);
  RETURN NEW;
END;
$$;

-- 6. Trigger function for certificates changes
CREATE OR REPLACE FUNCTION public.trigger_update_achievements_on_certificate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_student_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_student_id := OLD.user_id;
  ELSE
    v_student_id := NEW.user_id;
  END IF;

  PERFORM recalculate_student_achievements(v_student_id);
  RETURN NEW;
END;
$$;

-- 7. Create triggers
DROP TRIGGER IF EXISTS trg_achievements_on_session ON public.session_records;
CREATE TRIGGER trg_achievements_on_session
  AFTER INSERT OR UPDATE OR DELETE ON public.session_records
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_achievements_on_session();

DROP TRIGGER IF EXISTS trg_achievements_on_certificate ON public.certificates;
CREATE TRIGGER trg_achievements_on_certificate
  AFTER INSERT OR UPDATE OR DELETE ON public.certificates
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_achievements_on_certificate();
