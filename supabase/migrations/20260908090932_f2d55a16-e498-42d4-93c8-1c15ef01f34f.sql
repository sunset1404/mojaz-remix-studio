CREATE TABLE public.programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  track_type text NOT NULL DEFAULT 'general',
  start_date date,
  end_date date,
  status text NOT NULL DEFAULT 'active',
  max_students integer,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.programs TO authenticated;
GRANT ALL ON public.programs TO service_role;

ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view programs"
ON public.programs FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can insert programs"
ON public.programs FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update programs"
ON public.programs FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete programs"
ON public.programs FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_programs_updated_at
BEFORE UPDATE ON public.programs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.student_profiles
  ADD COLUMN program_id uuid REFERENCES public.programs(id) ON DELETE SET NULL;

CREATE INDEX idx_student_profiles_program_id ON public.student_profiles(program_id);