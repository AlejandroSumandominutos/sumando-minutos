-- Actualización consolidada: progreso, calorías por deporte y planes estructurados.
alter table public.goals add column if not exists plan jsonb;

create or replace function public.sport_calorie_totals(p_sport text)
returns jsonb language sql stable security invoker as $$
  select jsonb_build_object(
    'today',coalesce(sum(calories) filter(where activity_date=current_date),0),
    'week',coalesce(sum(calories) filter(where activity_date>=date_trunc('week',current_date)::date
      and activity_date<(date_trunc('week',current_date)+interval '7 days')::date),0)
  ) from public.activities where user_id=auth.uid() and sport=p_sport;
$$;

create or replace function public.user_progress_snapshot()
returns jsonb language sql stable security invoker as $$
  with mine as (select * from public.activities where user_id=auth.uid()),
  active_days as (select distinct activity_date from mine),
  ordered as (select activity_date,row_number() over(order by activity_date desc) rn from active_days),
  streak as (select count(*) n from ordered where activity_date=current_date-(rn-1)::int),
  quiz as (select count(*) filter(where correct) correct,coalesce(sum(xp) filter(where correct),0) xp,
    count(distinct sport) filter(where correct) sports from public.quiz_results where user_id=auth.uid()),
  goal as (select * from public.goals where user_id=auth.uid() and status='active' order by created_at desc limit 1),
  activity_xp as (select coalesce(sum(minutes + case when evidence_path is not null then 5 else 0 end),0) xp from mine),
  goal_progress as (select coalesce(sum(a.minutes),0) value from goal g left join mine a on a.sport=g.sport
    and a.activity_date>=date_trunc('week',current_date)::date
    and a.activity_date<(date_trunc('week',current_date)+interval '7 days')::date )
  select jsonb_build_object(
    'minutes_today',coalesce((select sum(minutes) from mine where activity_date=current_date),0),
    'minutes_week',coalesce((select sum(minutes) from mine where activity_date>=date_trunc('week',current_date)::date),0),
    'minutes_total',coalesce((select sum(minutes) from mine),0),
    'calories_week',coalesce((select sum(calories) from mine where activity_date>=date_trunc('week',current_date)::date),0),
    'calories_total',coalesce((select sum(calories) from mine),0),
    'workouts',(select count(*) from mine),
    'last_sport',(select sport from mine order by activity_date desc,created_at desc limit 1),
    'streak',coalesce((select n from streak),0),
    'quiz_correct',coalesce((select correct from quiz),0),
    'quiz_xp',coalesce((select xp from quiz),0),
    'activity_xp',coalesce((select xp from activity_xp),0),
    'xp_total',coalesce((select xp from quiz),0)+coalesce((select xp from activity_xp),0),
    'quiz_sports',coalesce((select sports from quiz),0),
    'education_medals',(select count(*) from (values(5),(10),(20)) m(threshold) where (select correct from quiz)>=m.threshold),
    'medals',(select count(*) from public.user_medals where user_id=auth.uid()),
    'goal_target',coalesce((select target_value from goal),420),
    'goal_current',coalesce((select value from goal_progress),0),
    'goal_sport',(select sport from goal)
  );
$$;

grant execute on function public.sport_calorie_totals(text),public.user_progress_snapshot() to authenticated;

do $$ begin
  if not exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='storage_avatar_delete') then
    create policy storage_avatar_delete on storage.objects for delete to authenticated
      using(bucket_id='avatars' and owner_id=auth.uid()::text);
  end if;
end $$;
