CREATE POLICY "Reciters can view their assigned students sessions"
ON public.session_records
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.student_profiles sp
    WHERE sp.user_id = session_records.user_id
      AND sp.assigned_reciter_id = auth.uid()
  )
);