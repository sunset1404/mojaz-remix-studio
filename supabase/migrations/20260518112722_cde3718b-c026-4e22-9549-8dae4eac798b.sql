
-- Add date and location columns
ALTER TABLE public.ghuyuf_rahman_entries
  ADD COLUMN IF NOT EXISTS entry_date date NOT NULL DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS location text;

-- Locations master table
CREATE TABLE IF NOT EXISTS public.ghuyuf_rahman_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ghuyuf_rahman_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view ghuyuf locations"
  ON public.ghuyuf_rahman_locations FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins manage ghuyuf locations"
  ON public.ghuyuf_rahman_locations FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Allow authenticated reciters to insert their own survey entries
CREATE POLICY "Authenticated can insert ghuyuf entries"
  ON public.ghuyuf_rahman_entries FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Seed a few common locations (optional)
INSERT INTO public.ghuyuf_rahman_locations (name) VALUES
  ('المسجد الحرام'),
  ('المسجد النبوي'),
  ('منى'),
  ('عرفات'),
  ('مزدلفة')
ON CONFLICT (name) DO NOTHING;
