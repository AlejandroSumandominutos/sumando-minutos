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
