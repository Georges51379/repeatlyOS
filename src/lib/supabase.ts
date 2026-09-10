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
  {
    auth: {
      // Passkey/WebAuthn support (supabase.auth.signInWithPasskey /
      // registerPasskey / passkey.list / passkey.update / passkey.delete) is
      // beta/experimental in @supabase/supabase-js — every passkey method
      // throws unless this flag is set. Verified against the installed
      // package source (node_modules/@supabase/auth-js/src/lib/types.ts),
      // not just docs, since this API shipped after this assistant's
      // knowledge cutoff. Must ALSO be enabled in the Supabase dashboard
      // (Authentication -> Passkeys) with a Relying Party ID/origins
      // configured before any of it works against a real project — see
      // docs/REPEATLYOS_MIGRATION_PLAN.md.
      experimental: { passkey: true },
    },
  },
);
