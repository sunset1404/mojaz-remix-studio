
-- Create student_hour_credits table to track remaining minutes
CREATE TABLE public.student_hour_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  remaining_minutes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.student_hour_credits ENABLE ROW LEVEL SECURITY;

-- Students can view their own credits
CREATE POLICY "Students can view their own credits"
ON public.student_hour_credits FOR SELECT
USING (auth.uid() = user_id);

-- Students can insert their own credits
CREATE POLICY "Students can insert their own credits"
ON public.student_hour_credits FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Students can update their own credits
CREATE POLICY "Students can update their own credits"
ON public.student_hour_credits FOR UPDATE
USING (auth.uid() = user_id);

-- Admins can manage all credits
CREATE POLICY "Admins can manage all credits"
ON public.student_hour_credits FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Service role needs access for edge functions
-- (service role bypasses RLS by default)

-- Add trigger for updated_at
CREATE TRIGGER update_student_hour_credits_updated_at
BEFORE UPDATE ON public.student_hour_credits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
