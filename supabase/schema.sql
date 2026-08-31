-- Sumando Minutos: esquema de producción para Supabase/PostgreSQL.
create extension if not exists pgcrypto;

create type public.app_role as enum ('student', 'teacher');
create type public.visibility_level as enum ('private', 'public');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  username text not null unique check (char_length(username) between 3 and 40),
  full_name text not null,
  age smallint check (age between 6 and 100),
  avatar_url text,
  role public.app_role not null default 'student',
  favorite_sport text,
  institution text,
  subject text,
  weight_kg numeric(5,2) check (weight_kg between 20 and 300),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.teacher_students (
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (teacher_id, student_id),
  check (teacher_id <> student_id)
);

create table public.app_settings (
  id boolean primary key default true check (id),
  evidence_required boolean not null default false,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);
insert into public.app_settings (id) values (true) on conflict do nothing;

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  sport text not null,
  activity_date date not null default current_date,
  minutes integer not null check (minutes between 1 and 1440),
  intensity text not null check (intensity in ('Baja','Moderada','Alta','Muy alta')),
  calories integer not null default 0 check (calories >= 0),
  distance numeric(9,2), body_part text, workout_type text,
  sets integer, repetitions integer, weight numeric(8,2), pace text,
  elevation numeric(9,2), position text, swimming_style text,
  session_type text, level text, difficulty text, exercise text,
  notes text check (char_length(notes) <= 2000),
  evidence_path text,
  visibility public.visibility_level not null default 'private',
  created_at timestamptz not null default now()
);

create table public.community_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  activity_id uuid references public.activities(id) on delete set null,
  image_path text,
  description text not null check (char_length(description) between 1 and 500),
  sport text not null,
  visibility public.visibility_level not null default 'public',
  created_at timestamptz not null default now()
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  content text not null check (char_length(content) between 1 and 500),
  created_at timestamptz not null default now()
);

create table public.progress_ratings (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

create table public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  sport text not null, goal_type text not null,
  target_value numeric(12,2) not null check (target_value > 0),
  current_value numeric(12,2) not null default 0 check (current_value >= 0),
  start_date date not null default current_date, end_date date,
  status text not null default 'active' check (status in ('active','completed','cancelled')),
  created_at timestamptz not null default now()
);

create table public.user_medals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  medal_type text not null,
  sport text not null default 'General',
  week smallint not null check (week between 1 and 53),
  year smallint not null check (year >= 2020),
  awarded_at timestamptz not null default now(),
  unique (user_id, medal_type, sport, week, year)
);

create table public.private_messages (
  id uuid primary key default gen_random_uuid(),
  teacher_id uuid not null references public.profiles(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  message text not null check (char_length(message) between 1 and 2000),
  created_at timestamptz not null default now(), edited_at timestamptz, read_at timestamptz,
  check (sender_id = teacher_id or sender_id = student_id)
);

create table public.quiz_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  sport text not null, question_id text not null, correct boolean not null,
  xp integer not null default 0 check (xp between 0 and 100),
  created_at timestamptz not null default now(),
  unique (user_id, question_id)
);

create table public.saved_articles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  article_id text not null, title text not null, url text not null, sport text, source text,
  created_at timestamptz not null default now(),
  unique (user_id, article_id)
);

create table public.saved_videos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  video_id text not null, created_at timestamptz not null default now(),
  unique (user_id, video_id)
);

-- Vista deliberadamente limitada para nombres/avatares visibles en la comunidad y rankings.
create view public.public_profiles with (security_barrier=true) as
select id,username,full_name,avatar_url from public.profiles;
revoke all on public.public_profiles from public,anon;
grant select on public.public_profiles to authenticated;

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger profiles_touch before update on public.profiles for each row execute function public.touch_updated_at();

create or replace function public.enforce_evidence_setting() returns trigger language plpgsql as $$
begin
  if exists(select 1 from public.app_settings where id=true and evidence_required=true) and new.evidence_path is null then
    raise exception 'La evidencia fotográfica es obligatoria';
  end if;
  return new;
end $$;
create trigger activities_require_evidence before insert or update of evidence_path on public.activities
for each row execute function public.enforce_evidence_setting();

-- El registro público solo puede crear estudiantes. El primer docente se promueve por SQL documentado.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id,email,username,full_name,age,role,favorite_sport,institution)
  values (new.id,new.email,coalesce(new.raw_user_meta_data->>'username',split_part(new.email,'@',1)),
    coalesce(new.raw_user_meta_data->>'full_name',split_part(new.email,'@',1)),
    nullif(new.raw_user_meta_data->>'age','')::smallint,'student',
    new.raw_user_meta_data->>'favorite_sport',new.raw_user_meta_data->>'institution');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.weekly_rankings(p_sport text default null)
returns table(user_id uuid, username text, full_name text, avatar_url text, sport text, total_minutes bigint, rank bigint)
language sql stable security definer set search_path=public as $$
  select a.user_id,p.username,p.full_name,p.avatar_url,coalesce(p_sport,'General'),sum(a.minutes),
    dense_rank() over(order by sum(a.minutes) desc)
  from public.activities a join public.profiles p on p.id=a.user_id
  where a.activity_date >= date_trunc('week',current_date)::date
    and a.activity_date < (date_trunc('week',current_date)+interval '7 days')::date
    and (p_sport is null or a.sport=p_sport)
  group by a.user_id,p.username,p.full_name,p.avatar_url order by sum(a.minutes) desc limit 100;
$$;

create or replace function public.my_dashboard_stats()
returns jsonb language sql stable security invoker as $$
  with mine as (select * from public.activities where user_id=auth.uid()),
  active_days as (select distinct activity_date from mine),
  ordered as (select activity_date,row_number() over(order by activity_date desc) rn from active_days),
  streak as (select count(*) n from ordered where activity_date=current_date-(rn-1)::int)
  select jsonb_build_object(
    'minutes_today',coalesce(sum(minutes) filter(where activity_date=current_date),0),
    'minutes_week',coalesce(sum(minutes) filter(where activity_date>=date_trunc('week',current_date)::date),0),
    'minutes_month',coalesce(sum(minutes) filter(where activity_date>=date_trunc('month',current_date)::date),0),
    'calories_week',coalesce(sum(calories) filter(where activity_date>=date_trunc('week',current_date)::date),0),
    'workouts',count(*),'favorite_sport',(select sport from mine group by sport order by sum(minutes) desc limit 1),
    'streak',(select n from streak)) from mine;
$$;

create or replace function public.teacher_student_summary(p_sport text default null)
returns table(student_id uuid,full_name text,age smallint,avatar_url text,sports text[],workouts_week bigint,minutes_week bigint,calories_week bigint,last_activity date)
language sql stable security invoker as $$
 select p.id,p.full_name,p.age,p.avatar_url,array_remove(array_agg(distinct a.sport),null),
 count(a.id) filter(where a.activity_date>=date_trunc('week',current_date)::date),
 coalesce(sum(a.minutes) filter(where a.activity_date>=date_trunc('week',current_date)::date),0),
 coalesce(sum(a.calories) filter(where a.activity_date>=date_trunc('week',current_date)::date),0),max(a.activity_date)
 from public.teacher_students ts join public.profiles p on p.id=ts.student_id
 left join public.activities a on a.user_id=p.id and (p_sport is null or a.sport=p_sport)
 where ts.teacher_id=auth.uid() group by p.id,p.full_name,p.age,p.avatar_url;
$$;
