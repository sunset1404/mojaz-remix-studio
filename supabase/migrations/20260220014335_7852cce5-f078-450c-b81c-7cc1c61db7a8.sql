
-- Create triggers on session_records to auto-update achievements
CREATE TRIGGER trigger_achievements_on_session_insert
  AFTER INSERT ON public.session_records
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_achievements_on_session();

CREATE TRIGGER trigger_achievements_on_session_update
  AFTER UPDATE ON public.session_records
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_achievements_on_session();

CREATE TRIGGER trigger_achievements_on_session_delete
  AFTER DELETE ON public.session_records
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_achievements_on_session();

-- Create triggers on certificates to auto-update achievements
CREATE TRIGGER trigger_achievements_on_certificate_insert
  AFTER INSERT ON public.certificates
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_achievements_on_certificate();

CREATE TRIGGER trigger_achievements_on_certificate_update
  AFTER UPDATE ON public.certificates
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_achievements_on_certificate();

CREATE TRIGGER trigger_achievements_on_certificate_delete
  AFTER DELETE ON public.certificates
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_update_achievements_on_certificate();
