import { getSupabase, assertOk } from './supabase.js';
export async function dashboardStats(){return assertOk(await (await getSupabase()).rpc('my_dashboard_stats'));}
export async function weeklyRankings(sport=null){return assertOk(await (await getSupabase()).rpc('weekly_rankings',{p_sport:sport}));}
export async function teacherStudents(sport=null){return assertOk(await (await getSupabase()).rpc('teacher_student_summary',{p_sport:sport}));}
export async function saveGoal(goal){const s=await getSupabase();const {data:{user}}=await s.auth.getUser();return assertOk(await s.from('goals').insert({...goal,user_id:user.id}).select().single());}
export async function saveQuiz(result){const s=await getSupabase();const {data:{user}}=await s.auth.getUser();return assertOk(await s.from('quiz_results').upsert({...result,user_id:user.id},{onConflict:'user_id,question_id'}).select().single());}
export async function saveArticle(article){const s=await getSupabase();const {data:{user}}=await s.auth.getUser();return assertOk(await s.from('saved_articles').upsert({...article,user_id:user.id},{onConflict:'user_id,article_id'}));}
export async function saveVideo(video_id){const s=await getSupabase();const {data:{user}}=await s.auth.getUser();return assertOk(await s.from('saved_videos').upsert({user_id:user.id,video_id},{onConflict:'user_id,video_id'}));}
