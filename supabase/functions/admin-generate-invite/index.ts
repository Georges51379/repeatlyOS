// Lets a platform admin create (or reactivate) an account WITHOUT
// RepeatlyOS sending any automated email — instead this generates a
// one-time code/link and hands it straight back to the admin, who relays
// it to the person themselves however they choose (WhatsApp, in person, a
// phone call, or their own personal email — anything except an automated
// system send).
//
// Why this needs a server call at all: registering a passkey requires an
// existing session (verified against the installed @supabase/auth-js
// source — there is no "create my first credential with zero prior auth"
// method), so SOME one-time credential has to exist to bootstrap that
// first session. `admin.generateLink` is the piece that makes this
// possible without an automatic email: unlike `signInWithOtp` (which both
// generates AND sends), `generateLink` only ever generates — sending is a
// separate step the caller controls, and here that step is "show it to
// the admin," not "email it automatically."
//
// Security note: this is still a real one-time, time-limited, single-use
// credential — not a "type any email, get a session" backdoor. It's
// restricted to platform admins (checked below the same way as every
// other admin-only Edge Function in this project), and only reaches the
// invited person if the admin actually chooses to share it with them.
//
// Deploy: Supabase Dashboard -> Edge Functions -> New Function -> paste
// this file, or `supabase functions deploy admin-generate-invite`. Keep
// the default JWT verification enabled.

import { createClient } from 'npm:@supabase/supabase-js@2.116.0'

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401 })
    }

    let body: { email?: unknown; fullName?: unknown; cityId?: unknown; redirectTo?: unknown }
    try {
      body = await req.json()
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400 })
    }

    const { email, fullName, cityId, redirectTo } = body
    if (typeof email !== 'string' || email.length === 0) {
      return new Response(JSON.stringify({ error: 'email is required' }), { status: 400 })
    }
    if (typeof fullName !== 'string' || fullName.length === 0) {
      return new Response(JSON.stringify({ error: 'fullName is required' }), { status: 400 })
    }
    if (cityId !== undefined && typeof cityId !== 'string') {
      return new Response(JSON.stringify({ error: 'cityId must be a string when provided' }), { status: 400 })
    }
    if (typeof redirectTo !== 'string' || redirectTo.length === 0) {
      return new Response(JSON.stringify({ error: 'redirectTo is required' }), { status: 400 })
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

    // Step 2: generate (never send) the one-time credential, via the
    // service-role client. `magiclink` both creates the account if it
    // doesn't exist yet and works for an existing one (e.g. re-activating
    // someone who lost their passkey), so this one call path covers both.
    const adminClient = createClient(supabaseUrl, serviceRoleKey)
    const { data, error } = await adminClient.auth.admin.generateLink({
      type: 'magiclink',
      email,
      options: {
        data: { full_name: fullName },
        redirectTo,
      },
    })
    if (error || !data.user) {
      console.error('generateLink failed', error)
      return new Response(JSON.stringify({ error: `Failed to generate invite: ${error?.message}` }), { status: 500 })
    }

    // Step 3: optionally grant city_admin for the requested city.
    if (cityId) {
      const { error: grantError } = await adminClient
        .from('city_admins')
        .upsert({ user_id: data.user.id, city_id: cityId }, { onConflict: 'user_id,city_id' })
      if (grantError) {
        console.error('city_admins grant failed', grantError)
        return new Response(JSON.stringify({ error: `Failed to grant city admin: ${grantError.message}` }), {
          status: 500,
        })
      }
    }

    return new Response(
      JSON.stringify({
        code: data.properties.email_otp,
        link: data.properties.action_link,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('admin-generate-invite crashed', err)
    const message = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ error: `Unhandled error: ${message}` }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
