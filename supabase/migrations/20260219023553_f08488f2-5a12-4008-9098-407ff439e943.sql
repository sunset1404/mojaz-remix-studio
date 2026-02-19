
-- Remove the single certification_text column (no longer needed)
ALTER TABLE public.reciter_profiles DROP COLUMN IF EXISTS certification_text;

-- Create table for reciter certification texts (one per riwaya + one for khatm)
CREATE TABLE public.reciter_certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reciter_id uuid NOT NULL,
  type text NOT NULL DEFAULT 'ijaza',
  riwaya text,
  certification_text text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(reciter_id, type, riwaya)
);

ALTER TABLE public.reciter_certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage reciter certifications"
ON public.reciter_certifications FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Reciters can view their own certifications"
ON public.reciter_certifications FOR SELECT
TO authenticated
USING (auth.uid() = reciter_id);

CREATE TRIGGER update_reciter_certifications_updated_at
BEFORE UPDATE ON public.reciter_certifications
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
