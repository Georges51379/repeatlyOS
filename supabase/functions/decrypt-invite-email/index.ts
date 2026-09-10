// Decrypts business_memberships.invited_email for a caller who is actually
// allowed to see that specific row.
//
// Two-step design, deliberately kept simple:
//   1. AUTHORIZATION: re-run the read AS THE CALLER, using their own JWT
//      against the normal REST API. Row Level Security (memberships_read,
//      see supabase/migrations/20260910000002_rls_policies.sql) decides
//      whether they're allowed to see this row at all — if not, this
//      returns nothing and we refuse, without ever touching the
//      service-role client. Authorization logic is NOT reimplemented here;
//      it's reused from the RLS policy that already enforces it everywhere
//      else.
//   2. DECRYPTION: only the service_role client can call the `decrypt_pii`
//      Postgres function (EXECUTE is revoked from anon/authenticated — see
//      migration 20260910000004). This function's service_role key is
//      never sent to the browser; only the plaintext result is.
//
// Deploy: Supabase Dashboard -> Edge Functions -> New Function -> paste this
// file, or `supabase functions deploy decrypt-invite-email` via the CLI. No
// manual secrets needed — SUPABASE_URL, SUPABASE_ANON_KEY and
// SUPABASE_SERVICE_ROLE_KEY are auto-injected into every Edge Function in
// the project. Requires the default JWT verification Supabase applies to
// new functions (do not disable it for this one).
//
// NOT verified against a live deployment — no Edge Function has been
// deployed for this project yet. Verify manually after deploying.

import { createClient } from 'npm:@supabase/supabase-js@2'

Deno.serve(async (req: Request) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401 })
  }

  let membershipId: unknown
  try {
    ;({ membershipId } = await req.json())
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 })
  }
  if (typeof membershipId !== 'string' || membershipId.length === 0) {
    return new Response(JSON.stringify({ error: 'membershipId is required' }), { status: 400 })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  // Step 1: authorization, via the caller's own session — not our own logic.
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: membership, error: readError } = await callerClient
    .from('business_memberships')
    .select('id, invited_email')
    .eq('id', membershipId)
    .maybeSingle()

  if (readError || !membership) {
    // Deliberately the same response whether the row doesn't exist or RLS
    // hid it — don't let this endpoint be used to probe which IDs exist.
    return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
  }
  if (!membership.invited_email) {
    return new Response(JSON.stringify({ invited_email: null }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Step 2: decryption, via the service-role client only.
  const adminClient = createClient(supabaseUrl, serviceRoleKey)
  const { data: plaintext, error: decryptError } = await adminClient.rpc('decrypt_pii', {
    ciphertext: membership.invited_email,
  })
  if (decryptError) {
    console.error('decrypt_pii failed', decryptError)
    return new Response(JSON.stringify({ error: 'Decryption failed' }), { status: 500 })
  }

  return new Response(JSON.stringify({ invited_email: plaintext }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
