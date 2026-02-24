-- Persist popup display state per user to guarantee one-time display across sessions/devices
CREATE TABLE IF NOT EXISTS public.popup_message_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  trigger_event TEXT NOT NULL,
  popup_message_id UUID NULL REFERENCES public.popup_messages(id) ON DELETE SET NULL,
  shown_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, trigger_event)
);

ALTER TABLE public.popup_message_views ENABLE ROW LEVEL SECURITY;

-- Students can read only their own seen popups
CREATE POLICY "Users can view their own popup views"
ON public.popup_message_views
FOR SELECT
USING (auth.uid() = user_id);

-- Students can mark their own popup as shown
CREATE POLICY "Users can insert their own popup views"
ON public.popup_message_views
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all popup views
CREATE POLICY "Admins can view all popup views"
ON public.popup_message_views
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_popup_message_views_user_id
  ON public.popup_message_views(user_id);

CREATE INDEX IF NOT EXISTS idx_popup_message_views_trigger_event
  ON public.popup_message_views(trigger_event);