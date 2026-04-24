import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { supabase } from '../lib/supabase/client'
import { useAuth }  from './AuthContext'

const ProfileContext = createContext(null)

export function ProfileProvider({ children }) {
  const { user }              = useAuth()
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!user) return
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, business_name, credits, credits_used, plan, subscription_status')
      .eq('id', user.id)
      .single()
    if (error) { console.error('Profile fetch error:', error.message); return }
    if (data)  setProfile(data)
  }, [user])

  useEffect(() => {
    if (!user) { setLoading(false); return }
    setLoading(true)
    refresh().finally(() => setLoading(false))
  }, [user, refresh])

  const update = async (updates) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single()
    if (data) setProfile(data)
    return { error }
  }

  return (
    <ProfileContext.Provider value={{ profile, loading, refresh, update }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const ctx = useContext(ProfileContext)
  if (!ctx) throw new Error('useProfile must be used within <ProfileProvider>')
  return ctx
}