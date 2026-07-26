CREATE TABLE public.call_diagnostics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id text NOT NULL,
  user_id uuid,
  role text NOT NULL,
  verdict text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  local_candidate_type text,
  remote_candidate_type text,
  candidate_protocol text,
  network_type text,
  inbound_audio_packets bigint,
  outbound_audio_packets bigint,
  inbound_audio_bytes bigint,
  outbound_audio_bytes bigint,
  audio_level numeric,
  ice_connection_state text,
  connection_state text,
  gathered_candidate_types text[],
  user_agent text,
  details jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX call_diagnostics_room_idx ON public.call_diagnostics (room_id, created_at DESC);
CREATE INDEX call_diagnostics_created_idx ON public.call_diagnostics (created_at DESC);

GRANT INSERT ON public.call_diagnostics TO anon;
GRANT SELECT, INSERT ON public.call_diagnostics TO authenticated;
GRANT ALL ON public.call_diagnostics TO service_role;

ALTER TABLE public.call_diagnostics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone in a call can log diagnostics"
ON public.call_diagnostics FOR INSERT TO anon, authenticated
WITH CHECK (
  user_id IS NULL OR user_id = auth.uid()
);

CREATE POLICY "Admins can read diagnostics"
ON public.call_diagnostics FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));