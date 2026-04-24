// supabase/functions/paystack-webhook/index.ts
// Deploy with: supabase functions deploy paystack-webhook
// Set secret: supabase secrets set PAYSTACK_SECRET_KEY=sk_live_...
//
// In Paystack dashboard → Settings → Webhooks, point to:
// https://<project>.supabase.co/functions/v1/paystack-webhook

import { createClient } from 'npm:@supabase/supabase-js@2'
import { createHmac }   from 'node:crypto'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const body = await req.text()

  // ── Verify Paystack signature ──
  const paystackSecret = Deno.env.get('PAYSTACK_SECRET_KEY') ?? ''
  const signature = req.headers.get('x-paystack-signature') ?? ''
  const expected  = createHmac('sha512', paystackSecret).update(body).digest('hex')

  if (signature !== expected) {
    return new Response('Invalid signature', { status: 401 })
  }

  const event = JSON.parse(body)

  // Only handle successful charges
  if (event.event !== 'charge.success') {
    return new Response('OK', { status: 200 })
  }

  const { metadata, customer } = event.data
  const email   = customer?.email
  const credits = parseInt(metadata?.credits ?? '0', 10)
  const plan    = metadata?.plan   // e.g. 'starter' | 'pro'
  const isTopup = metadata?.type === 'topup'

  if (!email || !credits) {
    return new Response('Missing metadata', { status: 400 })
  }

  // ── Admin Supabase client (service role) ──
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Find user by email
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers()
  const user = users?.find(u => u.email === email)

  if (!user) {
    console.error('User not found for email:', email)
    return new Response('User not found', { status: 404 })
  }

  // Add credits to profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('credits')
    .eq('id', user.id)
    .single()

  const newBalance = (profile?.credits ?? 0) + credits

  // Update profile
  const updates: Record<string, unknown> = { credits: newBalance }
  if (plan && !isTopup) {
    updates.plan = plan
    updates.subscription_status = 'active'
  }

  await supabase.from('profiles').update(updates).eq('id', user.id)

  // Log transaction
  await supabase.from('credit_transactions').insert({
    user_id:       user.id,
    event_type:    'purchase',
    amount:        credits,
    balance_after: newBalance,
    description:   isTopup ? `Credit top-up (${credits} credits)` : `Plan upgrade to ${plan}`,
  })

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
})
