
-- Fix: Drop the restrictive policy and create a permissive one that allows anon users to view admission exams
-- (needed because students browse exams BEFORE signing up)
DROP POLICY IF EXISTS "Students can view scheduled admission exams" ON public.exams;

CREATE POLICY "Anyone can view scheduled admission exams"
  ON public.exams
  AS PERMISSIVE
  FOR SELECT
  TO anon, authenticated
  USING (type = 'admission' AND status = 'scheduled');
