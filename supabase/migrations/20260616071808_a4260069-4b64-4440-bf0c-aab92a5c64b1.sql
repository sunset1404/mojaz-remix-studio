
CREATE TABLE public.subscription_grant_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text,
  email text,
  reason text NOT NULL,
  requested_plan_id uuid REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
  requested_plan_name text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  admin_notes text,
  approved_plan_id uuid REFERENCES public.subscription_plans(id) ON DELETE SET NULL,
  approved_plan_name text,
  approved_duration_months integer,
  approved_minutes integer,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscription_grant_requests TO authenticated;
GRANT ALL ON public.subscription_grant_requests TO service_role;

ALTER TABLE public.subscription_grant_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own grant requests"
ON public.subscription_grant_requests
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own grant requests"
ON public.subscription_grant_requests
FOR SELECT TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update grant requests"
ON public.subscription_grant_requests
FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete grant requests"
ON public.subscription_grant_requests
FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_subscription_grant_requests_updated_at
BEFORE UPDATE ON public.subscription_grant_requests
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_grant_requests_status ON public.subscription_grant_requests(status, created_at DESC);
CREATE INDEX idx_grant_requests_user ON public.subscription_grant_requests(user_id);
