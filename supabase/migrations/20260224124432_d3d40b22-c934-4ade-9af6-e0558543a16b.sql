
-- Add monthly_minutes column to subscription_plans
ALTER TABLE public.subscription_plans ADD COLUMN monthly_minutes INTEGER NOT NULL DEFAULT 0;

-- Update existing plans with their minute allocations
UPDATE public.subscription_plans SET monthly_minutes = 60 WHERE name = 'المجاني';
UPDATE public.subscription_plans SET monthly_minutes = 900 WHERE name = 'الحفظ والمراجعة';
UPDATE public.subscription_plans SET monthly_minutes = 900 WHERE name = 'الإجازات القرآنية';
