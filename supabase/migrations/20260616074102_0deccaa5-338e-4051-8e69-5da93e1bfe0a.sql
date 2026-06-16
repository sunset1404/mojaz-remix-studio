ALTER TABLE public.subscription_grant_requests ADD COLUMN approved_subscription_id uuid REFERENCES public.student_subscriptions(id) ON DELETE SET NULL;

GRANT SELECT, INSERT, UPDATE ON public.subscription_grant_requests TO authenticated;
GRANT ALL ON public.subscription_grant_requests TO service_role;