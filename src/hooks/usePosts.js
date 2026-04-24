// src/hooks/usePosts.js
import { useState, useEffect, useCallback } from 'react'
import { fetchUserPosts, archivePost, schedulePost } from '../lib/supabase/posts'

export function usePosts({ status } = {}) {
  const [posts,   setPosts]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    const { data, error } = await fetchUserPosts({ status })
    if (error) setError(error)
    else setPosts(data)
    setLoading(false)
  }, [status])

  useEffect(() => { refresh() }, [refresh])

  const archive = async (id) => {
    const { error } = await archivePost(id)
    if (!error) setPosts(ps => ps.filter(p => p.id !== id))
    return { error }
  }

  const schedule = async (id, date) => {
    const { data, error } = await schedulePost(id, date)
    if (data) setPosts(ps => ps.map(p => p.id === id ? data : p))
    return { error }
  }

  return { posts, loading, error, refresh, archive, schedule }
}
