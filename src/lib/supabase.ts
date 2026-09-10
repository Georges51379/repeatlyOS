import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** True once real Supabase credentials are present in the environment. Used
 * to show a clear "not configured yet" state instead of letting auth calls
 * fail confusingly against a placeholder project. */
export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// A syntactically valid placeholder URL so createClient() never throws at
// import time (that would crash the whole app before AuthContext gets a
// chance to show a helpful message). No network calls succeed against it.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key',
);
