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
// CORS: an OPTIONS preflight + Access-Control-Allow-* headers on every
// response, needed for any call made from the browser rather than curl
// (curl never enforces CORS, which is why this was missing from every
// Edge Function in this project until the gap surfaced live on
// admin-generate-invite). Not otherwise re-verified against a live
// deployment.

import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function jsonResponse(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return jsonResponse({ error: 'Missing Authorization header' }, 401)
  }

  let membershipId: unknown
  try {
    ;({ membershipId } = await req.json())
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }
  if (typeof membershipId !== 'string' || membershipId.length === 0) {
    return jsonResponse({ error: 'membershipId is required' }, 400)
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
    return jsonResponse({ error: 'Not found' }, 404)
  }
  if (!membership.invited_email) {
    return jsonResponse({ invited_email: null }, 200)
  }

  // Step 2: decryption, via the service-role client only.
  const adminClient = createClient(supabaseUrl, serviceRoleKey)
  const { data: plaintext, error: decryptError } = await adminClient.rpc('decrypt_pii', {
    ciphertext: membership.invited_email,
  })
  if (decryptError) {
    console.error('decrypt_pii failed', decryptError)
    return jsonResponse({ error: 'Decryption failed' }, 500)
  }

  return jsonResponse({ invited_email: plaintext }, 200)
})
