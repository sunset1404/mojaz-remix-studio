
-- Add email column to partner_profiles to store the partner's login email
ALTER TABLE public.partner_profiles ADD COLUMN email text;
