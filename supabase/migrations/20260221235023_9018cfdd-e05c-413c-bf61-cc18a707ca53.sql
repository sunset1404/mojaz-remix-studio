-- Add target_role column to popup_messages to distinguish student/reciter/partner messages
ALTER TABLE public.popup_messages 
ADD COLUMN target_role text NOT NULL DEFAULT 'student';

-- Update existing messages to be for students (they already are)
UPDATE public.popup_messages SET target_role = 'student' WHERE target_role = 'student';