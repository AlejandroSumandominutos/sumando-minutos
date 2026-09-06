import { getSupabase, assertOk } from './supabase.js';
import { uploadUserImage } from './images.js';

function pendingStore(storeName,mode,userId,value){
  if(!('indexedDB' in window))return Promise.resolve(null);
  return new Promise((resolve,reject)=>{const request=indexedDB.open('sumando-minutos-pending',2);request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains('avatars'))request.result.createObjectStore('avatars');if(!request.result.objectStoreNames.contains('security'))request.result.createObjectStore('security');};request.onerror=()=>reject(request.error);request.onsuccess=()=>{const db=request.result,tx=db.transaction(storeName,mode==='get'?'readonly':'readwrite'),store=tx.objectStore(storeName),op=mode==='put'?store.put(value,userId):mode==='delete'?store.delete(userId):store.get(userId);op.onsuccess=()=>resolve(op.result);op.onerror=()=>reject(op.error);tx.oncomplete=()=>db.close();};});
}
const avatarStore=(mode,userId,file)=>pendingStore('avatars',mode,userId,file);
const securityStore=(mode,userId,value)=>pendingStore('security',mode,userId,value);

export async function signUp({ email, password, username, fullName, age, sport, institution, subject, role='student', avatar, securityQuestion, securityAnswer }) {
  const supabase = await getSupabase();
  const auth = assertOk(await supabase.auth.signUp({ email, password, options: {
    emailRedirectTo: `${location.origin}/`,
    data: { username, full_name: fullName, age: age || '', favorite_sport: sport || '', institution: institution || '', subject: subject || '', role: role === 'teacher' ? 'teacher' : 'student' }
  }}));
  if (auth.user && auth.session && avatar) {
    const path = await uploadUserImage(supabase, 'avatars', auth.user.id, avatar);
    const { data } = supabase.storage.from('avatars').getPublicUrl(path);
    assertOk(await supabase.from('profiles').update({ avatar_url: data.publicUrl }).eq('id', auth.user.id));
  } else if (auth.user && avatar) {
    await avatarStore('put',auth.user.id,avatar);
  }
  if(auth.user&&securityQuestion&&securityAnswer){
    if(auth.session) assertOk(await supabase.rpc('set_my_security_question',{p_question:securityQuestion,p_answer:securityAnswer}));
    else await securityStore('put',auth.user.id,{question:securityQuestion,answer:securityAnswer});
  }
  return auth;
}

export async function signIn(identifier, password) {
  const supabase = await getSupabase();
  const response=await fetch('/api/login',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({identifier:identifier.trim(),password})}),raw=await response.text();
  let data={};try{data=raw?JSON.parse(raw):{};}catch{}
  if(!response.ok)throw new Error(data.error||'No fue posible iniciar sesión.');
  return assertOk(await supabase.auth.setSession({access_token:data.access_token,refresh_token:data.refresh_token}));
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
  const pendingSecurity=await securityStore('get',session.user.id).catch(()=>null);
  if(pendingSecurity){assertOk(await supabase.rpc('set_my_security_question',{p_question:pendingSecurity.question,p_answer:pendingSecurity.answer}));await securityStore('delete',session.user.id).catch(()=>null);}
  return { session, profile };
}
