
-- Create student_profiles table
CREATE TABLE public.student_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  gender TEXT NOT NULL,
  id_number TEXT NOT NULL,
  email TEXT NOT NULL,
  residence_country TEXT NOT NULL,
  nationality TEXT NOT NULL,
  phone TEXT NOT NULL,
  profession TEXT NOT NULL,
  education_level TEXT NOT NULL,
  quran_certifications TEXT DEFAULT '',
  preferred_riwaya TEXT NOT NULL DEFAULT '',
  preferred_track TEXT NOT NULL DEFAULT '',
  join_date TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own student profile"
ON public.student_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own student profile"
ON public.student_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own student profile"
ON public.student_profiles FOR UPDATE
USING (auth.uid() = user_id);

-- Timestamp trigger
CREATE TRIGGER update_student_profiles_updated_at
BEFORE UPDATE ON public.student_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
