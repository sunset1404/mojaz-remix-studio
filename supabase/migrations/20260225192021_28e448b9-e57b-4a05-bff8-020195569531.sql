CREATE POLICY "Reciters can insert sessions for their assigned students"
ON public.session_records
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM student_profiles sp
    WHERE sp.user_id = session_records.user_id
    AND sp.assigned_reciter_id = auth.uid()
  )
);