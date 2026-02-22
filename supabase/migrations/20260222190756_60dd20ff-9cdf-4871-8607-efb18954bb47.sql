
-- 1. Create payment_invoice_metadata table
CREATE TABLE IF NOT EXISTS payment_invoice_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  moyassar_payment_id TEXT UNIQUE,
  source_type TEXT NOT NULL CHECK (source_type IN ('subscription', 'gift', 'extra_hours')),
  amount_sar NUMERIC NOT NULL CHECK (amount_sar > 0),
  metadata JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  processed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE payment_invoice_metadata ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own payment metadata"
  ON payment_invoice_metadata FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own payment metadata"
  ON payment_invoice_metadata FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role can manage payment metadata"
  ON payment_invoice_metadata FOR ALL
  USING (true)
  WITH CHECK (true);
CREATE INDEX idx_payment_metadata_moyassar_id ON payment_invoice_metadata (moyassar_payment_id);
CREATE INDEX idx_payment_metadata_user_id ON payment_invoice_metadata (user_id);

-- 2. Create video_call_sessions table from scratch
CREATE TABLE IF NOT EXISTS public.video_call_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id TEXT NOT NULL UNIQUE,
  caller_id UUID,
  callee_id UUID,
  status TEXT NOT NULL DEFAULT 'waiting',
  reciter_joined_at TIMESTAMPTZ,
  student_joined_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  access_token TEXT,
  student_name TEXT,
  link_used BOOLEAN DEFAULT false,
  rating INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.video_call_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Caller can view own call sessions" ON public.video_call_sessions FOR SELECT USING (auth.uid() = caller_id);
CREATE POLICY "Caller can create call sessions" ON public.video_call_sessions FOR INSERT WITH CHECK (auth.uid() = caller_id);
CREATE POLICY "Caller can update own call sessions" ON public.video_call_sessions FOR UPDATE USING (auth.uid() = caller_id);
CREATE POLICY "Callee can view own call sessions" ON public.video_call_sessions FOR SELECT USING (auth.uid() = callee_id);
CREATE POLICY "Callee can update own call sessions" ON public.video_call_sessions FOR UPDATE USING (auth.uid() = callee_id);
CREATE POLICY "Admins can manage call sessions" ON public.video_call_sessions FOR ALL USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_vcs_caller_id ON public.video_call_sessions(caller_id);
CREATE INDEX IF NOT EXISTS idx_vcs_callee_id ON public.video_call_sessions(callee_id);
CREATE INDEX IF NOT EXISTS idx_vcs_room_id ON public.video_call_sessions(room_id);
