-- WhatsApp Auto Messages table
CREATE TABLE IF NOT EXISTS public.whatsapp_auto_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trigger_event text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  icon text NOT NULL DEFAULT '📱',
  color_scheme text NOT NULL DEFAULT 'teal',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_auto_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage whatsapp auto messages"
  ON public.whatsapp_auto_messages
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- WhatsApp Manual Logs table
CREATE TABLE IF NOT EXISTS public.whatsapp_manual_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message text NOT NULL,
  target_group text NOT NULL DEFAULT 'all',
  filters jsonb NOT NULL DEFAULT '{}'::jsonb,
  recipients_count integer NOT NULL DEFAULT 0,
  phone_numbers text[] NOT NULL DEFAULT '{}'::text[],
  sent_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.whatsapp_manual_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage whatsapp manual logs"
  ON public.whatsapp_manual_logs
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at on whatsapp_auto_messages
CREATE TRIGGER update_whatsapp_auto_messages_updated_at
  BEFORE UPDATE ON public.whatsapp_auto_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
