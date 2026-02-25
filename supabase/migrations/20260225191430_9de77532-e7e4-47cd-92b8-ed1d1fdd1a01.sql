CREATE POLICY "Reciters can view their assigned students profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM student_profiles sp
    WHERE sp.user_id = profiles.user_id
    AND sp.assigned_reciter_id = auth.uid()
  )
);