
CREATE TABLE public.extra_hour_packages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  label TEXT NOT NULL,
  hours INTEGER NOT NULL DEFAULT 1,
  price NUMERIC NOT NULL DEFAULT 0,
  original_price NUMERIC,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.extra_hour_packages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage extra hour packages"
  ON public.extra_hour_packages FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active extra hour packages"
  ON public.extra_hour_packages FOR SELECT
  USING (is_active = true);

-- Seed with current hardcoded data
INSERT INTO public.extra_hour_packages (label, hours, price, original_price, sort_order) VALUES
  ('ساعة واحدة', 1, 15, NULL, 0),
  ('٣ ساعات', 3, 40, 45, 1),
  ('٥ ساعات', 5, 60, 75, 2),
  ('١٠ ساعات', 10, 100, 150, 3);
