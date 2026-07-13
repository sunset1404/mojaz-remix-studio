
-- Additive columns
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

-- Constraints (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'video_call_sessions_signaling_generation_positive') THEN
    ALTER TABLE public.video_call_sessions
      ADD CONSTRAINT video_call_sessions_signaling_generation_positive
      CHECK (signaling_generation >= 1);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'video_call_sessions_offer_generation_positive') THEN
    ALTER TABLE public.video_call_sessions
      ADD CONSTRAINT video_call_sessions_offer_generation_positive
      CHECK (offer_generation IS NULL OR offer_generation >= 1);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'video_call_sessions_answer_generation_positive') THEN
    ALTER TABLE public.video_call_sessions
      ADD CONSTRAINT video_call_sessions_answer_generation_positive
      CHECK (answer_generation IS NULL OR answer_generation >= 1);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'video_call_sessions_caller_connection_state_check') THEN
    ALTER TABLE public.video_call_sessions
      ADD CONSTRAINT video_call_sessions_caller_connection_state_check
      CHECK (caller_connection_state IS NULL OR caller_connection_state = ANY (ARRAY['new','connecting','connected','disconnected','failed','closed']));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'video_call_sessions_callee_connection_state_check') THEN
    ALTER TABLE public.video_call_sessions
      ADD CONSTRAINT video_call_sessions_callee_connection_state_check
      CHECK (callee_connection_state IS NULL OR callee_connection_state = ANY (ARRAY['new','connecting','connected','disconnected','failed','closed']));
  END IF;
END $$;

-- Trigger function: activate the session only once, when both peers are connected
CREATE OR REPLACE FUNCTION public.sync_video_call_connected_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Never resurrect terminated sessions
  IF NEW.status IN ('ended', 'failed') OR OLD.status IN ('ended', 'failed') THEN
    RETURN NEW;
  END IF;

  IF NEW.caller_connection_state = 'connected'
     AND NEW.callee_connection_state = 'connected'
     AND NEW.status <> 'active' THEN
    NEW.status := 'active';
    IF NEW.started_at IS NULL THEN
      NEW.started_at := now();
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_video_call_connected_status_trigger ON public.video_call_sessions;
CREATE TRIGGER sync_video_call_connected_status_trigger
  BEFORE UPDATE OF caller_connection_state, callee_connection_state
  ON public.video_call_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_video_call_connected_status();

-- Realtime publication (only add if missing)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'video_call_sessions'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.video_call_sessions';
  END IF;
END $$;
