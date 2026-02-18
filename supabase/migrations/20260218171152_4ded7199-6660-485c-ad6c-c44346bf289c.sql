-- Allow admins to read all student_profiles
CREATE POLICY "Admins can view all student profiles"
ON public.student_profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to read all reciter_profiles
CREATE POLICY "Admins can view all reciter profiles"
ON public.reciter_profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to read all partner_profiles
CREATE POLICY "Admins can view all partner profiles"
ON public.partner_profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to read all session_records
CREATE POLICY "Admins can view all session records"
ON public.session_records
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to read all certificates
CREATE POLICY "Admins can view all certificates"
ON public.certificates
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to read all gift_subscriptions
CREATE POLICY "Admins can view all gift subscriptions"
ON public.gift_subscriptions
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));
