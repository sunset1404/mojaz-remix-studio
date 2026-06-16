
-- Add exam_id link on video_call_sessions
ALTER TABLE public.video_call_sessions
  ADD COLUMN IF NOT EXISTS exam_id uuid REFERENCES public.exams(id) ON DELETE SET NULL;

-- Exam evaluations table
CREATE TABLE IF NOT EXISTS public.exam_evaluations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid REFERENCES public.exams(id) ON DELETE SET NULL,
  student_id uuid NOT NULL,
  student_name text,
  reciter_id uuid NOT NULL,
  reciter_name text,
  exam_type text,
  scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  total_score numeric NOT NULL DEFAULT 0,
  passed boolean NOT NULL DEFAULT false,
  start_surah text,
  start_ayah text,
  end_surah text,
  end_ayah text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.exam_evaluations TO authenticated;
GRANT ALL ON public.exam_evaluations TO service_role;

ALTER TABLE public.exam_evaluations ENABLE ROW LEVEL SECURITY;

-- Student can view their own evaluations
CREATE POLICY "students view own evaluations"
  ON public.exam_evaluations FOR SELECT
  TO authenticated
  USING (student_id = auth.uid());

-- Reciter can view evaluations they created
CREATE POLICY "reciter view own created evaluations"
  ON public.exam_evaluations FOR SELECT
  TO authenticated
  USING (reciter_id = auth.uid());

-- Assigned reciter can view evaluations of their students
CREATE POLICY "assigned reciter view student evaluations"
  ON public.exam_evaluations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.student_profiles sp
      WHERE sp.user_id = exam_evaluations.student_id
        AND sp.assigned_reciter_id = auth.uid()
    )
  );

-- Admin sees everything
CREATE POLICY "admin view all evaluations"
  ON public.exam_evaluations FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Reciter can insert evaluation when they are committee member of exam
CREATE POLICY "reciter insert evaluation"
  ON public.exam_evaluations FOR INSERT
  TO authenticated
  WITH CHECK (
    reciter_id = auth.uid()
    AND (
      exam_id IS NULL
      OR public.is_exam_committee_member(exam_id, auth.uid())
    )
  );

-- Admin can update/delete
CREATE POLICY "admin manage evaluations"
  ON public.exam_evaluations FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Updated at trigger
CREATE TRIGGER trg_exam_evaluations_updated_at
  BEFORE UPDATE ON public.exam_evaluations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_exam_eval_student ON public.exam_evaluations(student_id);
CREATE INDEX IF NOT EXISTS idx_exam_eval_reciter ON public.exam_evaluations(reciter_id);
CREATE INDEX IF NOT EXISTS idx_exam_eval_exam ON public.exam_evaluations(exam_id);
