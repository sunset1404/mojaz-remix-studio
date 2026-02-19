
-- Add exam selection to student profiles
ALTER TABLE public.student_profiles 
ADD COLUMN IF NOT EXISTS selected_exam_id uuid NULL;

-- Allow authenticated users to view scheduled admission exams
CREATE POLICY "Students can view scheduled admission exams"
  ON public.exams FOR SELECT
  TO authenticated
  USING (type = 'admission' AND status = 'scheduled');
