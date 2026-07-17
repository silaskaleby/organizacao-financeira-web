import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

export async function checkSupabaseConnection() {
  if (!supabase) {
    return {
      ok: false,
      reason: 'missing-env',
    } as const;
  }

  const { error } = await supabase.from('profiles').select('id').limit(1);

  if (error) {
    return {
      ok: false,
      reason: 'connection-error',
      message: error.message,
    } as const;
  }

  return {
    ok: true,
  } as const;
}
