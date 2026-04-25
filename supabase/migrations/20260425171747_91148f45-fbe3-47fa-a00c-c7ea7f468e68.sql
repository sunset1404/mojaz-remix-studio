
-- Per-recipient message tracking (one row per phone in a campaign)
CREATE TABLE IF NOT EXISTS public.whatsapp_message_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  log_id uuid REFERENCES public.whatsapp_manual_logs(id) ON DELETE CASCADE,
  wamid text UNIQUE,
  phone text NOT NULL,
  status text NOT NULL DEFAULT 'sent',
  error_message text,
  sent_at timestamptz NOT NULL DEFAULT now(),
  delivered_at timestamptz,
  read_at timestamptz,
  replied_at timestamptz,
  failed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wmr_log_id ON public.whatsapp_message_recipients(log_id);
CREATE INDEX IF NOT EXISTS idx_wmr_wamid ON public.whatsapp_message_recipients(wamid);
CREATE INDEX IF NOT EXISTS idx_wmr_phone ON public.whatsapp_message_recipients(phone);

ALTER TABLE public.whatsapp_message_recipients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage recipients"
  ON public.whatsapp_message_recipients FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Raw events log from Meta webhook (audit)
CREATE TABLE IF NOT EXISTS public.whatsapp_message_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wamid text,
  phone text,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wme_wamid ON public.whatsapp_message_events(wamid);
CREATE INDEX IF NOT EXISTS idx_wme_event_type ON public.whatsapp_message_events(event_type);

ALTER TABLE public.whatsapp_message_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read events"
  ON public.whatsapp_message_events FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role inserts events"
  ON public.whatsapp_message_events FOR INSERT
  WITH CHECK (true);
