
-- Add ijazah workflow columns to student_profiles
ALTER TABLE public.student_profiles 
ADD COLUMN ijazah_status text DEFAULT 'pending_test',
ADD COLUMN assigned_reciter_id uuid;

-- ijazah_status values:
-- 'pending_test' = بانتظار اختبار القبول
-- 'assigned_to_reciter' = تم التحويل لمقرئ
-- 'recitation_completed' = انتهاء من الإقراء
-- 'merit_test' = اختبار استحقاق
-- 'ijazah_granted' = حصل على الإجازة

-- Add RLS policy for admins to update student profiles
CREATE POLICY "Admins can update all student profiles"
ON public.student_profiles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));
