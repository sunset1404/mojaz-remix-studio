
-- Create exams table for admission and eligibility tests
CREATE TABLE public.exams (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type text NOT NULL DEFAULT 'admission', -- 'admission' (قبول) or 'eligibility' (استحقاق)
  student_id uuid NULL,
  student_name text NULL,
  date text NOT NULL,
  time text NOT NULL,
  committee_member_1 uuid NULL,
  committee_member_1_name text NULL,
  committee_member_2 uuid NULL,
  committee_member_2_name text NULL,
  committee_member_3 uuid NULL,
  committee_member_3_name text NULL,
  notes text NULL,
  status text NOT NULL DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled'
  result text NULL, -- 'passed', 'failed', NULL
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage exams"
ON public.exams
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_exams_updated_at
BEFORE UPDATE ON public.exams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
