
-- Allow admins to insert and update student achievements
CREATE POLICY "Admins can insert achievements"
ON public.student_achievements FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update achievements"
ON public.student_achievements FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete achievements"
ON public.student_achievements FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));
