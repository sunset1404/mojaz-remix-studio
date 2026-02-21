CREATE POLICY "Reciters can view their assigned students"
ON public.student_profiles
FOR SELECT
USING (auth.uid() = assigned_reciter_id);