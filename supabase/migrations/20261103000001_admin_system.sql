alter table public.profiles add column if not exists role text not null default 'user';
alter table public.profiles add column if not exists admin_status text not null default 'none';
alter table public.profiles add column if not exists is_disabled boolean not null default false;
alter table public.profiles add column if not exists disabled_reason text;
alter table public.profiles add column if not exists disabled_at timestamptz;

alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('user', 'admin'));

alter table public.profiles drop constraint if exists profiles_admin_status_check;
alter table public.profiles add constraint profiles_admin_status_check
  check (admin_status in ('none', 'awaiting_documents', 'pending', 'approved', 'rejected'));

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
      and p.is_disabled = false
  );
$$;

create or replace function public.protect_profile_columns()
returns trigger
language plpgsql
as $$
begin
  if current_user in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then
      new.role := 'user';
      new.admin_status := 'none';
      new.is_disabled := false;
      new.disabled_reason := null;
      new.disabled_at := null;
    else
      new.role := old.role;
      new.admin_status := old.admin_status;
      new.is_disabled := old.is_disabled;
      new.disabled_reason := old.disabled_reason;
      new.disabled_at := old.disabled_at;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_columns_trg on public.profiles;
create trigger protect_profile_columns_trg
  before insert or update on public.profiles
  for each row execute function public.protect_profile_columns();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested text := coalesce(new.raw_user_meta_data ->> 'requested_role', 'user');
begin
  insert into public.profiles (id, email, full_name, role, admin_status)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'user',
    case when requested = 'admin' then 'awaiting_documents' else 'none' end
  )
  on conflict (id) do update
    set email = excluded.email,
        full_name = coalesce(nullif(excluded.full_name, ''), public.profiles.full_name);
  return new;
exception when others then
  raise warning 'handle_new_user failed for %: %', new.id, sqlerrm;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

drop policy if exists "moodsync_profiles_select_admin" on public.profiles;
create policy "moodsync_profiles_select_admin"
  on public.profiles for select
  to authenticated
  using (public.is_admin());

create table if not exists public.admin_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  full_name text not null,
  id_number text not null,
  phone text not null,
  organisation text not null,
  job_title text not null,
  reason text not null,
  id_document_path text not null,
  proof_document_path text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  review_note text,
  reviewer_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

alter table public.admin_applications enable row level security;

drop policy if exists "moodsync_admin_apps_select_own" on public.admin_applications;
create policy "moodsync_admin_apps_select_own"
  on public.admin_applications for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "moodsync_admin_apps_select_admin" on public.admin_applications;
create policy "moodsync_admin_apps_select_admin"
  on public.admin_applications for select
  to authenticated
  using (public.is_admin());

create table if not exists public.admin_audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid references auth.users (id) on delete set null,
  admin_name text,
  action text not null,
  target_user_id uuid,
  target_name text,
  details text,
  created_at timestamptz not null default now()
);

alter table public.admin_audit_log enable row level security;

drop policy if exists "moodsync_audit_select_admin" on public.admin_audit_log;
create policy "moodsync_audit_select_admin"
  on public.admin_audit_log for select
  to authenticated
  using (public.is_admin());

do $$
begin
  if to_regclass('public.subscriptions') is null then
    create table public.subscriptions (
      id uuid primary key default gen_random_uuid(),
      user_id uuid references auth.users (id) on delete cascade,
      created_at timestamptz not null default now()
    );
    alter table public.subscriptions enable row level security;
    create policy "moodsync_subscriptions_own"
      on public.subscriptions for all
      to authenticated
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;
end
$$;

alter table public.subscriptions add column if not exists plan_name text;
alter table public.subscriptions add column if not exists plan_price numeric;
alter table public.subscriptions add column if not exists plan_duration text;
alter table public.subscriptions add column if not exists is_active boolean default true;
alter table public.subscriptions add column if not exists next_billing_date timestamptz;
alter table public.subscriptions add column if not exists cancelled_at timestamptz;
alter table public.subscriptions add column if not exists created_at timestamptz default now();

insert into storage.buckets (id, name, public)
values ('admin-documents', 'admin-documents', false)
on conflict (id) do nothing;

drop policy if exists "moodsync_admin_docs_insert_own" on storage.objects;
create policy "moodsync_admin_docs_insert_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'admin-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "moodsync_admin_docs_select" on storage.objects;
create policy "moodsync_admin_docs_select"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'admin-documents'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.is_admin()
    )
  );

create or replace function public.submit_admin_application(
  p_full_name text,
  p_id_number text,
  p_phone text,
  p_organisation text,
  p_job_title text,
  p_reason text,
  p_id_path text,
  p_proof_path text
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_status text;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;

  select admin_status into current_status from public.profiles where id = auth.uid();

  if current_status is null or current_status not in ('awaiting_documents', 'rejected') then
    raise exception 'You cannot submit an application right now';
  end if;

  insert into public.admin_applications (
    user_id, full_name, id_number, phone, organisation, job_title, reason,
    id_document_path, proof_document_path, status, review_note, reviewer_id, created_at, reviewed_at
  )
  values (
    auth.uid(), p_full_name, p_id_number, p_phone, p_organisation, p_job_title, p_reason,
    p_id_path, p_proof_path, 'pending', null, null, now(), null
  )
  on conflict (user_id) do update set
    full_name = excluded.full_name,
    id_number = excluded.id_number,
    phone = excluded.phone,
    organisation = excluded.organisation,
    job_title = excluded.job_title,
    reason = excluded.reason,
    id_document_path = excluded.id_document_path,
    proof_document_path = excluded.proof_document_path,
    status = 'pending',
    review_note = null,
    reviewer_id = null,
    created_at = now(),
    reviewed_at = null;

  update public.profiles set admin_status = 'pending' where id = auth.uid();

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.admin_dashboard_stats()
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if not public.is_admin() then
    raise exception 'Admins only';
  end if;

  select jsonb_build_object(
    'total_users', (select count(*) from public.profiles),
    'new_today', (select count(*) from public.profiles where created_at >= date_trunc('day', now())),
    'new_7d', (select count(*) from public.profiles where created_at >= now() - interval '7 days'),
    'new_30d', (select count(*) from public.profiles where created_at >= now() - interval '30 days'),
    'active_users', (select count(*) from public.profiles where is_disabled = false),
    'disabled_users', (select count(*) from public.profiles where is_disabled = true),
    'admins', (select count(*) from public.profiles where role = 'admin'),
    'regular_users', (select count(*) from public.profiles where role = 'user'),
    'pending_applications', (select count(*) from public.admin_applications where status = 'pending'),
    'premium_subscribers', (select count(distinct user_id) from public.subscriptions where is_active = true),
    'monthly_revenue', coalesce((
      select sum(
        case
          when lower(coalesce(plan_duration, '')) like 'year%' then coalesce(plan_price, 0) / 12.0
          else coalesce(plan_price, 0)
        end
      )
      from public.subscriptions
      where is_active = true
    ), 0),
    'signups_by_day', (
      select coalesce(jsonb_agg(jsonb_build_object('day', to_char(d.day, 'YYYY-MM-DD'), 'count', coalesce(c.count, 0)) order by d.day), '[]'::jsonb)
      from generate_series(date_trunc('day', now()) - interval '13 days', date_trunc('day', now()), interval '1 day') as d(day)
      left join (
        select date_trunc('day', created_at) as day, count(*) as count
        from public.profiles
        where created_at >= date_trunc('day', now()) - interval '13 days'
        group by 1
      ) c on c.day = d.day
    )
  ) into result;

  return result;
end;
$$;

create or replace function public.admin_list_users(
  p_search text default '',
  p_filter text default 'all',
  p_limit integer default 20,
  p_offset integer default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result jsonb;
  term text := '%' || lower(coalesce(p_search, '')) || '%';
begin
  if not public.is_admin() then
    raise exception 'Admins only';
  end if;

  select coalesce(jsonb_agg(row_data order by created_at desc), '[]'::jsonb) into result
  from (
    select
      p.created_at,
      jsonb_build_object(
        'id', p.id,
        'email', p.email,
        'full_name', p.full_name,
        'role', p.role,
        'admin_status', p.admin_status,
        'is_disabled', p.is_disabled,
        'created_at', p.created_at,
        'plan_name', (
          select s.plan_name
          from public.subscriptions s
          where s.user_id = p.id and s.is_active = true
          order by s.created_at desc
          limit 1
        )
      ) as row_data
    from public.profiles p
    where (lower(coalesce(p.email, '')) like term or lower(coalesce(p.full_name, '')) like term)
      and (
        p_filter = 'all'
        or (p_filter = 'users' and p.role = 'user')
        or (p_filter = 'admins' and p.role = 'admin')
        or (p_filter = 'disabled' and p.is_disabled = true)
        or (p_filter = 'premium' and exists (
          select 1 from public.subscriptions s where s.user_id = p.id and s.is_active = true
        ))
      )
    order by p.created_at desc
    limit greatest(p_limit, 1)
    offset greatest(p_offset, 0)
  ) sub;

  return result;
end;
$$;

create or replace function public.admin_get_user(p_user_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result jsonb;
  mood_count bigint := 0;
  playlist_count bigint := 0;
begin
  if not public.is_admin() then
    raise exception 'Admins only';
  end if;

  if to_regclass('public.moods') is not null then
    execute 'select count(*) from public.moods where user_id = $1' into mood_count using p_user_id;
  end if;

  if to_regclass('public.playlists') is not null then
    execute 'select count(*) from public.playlists where user_id = $1' into playlist_count using p_user_id;
  end if;

  select jsonb_build_object(
    'id', p.id,
    'email', p.email,
    'full_name', p.full_name,
    'role', p.role,
    'admin_status', p.admin_status,
    'is_disabled', p.is_disabled,
    'disabled_reason', p.disabled_reason,
    'disabled_at', p.disabled_at,
    'created_at', p.created_at,
    'mood_checkins', mood_count,
    'playlists', playlist_count,
    'plan_name', (
      select s.plan_name from public.subscriptions s
      where s.user_id = p.id and s.is_active = true
      order by s.created_at desc limit 1
    ),
    'plan_duration', (
      select s.plan_duration from public.subscriptions s
      where s.user_id = p.id and s.is_active = true
      order by s.created_at desc limit 1
    ),
    'next_billing_date', (
      select s.next_billing_date from public.subscriptions s
      where s.user_id = p.id and s.is_active = true
      order by s.created_at desc limit 1
    )
  ) into result
  from public.profiles p
  where p.id = p_user_id;

  return result;
end;
$$;

create or replace function public.admin_set_user_disabled(
  p_user_id uuid,
  p_disabled boolean,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_name text;
  target_name text;
begin
  if not public.is_admin() then
    raise exception 'Admins only';
  end if;

  if p_user_id = auth.uid() then
    raise exception 'You cannot change your own account status';
  end if;

  select coalesce(nullif(full_name, ''), email) into actor_name from public.profiles where id = auth.uid();
  select coalesce(nullif(full_name, ''), email) into target_name from public.profiles where id = p_user_id;

  update public.profiles
  set is_disabled = p_disabled,
      disabled_reason = case when p_disabled then nullif(trim(coalesce(p_reason, '')), '') else null end,
      disabled_at = case when p_disabled then now() else null end
  where id = p_user_id;

  begin
    update auth.users
    set banned_until = case when p_disabled then 'infinity'::timestamptz else null end
    where id = p_user_id;

    if p_disabled then
      delete from auth.sessions where user_id = p_user_id;
    end if;
  exception when others then
    raise warning 'auth ban update failed for %: %', p_user_id, sqlerrm;
  end;

  insert into public.admin_audit_log (admin_id, admin_name, action, target_user_id, target_name, details)
  values (
    auth.uid(),
    actor_name,
    case when p_disabled then 'disabled_account' else 'enabled_account' end,
    p_user_id,
    target_name,
    nullif(trim(coalesce(p_reason, '')), '')
  );

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.admin_list_applications(p_status text default 'pending')
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if not public.is_admin() then
    raise exception 'Admins only';
  end if;

  select coalesce(jsonb_agg(to_jsonb(a) || jsonb_build_object('email', p.email) order by a.created_at desc), '[]'::jsonb)
  into result
  from public.admin_applications a
  left join public.profiles p on p.id = a.user_id
  where a.status = p_status;

  return result;
end;
$$;

create or replace function public.admin_review_application(
  p_application_id uuid,
  p_approve boolean,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  app_row public.admin_applications;
  actor_name text;
begin
  if not public.is_admin() then
    raise exception 'Admins only';
  end if;

  select * into app_row from public.admin_applications where id = p_application_id;

  if app_row.id is null then
    raise exception 'Application not found';
  end if;

  if app_row.user_id = auth.uid() then
    raise exception 'You cannot review your own application';
  end if;

  if app_row.status <> 'pending' then
    raise exception 'This application was already reviewed';
  end if;

  select coalesce(nullif(full_name, ''), email) into actor_name from public.profiles where id = auth.uid();

  update public.admin_applications
  set status = case when p_approve then 'approved' else 'rejected' end,
      review_note = nullif(trim(coalesce(p_note, '')), ''),
      reviewer_id = auth.uid(),
      reviewed_at = now()
  where id = p_application_id;

  update public.profiles
  set role = case when p_approve then 'admin' else role end,
      admin_status = case when p_approve then 'approved' else 'rejected' end
  where id = app_row.user_id;

  insert into public.admin_audit_log (admin_id, admin_name, action, target_user_id, target_name, details)
  values (
    auth.uid(),
    actor_name,
    case when p_approve then 'approved_admin' else 'rejected_admin' end,
    app_row.user_id,
    app_row.full_name,
    nullif(trim(coalesce(p_note, '')), '')
  );

  return jsonb_build_object('ok', true);
end;
$$;

create or replace function public.admin_recent_activity(p_limit integer default 10)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  result jsonb;
begin
  if not public.is_admin() then
    raise exception 'Admins only';
  end if;

  select coalesce(jsonb_agg(to_jsonb(l) order by l.created_at desc), '[]'::jsonb)
  into result
  from (
    select * from public.admin_audit_log order by created_at desc limit greatest(p_limit, 1)
  ) l;

  return result;
end;
$$;

grant execute on function public.is_admin() to authenticated;
grant execute on function public.submit_admin_application(text, text, text, text, text, text, text, text) to authenticated;
grant execute on function public.admin_dashboard_stats() to authenticated;
grant execute on function public.admin_list_users(text, text, integer, integer) to authenticated;
grant execute on function public.admin_get_user(uuid) to authenticated;
grant execute on function public.admin_set_user_disabled(uuid, boolean, text) to authenticated;
grant execute on function public.admin_list_applications(text) to authenticated;
grant execute on function public.admin_review_application(uuid, boolean, text) to authenticated;
grant execute on function public.admin_recent_activity(integer) to authenticated;
