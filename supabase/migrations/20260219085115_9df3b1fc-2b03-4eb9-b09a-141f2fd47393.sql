
-- Table for certificate/ijaza design templates
CREATE TABLE public.certificate_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'ijaza', -- 'ijaza' or 'certificate'
  -- Background: either uploaded image or color
  background_image_url text,
  background_color text DEFAULT '#ffffff',
  -- Field positions and styles (JSON): each field has x, y, fontSize, fontFamily, color, textAlign
  field_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- Whether this is the active/default template for its type
  is_active boolean NOT NULL DEFAULT false,
  -- Platform logo URL override (optional)
  logo_url text,
  -- Dimensions
  width integer NOT NULL DEFAULT 1200,
  height integer NOT NULL DEFAULT 850,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage certificate templates"
ON public.certificate_templates FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Anyone authenticated can read active templates (for generating certificates)
CREATE POLICY "Authenticated users can view active templates"
ON public.certificate_templates FOR SELECT
USING (is_active = true AND auth.uid() IS NOT NULL);

-- Trigger for updated_at
CREATE TRIGGER update_certificate_templates_updated_at
BEFORE UPDATE ON public.certificate_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
