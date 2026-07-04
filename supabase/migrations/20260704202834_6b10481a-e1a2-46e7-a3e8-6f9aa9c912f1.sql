
create type public.app_role as enum ('admin', 'client');
create type public.account_status as enum ('pending', 'active', 'denied');
create type public.slot_period as enum ('morning', 'evening');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  age int,
  phone text,
  avatar_url text,
  height_cm numeric,
  weight_kg numeric,
  status public.account_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique(user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create policy "profiles_select" on public.profiles for select to authenticated
  using (auth.uid() = id or public.has_role(auth.uid(), 'admin'));
create policy "profiles_update" on public.profiles for update to authenticated
  using (auth.uid() = id or public.has_role(auth.uid(), 'admin'))
  with check (auth.uid() = id or public.has_role(auth.uid(), 'admin'));
create policy "profiles_insert" on public.profiles for insert to authenticated
  with check (auth.uid() = id);

create policy "user_roles_select" on public.user_roles for select to authenticated
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

create table public.health_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  injuries text default '',
  allergies text default '',
  notes text default '',
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.health_profiles to authenticated;
grant all on public.health_profiles to service_role;
alter table public.health_profiles enable row level security;
create policy "health_all" on public.health_profiles for all to authenticated
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'))
  with check (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slot_date date not null,
  slot_start time not null,
  period public.slot_period not null,
  created_at timestamptz not null default now(),
  unique(user_id, slot_date, slot_start)
);
create index bookings_slot_idx on public.bookings(slot_date, slot_start);
grant select, insert, delete on public.bookings to authenticated;
grant all on public.bookings to service_role;
alter table public.bookings enable row level security;
create policy "bookings_select" on public.bookings for select to authenticated
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "bookings_delete" on public.bookings for delete to authenticated
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));

create or replace function public.book_slot(_date date, _start time)
returns public.bookings language plpgsql security definer set search_path = public as $$
declare
  _uid uuid := auth.uid();
  _status public.account_status;
  _period public.slot_period;
  _cap int;
  _count int;
  _row public.bookings;
begin
  if _uid is null then raise exception 'Not authenticated'; end if;
  select status into _status from public.profiles where id = _uid;
  if _status is distinct from 'active' then raise exception 'Account not active'; end if;
  if _start >= time '06:30' and _start <= time '09:30' then
    _period := 'morning'; _cap := 2;
  elsif _start >= time '15:30' and _start <= time '21:30' then
    _period := 'evening'; _cap := 4;
  else raise exception 'Invalid time slot'; end if;
  if extract(minute from _start) <> 30 then raise exception 'Slots must start at :30'; end if;
  select count(*) into _count from public.bookings where slot_date = _date and slot_start = _start;
  if _count >= _cap then raise exception 'Slot full'; end if;
  insert into public.bookings(user_id, slot_date, slot_start, period)
  values (_uid, _date, _start, _period) returning * into _row;
  return _row;
end;
$$;
grant execute on function public.book_slot(date, time) to authenticated;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, full_name, age, phone, height_cm, weight_kg, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    nullif(new.raw_user_meta_data ->> 'age','')::int,
    new.raw_user_meta_data ->> 'phone',
    nullif(new.raw_user_meta_data ->> 'height_cm','')::numeric,
    nullif(new.raw_user_meta_data ->> 'weight_kg','')::numeric,
    new.raw_user_meta_data ->> 'avatar_url'
  );
  insert into public.user_roles(user_id, role) values (new.id, 'client');
  insert into public.health_profiles(user_id) values (new.id);
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();
