-- Allow students to insert their own subscriptions (for free plan activation)
CREATE POLICY "Students can insert their own subscriptions"
ON public.student_subscriptions
FOR INSERT
WITH CHECK (auth.uid() = student_id);
