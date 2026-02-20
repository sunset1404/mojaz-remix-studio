
-- Create subscription_plans table
CREATE TABLE public.subscription_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  price_monthly numeric NOT NULL DEFAULT 0,
  price_yearly numeric,
  period text NOT NULL DEFAULT 'ريال / شهرياً',
  icon text NOT NULL DEFAULT 'Crown',
  features text[] NOT NULL DEFAULT '{}',
  not_included text[] NOT NULL DEFAULT '{}',
  is_popular boolean NOT NULL DEFAULT false,
  has_billing boolean NOT NULL DEFAULT true,
  subtitle text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create gift_plans table
CREATE TABLE public.gift_plans (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  price numeric NOT NULL DEFAULT 0,
  original_price numeric,
  duration text NOT NULL DEFAULT 'شهر واحد',
  duration_months integer NOT NULL DEFAULT 1,
  hours text NOT NULL DEFAULT '10 ساعات',
  discount text,
  features text[] NOT NULL DEFAULT '{}',
  icon text NOT NULL DEFAULT 'Gift',
  is_popular boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_plans ENABLE ROW LEVEL SECURITY;

-- RLS policies for subscription_plans
CREATE POLICY "Admins can manage subscription plans"
  ON public.subscription_plans FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active subscription plans"
  ON public.subscription_plans FOR SELECT
  USING (is_active = true);

-- RLS policies for gift_plans
CREATE POLICY "Admins can manage gift plans"
  ON public.gift_plans FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view active gift plans"
  ON public.gift_plans FOR SELECT
  USING (is_active = true);

-- Update triggers
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_gift_plans_updated_at
  BEFORE UPDATE ON public.gift_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, price_monthly, price_yearly, period, icon, features, not_included, is_popular, has_billing, subtitle, sort_order) VALUES
(
  'المجاني', 0, NULL, 'ساعة مجانية للحساب الجديد', 'Zap',
  ARRAY['ساعة واحدة مجانية للتجربة', 'اختيار مقرئ واحد', 'تتبع أساسي للتقدم'],
  ARRAY['ساعات إضافية بعد التجربة', 'إجازات قرآنية', 'شهادات معتمدة'],
  false, false, 'بعد انتهاء الساعة المجانية يتم تفعيل الاشتراك الشهري', 1
),
(
  'الحفظ والمراجعة', 89, 890, 'ريال / شهرياً', 'Crown',
  ARRAY['10 ساعات شهرياً', 'حفظ ومراجعة القرآن', 'تصحيح التلاوة والتجويد', 'جميع المقرئين متاحين', 'تتبع متقدم للتقدم', 'دعم أولوي 24/7'],
  ARRAY[]::text[],
  true, true, NULL, 2
),
(
  'الإجازات القرآنية', 89, 890, 'ريال / شهرياً', 'Sparkles',
  ARRAY['10 ساعات شهرياً', 'إجازة في القراءة', 'شهادات معتمدة', 'مقرئين متخصصين بالإجازات', 'متابعة مستمرة للتقدم', 'أولوية حجز المقرئين'],
  ARRAY[]::text[],
  false, true, NULL, 3
);

-- Insert default gift plans
INSERT INTO public.gift_plans (name, price, original_price, duration, duration_months, hours, discount, features, icon, is_popular, sort_order) VALUES
(
  'هدية الانطلاقة', 89, NULL, 'شهر واحد', 1, '10 ساعات', NULL,
  ARRAY['10 ساعات تعليمية', 'حفظ ومراجعة', 'مقرئ معتمد'],
  'Gift', false, 1
),
(
  'هدية التميز', 445, 534, '6 أشهر', 6, '60 ساعة', 'توفير 17%',
  ARRAY['60 ساعة تعليمية', 'حفظ ومراجعة متقدم', 'شهادة تقدم', 'مقرئ معتمد'],
  'Crown', true, 2
),
(
  'هدية الختمة', 790, 1068, 'سنة كاملة', 12, '120 ساعة', 'توفير 26%',
  ARRAY['120 ساعة تعليمية', 'أولوية حجز المقرئين', 'شهادة إتمام معتمدة', 'متابعة مستمرة'],
  'Star', false, 3
);
