CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.internal_task_tokens (
  name text PRIMARY KEY,
  token text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.internal_task_tokens ENABLE ROW LEVEL SECURITY;

INSERT INTO public.internal_task_tokens(name, token)
VALUES ('subscription-payment-reconcile', encode(gen_random_bytes(32), 'hex'))
ON CONFLICT (name) DO NOTHING;

DO $$
DECLARE
  job_row record;
BEGIN
  FOR job_row IN
    SELECT jobid
    FROM cron.job
    WHERE jobname = 'subscription-payment-reconcile'
  LOOP
    PERFORM cron.unschedule(job_row.jobid);
  END LOOP;

  PERFORM cron.schedule(
    'subscription-payment-reconcile',
    '*/10 * * * *',
    $job$
      SELECT net.http_post(
        url := 'https://cfihcvudcwujylipqngk.supabase.co/functions/v1/reconcile-subscription-payments',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'x-internal-secret', (
            SELECT token
            FROM public.internal_task_tokens
            WHERE name = 'subscription-payment-reconcile'
          )
        ),
        body := '{}'::jsonb
      );
    $job$
  );
END;
$$;
