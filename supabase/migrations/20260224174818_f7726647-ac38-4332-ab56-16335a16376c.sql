
-- Add caller_role column
ALTER TABLE public.video_call_sessions
ADD COLUMN caller_role text NOT NULL DEFAULT 'student';

-- Add check constraint
ALTER TABLE public.video_call_sessions
ADD CONSTRAINT video_call_sessions_caller_role_check CHECK (caller_role IN ('student', 'reciter'));

-- Backfill existing rows
UPDATE public.video_call_sessions SET caller_role = 'student' WHERE caller_role IS NULL OR caller_role = 'student';
