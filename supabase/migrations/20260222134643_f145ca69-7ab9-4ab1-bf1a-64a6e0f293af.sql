
-- Auto notification rules (similar to popup_messages but for push notifications)
CREATE TABLE public.auto_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  trigger_event TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'bell',
  notification_type TEXT NOT NULL DEFAULT 'bell',
  is_active BOOLEAN NOT NULL DEFAULT true,
  target_role TEXT NOT NULL DEFAULT 'student',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.auto_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage auto_notifications" ON public.auto_notifications
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Anyone can read active auto_notifications" ON public.auto_notifications
  FOR SELECT USING (is_active = true);
