// Decrypts customers.address for a caller who is actually allowed to see
// that specific customer row. Same two-step design as
// decrypt-invite-email (see that function's header comment for the full
// rationale) — re-run the read AS THE CALLER first so RLS
// (customers_member_read, supabase/migrations/20260910000006_customers.sql)
// decides authorization, and only decrypt via the service-role client if
// that succeeds. Authorization is not reimplemented here.
//
// Deploy: `supabase functions deploy decrypt-customer-address`, or via the
// Dashboard. Same auto-injected env vars as every other function in this
// project (SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY) —
// no manual secrets needed.

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

  let customerId: unknown
  try {
    ;({ customerId } = await req.json())
  } catch {
    return jsonResponse({ error: 'Invalid JSON body' }, 400)
  }
  if (typeof customerId !== 'string' || customerId.length === 0) {
    return jsonResponse({ error: 'customerId is required' }, 400)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

  // Step 1: authorization, via the caller's own session.
  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: customer, error: readError } = await callerClient
    .from('customers')
    .select('id, address')
    .eq('id', customerId)
    .maybeSingle()

  if (readError || !customer) {
    // Same response whether the row doesn't exist or RLS hid it — don't
    // let this endpoint be used to probe which customer ids exist.
    return jsonResponse({ error: 'Not found' }, 404)
  }
  if (!customer.address) {
    return jsonResponse({ address: null }, 200)
  }

  // Step 2: decryption, via the service-role client only.
  const adminClient = createClient(supabaseUrl, serviceRoleKey)
  const { data: plaintext, error: decryptError } = await adminClient.rpc('decrypt_pii', {
    ciphertext: customer.address,
  })
  if (decryptError) {
    console.error('decrypt_pii failed', decryptError)
    return jsonResponse({ error: 'Decryption failed' }, 500)
  }

  return jsonResponse({ address: plaintext }, 200)
})
