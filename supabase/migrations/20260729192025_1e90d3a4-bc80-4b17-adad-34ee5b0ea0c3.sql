GRANT INSERT ON public.call_diagnostics TO anon, authenticated;
GRANT SELECT ON public.call_diagnostics TO authenticated;
GRANT ALL ON public.call_diagnostics TO service_role;