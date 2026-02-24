-- Allow authenticated users to view reciter certifications (for display on reciters page)
CREATE POLICY "Authenticated users can view reciter certifications"
ON public.reciter_certifications
FOR SELECT
USING (auth.uid() IS NOT NULL);