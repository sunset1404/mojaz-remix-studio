CREATE POLICY "Reciters can view their assigned students achievements"
ON public.student_achievements
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.student_profiles sp
    WHERE sp.user_id = student_achievements.student_id
      AND sp.assigned_reciter_id = auth.uid()
  )
);