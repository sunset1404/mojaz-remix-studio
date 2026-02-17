
-- Create reciter_profiles table for additional reciter information
CREATE TABLE public.reciter_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  gender TEXT NOT NULL,
  nationality TEXT NOT NULL,
  id_number TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT NOT NULL,
  profession TEXT NOT NULL,
  qualifications TEXT NOT NULL,
  quran_certifications TEXT NOT NULL,
  teaching_experience TEXT NOT NULL,
  preferred_days TEXT[] NOT NULL DEFAULT '{}',
  preferred_times TEXT[] NOT NULL DEFAULT '{}',
  preferred_track TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reciter_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own reciter profile
CREATE POLICY "Users can view their own reciter profile"
ON public.reciter_profiles FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own reciter profile
CREATE POLICY "Users can insert their own reciter profile"
ON public.reciter_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own reciter profile
CREATE POLICY "Users can update their own reciter profile"
ON public.reciter_profiles FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_reciter_profiles_updated_at
BEFORE UPDATE ON public.reciter_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
