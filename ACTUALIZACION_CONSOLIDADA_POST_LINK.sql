-- Dashboard diario y racha usando la fecha de Ciudad de México.
create or replace function public.sport_calorie_totals(p_sport text)
returns jsonb language sql stable security invoker as $$
  with clock as (
    select (now() at time zone 'America/Mexico_City')::date today,
      date_trunc('week',now() at time zone 'America/Mexico_City')::date week_start
  )
  select jsonb_build_object(
    'today',coalesce(sum(a.calories) filter(where a.activity_date=c.today),0),
    'week',coalesce(sum(a.calories) filter(where a.activity_date>=c.week_start and a.activity_date<c.week_start+7),0)
  ) from public.activities a cross join clock c where a.user_id=auth.uid() and a.sport=p_sport
  group by c.today,c.week_start;
$$;

create or replace function public.user_progress_snapshot()
returns jsonb language sql stable security invoker as $$
  with clock as (
    select (now() at time zone 'America/Mexico_City')::date today,
      date_trunc('week',now() at time zone 'America/Mexico_City')::date week_start
  ),
  mine as (select * from public.activities where user_id=auth.uid()),
  active_days as (select distinct m.activity_date from mine m,clock c where m.activity_date<=c.today),
  ordered as (select activity_date,row_number() over(order by activity_date desc) rn from active_days),
  streak as (select count(*) n from ordered,clock where activity_date=clock.today-(rn-1)::int),
  quiz as (select count(*) filter(where correct) correct,coalesce(sum(xp) filter(where correct),0) xp,
    count(distinct sport) filter(where correct) sports from public.quiz_results where user_id=auth.uid()),
  goal as (select * from public.goals where user_id=auth.uid() and status='active' order by created_at desc limit 1),
  activity_xp as (select coalesce(sum(minutes + case when evidence_path is not null then 5 else 0 end),0) xp from mine),
  goal_progress as (select coalesce(sum(a.minutes),0) value from goal g cross join clock c left join mine a on a.sport=g.sport
    and a.activity_date>=c.week_start and a.activity_date<c.week_start+7)
  select jsonb_build_object(
    'minutes_today',coalesce((select sum(m.minutes) from mine m,clock c where m.activity_date=c.today),0),
    'minutes_week',coalesce((select sum(m.minutes) from mine m,clock c where m.activity_date>=c.week_start and m.activity_date<c.week_start+7),0),
    'minutes_total',coalesce((select sum(minutes) from mine),0),
    'calories_week',coalesce((select sum(m.calories) from mine m,clock c where m.activity_date>=c.week_start and m.activity_date<c.week_start+7),0),
    'calories_total',coalesce((select sum(calories) from mine),0),
    'workouts',(select count(*) from mine),
    'last_sport',(select sport from mine order by activity_date desc,created_at desc limit 1),
    'streak',coalesce((select n from streak),0),
    'quiz_correct',coalesce((select correct from quiz),0),
    'quiz_xp',coalesce((select xp from quiz),0),
    'activity_xp',coalesce((select xp from activity_xp),0),
    'xp_total',coalesce((select xp from quiz),0)+coalesce((select xp from activity_xp),0),
    'quiz_sports',coalesce((select sports from quiz),0),
    'education_medals',(select count(*) from (values(5),(10),(20)) m(threshold) where coalesce((select correct from quiz),0)>=m.threshold),
    'medals',(select count(*) from public.user_medals where user_id=auth.uid()),
    'goal_target',coalesce((select target_value from goal),420),
    'goal_current',coalesce((select value from goal_progress),0),
    'goal_sport',(select sport from goal)
  );
$$;

grant execute on function public.sport_calorie_totals(text),public.user_progress_snapshot() to authenticated;

-- Medallero: líderes provisionales, cierre viernes 15:00 y nuevo ciclo lunes 01:00.
create or replace function public.medal_weekly_rankings()
returns table(user_id uuid,username text,full_name text,avatar_url text,total_minutes bigint,dominant_sport text,rank_position bigint)
language sql stable security definer set search_path=public as $$
 with clock as(
   select now() at time zone 'America/Mexico_City' local_now,
     date_trunc('week',now() at time zone 'America/Mexico_City') monday
 ), cycle as(
   select local_now,case when local_now>=monday+interval '1 hour'
     then monday+interval '1 hour' else monday-interval '7 days'+interval '1 hour' end cycle_start
   from clock
 ), limits as(
   select cycle_start at time zone 'America/Mexico_City' start_at,
     least(local_now,cycle_start+interval '4 days 14 hours') at time zone 'America/Mexico_City' end_at
   from cycle
 ), totals as(
   select a.user_id,sum(a.minutes)::bigint total_minutes from public.activities a,limits l
   where a.created_at>=l.start_at and a.created_at<=l.end_at group by a.user_id
 ), dominant as(
   select a.user_id,a.sport,row_number() over(partition by a.user_id order by sum(a.minutes) desc,a.sport) n
   from public.activities a,limits l where a.created_at>=l.start_at and a.created_at<=l.end_at group by a.user_id,a.sport
 )
 select t.user_id,p.username,p.full_name,p.avatar_url,t.total_minutes,d.sport,
   row_number() over(order by t.total_minutes desc,p.full_name,t.user_id)
 from totals t join public.profiles p on p.id=t.user_id left join dominant d on d.user_id=t.user_id and d.n=1
 order by t.total_minutes desc,p.full_name,t.user_id limit 3;
$$;

create or replace function public.finalize_weekly_awards()
returns integer language plpgsql security definer set search_path=public as $$
declare
  local_now timestamp:=now() at time zone 'America/Mexico_City';
  cycle_start timestamp:=case when local_now>=date_trunc('week',local_now)+interval '1 hour'
    then date_trunc('week',local_now)+interval '1 hour'
    else date_trunc('week',local_now)-interval '7 days'+interval '1 hour' end;
  start_at timestamptz:=(cycle_start at time zone 'America/Mexico_City');
  finish timestamptz:=((cycle_start+interval '4 days 14 hours') at time zone 'America/Mexico_City');
  inserted integer;
begin
 insert into public.weekly_awards(period_start,period_end,"position",user_id,total_minutes,dominant_sport)
 select start_at,finish,rank_position,user_id,total_minutes,dominant_sport
 from public.medal_weekly_rankings() where rank_position<=3
 on conflict do nothing;
 get diagnostics inserted=row_count;
 insert into public.user_medals(user_id,medal_type,sport,week,year)
 select user_id,case "position" when 1 then 'Oro semanal' when 2 then 'Plata semanal' else 'Bronce semanal' end,
   coalesce(dominant_sport,'General'),extract(week from period_start at time zone 'America/Mexico_City')::smallint,
   extract(year from period_start at time zone 'America/Mexico_City')::smallint
 from public.weekly_awards where period_start=start_at on conflict do nothing;
 return inserted;
end $$;

grant execute on function public.medal_weekly_rankings() to authenticated;
revoke all on function public.finalize_weekly_awards() from public,anon,authenticated;
grant execute on function public.finalize_weekly_awards() to service_role;
