
-- Create student subscriptions table
CREATE TABLE public.student_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid NOT NULL,
  student_name text NOT NULL DEFAULT '',
  student_phone text,
  subscription_type text NOT NULL DEFAULT 'حفظ القرآن الكريم',
  amount numeric NOT NULL DEFAULT 0,
  duration_months integer NOT NULL DEFAULT 1,
  start_date date NOT NULL DEFAULT CURRENT_DATE,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'active',
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.student_subscriptions ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage student subscriptions"
ON public.student_subscriptions
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Students can view their own subscriptions
CREATE POLICY "Students can view their own subscriptions"
ON public.student_subscriptions
FOR SELECT
TO authenticated
USING (auth.uid() = student_id);

-- Auto-update updated_at
CREATE TRIGGER update_student_subscriptions_updated_at
BEFORE UPDATE ON public.student_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
