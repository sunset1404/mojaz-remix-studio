-- Mojaz App 2: video_call_sessions table matching Flutter schema
-- Note: reciter_id and student_id reference auth.users to match Mojaz App 2's structure
-- where reciters/students are unified under auth.users, while keeping column names matching Flutter.

CREATE TABLE IF NOT EXISTS public.video_call_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
    reciter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT CHECK (status IN ('waiting', 'active', 'ended', 'failed')) DEFAULT 'waiting',
    reciter_joined_at TIMESTAMPTZ,
    student_joined_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    access_token TEXT,
    student_name TEXT,
    link_used BOOLEAN DEFAULT false,
    rating INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.video_call_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own call sessions via reciter_id"
ON public.video_call_sessions FOR SELECT
USING (auth.uid() = reciter_id);

CREATE POLICY "Users can view own call sessions via student_id"
ON public.video_call_sessions FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Reciters can create and update sessions"
ON public.video_call_sessions FOR ALL
USING (auth.uid() = reciter_id)
WITH CHECK (auth.uid() = reciter_id);

CREATE POLICY "Students can update sessions"
ON public.video_call_sessions FOR UPDATE
USING (auth.uid() = student_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_vcs_reciter_id ON public.video_call_sessions(reciter_id);
CREATE INDEX IF NOT EXISTS idx_vcs_student_id ON public.video_call_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_vcs_status ON public.video_call_sessions(status);
