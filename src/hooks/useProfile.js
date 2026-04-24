
// import { useState, useEffect, useCallback } from 'react'
// import { fetchProfile, updateProfile } from '../lib/supabase/posts'
// import { useAuth } from '../context/AuthContext'

// export function useProfile() {
//   const { user } = useAuth()
//   const [profile, setProfile] = useState(null)
//   const [loading, setLoading] = useState(true)

//   const refresh = useCallback(async () => {
//     if (!user) return
//     const { data } = await fetchProfile(user.id)
//     if (data) setProfile(data)
//   }, [user])

//   useEffect(() => {
//     setLoading(true)
//     refresh().finally(() => setLoading(false))
//   }, [refresh])

//   const update = async (updates) => {
//     const { data, error } = await updateProfile(user.id, updates)
//     if (data) setProfile(data)
//     return { error }
//   }

//   return { profile, loading, refresh, update }
// }


export { useProfile } from '../context/ProfileContext'