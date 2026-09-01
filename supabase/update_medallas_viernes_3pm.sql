-- Medallero: actualización de lunes a viernes y cierre viernes 15:00, hora de Ciudad de México.
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
   select a.user_id,sum(a.minutes)::bigint total_minutes from activities a,limits l
   where a.created_at>=l.start_at and a.created_at<=l.end_at group by a.user_id
 ), dominant as(
   select a.user_id,a.sport,row_number() over(partition by a.user_id order by sum(a.minutes) desc,a.sport) n
   from activities a,limits l where a.created_at>=l.start_at and a.created_at<=l.end_at group by a.user_id,a.sport
 )
 select t.user_id,p.username,p.full_name,p.avatar_url,t.total_minutes,d.sport,
   row_number() over(order by t.total_minutes desc,p.full_name,t.user_id)
 from totals t join profiles p on p.id=t.user_id left join dominant d on d.user_id=t.user_id and d.n=1
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
 insert into weekly_awards(period_start,period_end,"position",user_id,total_minutes,dominant_sport)
 select start_at,finish,rank_position,user_id,total_minutes,dominant_sport
 from public.medal_weekly_rankings() where rank_position<=3
 on conflict do nothing;
 get diagnostics inserted=row_count;
 insert into user_medals(user_id,medal_type,sport,week,year)
 select user_id,case "position" when 1 then 'Oro semanal' when 2 then 'Plata semanal' else 'Bronce semanal' end,
   coalesce(dominant_sport,'General'),extract(week from period_start at time zone 'America/Mexico_City')::smallint,
   extract(year from period_start at time zone 'America/Mexico_City')::smallint
 from weekly_awards where period_start=start_at on conflict do nothing;
 return inserted;
end $$;

grant execute on function public.medal_weekly_rankings() to authenticated;
revoke all on function public.finalize_weekly_awards() from public,anon,authenticated;
grant execute on function public.finalize_weekly_awards() to service_role;
