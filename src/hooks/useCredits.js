import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase/client'
import { useAuth } from '../context/AuthContext'

export function useCredits() {
  const { user }              = useAuth()
  const [credits, setCredits] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single()
    if (data) setCredits(data.credits)
  }, [user])

  // Fetch once on mount / user change — no Realtime subscription
  // (Realtime causes StrictMode double-invoke crashes in dev)
  useEffect(() => {
    if (!user) return
    setLoading(true)
    refresh().finally(() => setLoading(false))
  }, [user, refresh])

  return { credits, loading, refresh }
}