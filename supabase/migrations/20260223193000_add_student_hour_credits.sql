-- Track extra hour credits purchased by students

CREATE TABLE public.student_hour_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  hours NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.student_hour_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own hour credits"
  ON public.student_hour_credits FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage hour credits"
  ON public.student_hour_credits FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_student_hour_credits_updated_at
  BEFORE UPDATE ON public.student_hour_credits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
