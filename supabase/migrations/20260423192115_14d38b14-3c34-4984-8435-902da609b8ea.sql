
-- Create public bucket for certificate PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificates', 'certificates', true)
ON CONFLICT (id) DO NOTHING;

-- Public can read
CREATE POLICY "Public read certificates"
ON storage.objects FOR SELECT
USING (bucket_id = 'certificates');

-- Admins can insert
CREATE POLICY "Admins upload certificates"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'certificates'
  AND public.has_role(auth.uid(), 'admin')
);

-- Admins can update
CREATE POLICY "Admins update certificates"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'certificates'
  AND public.has_role(auth.uid(), 'admin')
);

-- Admins can delete
CREATE POLICY "Admins delete certificates"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'certificates'
  AND public.has_role(auth.uid(), 'admin')
);
