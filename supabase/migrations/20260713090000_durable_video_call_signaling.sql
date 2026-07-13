-- Durable, recoverable WebRTC signaling using the existing Supabase backend.
-- Realtime UPDATE events accelerate delivery, while these columns remain the
-- source of truth when an event is missed or a client reconnects.

ALTER TABLE public.video_call_sessions
  ADD COLUMN IF NOT EXISTS signaling_generation integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS caller_ready_at timestamptz,
  ADD COLUMN IF NOT EXISTS callee_ready_at timestamptz,
  ADD COLUMN IF NOT EXISTS offer_sdp jsonb,
  ADD COLUMN IF NOT EXISTS answer_sdp jsonb,
  ADD COLUMN IF NOT EXISTS offer_generation integer,
  ADD COLUMN IF NOT EXISTS answer_generation integer,
  ADD COLUMN IF NOT EXISTS caller_connection_state text,
  ADD COLUMN IF NOT EXISTS callee_connection_state text,
  ADD COLUMN IF NOT EXISTS failure_code text;

ALTER TABLE public.video_call_sessions
  DROP CONSTRAINT IF EXISTS video_call_sessions_signaling_generation_check;

ALTER TABLE public.video_call_sessions
  ADD CONSTRAINT video_call_sessions_signaling_generation_check
  CHECK (signaling_generation > 0);

ALTER TABLE public.video_call_sessions
  DROP CONSTRAINT IF EXISTS video_call_sessions_caller_connection_state_check;

ALTER TABLE public.video_call_sessions
  ADD CONSTRAINT video_call_sessions_caller_connection_state_check
  CHECK (
    caller_connection_state IS NULL OR
    caller_connection_state IN ('new', 'connecting', 'connected', 'disconnected', 'failed', 'closed')
  );

ALTER TABLE public.video_call_sessions
  DROP CONSTRAINT IF EXISTS video_call_sessions_callee_connection_state_check;

ALTER TABLE public.video_call_sessions
  ADD CONSTRAINT video_call_sessions_callee_connection_state_check
  CHECK (
    callee_connection_state IS NULL OR
    callee_connection_state IN ('new', 'connecting', 'connected', 'disconnected', 'failed', 'closed')
  );

CREATE OR REPLACE FUNCTION public.sync_video_call_connected_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Accepting a call is not the same as establishing media. Only transition
  -- to active once both peer connections independently report connected.
  IF NEW.status NOT IN ('ended', 'failed')
     AND NEW.caller_connection_state = 'connected'
     AND NEW.callee_connection_state = 'connected' THEN
    NEW.status := 'active';
    NEW.started_at := COALESCE(NEW.started_at, now());
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_video_call_connected_status_trigger
ON public.video_call_sessions;

CREATE TRIGGER sync_video_call_connected_status_trigger
BEFORE UPDATE OF caller_connection_state, callee_connection_state
ON public.video_call_sessions
FOR EACH ROW
EXECUTE FUNCTION public.sync_video_call_connected_status();

COMMENT ON COLUMN public.video_call_sessions.offer_sdp IS
  'Complete non-trickle WebRTC offer, including gathered ICE candidates.';
COMMENT ON COLUMN public.video_call_sessions.answer_sdp IS
  'Complete non-trickle WebRTC answer, including gathered ICE candidates.';
COMMENT ON COLUMN public.video_call_sessions.signaling_generation IS
  'Monotonic generation used to reject stale offers and answers during reconnects.';
