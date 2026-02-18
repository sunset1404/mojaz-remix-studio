-- Allow admins to view all student achievements
CREATE POLICY "Admins can view all student achievements"
ON public.student_achievements
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));
