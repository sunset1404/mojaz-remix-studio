CREATE POLICY "Users mark own grant request notified"
ON public.subscription_grant_requests
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);