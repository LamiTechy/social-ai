import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePosts }   from '../../hooks/usePosts'
import { useToast }   from '../../components/ui/Toast'
import Modal          from '../../components/ui/Modal'
import Badge          from '../../components/ui/Badge'
import Spinner        from '../../components/ui/Spinner'
import EmptyState     from '../../components/ui/EmptyState'
import { schedulePost } from '../../lib/supabase/posts'
import {
  BookOpen, Sparkles, Trash2, CalendarPlus,
  Copy, Check, Filter, Clock, Loader2
} from 'lucide-react'
import { format } from 'date-fns'

const PLATFORM_ICONS = { twitter: '𝕏', linkedin: 'in', instagram: '📸' }
const FILTERS = [
  { value: '',          label: 'All'       },
  { value: 'draft',     label: 'Drafts'    },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'published', label: 'Published' },
]

// ─── Post Card ───────────────────────────────────────────────
function PostCard({ post, onArchive, onScheduled }) {
  const [copied, setCopied]     = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showSched, setShowSched] = useState(false)
  const [schedDate, setSchedDate] = useState('')
  const [saving, setSaving]     = useState(false)
  const { add: toast }          = useToast()

  const platform  = post.platforms?.[0] ?? 'twitter'
  const text      = post.content?.[platform] ?? ''
  const platforms = post.platforms ?? []

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text).catch(() => {})
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  const handleDelete = async () => {
    setDeleting(true)
    const { error } = await onArchive(post.id)
    if (error) { toast('Failed to delete post', 'error'); setDeleting(false) }
  }

  const handleSchedule = async () => {
    if (!schedDate) return
    setSaving(true)
    const { error } = await schedulePost(post.id, new Date(schedDate).toISOString())
    setSaving(false)
    if (error) toast('Failed to schedule', 'error')
    else { toast('Post scheduled!', 'success'); setShowSched(false); onScheduled(post.id, schedDate) }
  }

  return (
    <>
      <div className="card p-5 flex flex-col gap-4 hover:border-white/20 transition-all duration-200">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            {platforms.map(p => (
              <span key={p} className="text-sm">{PLATFORM_ICONS[p] ?? '📝'}</span>
            ))}
            <Badge label={post.status} variant={post.status} />
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={handleCopy} title="Copy" className="p-1.5 rounded-lg text-white/25 hover:text-white/70 hover:bg-white/[0.06] transition-all">
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button onClick={() => setShowSched(true)} title="Schedule" className="p-1.5 rounded-lg text-white/25 hover:text-violet-400 hover:bg-violet-500/10 transition-all">
              <CalendarPlus className="w-3.5 h-3.5" />
            </button>
            <button onClick={handleDelete} disabled={deleting} title="Delete" className="p-1.5 rounded-lg text-white/25 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-40">
              {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Content preview */}
        <p className="text-sm text-white/65 leading-relaxed line-clamp-3">{text}</p>

        {/* Footer */}
        <div className="flex items-center gap-2 text-[11px] text-white/25">
          <Clock className="w-3 h-3" />
          <span>{format(new Date(post.created_at), 'MMM d, yyyy · h:mm a')}</span>
          {post.tone && (
            <span className="ml-auto capitalize bg-white/[0.05] px-2 py-0.5 rounded-full">{post.tone}</span>
          )}
        </div>
      </div>

      {/* Schedule modal */}
      <Modal open={showSched} onClose={() => setShowSched(false)} title="Schedule Post">
        <div className="space-y-4">
          <p className="text-sm text-white/50">Choose when to publish this post.</p>
          <div>
            <label className="label block mb-2">Date & Time</label>
            <input type="datetime-local" value={schedDate}
              onChange={e => setSchedDate(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="input" />
          </div>
          <div className="flex gap-3">
            <button onClick={handleSchedule} disabled={!schedDate || saving} className="btn-primary flex-1">
              {saving ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</> : <><CalendarPlus className="w-3.5 h-3.5" /> Schedule</>}
            </button>
            <button onClick={() => setShowSched(false)} className="btn-ghost">Cancel</button>
          </div>
        </div>
      </Modal>
    </>
  )
}

// ─── Page ────────────────────────────────────────────────────
export default function LibraryPage() {
  const navigate            = useNavigate()
  const [filter, setFilter] = useState('')
  const { posts, loading, archive, refresh } = usePosts({ status: filter || undefined })
  const { add: toast }      = useToast()

  const handleArchive = async (id) => {
    const { error } = await archive(id)
    if (!error) toast('Post deleted', 'info')
    return { error }
  }

  const handleScheduled = (id, date) => {
    refresh()
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Content Library</h2>
          <p className="text-sm text-white/40 mt-0.5">{posts.length} post{posts.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => navigate('/generate')} className="btn-primary self-start sm:self-auto">
          <Sparkles className="w-4 h-4" /> Generate new
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-3.5 h-3.5 text-white/30" />
        {FILTERS.map(f => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-150
              ${filter === f.value
                ? 'bg-violet-600/20 border border-violet-500/40 text-violet-300'
                : 'border border-white/10 text-white/40 hover:text-white/70 hover:border-white/20'
              }`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
      ) : posts.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No posts here yet"
          description="Generate AI content and it will appear in your library."
          action={
            <button onClick={() => navigate('/generate')} className="btn-primary">
              <Sparkles className="w-4 h-4" /> Generate your first post
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {posts.map(post => (
            <PostCard key={post.id} post={post} onArchive={handleArchive} onScheduled={handleScheduled} />
          ))}
        </div>
      )}
    </div>
  )
}
