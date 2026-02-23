
-- Allow authenticated users (students) to view approved reciter profiles
CREATE POLICY "Anyone can view approved reciter profiles"
ON public.reciter_profiles FOR SELECT
USING (status = 'approved');
