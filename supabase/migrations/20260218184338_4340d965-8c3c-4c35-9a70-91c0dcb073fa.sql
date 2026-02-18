
-- Allow admins to insert partner profiles
CREATE POLICY "Admins can insert partner profiles"
ON public.partner_profiles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to update partner profiles
CREATE POLICY "Admins can update partner profiles"
ON public.partner_profiles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to insert user roles (for creating partner accounts)
CREATE POLICY "Admins can insert user roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all profiles (for partner creation)
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all partner usage logs
CREATE POLICY "Admins can view all partner usage logs"
ON public.partner_usage_logs
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow admins to view all partner students
CREATE POLICY "Admins can view all partner students"
ON public.partner_students
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
