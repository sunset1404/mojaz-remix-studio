
-- Drop old table and recreate with new schema
DROP TABLE IF EXISTS public.video_call_sessions CASCADE;

CREATE TABLE public.video_call_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex'),
    reciter_id UUID NOT NULL,
    student_id UUID NOT NULL,
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

-- Enable RLS
ALTER TABLE public.video_call_sessions ENABLE ROW LEVEL SECURITY;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.video_call_sessions;

-- RLS Policies
CREATE POLICY "Users can view own call sessions via reciter_id"
ON public.video_call_sessions FOR SELECT
USING (auth.uid() = reciter_id);

CREATE POLICY "Users can view own call sessions via student_id"
ON public.video_call_sessions FOR SELECT
USING (auth.uid() = student_id);

CREATE POLICY "Students can create call sessions"
ON public.video_call_sessions FOR INSERT
WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Reciters can update own sessions"
ON public.video_call_sessions FOR UPDATE
USING (auth.uid() = reciter_id);

CREATE POLICY "Students can update own sessions"
ON public.video_call_sessions FOR UPDATE
USING (auth.uid() = student_id);

CREATE POLICY "Admins can manage call sessions"
ON public.video_call_sessions FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
