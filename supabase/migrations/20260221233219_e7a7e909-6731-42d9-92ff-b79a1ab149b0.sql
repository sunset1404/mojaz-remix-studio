
-- Allow admins to insert, update, and delete partner_students
CREATE POLICY "Admins can insert partner students"
ON public.partner_students
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update partner students"
ON public.partner_students
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete partner students"
ON public.partner_students
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));
