import { getSupabase, assertOk } from './supabase.js';
import { uploadUserImage } from './images.js';

const met = { Gimnasio:6,Calistenia:5.5,Running:9,Hiking:6.5,Tennis:7.3,Padel:6.5,'Fútbol':8,Volleyball:6,'Natación':8 };
const intensity = { Baja:.75,Moderada:1,Alta:1.2,'Muy alta':1.4 };
export function calculateCalories(activity, weightKg = 70) {
  const kg = Math.min(300, Math.max(20, Number(weightKg) || 70));
  return Math.max(0, Math.round(((met[activity.sport] || 5) * 3.5 * kg / 200) * Number(activity.minutes || 0) * (intensity[activity.intensity] || 1)));
}
export async function createActivity(activity, evidenceFile, evidenceRequired = false) {
  const supabase = await getSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Inicia sesión nuevamente.');
  if (evidenceRequired && !evidenceFile) throw new Error('La evidencia fotográfica es obligatoria.');
  let evidence_path = null;
  if (evidenceFile) evidence_path = await uploadUserImage(supabase, 'evidence', user.id, evidenceFile);
  return assertOk(await supabase.from('activities').insert({ ...activity, user_id:user.id, evidence_path }).select().single());
}
export async function listMyActivities({ sport, from, to, page = 0, pageSize = 25 } = {}) {
  const supabase = await getSupabase();
  let query = supabase.from('activities').select('*',{count:'exact'}).order('activity_date',{ascending:false}).order('created_at',{ascending:false}).range(page*pageSize,(page+1)*pageSize-1);
  if (sport) query=query.eq('sport',sport); if(from) query=query.gte('activity_date',from); if(to) query=query.lte('activity_date',to);
  const {data,error,count}=await query; if(error) throw error; return {data,count};
}
