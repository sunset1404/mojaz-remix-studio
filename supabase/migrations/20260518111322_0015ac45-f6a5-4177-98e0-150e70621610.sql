
-- جدول إدخالات إقراء ضيوف الرحمن
CREATE TABLE public.ghuyuf_rahman_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reciter_name TEXT NOT NULL,
  country TEXT,
  nationality TEXT,
  riwaya TEXT,
  pages INTEGER NOT NULL DEFAULT 0,
  juz INTEGER NOT NULL DEFAULT 0,
  hours NUMERIC NOT NULL DEFAULT 0,
  students_count INTEGER NOT NULL DEFAULT 0,
  notes TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ghuyuf_rahman_entries ENABLE ROW LEVEL SECURITY;

-- المشرفون يديرون كل شيء
CREATE POLICY "Admins manage ghuyuf entries"
ON public.ghuyuf_rahman_entries
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- المستخدمون المسجلون يمكنهم القراءة (للإحصائيات العامة)
CREATE POLICY "Authenticated can view ghuyuf entries"
ON public.ghuyuf_rahman_entries
FOR SELECT
USING (auth.uid() IS NOT NULL);

CREATE TRIGGER update_ghuyuf_rahman_entries_updated_at
BEFORE UPDATE ON public.ghuyuf_rahman_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- جدول إعدادات بسيط لحفظ رابط الاستبانة الخارجية
CREATE TABLE public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage app settings"
ON public.app_settings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can read app settings"
ON public.app_settings
FOR SELECT
USING (auth.uid() IS NOT NULL);
