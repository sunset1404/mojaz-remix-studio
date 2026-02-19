
-- Create storage bucket for reciter stamps and signatures
INSERT INTO storage.buckets (id, name, public) VALUES ('reciter-assets', 'reciter-assets', true);

-- Allow admins to upload
CREATE POLICY "Admins can upload reciter assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'reciter-assets' AND public.has_role(auth.uid(), 'admin'));

-- Allow admins to update
CREATE POLICY "Admins can update reciter assets"
ON storage.objects FOR UPDATE
USING (bucket_id = 'reciter-assets' AND public.has_role(auth.uid(), 'admin'));

-- Allow admins to delete
CREATE POLICY "Admins can delete reciter assets"
ON storage.objects FOR DELETE
USING (bucket_id = 'reciter-assets' AND public.has_role(auth.uid(), 'admin'));

-- Public read access
CREATE POLICY "Reciter assets are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'reciter-assets');
