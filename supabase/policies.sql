-- Ejecutar después de schema.sql. Las políticas nunca confían en el rol del HTML.
create or replace function public.is_teacher(uid uuid default auth.uid()) returns boolean
language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.profiles where id=uid and role='teacher');
$$;
create or replace function public.is_my_student(uid uuid) returns boolean
language sql stable security definer set search_path=public as $$
  select exists(select 1 from public.teacher_students where teacher_id=auth.uid() and student_id=uid);
$$;
grant execute on function public.is_teacher(uuid),public.is_my_student(uuid) to authenticated;

alter table public.profiles enable row level security;
alter table public.teacher_students enable row level security;
alter table public.app_settings enable row level security;
alter table public.activities enable row level security;
alter table public.community_posts enable row level security;
alter table public.comments enable row level security;
alter table public.progress_ratings enable row level security;
alter table public.goals enable row level security;
alter table public.user_medals enable row level security;
alter table public.private_messages enable row level security;
alter table public.quiz_results enable row level security;
alter table public.saved_articles enable row level security;
alter table public.saved_videos enable row level security;

create policy profiles_read_self_or_related on public.profiles for select to authenticated
using (id=auth.uid() or public.is_my_student(id) or exists(select 1 from public.teacher_students ts where ts.student_id=auth.uid() and ts.teacher_id=profiles.id));
create policy profiles_update_self on public.profiles for update to authenticated using(id=auth.uid()) with check(id=auth.uid());

-- Evita auto-promoción y cambios de identidad mediante una lista explícita de columnas.
revoke update on public.profiles from authenticated;
grant update (username,full_name,age,avatar_url,favorite_sport,institution,subject,weight_kg,updated_at) on public.profiles to authenticated;

create policy links_read_participants on public.teacher_students for select to authenticated
using(teacher_id=auth.uid() or student_id=auth.uid());
create policy links_teacher_insert on public.teacher_students for insert to authenticated
with check(teacher_id=auth.uid() and public.is_teacher());
create policy links_teacher_delete on public.teacher_students for delete to authenticated
using(teacher_id=auth.uid() and public.is_teacher());

create policy settings_read on public.app_settings for select to authenticated using(true);
create policy settings_teacher_update on public.app_settings for update to authenticated
using(public.is_teacher()) with check(public.is_teacher() and updated_by=auth.uid());

create policy activities_read on public.activities for select to authenticated
using(user_id=auth.uid() or public.is_my_student(user_id));
create policy activities_insert_self on public.activities for insert to authenticated with check(user_id=auth.uid());
create policy activities_update_self on public.activities for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy activities_delete_self on public.activities for delete to authenticated using(user_id=auth.uid());

create policy posts_read on public.community_posts for select to authenticated
using(visibility='public' or user_id=auth.uid());
create policy posts_insert_self on public.community_posts for insert to authenticated with check(user_id=auth.uid());
create policy posts_update_self on public.community_posts for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy posts_delete_self on public.community_posts for delete to authenticated using(user_id=auth.uid());

create policy comments_read_public_post on public.comments for select to authenticated
using(exists(select 1 from public.community_posts p where p.id=post_id and (p.visibility='public' or p.user_id=auth.uid())));
create policy comments_insert_self on public.comments for insert to authenticated
with check(user_id=auth.uid() and exists(select 1 from public.community_posts p where p.id=post_id and p.visibility='public'));
create policy comments_delete_self on public.comments for delete to authenticated using(user_id=auth.uid());

create policy ratings_read on public.progress_ratings for select to authenticated
using(exists(select 1 from public.community_posts p where p.id=post_id and p.visibility='public'));
create policy ratings_write on public.progress_ratings for insert to authenticated
with check(user_id=auth.uid() and exists(select 1 from public.community_posts p where p.id=post_id and p.visibility='public'));
create policy ratings_update_self on public.progress_ratings for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());

create policy goals_owner_all on public.goals for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy goals_teacher_read on public.goals for select to authenticated using(public.is_my_student(user_id));
create policy medals_read_self_related on public.user_medals for select to authenticated using(user_id=auth.uid() or public.is_my_student(user_id));

create policy messages_participants_read on public.private_messages for select to authenticated
using(auth.uid()=teacher_id or auth.uid()=student_id);
create policy messages_participants_insert on public.private_messages for insert to authenticated
with check((auth.uid()=sender_id) and (auth.uid()=teacher_id or auth.uid()=student_id)
 and exists(select 1 from public.teacher_students ts where ts.teacher_id=private_messages.teacher_id and ts.student_id=private_messages.student_id));
create policy messages_sender_update on public.private_messages for update to authenticated
using(sender_id=auth.uid()) with check(sender_id=auth.uid());

create policy quiz_owner_all on public.quiz_results for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy articles_owner_all on public.saved_articles for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy videos_owner_all on public.saved_videos for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());

-- Storage: avatars/comunidad públicos; evidence privado y servido con URL firmada.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values
 ('avatars','avatars',true,1048576,array['image/jpeg','image/png','image/webp']),
 ('evidence','evidence',false,1048576,array['image/jpeg','image/png','image/webp']),
 ('community','community',true,1048576,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

create policy storage_avatar_insert on storage.objects for insert to authenticated with check(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);
create policy storage_avatar_update on storage.objects for update to authenticated using(bucket_id='avatars' and owner_id=auth.uid()::text);
create policy storage_community_insert on storage.objects for insert to authenticated with check(bucket_id='community' and (storage.foldername(name))[1]=auth.uid()::text);
create policy storage_community_delete on storage.objects for delete to authenticated using(bucket_id='community' and owner_id=auth.uid()::text);
create policy storage_evidence_insert on storage.objects for insert to authenticated with check(bucket_id='evidence' and (storage.foldername(name))[1]=auth.uid()::text);
create policy storage_evidence_read on storage.objects for select to authenticated using(bucket_id='evidence' and (
 owner_id=auth.uid()::text or public.is_my_student(((storage.foldername(name))[1])::uuid)
));
create policy storage_evidence_delete on storage.objects for delete to authenticated using(bucket_id='evidence' and owner_id=auth.uid()::text);

grant usage on schema public to authenticated;
grant select,insert,update,delete on all tables in schema public to authenticated;
grant execute on function public.weekly_rankings(text),public.my_dashboard_stats(),public.teacher_student_summary(text) to authenticated;

-- Cierre de privilegios por columna después del grant general.
revoke insert,delete on public.profiles from authenticated;
revoke update on public.profiles from authenticated;
grant update (username,full_name,age,avatar_url,favorite_sport,institution,subject,weight_kg,updated_at) on public.profiles to authenticated;
revoke update on public.private_messages from authenticated;
grant update (message,edited_at,read_at) on public.private_messages to authenticated;
