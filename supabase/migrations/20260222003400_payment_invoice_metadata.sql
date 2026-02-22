-- Payment Invoice Metadata for Moyassar integration
-- Tracks payment attempts and links them to subscriptions/gifts/hours

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

-- RLS policies
ALTER TABLE payment_invoice_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payment metadata"
  ON payment_invoice_metadata FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own payment metadata"
  ON payment_invoice_metadata FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Index for quick lookup by payment ID
CREATE INDEX idx_payment_metadata_moyassar_id ON payment_invoice_metadata (moyassar_payment_id);
CREATE INDEX idx_payment_metadata_user_id ON payment_invoice_metadata (user_id);
