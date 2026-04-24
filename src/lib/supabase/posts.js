import { supabase } from './client'

// ─── Posts ───────────────────────────────────────────────────────────────────

export async function insertGeneratedPost({ userId, topic, tone, platforms, content, imagePrompt = null }) {
  const { data: post, error: insertError } = await supabase
    .from('generated_posts')
    .insert({ user_id: userId, topic, tone, platforms, content, image_prompt: imagePrompt, credits_charged: 1 })
    .select()
    .single()

  if (insertError) return { data: null, error: insertError }

  const { error: creditError } = await supabase
    .rpc('deduct_credit', { p_user_id: userId, p_post_id: post.id, p_amount: 1 })

  if (creditError) {
    await supabase.from('generated_posts').delete().eq('id', post.id)
    return { data: null, error: creditError }
  }

  return { data: post, error: null }
}

export async function fetchUserPosts({ status, limit = 20, offset = 0 } = {}) {
  let query = supabase
    .from('generated_posts')
    .select('*')
    .eq('is_archived', false)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) query = query.eq('status', status)

  const { data, error } = await query
  return { data: data ?? [], error }
}

export async function fetchScheduledPosts(from, to) {
  const { data, error } = await supabase
    .from('generated_posts')
    .select('*')
    .eq('status', 'scheduled')
    .gte('scheduled_at', from)
    .lte('scheduled_at', to)
    .order('scheduled_at', { ascending: true })

  return { data: data ?? [], error }
}

export async function schedulePost(postId, scheduledAt) {
  const { data, error } = await supabase
    .from('generated_posts')
    .update({ status: 'scheduled', scheduled_at: scheduledAt })
    .eq('id', postId)
    .select()
    .single()
  return { data, error }
}

export async function archivePost(postId) {
  const { error } = await supabase.from('generated_posts').update({ is_archived: true }).eq('id', postId)
  return { error }
}

export async function updatePostContent(postId, content) {
  const { data, error } = await supabase
    .from('generated_posts')
    .update({ content })
    .eq('id', postId)
    .select()
    .single()
  return { data, error }
}

// ─── Profile ─────────────────────────────────────────────────────────────────

export async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, business_name, credits, credits_used, plan, subscription_status')
    .eq('id', userId)
    .single()
  return { data, error }
}

export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  return { data, error }
}

// ─── Credits ─────────────────────────────────────────────────────────────────

export async function fetchCreditHistory(limit = 20) {
  const { data, error } = await supabase
    .from('credit_transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  return { data: data ?? [], error }
}

// ─── Connected Accounts ──────────────────────────────────────────────────────

export async function fetchConnectedAccounts(userId) {
  const { data, error } = await supabase
    .from('connected_accounts')
    .select('*')
    .eq('user_id', userId)
  return { data: data ?? [], error }
}

export async function disconnectAccount(accountId) {
  const { error } = await supabase.from('connected_accounts').delete().eq('id', accountId)
  return { error }
}
