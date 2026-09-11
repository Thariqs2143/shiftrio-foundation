create schema if not exists private;
grant usage on schema private to authenticated, service_role;

create or replace function private.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role);
$$;
create or replace function private.current_org_id()
returns uuid language sql stable security definer set search_path = public as $$
  select org_id from public.profiles where id = auth.uid();
$$;
create or replace function private.is_manager()
returns boolean language sql stable security definer set search_path = public as $$
  select private.has_role(auth.uid(),'admin') or private.has_role(auth.uid(),'manager');
$$;
revoke execute on function private.has_role(uuid, public.app_role) from public, anon;
revoke execute on function private.current_org_id() from public, anon;
revoke execute on function private.is_manager() from public, anon;
grant execute on function private.has_role(uuid, public.app_role) to authenticated;
grant execute on function private.current_org_id() to authenticated;
grant execute on function private.is_manager() to authenticated;

drop policy org_select on public.organizations;
drop policy org_update on public.organizations;
drop policy prof_select_own on public.profiles;
drop policy roles_select on public.user_roles;
drop policy roles_admin_write on public.user_roles;
drop policy sites_select on public.sites;
drop policy sites_write on public.sites;
drop policy inch_select on public.incharges;
drop policy inch_write on public.incharges;
drop policy mach_select on public.machines;
drop policy mach_write on public.machines;
drop policy oper_select on public.operators;
drop policy oper_write on public.operators;
drop policy work_select on public.workers;
drop policy work_write on public.workers;
drop policy asg_select on public.shift_assignments;
drop policy asg_write on public.shift_assignments;
drop policy shifts_select on public.shifts;
drop policy shifts_manager_write on public.shifts;
drop policy shifts_staff_insert on public.shifts;
drop policy shifts_staff_update on public.shifts;
drop policy photos_select on public.shift_photos;
drop policy photos_insert on public.shift_photos;
drop policy photos_delete on public.shift_photos;
drop policy notif_select on public.notifications;
drop policy notif_insert on public.notifications;
drop policy notif_update on public.notifications;
drop policy notif_delete on public.notifications;
drop policy audit_select on public.audit_logs;
drop policy audit_insert on public.audit_logs;

drop function public.has_role(uuid, public.app_role);
drop function public.current_org_id();
drop function public.is_manager();

create policy org_select on public.organizations for select to authenticated using (id = private.current_org_id());
create policy org_update on public.organizations for update to authenticated using (id = private.current_org_id() and private.has_role(auth.uid(),'admin')) with check (id = private.current_org_id());

create policy prof_select_own on public.profiles for select to authenticated using (id = auth.uid() or org_id = private.current_org_id());

create policy roles_select on public.user_roles for select to authenticated using (user_id = auth.uid() or org_id = private.current_org_id());
create policy roles_admin_write on public.user_roles for all to authenticated
  using (org_id = private.current_org_id() and private.has_role(auth.uid(),'admin'))
  with check (org_id = private.current_org_id() and private.has_role(auth.uid(),'admin'));

create policy sites_select on public.sites for select to authenticated using (org_id = private.current_org_id());
create policy sites_write on public.sites for all to authenticated using (org_id = private.current_org_id() and private.is_manager()) with check (org_id = private.current_org_id() and private.is_manager());
create policy inch_select on public.incharges for select to authenticated using (org_id = private.current_org_id());
create policy inch_write on public.incharges for all to authenticated using (org_id = private.current_org_id() and private.is_manager()) with check (org_id = private.current_org_id() and private.is_manager());
create policy mach_select on public.machines for select to authenticated using (org_id = private.current_org_id());
create policy mach_write on public.machines for all to authenticated using (org_id = private.current_org_id() and private.is_manager()) with check (org_id = private.current_org_id() and private.is_manager());
create policy oper_select on public.operators for select to authenticated using (org_id = private.current_org_id());
create policy oper_write on public.operators for all to authenticated using (org_id = private.current_org_id() and private.is_manager()) with check (org_id = private.current_org_id() and private.is_manager());
create policy work_select on public.workers for select to authenticated using (org_id = private.current_org_id());
create policy work_write on public.workers for all to authenticated using (org_id = private.current_org_id() and private.is_manager()) with check (org_id = private.current_org_id() and private.is_manager());

create policy asg_select on public.shift_assignments for select to authenticated using (org_id = private.current_org_id());
create policy asg_write on public.shift_assignments for all to authenticated using (org_id = private.current_org_id() and private.is_manager()) with check (org_id = private.current_org_id() and private.is_manager());

create policy shifts_select on public.shifts for select to authenticated using (org_id = private.current_org_id());
create policy shifts_manager_write on public.shifts for all to authenticated using (org_id = private.current_org_id() and private.is_manager()) with check (org_id = private.current_org_id() and private.is_manager());
create policy shifts_staff_insert on public.shifts for insert to authenticated
  with check (org_id = private.current_org_id() and worker_id in (select id from public.workers where user_id = auth.uid()));
create policy shifts_staff_update on public.shifts for update to authenticated
  using (org_id = private.current_org_id() and worker_id in (select id from public.workers where user_id = auth.uid()))
  with check (org_id = private.current_org_id() and worker_id in (select id from public.workers where user_id = auth.uid()));

create policy photos_select on public.shift_photos for select to authenticated using (org_id = private.current_org_id());
create policy photos_insert on public.shift_photos for insert to authenticated
  with check (org_id = private.current_org_id() and (private.is_manager() or shift_id in (select s.id from public.shifts s join public.workers w on w.id = s.worker_id where w.user_id = auth.uid())));
create policy photos_delete on public.shift_photos for delete to authenticated
  using (org_id = private.current_org_id() and (private.is_manager() or shift_id in (select s.id from public.shifts s join public.workers w on w.id = s.worker_id where w.user_id = auth.uid())));

create policy notif_select on public.notifications for select to authenticated
  using (org_id = private.current_org_id() and (user_id is null or user_id = auth.uid()));
create policy notif_insert on public.notifications for insert to authenticated with check (org_id = private.current_org_id());
create policy notif_update on public.notifications for update to authenticated
  using (org_id = private.current_org_id() and (user_id is null or user_id = auth.uid()))
  with check (org_id = private.current_org_id());
create policy notif_delete on public.notifications for delete to authenticated using (org_id = private.current_org_id() and private.is_manager());

create policy audit_select on public.audit_logs for select to authenticated using (org_id = private.current_org_id() and private.is_manager());
create policy audit_insert on public.audit_logs for insert to authenticated with check (org_id = private.current_org_id());