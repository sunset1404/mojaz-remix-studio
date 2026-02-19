
-- Add columns for admin-issued certificates
ALTER TABLE public.certificates 
ADD COLUMN IF NOT EXISTS reciter_id uuid,
ADD COLUMN IF NOT EXISTS riwaya text,
ADD COLUMN IF NOT EXISTS notes text,
ADD COLUMN IF NOT EXISTS issued_by uuid,
ADD COLUMN IF NOT EXISTS student_name text,
ADD COLUMN IF NOT EXISTS reciter_name text,
ADD COLUMN IF NOT EXISTS certificate_text text,
ADD COLUMN IF NOT EXISTS student_phone text,
ADD COLUMN IF NOT EXISTS student_email text;

-- Allow admins to insert certificates
CREATE POLICY "Admins can insert certificates"
ON public.certificates
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to update certificates
CREATE POLICY "Admins can update certificates"
ON public.certificates
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete certificates
CREATE POLICY "Admins can delete certificates"
ON public.certificates
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
