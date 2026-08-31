import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

let clientPromise;
export async function getSupabase() {
  if (!clientPromise) clientPromise = (async () => {
    const response = await fetch('/.netlify/functions/public-config', { cache: 'no-store' });
    if (!response.ok) throw new Error('Falta configurar Supabase en Netlify.');
    const { supabaseUrl, supabaseAnonKey } = await response.json();
    if (!supabaseUrl || !supabaseAnonKey) throw new Error('Configuración pública incompleta.');
    window.__SUMANDO_PUBLIC_CONFIG__ = { supabaseUrl };
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
    });
  })();
  return clientPromise;
}

export function assertOk({ data, error }) {
  if (error) throw error;
  return data;
}
