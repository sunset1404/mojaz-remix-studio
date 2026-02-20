
-- Create reward_rules table for gamification system
CREATE TABLE public.reward_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  action_key text NOT NULL UNIQUE,
  points integer NOT NULL DEFAULT 10,
  icon text NOT NULL DEFAULT 'star',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reward_rules ENABLE ROW LEVEL SECURITY;

-- Admins can manage reward rules
CREATE POLICY "Admins can manage reward rules"
ON public.reward_rules
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- All authenticated users can view active reward rules
CREATE POLICY "Authenticated users can view active reward rules"
ON public.reward_rules
FOR SELECT
TO authenticated
USING (is_active = true);

-- Trigger for updated_at
CREATE TRIGGER update_reward_rules_updated_at
BEFORE UPDATE ON public.reward_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default reward rules
INSERT INTO public.reward_rules (name, description, action_key, points, icon, is_active) VALUES
('إتمام جلسة', 'نقاط تُمنح عند إتمام كل جلسة إقراء بنجاح', 'session_complete', 20, 'BookOpen', true),
('حضور متواصل أسبوعي', 'نقاط تُمنح عند الالتزام بالخطة الأسبوعية كاملة', 'weekly_streak', 50, 'Flame', true),
('الحصول على شهادة', 'نقاط تُمنح عند منح الطالب شهادة اجتياز', 'certificate_earned', 100, 'Award', true),
('ختم القرآن الكريم', 'نقاط تُمنح عند إتمام حفظ أو تلاوة القرآن كاملاً', 'quran_completion', 500, 'Crown', true),
('حفظ جزء كامل', 'نقاط تُمنح لكل جزء يتم حفظه', 'part_memorized', 30, 'BookMarked', true),
('أول جلسة', 'نقاط ترحيبية عند إتمام أول جلسة', 'first_session', 10, 'Sparkles', true),
('إتمام 10 جلسات', 'نقاط مكافأة عند الوصول إلى 10 جلسات', 'sessions_10', 80, 'Trophy', true),
('إتمام 50 جلسة', 'نقاط مكافأة عند الوصول إلى 50 جلسة', 'sessions_50', 200, 'Trophy', true);
