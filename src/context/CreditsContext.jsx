// Single source of truth for credits across the whole app.
// Both Sidebar and BillingPage read from here — no stale values.
import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase/client'
import { useAuth }  from './AuthContext'

const CreditsContext = createContext(null)

export function CreditsProvider({ children }) {
  const { user }              = useAuth()
  const [credits, setCredits] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', user.id)
      .single()
    if (error) { console.error('Credits fetch error:', error.message); return }
    if (data)  setCredits(data.credits)
  }, [user])

  useEffect(() => {
    if (!user) { setLoading(false); return }
    setLoading(true)
    refresh().finally(() => setLoading(false))
  }, [user, refresh])

  return (
    <CreditsContext.Provider value={{ credits, loading, refresh, setCredits }}>
      {children}
    </CreditsContext.Provider>
  )
}

export function useCredits() {
  const ctx = useContext(CreditsContext)
  if (!ctx) throw new Error('useCredits must be used within <CreditsProvider>')
  return ctx
}