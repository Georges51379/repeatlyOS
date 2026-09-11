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

  let body: { action?: unknown; userId?: unknown; passkeyId?: unknown }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 })
  }

  const { action, userId, passkeyId } = body
  if (action !== 'list' && action !== 'delete') {
    return new Response(JSON.stringify({ error: 'action must be "list" or "delete"' }), { status: 400 })
  }
  if (typeof userId !== 'string' || userId.length === 0) {
    return new Response(JSON.stringify({ error: 'userId is required' }), { status: 400 })
  }
  if (action === 'delete' && (typeof passkeyId !== 'string' || passkeyId.length === 0)) {
    return new Response(JSON.stringify({ error: 'passkeyId is required for delete' }), { status: 400 })
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
    return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 })
  }

  // Step 2: the actual admin action, via the service-role client only.
  const adminClient = createClient(supabaseUrl, serviceRoleKey)

  if (action === 'list') {
    const { data, error } = await adminClient.auth.admin.passkey.list({ userId })
    if (error) {
      console.error('passkey.list failed', error)
      return new Response(JSON.stringify({ error: 'Failed to list passkeys' }), { status: 500 })
    }
    return new Response(JSON.stringify({ data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { error } = await adminClient.auth.admin.passkey.delete({ userId, passkeyId: passkeyId as string })
  if (error) {
    console.error('passkey.delete failed', error)
    return new Response(JSON.stringify({ error: 'Failed to revoke passkey' }), { status: 500 })
  }
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
