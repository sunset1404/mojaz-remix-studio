-- Mojaz App 2: Add caller_id and callee_id to existing video_call_sessions table
-- These allow sessions to reference auth.users directly (vs reciters/registration_requests FKs)

-- Make reciter_id and student_id nullable for Mojaz App 2 sessions
ALTER TABLE public.video_call_sessions ALTER COLUMN reciter_id DROP NOT NULL;
ALTER TABLE public.video_call_sessions ALTER COLUMN student_id DROP NOT NULL;

-- Add new columns for direct auth.users references  
ALTER TABLE public.video_call_sessions
  ADD COLUMN IF NOT EXISTS caller_id UUID,
  ADD COLUMN IF NOT EXISTS callee_id UUID;

-- RLS: Allow caller (auth.uid) to manage their sessions
CREATE POLICY "Caller can view own call sessions"
ON public.video_call_sessions FOR SELECT
USING (auth.uid() = caller_id);

CREATE POLICY "Caller can create call sessions"
ON public.video_call_sessions FOR INSERT
WITH CHECK (auth.uid() = caller_id);

CREATE POLICY "Caller can update own call sessions"
ON public.video_call_sessions FOR UPDATE
USING (auth.uid() = caller_id);

-- RLS: Allow callee (auth.uid) to view/update
CREATE POLICY "Callee can view own call sessions"
ON public.video_call_sessions FOR SELECT
USING (auth.uid() = callee_id);

CREATE POLICY "Callee can update own call sessions"
ON public.video_call_sessions FOR UPDATE
USING (auth.uid() = callee_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vcs_caller_id ON public.video_call_sessions(caller_id);
CREATE INDEX IF NOT EXISTS idx_vcs_callee_id ON public.video_call_sessions(callee_id);
