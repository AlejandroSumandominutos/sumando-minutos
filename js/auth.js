import { getSupabase, assertOk } from './supabase.js';
import { uploadUserImage } from './images.js';

function avatarStore(mode,userId,file){
  if(!('indexedDB' in window))return Promise.resolve(null);
  return new Promise((resolve,reject)=>{const request=indexedDB.open('sumando-minutos-pending',1);request.onupgradeneeded=()=>request.result.createObjectStore('avatars');request.onerror=()=>reject(request.error);request.onsuccess=()=>{const db=request.result,tx=db.transaction('avatars',mode==='get'?'readonly':'readwrite'),store=tx.objectStore('avatars'),op=mode==='put'?store.put(file,userId):mode==='delete'?store.delete(userId):store.get(userId);op.onsuccess=()=>resolve(op.result);op.onerror=()=>reject(op.error);tx.oncomplete=()=>db.close();};});
}

export async function signUp({ email, password, username, fullName, age, sport, institution, avatar }) {
  const supabase = await getSupabase();
  const auth = assertOk(await supabase.auth.signUp({ email, password, options: {
    emailRedirectTo: `${location.origin}/`,
    data: { username, full_name: fullName, age: age || '', favorite_sport: sport || '', institution: institution || '' }
  }}));
  if (auth.user && auth.session && avatar) {
    const path = await uploadUserImage(supabase, 'avatars', auth.user.id, avatar);
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    assertOk(await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', auth.user.id));
  } else if (auth.user && avatar) {
    await avatarStore('put',auth.user.id,avatar);
  }
  return auth;
}

export async function signIn(identifier, password) {
  const supabase = await getSupabase();
  const email = identifier.trim();
  if (!email.includes('@')) throw new Error('Inicia sesión con tu correo electrónico.');
  return assertOk(await supabase.auth.signInWithPassword({ email, password }));
}
export async function signOut() { return assertOk(await (await getSupabase()).auth.signOut()); }
export async function sendPasswordReset(email) {
  return assertOk(await (await getSupabase()).auth.resetPasswordForEmail(email, { redirectTo: `${location.origin}/?reset-password=1` }));
}
export async function updatePassword(password) { return assertOk(await (await getSupabase()).auth.updateUser({ password })); }
export async function currentContext() {
  const supabase = await getSupabase();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return { session: null, profile: null };
  let profile = assertOk(await supabase.from('profiles').select('*').eq('id', session.user.id).single());
  const pendingAvatar=await avatarStore('get',session.user.id).catch(()=>null);
  if(pendingAvatar&&!profile.avatar_url){
    const path=await uploadUserImage(supabase,'avatars',session.user.id,pendingAvatar),{data}=supabase.storage.from('avatars').getPublicUrl(path);
    profile=assertOk(await supabase.from('profiles').update({avatar_url:data.publicUrl}).eq('id',session.user.id).select().single());
    await avatarStore('delete',session.user.id).catch(()=>null);
  }
  return { session, profile };
}
