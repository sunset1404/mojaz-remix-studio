-- Manual/external recitation progress is a real completed session.
-- Keep achievement recalculation stable and avoid duplicate trigger execution.

create or replace function public.parse_duration_minutes(duration_text text)
returns integer
language plpgsql
stable
set search_path = public
as $$
declare
  normalized text := coalesce(duration_text, '');
  hours_value numeric := 0;
  minutes_value numeric := 0;
  clock_match text[];
  numeric_value numeric := 0;
  total numeric := 0;
begin
  normalized := translate(normalized, '٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹', '01234567890123456789');
  normalized := btrim(normalized);

  if normalized = '' or normalized = '-' then
    return 0;
  end if;

  if normalized ~ '^\d{1,3}:\d{1,2}(:\d{1,2})?$' then
    clock_match := regexp_match(normalized, '^(\d{1,3}):(\d{1,2})(?::(\d{1,2}))?$');
    if array_length(clock_match, 1) >= 2 then
      if clock_match[3] is not null then
        total := clock_match[1]::numeric * 60 + clock_match[2]::numeric + clock_match[3]::numeric / 60;
      else
        total := clock_match[1]::numeric * 60 + clock_match[2]::numeric;
      end if;
    end if;
  else
    begin
      hours_value := coalesce(
        nullif((regexp_match(normalized, '(\d+(?:\.\d+)?)\s*(?:ساعة|ساعه|hour|hours|hr|hrs)'))[1], '')::numeric,
        0
      );
    exception when others then
      hours_value := 0;
    end;

    begin
      minutes_value := coalesce(
        nullif((regexp_match(normalized, '(\d+(?:\.\d+)?)\s*(?:دقيقة|دقيقه|minute|minutes|min|mins)'))[1], '')::numeric,
        0
      );
    exception when others then
      minutes_value := 0;
    end;

    total := hours_value * 60 + minutes_value;

    if total = 0 then
      begin
        numeric_value := nullif(regexp_replace(normalized, '[^0-9.]', '', 'g'), '')::numeric;
      exception when others then
        numeric_value := 0;
      end;
      total := coalesce(numeric_value, 0);
    end if;
  end if;

  -- Protect historical aggregates from malformed values such as "530 ساعة".
  if total < 0 or total > 480 then
    return 0;
  end if;

  return round(total)::integer;
end;
$$;

-- Some early builds accidentally created several identical achievement triggers.
-- Keep one canonical trigger so one manual insert causes one recalculation.
drop trigger if exists trigger_achievements_on_session_insert on public.session_records;
drop trigger if exists trigger_achievements_on_session_update on public.session_records;
drop trigger if exists trigger_achievements_on_session_delete on public.session_records;
drop trigger if exists update_achievements_on_session_insert on public.session_records;
drop trigger if exists update_achievements_on_session_update on public.session_records;

drop trigger if exists trg_achievements_on_session on public.session_records;
create trigger trg_achievements_on_session
after insert or update or delete on public.session_records
for each row
execute function public.trigger_update_achievements_on_session();

-- Historical completion records often have Quran progress only in the note text.
-- A confirmed endpoint at the last ayah of An-Nas is unambiguously a full Quran
-- completion, so backfill that canonical milestone for existing students.
update public.session_records
set
  pages_reached = greatest(coalesce(pages_reached, 0), 604),
  parts_reached = greatest(coalesce(parts_reached, 0), 30)
where status = 'مكتملة'
  and coalesce(notes, '') ~ 'انتهى\s+عند:\s*الناس\s+آية\s+6'
  and (coalesce(pages_reached, 0) < 604 or coalesce(parts_reached, 0) < 30);

comment on function public.parse_duration_minutes(text) is
  'Parses Arabic/English session durations safely. Manual external session entries are stored in session_records and count as completed sessions.';

notify pgrst, 'reload schema';
