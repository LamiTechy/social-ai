import { createClient } from '@supabase/supabase-js'

let supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? ''
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY.\n' +
    'Copy .env.example → .env.local and fill in your Supabase credentials.'
  )
}

// Strip any accidental path suffixes — URL must be bare domain only.
// e.g. "https://x.supabase.co/rest/v1" → "https://x.supabase.co"
supabaseUrl = supabaseUrl
  .replace(/\/rest\/v1\/?$/, '')
  .replace(/\/auth\/v1\/?$/, '')
  .replace(/\/+$/, '')          // trailing slashes

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})