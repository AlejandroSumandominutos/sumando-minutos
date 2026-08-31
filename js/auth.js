import { getSupabase, assertOk } from './supabase.js';
import { uploadUserImage } from './images.js';

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
  const profile = assertOk(await supabase.from('profiles').select('*').eq('id', session.user.id).single());
  return { session, profile };
}
