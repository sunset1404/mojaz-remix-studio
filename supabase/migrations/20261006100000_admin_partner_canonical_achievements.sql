-- Canonical admin read for partner student achievements.
-- Ensures the partner report sees exactly the same student_achievements values
-- shown in student details, regardless of client-side RLS policy state.

create or replace function public.get_admin_partner_student_achievements(p_partner_id uuid)
returns table (
  student_id uuid,
  pages_memorized integer,
  parts_memorized integer,
  sessions_count integer,
  total_minutes numeric,
  certificates_count integer,
  completions integer,
  commitment_rate numeric
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or not public.has_role(auth.uid(), 'admin'::public.app_role) then
    raise exception 'admin_access_required';
  end if;

  return query
  select
    ps.student_id,
    coalesce(sa.pages_memorized, 0),
    coalesce(sa.parts_memorized, 0),
    coalesce(sa.sessions_count, 0),
    coalesce(sa.total_minutes, 0),
    coalesce(sa.certificates_count, 0),
    coalesce(sa.completions, 0),
    coalesce(sa.commitment_rate, 0)
  from public.partner_students ps
  left join public.student_achievements sa
    on sa.student_id = ps.student_id
  where ps.partner_id = p_partner_id
    and ps.status = 'active'
  order by ps.assigned_at desc;
end;
$$;

revoke all on function public.get_admin_partner_student_achievements(uuid) from public, anon;
grant execute on function public.get_admin_partner_student_achievements(uuid) to authenticated;

notify pgrst, 'reload schema';
