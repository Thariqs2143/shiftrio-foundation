-- ENUMS
create type public.app_role as enum ('admin','manager','staff');
create type public.shift_type as enum ('day','night');
create type public.shift_status as enum ('active','completed','cancelled');
create type public.worker_status as enum ('active','inactive','on_leave');
create type public.site_status as enum ('active','paused','closed');
create type public.machine_status as enum ('available','in_use','maintenance');
create type public.operator_status as enum ('available','assigned','off_duty');
create type public.photo_kind as enum ('check_in','check_out');
create type public.notification_kind as enum ('shift','attendance','safety','system');

create or replace function public.update_updated_at_column()
returns trigger language plpgsql set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

-- ORGANIZATIONS
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  legal_name text not null default '',
  industry text not null default '',
  timezone text not null default 'Asia/Kolkata',
  currency text not null default 'INR',
  standard_shift_hours numeric not null default 8,
  overtime_after_hours numeric not null default 8,
  geofence_radius_m integer not null default 150,
  require_check_in_photo boolean not null default true,
  require_gps_verification boolean not null default true,
  auto_approve_attendance boolean not null default false,
  contact_email text not null default '',
  contact_phone text not null default '',
  join_code text not null unique default upper(substr(replace(gen_random_uuid()::text,'-',''),1,8)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key,
  org_id uuid not null references public.organizations(id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  phone text not null default '',
  language text not null default 'en',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  org_id uuid not null references public.organizations(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

-- HELPERS
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role);
$$;

create or replace function public.current_org_id()
returns uuid language sql stable security definer set search_path = public as $$
  select org_id from public.profiles where id = auth.uid();
$$;

create or replace function public.is_manager()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(auth.uid(),'admin') or public.has_role(auth.uid(),'manager');
$$;

-- MASTER DATA
create table public.sites (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  code text not null,
  city text not null default '',
  address text not null default '',
  headcount_target integer not null default 0,
  status public.site_status not null default 'active',
  geofence_radius_m integer not null default 150,
  lat double precision,
  lng double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.incharges (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  phone text not null default '',
  email text not null default '',
  site_id uuid references public.sites(id) on delete set null,
  shift_preference text not null default 'any',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workers (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid,
  name text not null,
  name_ta text,
  employee_code text not null,
  designation text not null default '',
  phone text not null default '',
  site_id uuid references public.sites(id) on delete set null,
  skills text[] not null default '{}',
  status public.worker_status not null default 'active',
  joined_at date not null default current_date,
  daily_wage numeric not null default 0,
  rating numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (org_id, employee_code)
);
create index workers_user_id_idx on public.workers(user_id);

create table public.machines (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  code text not null,
  category text not null default '',
  site_id uuid references public.sites(id) on delete set null,
  status public.machine_status not null default 'available',
  last_serviced_at date,
  hours_run numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.operators (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  phone text not null default '',
  license_no text not null default '',
  certified_for text[] not null default '{}',
  site_id uuid references public.sites(id) on delete set null,
  status public.operator_status not null default 'available',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.shift_assignments (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  worker_id uuid not null references public.workers(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  machine_id uuid references public.machines(id) on delete set null,
  incharge_id uuid references public.incharges(id) on delete set null,
  date date not null,
  shift_type public.shift_type not null default 'day',
  start_time text not null default '08:00',
  end_time text not null default '17:00',
  status text not null default 'scheduled',
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index shift_assignments_unique_worker_slot
  on public.shift_assignments(worker_id, date, shift_type)
  where status <> 'cancelled';

create table public.shifts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  worker_id uuid not null references public.workers(id) on delete cascade,
  site_id uuid not null references public.sites(id) on delete cascade,
  machine_id uuid references public.machines(id) on delete set null,
  operator_id uuid references public.operators(id) on delete set null,
  incharge_id uuid references public.incharges(id) on delete set null,
  shift_type public.shift_type not null default 'day',
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  break_minutes integer not null default 0,
  status public.shift_status not null default 'active',
  notes text not null default '',
  gps_verified boolean,
  gps_distance_m integer,
  gps_accuracy_m integer,
  gps_lat double precision,
  gps_lng double precision,
  gps_method text,
  gps_checked_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index shifts_one_active_per_worker on public.shifts(worker_id) where status = 'active';
create index shifts_org_started_idx on public.shifts(org_id, started_at desc);

create table public.shift_photos (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  shift_id uuid not null references public.shifts(id) on delete cascade,
  kind public.photo_kind not null,
  storage_path text not null,
  source text not null default 'upload',
  taken_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid,
  title text not null,
  body text not null default '',
  kind public.notification_kind not null default 'system',
  audience text not null default 'all',
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_org_created_idx on public.notifications(org_id, created_at desc);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  actor_id uuid,
  actor_name text not null default '',
  action text not null,
  entity text not null default '',
  entity_id text,
  details jsonb not null default '{}',
  created_at timestamptz not null default now()
);
create index audit_logs_org_created_idx on public.audit_logs(org_id, created_at desc);

-- updated_at triggers
create trigger t_org_upd before update on public.organizations for each row execute function public.update_updated_at_column();
create trigger t_prof_upd before update on public.profiles for each row execute function public.update_updated_at_column();
create trigger t_sites_upd before update on public.sites for each row execute function public.update_updated_at_column();
create trigger t_inch_upd before update on public.incharges for each row execute function public.update_updated_at_column();
create trigger t_work_upd before update on public.workers for each row execute function public.update_updated_at_column();
create trigger t_mach_upd before update on public.machines for each row execute function public.update_updated_at_column();
create trigger t_oper_upd before update on public.operators for each row execute function public.update_updated_at_column();
create trigger t_asg_upd before update on public.shift_assignments for each row execute function public.update_updated_at_column();
create trigger t_shift_upd before update on public.shifts for each row execute function public.update_updated_at_column();

-- GRANTS
grant select, insert, update, delete on public.organizations to authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.user_roles to authenticated;
grant select, insert, update, delete on public.sites to authenticated;
grant select, insert, update, delete on public.incharges to authenticated;
grant select, insert, update, delete on public.workers to authenticated;
grant select, insert, update, delete on public.machines to authenticated;
grant select, insert, update, delete on public.operators to authenticated;
grant select, insert, update, delete on public.shift_assignments to authenticated;
grant select, insert, update, delete on public.shifts to authenticated;
grant select, insert, update, delete on public.shift_photos to authenticated;
grant select, insert, update, delete on public.notifications to authenticated;
grant select, insert, update, delete on public.audit_logs to authenticated;
grant all on public.organizations, public.profiles, public.user_roles, public.sites,
  public.incharges, public.workers, public.machines, public.operators,
  public.shift_assignments, public.shifts, public.shift_photos,
  public.notifications, public.audit_logs to service_role;

-- RLS
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.sites enable row level security;
alter table public.incharges enable row level security;
alter table public.workers enable row level security;
alter table public.machines enable row level security;
alter table public.operators enable row level security;
alter table public.shift_assignments enable row level security;
alter table public.shifts enable row level security;
alter table public.shift_photos enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

create policy org_select on public.organizations for select to authenticated using (id = public.current_org_id());
create policy org_update on public.organizations for update to authenticated using (id = public.current_org_id() and public.has_role(auth.uid(),'admin')) with check (id = public.current_org_id());

create policy prof_select_own on public.profiles for select to authenticated using (id = auth.uid() or org_id = public.current_org_id());
create policy prof_update_own on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy roles_select on public.user_roles for select to authenticated using (user_id = auth.uid() or org_id = public.current_org_id());
create policy roles_admin_write on public.user_roles for all to authenticated
  using (org_id = public.current_org_id() and public.has_role(auth.uid(),'admin'))
  with check (org_id = public.current_org_id() and public.has_role(auth.uid(),'admin'));

-- master data: read for org members, write for managers
create policy sites_select on public.sites for select to authenticated using (org_id = public.current_org_id());
create policy sites_write on public.sites for all to authenticated using (org_id = public.current_org_id() and public.is_manager()) with check (org_id = public.current_org_id() and public.is_manager());
create policy inch_select on public.incharges for select to authenticated using (org_id = public.current_org_id());
create policy inch_write on public.incharges for all to authenticated using (org_id = public.current_org_id() and public.is_manager()) with check (org_id = public.current_org_id() and public.is_manager());
create policy mach_select on public.machines for select to authenticated using (org_id = public.current_org_id());
create policy mach_write on public.machines for all to authenticated using (org_id = public.current_org_id() and public.is_manager()) with check (org_id = public.current_org_id() and public.is_manager());
create policy oper_select on public.operators for select to authenticated using (org_id = public.current_org_id());
create policy oper_write on public.operators for all to authenticated using (org_id = public.current_org_id() and public.is_manager()) with check (org_id = public.current_org_id() and public.is_manager());
create policy work_select on public.workers for select to authenticated using (org_id = public.current_org_id());
create policy work_write on public.workers for all to authenticated using (org_id = public.current_org_id() and public.is_manager()) with check (org_id = public.current_org_id() and public.is_manager());
create policy work_update_self on public.workers for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy asg_select on public.shift_assignments for select to authenticated using (org_id = public.current_org_id());
create policy asg_write on public.shift_assignments for all to authenticated using (org_id = public.current_org_id() and public.is_manager()) with check (org_id = public.current_org_id() and public.is_manager());

create policy shifts_select on public.shifts for select to authenticated using (org_id = public.current_org_id());
create policy shifts_manager_write on public.shifts for all to authenticated using (org_id = public.current_org_id() and public.is_manager()) with check (org_id = public.current_org_id() and public.is_manager());
create policy shifts_staff_insert on public.shifts for insert to authenticated
  with check (org_id = public.current_org_id() and worker_id in (select id from public.workers where user_id = auth.uid()));
create policy shifts_staff_update on public.shifts for update to authenticated
  using (org_id = public.current_org_id() and worker_id in (select id from public.workers where user_id = auth.uid()))
  with check (org_id = public.current_org_id() and worker_id in (select id from public.workers where user_id = auth.uid()));

create policy photos_select on public.shift_photos for select to authenticated using (org_id = public.current_org_id());
create policy photos_insert on public.shift_photos for insert to authenticated
  with check (org_id = public.current_org_id() and (public.is_manager() or shift_id in (select s.id from public.shifts s join public.workers w on w.id = s.worker_id where w.user_id = auth.uid())));
create policy photos_delete on public.shift_photos for delete to authenticated
  using (org_id = public.current_org_id() and (public.is_manager() or shift_id in (select s.id from public.shifts s join public.workers w on w.id = s.worker_id where w.user_id = auth.uid())));

create policy notif_select on public.notifications for select to authenticated
  using (org_id = public.current_org_id() and (user_id is null or user_id = auth.uid()));
create policy notif_insert on public.notifications for insert to authenticated with check (org_id = public.current_org_id());
create policy notif_update on public.notifications for update to authenticated
  using (org_id = public.current_org_id() and (user_id is null or user_id = auth.uid()))
  with check (org_id = public.current_org_id());
create policy notif_delete on public.notifications for delete to authenticated using (org_id = public.current_org_id() and public.is_manager());

create policy audit_select on public.audit_logs for select to authenticated using (org_id = public.current_org_id() and public.is_manager());
create policy audit_insert on public.audit_logs for insert to authenticated with check (org_id = public.current_org_id());

-- SIGNUP HELPERS
create or replace function public.bootstrap_organization(_org_name text, _full_name text, _phone text)
returns uuid language plpgsql security definer set search_path = public as $$
declare _uid uuid := auth.uid(); _org uuid;
begin
  if _uid is null then raise exception 'Not authenticated'; end if;
  if exists (select 1 from public.profiles where id = _uid) then
    return (select org_id from public.profiles where id = _uid);
  end if;
  insert into public.organizations (name, legal_name, contact_email)
  values (coalesce(nullif(_org_name,''),'My organization'), coalesce(_org_name,''), coalesce((select email from auth.users where id = _uid),''))
  returning id into _org;
  insert into public.profiles (id, org_id, full_name, email, phone)
  values (_uid, _org, coalesce(_full_name,''), coalesce((select email from auth.users where id = _uid),''), coalesce(_phone,''));
  insert into public.user_roles (user_id, org_id, role) values (_uid, _org, 'admin');
  return _org;
end; $$;

create or replace function public.join_organization(_join_code text, _full_name text, _phone text, _employee_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare _uid uuid := auth.uid(); _org uuid; _worker uuid;
begin
  if _uid is null then raise exception 'Not authenticated'; end if;
  if exists (select 1 from public.profiles where id = _uid) then
    return (select org_id from public.profiles where id = _uid);
  end if;
  select id into _org from public.organizations where join_code = upper(trim(_join_code));
  if _org is null then raise exception 'Invalid organization code'; end if;
  insert into public.profiles (id, org_id, full_name, email, phone)
  values (_uid, _org, coalesce(_full_name,''), coalesce((select email from auth.users where id = _uid),''), coalesce(_phone,''));
  insert into public.user_roles (user_id, org_id, role) values (_uid, _org, 'staff');
  select id into _worker from public.workers
   where org_id = _org and (upper(employee_code) = upper(trim(coalesce(_employee_code,''))) or (phone <> '' and phone = _phone))
   order by (upper(employee_code) = upper(trim(coalesce(_employee_code,'')))) desc limit 1;
  if _worker is null then
    insert into public.workers (org_id, user_id, name, employee_code, phone)
    values (_org, _uid, coalesce(_full_name,'New worker'),
      coalesce(nullif(trim(_employee_code),''), 'EMP-' || upper(substr(replace(_uid::text,'-',''),1,6))), coalesce(_phone,''));
  else
    update public.workers set user_id = _uid where id = _worker;
  end if;
  return _org;
end; $$;

grant execute on function public.bootstrap_organization(text,text,text) to authenticated;
grant execute on function public.join_organization(text,text,text,text) to authenticated;