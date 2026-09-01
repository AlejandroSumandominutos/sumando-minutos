-- Segunda actualización consolidada: rankings, medallas y recordatorios.
create table if not exists public.whatsapp_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  phone_e164 text not null check (phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  enabled boolean not null default false,
  consented_at timestamptz,
  last_reminder_date date,
  updated_at timestamptz not null default now()
);
alter table public.whatsapp_preferences enable row level security;
do $$ begin
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='whatsapp_preferences' and policyname='whatsapp_preferences_owner') then
    create policy whatsapp_preferences_owner on public.whatsapp_preferences for all to authenticated
      using(user_id=auth.uid()) with check(user_id=auth.uid());
  end if;
end $$;

create table if not exists public.weekly_awards (
  id uuid primary key default gen_random_uuid(),
  period_start timestamptz not null,
  period_end timestamptz not null,
  position smallint not null check(position between 1 and 3),
  user_id uuid not null references public.profiles(id) on delete cascade,
  total_minutes bigint not null,
  dominant_sport text,
  awarded_at timestamptz not null default now(),
  unique(period_start,position), unique(period_start,user_id)
);

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('private-community','private-community',false,1048576,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
do $$ begin
  if not exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='storage_private_community_owner') then
    create policy storage_private_community_owner on storage.objects for all to authenticated
      using(bucket_id='private-community' and owner_id=auth.uid()::text)
      with check(bucket_id='private-community' and (storage.foldername(name))[1]=auth.uid()::text);
  end if;
end $$;
alter table public.weekly_awards enable row level security;
do $$ begin
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='weekly_awards' and policyname='weekly_awards_read') then
    create policy weekly_awards_read on public.weekly_awards for select to authenticated using(true);
  end if;
end $$;

create or replace function public.current_competition_start()
returns timestamptz language sql stable as $$
  select case when (now() at time zone 'America/Mexico_City') >=
    date_trunc('week',now() at time zone 'America/Mexico_City') + interval '4 days 13 hours'
  then (date_trunc('week',now() at time zone 'America/Mexico_City') + interval '4 days 13 hours') at time zone 'America/Mexico_City'
  else (date_trunc('week',now() at time zone 'America/Mexico_City') - interval '3 days' + interval '13 hours') at time zone 'America/Mexico_City' end;
$$;

create or replace function public.live_weekly_rankings(p_sport text default null)
returns table(user_id uuid,username text,full_name text,avatar_url text,total_minutes bigint,dominant_sport text,rank_position bigint)
language sql stable security definer set search_path=public as $$
 with period as(select public.current_competition_start() s), totals as(
  select a.user_id,sum(a.minutes)::bigint total_minutes
  from activities a,period where a.created_at>=period.s and (p_sport is null or a.sport=p_sport) group by a.user_id
 ), dominant as(
  select user_id,sport,row_number() over(partition by user_id order by sum(minutes) desc,sport) n
  from activities,period where created_at>=period.s group by user_id,sport
 )
 select t.user_id,p.username,p.full_name,p.avatar_url,t.total_minutes,d.sport,
   row_number() over(order by t.total_minutes desc,p.full_name,t.user_id)
 from totals t join profiles p on p.id=t.user_id left join dominant d on d.user_id=t.user_id and d.n=1
 order by t.total_minutes desc,p.full_name,t.user_id limit 100;
$$;

create or replace function public.finalize_weekly_awards()
returns integer language plpgsql security definer set search_path=public as $$
declare finish timestamptz:=public.current_competition_start(); start_at timestamptz:=finish-interval '7 days'; inserted integer;
begin
 insert into weekly_awards(period_start,period_end,position,user_id,total_minutes,dominant_sport)
 with totals as(
   select a.user_id,sum(a.minutes)::bigint total_minutes from activities a
   where a.created_at>=start_at and a.created_at<finish group by a.user_id
 ), dominant as(
   select user_id,sport,row_number() over(partition by user_id order by sum(minutes) desc,sport) n
   from activities where created_at>=start_at and created_at<finish group by user_id,sport
 ), ranked as(
   select t.user_id,t.total_minutes,d.sport dominant_sport,row_number() over(order by t.total_minutes desc,p.full_name,t.user_id) rank_position
   from totals t join profiles p on p.id=t.user_id left join dominant d on d.user_id=t.user_id and d.n=1
 ) select start_at,finish,rank_position,user_id,total_minutes,dominant_sport from ranked where rank_position<=3
 on conflict do nothing;
 insert into user_medals(user_id,medal_type,sport,week,year)
 select user_id,case "position" when 1 then 'Oro semanal' when 2 then 'Plata semanal' else 'Bronce semanal' end,
   coalesce(dominant_sport,'General'),extract(week from period_start at time zone 'America/Mexico_City')::smallint,
   extract(year from period_start at time zone 'America/Mexico_City')::smallint
 from weekly_awards where period_start=start_at on conflict do nothing;
 get diagnostics inserted=row_count; return inserted;
end $$;

grant execute on function public.current_competition_start(),public.live_weekly_rankings(text) to authenticated;
revoke all on function public.finalize_weekly_awards() from public,anon,authenticated;
grant execute on function public.finalize_weekly_awards() to service_role;
