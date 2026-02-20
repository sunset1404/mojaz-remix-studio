
-- Create popup_messages table for managing in-app floating card notifications
CREATE TABLE public.popup_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  message text NOT NULL,
  trigger_event text NOT NULL,
  icon text NOT NULL DEFAULT '🎉',
  color_scheme text NOT NULL DEFAULT 'gold',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.popup_messages ENABLE ROW LEVEL SECURITY;

-- Admins can manage all popup messages
CREATE POLICY "Admins can manage popup messages"
  ON public.popup_messages
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can view active popup messages
CREATE POLICY "Authenticated users can view active popup messages"
  ON public.popup_messages
  FOR SELECT
  USING (is_active = true AND auth.uid() IS NOT NULL);

-- Trigger for updated_at
CREATE TRIGGER update_popup_messages_updated_at
  BEFORE UPDATE ON public.popup_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default trigger-based messages
INSERT INTO public.popup_messages (title, message, trigger_event, icon, color_scheme) VALUES
('أحسنت! 🎊', 'لقد أتممت جلسة تلاوة بنجاح، بارك الله في جهودك واجعلها في ميزان حسناتك!', 'session_complete', '📖', 'gold'),
('ختمة مباركة! 🌟', 'ما شاء الله! أتممت ختمة كاملة للقرآن الكريم، نسأل الله أن يبارك في حفظك!', 'hatma_complete', '✨', 'gold'),
('عرض خاص! 💎', 'احصل على خصم حصري على اشتراكك، لا تفوّت هذه الفرصة الذهبية!', 'special_offer', '🎁', 'purple'),
('جزء محفوظ! 🏆', 'بارك الله فيك! لقد حفظت جزءاً جديداً من كتاب الله العزيز!', 'juz_memorized', '🏅', 'green'),
('خطتك مكتملة! ⭐', 'أحسنت على الالتزام! لقد أتممت خطتك الأسبوعية كاملة، استمر في هذا الجهد!', 'weekly_plan_complete', '📅', 'teal'),
('إجازة مباركة! 🎓', 'ألف مبروك! حصلت على إجازة في القرآن الكريم، نسأل الله أن ينفع بك!', 'ijaza_earned', '🎓', 'gold'),
('شهادة جديدة! 📜', 'مبروك! حصلت على شهادة تقديرية جديدة، استمر في التميز!', 'certificate_earned', '📜', 'blue'),
('إنجاز جديد! 🌟', 'رائع! فتحت إنجازاً جديداً في رحلتك مع القرآن الكريم!', 'achievement_unlocked', '🏆', 'teal');
