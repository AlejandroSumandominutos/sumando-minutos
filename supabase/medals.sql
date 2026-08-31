-- Programar semanalmente con Supabase Cron (lunes 00:10) o ejecutar manualmente.
create or replace function public.award_weekly_medals() returns integer
language plpgsql security definer set search_path=public as $$
declare inserted_count integer;
begin
  with totals as (
    select user_id,sum(minutes) total,dense_rank() over(order by sum(minutes) desc) place
    from activities
    where activity_date>=date_trunc('week',current_date)::date
      and activity_date<(date_trunc('week',current_date)+interval '7 days')::date
    group by user_id
  ), awards as (
    select user_id,case place when 1 then 'Oro' when 2 then 'Plata' when 3 then 'Cobre' end medal_type,'General' sport
    from totals where place<=3
    union all select user_id,'Constancia 420','General' from totals where total>=420
  ) insert into user_medals(user_id,medal_type,sport,week,year)
    select user_id,medal_type,sport,extract(week from current_date)::int,extract(isoyear from current_date)::int from awards
    on conflict do nothing;
  get diagnostics inserted_count=row_count;
  return inserted_count;
end $$;
revoke all on function public.award_weekly_medals() from public,anon,authenticated;
