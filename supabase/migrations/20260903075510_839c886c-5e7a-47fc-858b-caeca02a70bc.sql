CREATE POLICY "Reciters can update their assigned students sessions"
ON public.session_records
FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.student_profiles sp
  WHERE sp.user_id = session_records.user_id
    AND sp.assigned_reciter_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.student_profiles sp
  WHERE sp.user_id = session_records.user_id
    AND sp.assigned_reciter_id = auth.uid()
));