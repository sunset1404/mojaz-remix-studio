
-- Add status column to reciter_profiles for approval workflow
ALTER TABLE public.reciter_profiles 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending';

-- Allow admins to update reciter profiles (for approval/rejection)
CREATE POLICY "Admins can update all reciter profiles"
ON public.reciter_profiles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));
