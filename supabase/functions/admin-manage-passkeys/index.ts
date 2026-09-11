// Lets a platform admin list or revoke ANOTHER user's passkeys. Needed
// because the client-side passkey API (`supabase.auth.passkey.*`) is
// self-service only — it always operates on the caller's own account, with
// no way to target another user's credentials. Revoking someone else's
// passkey requires the GoTrue Admin API (`admin.passkey.list/delete`,
// scoped by `userId`), which only works with the service_role key — so
// this has to happen server-side, the same two-step shape as
// decrypt-invite-email:
//   1. AUTHORIZATION: ask Postgres whether the CALLER is a platform admin,
//      using the caller's own JWT (`is_platform_admin()` reads auth.uid()
//      from that session) — not a client-supplied flag we'd have to trust.
//   2. THE ADMIN ACTION: only then, using the service-role client, list or
//      delete passkeys for the target userId from the request body.
//
// Deploy: Supabase Dashboard -> Edge Functions -> New Function -> paste
// this file, or `supabase functions deploy admin-manage-passkeys`. No
// manual secrets needed (SUPABASE_URL / SUPABASE_ANON_KEY /
// SUPABASE_SERVICE_ROLE_KEY are auto-injected). Keep the default JWT
// verification enabled for this function.
//
// Live-verified 2026-09-11 via curl end to end (non-admin gets 403,
// admin gets the passkey list). CORS handling added afterward, once this
// started being called from the actual browser dashboard instead of only
// curl — curl never enforces CORS, so that gap wasn't visible until then.
//
// Pinned to the exact version verified locally to include passkey admin
// support (node_modules/@supabase/auth-js), rather than a floating "@2" —
// the passkey API is recent enough that an unpinned range risks resolving
// to a version that predates it.
import { createClient } from 'npm:@supabase/supabase-js@2.116.0'

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

  try {
    if (req.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405)
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return jsonResponse({ error: 'Missing Authorization header' }, 401)
    }

    let body: { action?: unknown; userId?: unknown; passkeyId?: unknown }
    try {
      body = await req.json()
    } catch {
      return jsonResponse({ error: 'Invalid JSON body' }, 400)
    }

    const { action, userId, passkeyId } = body
    if (action !== 'list' && action !== 'delete') {
      return jsonResponse({ error: 'action must be "list" or "delete"' }, 400)
    }
    if (typeof userId !== 'string' || userId.length === 0) {
      return jsonResponse({ error: 'userId is required' }, 400)
    }
    if (action === 'delete' && (typeof passkeyId !== 'string' || passkeyId.length === 0)) {
      return jsonResponse({ error: 'passkeyId is required for delete' }, 400)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Step 1: authorization, via the caller's own session.
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: isAdmin, error: authError } = await callerClient.rpc('is_platform_admin')
    if (authError || !isAdmin) {
      return jsonResponse({ error: 'Forbidden' }, 403)
    }

    // Step 2: the actual admin action, via the service-role client only.
    // `experimental.passkey: true` is required here too (not just on the
    // browser client in lib/supabase.ts) — every passkey method, including
    // the admin list/delete ones, throws `assertPasskeyExperimentalEnabled`
    // without it.
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { experimental: { passkey: true } },
    })

    if (action === 'list') {
      // Named differently from the client-side self-service API
      // (`supabase.auth.passkey.list`) — confirmed by reading
      // GoTrueAdminApi's constructor directly after `.passkey.list` threw
      // "is not a function" in production; the admin object only has
      // `listPasskeys`/`deletePasskey`.
      const { data, error } = await adminClient.auth.admin.passkey.listPasskeys({ userId })
      if (error) {
        console.error('passkey.listPasskeys failed', error)
        return jsonResponse({ error: `Failed to list passkeys: ${error.message}` }, 500)
      }
      return jsonResponse({ data }, 200)
    }

    const { error } = await adminClient.auth.admin.passkey.deletePasskey({ userId, passkeyId: passkeyId as string })
    if (error) {
      console.error('passkey.deletePasskey failed', error)
      return jsonResponse({ error: `Failed to revoke passkey: ${error.message}` }, 500)
    }
    return jsonResponse({ success: true }, 200)
  } catch (err) {
    // Catches anything the auth-js client throws synchronously rather than
    // returning as a { data, error } pair (e.g. the experimental-flag
    // assertion, or a malformed response from the auth server) — without
    // this, such an error propagated out of Deno.serve entirely and
    // Supabase's Edge Runtime returned its own generic, detail-free 500.
    console.error('admin-manage-passkeys crashed', err)
    const message = err instanceof Error ? err.message : String(err)
    return jsonResponse({ error: `Unhandled error: ${message}` }, 500)
  }
})
