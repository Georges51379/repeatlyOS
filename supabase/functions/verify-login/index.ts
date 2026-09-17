// Replaces the old code/link activation flow entirely (2026-09-17): a
// visitor types only their email and clicks "Verify" — no code is ever
// generated for a human to read, type, or click. This function checks
// eligibility for the requested role, then establishes a REAL Supabase Auth
// session server-side and hands the client just enough to finish the job
// invisibly.
//
// The trick: `admin.generateLink` returns a `hashed_token` alongside the
// human-readable `email_otp`/`action_link` it was built to produce (see
// admin-generate-invite, which returns those instead). This function
// returns the hashed_token instead — the client calls
// `supabase.auth.verifyOtp({ token_hash, type: 'email' })` with it
// immediately, in the same request cycle, and a session is established
// with nothing ever shown to the person or sent anywhere. It's the exact
// same underlying Supabase primitive as before, just never surfaced as a
// "type this code" step.
//
// Callable by ANYONE, unauthenticated, by design — the eligibility check
// below is the actual gate, not a caller-auth check (contrast
// admin-generate-invite, which requires an already-signed-in platform
// admin). A brand-new auth.users account is created here ONLY after that
// eligibility check passes, never unconditionally:
//   - platform_admin: requires an EXISTING account already granted a
//     platform_admins row (see docs/REPEATLYOS_SECURITY_MODEL.md — this
//     role is intentionally only grantable via direct SQL, and that stays
//     true here: this function never creates a platform_admins row).
//   - city_admin: requires either an existing `city_admins` grant, or an
//     active+verified `city_admin_invites` row (migration
//     20260917000001) created by a platform admin. Any matching invite is
//     promoted into a real `city_admins` row here.
//   - business_owner: requires either an existing active
//     `business_memberships` row, or a `signup_requests` row with
//     status = 'approved'.
//
// Rate limited via `auth_verify_attempts` (same migration) — every
// attempt is logged regardless of outcome, which is what actually prevents
// this from being usable to brute-force which emails are eligible.

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

const RATE_WINDOW_MINUTES = 15
const RATE_LIMIT = 8
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type Context = 'platform_admin' | 'city_admin' | 'business_owner'

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  try {
    if (req.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405)
    }

    let body: { email?: unknown; context?: unknown }
    try {
      body = await req.json()
    } catch {
      return jsonResponse({ error: 'Invalid JSON body' }, 400)
    }

    const rawEmail = body.email
    const context = body.context as Context
    if (typeof rawEmail !== 'string' || !EMAIL_RE.test(rawEmail)) {
      return jsonResponse({ error: 'A valid email is required.' }, 400)
    }
    if (context !== 'platform_admin' && context !== 'city_admin' && context !== 'business_owner') {
      return jsonResponse({ error: 'Invalid context.' }, 400)
    }
    const email = rawEmail.trim().toLowerCase()

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    // ── Rate limit ────────────────────────────────────────────────────────
    const since = new Date(Date.now() - RATE_WINDOW_MINUTES * 60 * 1000).toISOString()
    const { count } = await adminClient
      .from('auth_verify_attempts')
      .select('*', { count: 'exact', head: true })
      .ilike('email', email)
      .gte('created_at', since)
    if ((count ?? 0) >= RATE_LIMIT) {
      return jsonResponse({ error: 'Too many attempts. Please try again later.' }, 429)
    }
    await adminClient.from('auth_verify_attempts').insert({ email, context })

    // ── Look up an existing account, if any ─────────────────────────────
    const { data: profile } = await adminClient.from('profiles').select('id').ilike('email', email).maybeSingle()
    let userId: string | null = profile?.id ?? null

    // ── Eligibility, per role ────────────────────────────────────────────
    let eligible = false
    let redirectTo = '/app'
    let deniedMessage = 'This email is not authorized to sign in.'
    // Populated only for context === 'city_admin', and only ever read
    // further down in THIS SAME invocation — deliberately a plain local,
    // not a module-level/globalThis value, since Supabase Edge Functions
    // reuse isolates across concurrent requests and a shared mutable
    // global here would leak one request's city grants into another's.
    const cityIdsForGrant = new Set<string>()

    if (context === 'platform_admin') {
      if (userId) {
        const { data: pa } = await adminClient.from('platform_admins').select('user_id').eq('user_id', userId).maybeSingle()
        eligible = Boolean(pa)
      }
      redirectTo = '/platform-admin'
    } else if (context === 'city_admin') {
      if (userId) {
        const { data: grants } = await adminClient.from('city_admins').select('city_id').eq('user_id', userId)
        for (const g of grants ?? []) cityIdsForGrant.add(g.city_id as string)
      }
      const { data: invites } = await adminClient
        .from('city_admin_invites')
        .select('city_id')
        .ilike('email', email)
        .eq('active', true)
        .eq('verified', true)
      for (const inv of invites ?? []) cityIdsForGrant.add(inv.city_id as string)

      eligible = cityIdsForGrant.size > 0
      if (eligible) {
        redirectTo = cityIdsForGrant.size === 1 ? `/city-admin/${[...cityIdsForGrant][0]}` : '/app'
      }
    } else {
      if (userId) {
        const { count: memberCount } = await adminClient
          .from('business_memberships')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('status', 'active')
        if ((memberCount ?? 0) > 0) {
          eligible = true
          redirectTo = '/app'
        }
      }
      if (!eligible) {
        const { data: signupRequest } = await adminClient
          .from('signup_requests')
          .select('status')
          .ilike('email', email)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (signupRequest?.status === 'approved') {
          eligible = true
          redirectTo = '/onboarding'
        } else if (signupRequest?.status === 'pending') {
          deniedMessage = 'Your application is still awaiting approval.'
        }
      }
    }

    if (!eligible) {
      return jsonResponse({ error: deniedMessage }, 403)
    }

    // ── Create the account if this is genuinely their first time ────────
    if (!userId) {
      const { data: created, error: createError } = await adminClient.auth.admin.createUser({
        email,
        email_confirm: true,
      })
      if (createError || !created.user) {
        console.error('createUser failed', createError)
        return jsonResponse({ error: 'Could not create your account. Please try again.' }, 500)
      }
      userId = created.user.id
    }

    // ── Promote any matching city_admin_invites into real grants ─────────
    if (context === 'city_admin') {
      for (const cityId of cityIdsForGrant) {
        await adminClient.from('city_admins').upsert({ user_id: userId, city_id: cityId }, { onConflict: 'user_id,city_id' })
      }
    }

    // ── Establish a session invisibly ───────────────────────────────────
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email,
    })
    if (linkError || !linkData?.properties?.hashed_token) {
      console.error('generateLink failed', linkError)
      return jsonResponse({ error: 'Could not start sign-in. Please try again.' }, 500)
    }

    return jsonResponse({ tokenHash: linkData.properties.hashed_token, redirectTo }, 200)
  } catch (err) {
    console.error('verify-login crashed', err)
    const message = err instanceof Error ? err.message : String(err)
    return jsonResponse({ error: `Unhandled error: ${message}` }, 500)
  }
})
