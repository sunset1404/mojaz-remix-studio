
-- Fix overly permissive RLS policy on payment_invoice_metadata
DROP POLICY IF EXISTS "Service role can manage payment metadata" ON payment_invoice_metadata;
CREATE POLICY "Admins can manage payment metadata" ON payment_invoice_metadata FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow edge function to update payment metadata (service role bypasses RLS anyway)
CREATE POLICY "Users can update own payment metadata" ON payment_invoice_metadata FOR UPDATE
  USING (auth.uid() = user_id);
