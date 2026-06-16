
-- ============================================================
-- Exams: reciter access + auto notifications for committee members
-- ============================================================

-- 1) Helper: check if current user is a committee member of an exam
CREATE OR REPLACE FUNCTION public.is_exam_committee_member(_exam_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.exams e
    JOIN public.reciter_profiles rp ON rp.user_id = _user_id
    WHERE e.id = _exam_id
      AND (
        e.committee_member_1 = rp.id
        OR e.committee_member_2 = rp.id
        OR e.committee_member_3 = rp.id
      )
  );
$$;

-- 2) RLS policies on exams for reciters
DROP POLICY IF EXISTS "Reciters can view their committee exams" ON public.exams;
CREATE POLICY "Reciters can view their committee exams"
ON public.exams
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.reciter_profiles rp
    WHERE rp.user_id = auth.uid()
      AND (
        exams.committee_member_1 = rp.id
        OR exams.committee_member_2 = rp.id
        OR exams.committee_member_3 = rp.id
      )
  )
);

DROP POLICY IF EXISTS "Reciters can update their committee exams" ON public.exams;
CREATE POLICY "Reciters can update their committee exams"
ON public.exams
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.reciter_profiles rp
    WHERE rp.user_id = auth.uid()
      AND (
        exams.committee_member_1 = rp.id
        OR exams.committee_member_2 = rp.id
        OR exams.committee_member_3 = rp.id
      )
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.reciter_profiles rp
    WHERE rp.user_id = auth.uid()
      AND (
        exams.committee_member_1 = rp.id
        OR exams.committee_member_2 = rp.id
        OR exams.committee_member_3 = rp.id
      )
  )
);

-- 3) Trigger function: notify newly added committee members
CREATE OR REPLACE FUNCTION public.notify_exam_committee_members()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  type_label text;
  body_text text;
  new_members uuid[];
  old_members uuid[];
  m uuid;
  reciter_user_id uuid;
BEGIN
  type_label := CASE WHEN NEW.type = 'admission' THEN 'القبول' ELSE 'الاستحقاق' END;

  new_members := ARRAY(
    SELECT x FROM unnest(ARRAY[NEW.committee_member_1, NEW.committee_member_2, NEW.committee_member_3]) AS x
    WHERE x IS NOT NULL
  );

  IF TG_OP = 'UPDATE' THEN
    old_members := ARRAY(
      SELECT x FROM unnest(ARRAY[OLD.committee_member_1, OLD.committee_member_2, OLD.committee_member_3]) AS x
      WHERE x IS NOT NULL
    );
  ELSE
    old_members := ARRAY[]::uuid[];
  END IF;

  FOREACH m IN ARRAY new_members LOOP
    IF NOT (m = ANY(old_members)) THEN
      SELECT user_id INTO reciter_user_id FROM public.reciter_profiles WHERE id = m;
      IF reciter_user_id IS NOT NULL THEN
        body_text := 'تم تعيينك في لجنة اختبار ' || type_label
          || COALESCE(' للطالب ' || NEW.student_name, '')
          || ' بتاريخ ' || NEW.date || ' الساعة ' || NEW."time";

        INSERT INTO public.notifications (user_id, title, body, type)
        VALUES (
          reciter_user_id,
          'تم تعيينك في لجنة اختبار ' || type_label,
          body_text,
          'bell'
        );
      END IF;
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS exams_notify_committee ON public.exams;
CREATE TRIGGER exams_notify_committee
AFTER INSERT OR UPDATE OF committee_member_1, committee_member_2, committee_member_3
ON public.exams
FOR EACH ROW
EXECUTE FUNCTION public.notify_exam_committee_members();
