ALTER TABLE public.ghuyuf_rahman_entries 
  ADD COLUMN IF NOT EXISTS nationalities_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS riwayat_count integer NOT NULL DEFAULT 0;