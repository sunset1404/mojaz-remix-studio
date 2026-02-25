CREATE TRIGGER update_achievements_on_session_insert
AFTER INSERT ON public.session_records
FOR EACH ROW
EXECUTE FUNCTION public.trigger_update_achievements_on_session();

CREATE TRIGGER update_achievements_on_session_update
AFTER UPDATE ON public.session_records
FOR EACH ROW
EXECUTE FUNCTION public.trigger_update_achievements_on_session();