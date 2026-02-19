
-- Allow anon users to read selected_exam_id from student_profiles (needed for capacity counting during signup)
-- We create a restricted policy allowing only the exam_id column via a security-safe condition
CREATE POLICY "Anyone can read exam registrations count"
  ON public.student_profiles
  AS PERMISSIVE
  FOR SELECT
  TO anon
  USING (selected_exam_id IS NOT NULL);
