
-- Create gift_subscriptions table
CREATE TABLE public.gift_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL,
  recipient_name TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  personal_message TEXT,
  plan_id TEXT NOT NULL,
  plan_name TEXT NOT NULL,
  duration_months INTEGER NOT NULL,
  amount NUMERIC NOT NULL,
  gift_code TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  redeemed_by UUID,
  redeemed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gift_subscriptions ENABLE ROW LEVEL SECURITY;

-- Sender can create gifts
CREATE POLICY "Users can create gift subscriptions"
ON public.gift_subscriptions
FOR INSERT
WITH CHECK (auth.uid() = sender_id);

-- Sender can view their own gifts
CREATE POLICY "Users can view their own gifts"
ON public.gift_subscriptions
FOR SELECT
USING (auth.uid() = sender_id);

-- Anyone authenticated can redeem a gift by code (update status)
CREATE POLICY "Users can redeem gifts"
ON public.gift_subscriptions
FOR UPDATE
USING (status = 'pending')
WITH CHECK (auth.uid() = redeemed_by);

-- Allow anyone authenticated to read by gift_code for redemption
CREATE POLICY "Users can lookup gift by code"
ON public.gift_subscriptions
FOR SELECT
USING (auth.uid() IS NOT NULL);
