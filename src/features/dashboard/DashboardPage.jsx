import { useNavigate } from 'react-router-dom'
import { useProfile } from '../../hooks/useProfile'
import { usePosts }   from '../../hooks/usePosts'
import { useAuth }    from '../../context/AuthContext'
import { Sparkles, Zap, FileText, Calendar, TrendingUp, ArrowRight, Clock } from 'lucide-react'
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns'
import Badge    from '../../components/ui/Badge'
import Spinner  from '../../components/ui/Spinner'

// ─── Stat Card ───────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, accent = 'violet' }) {
  const colors = {
    violet:  'bg-violet-500/15 text-violet-400 border-violet-500/20',
    emerald: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    amber:   'bg-amber-500/15 text-amber-400 border-amber-500/20',
    blue:    'bg-blue-500/15 text-blue-400 border-blue-500/20',
  }
  return (
    <div className="card p-3 sm:p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center border ${colors[accent]}`}>
          <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
        </div>
      </div>
      <p className="text-xl sm:text-2xl font-bold text-white mb-0.5">{value}</p>
      <p className="text-xs font-medium text-white/60">{label}</p>
      {sub && <p className="text-[10px] sm:text-[11px] text-white/30 mt-0.5">{sub}</p>}
    </div>
  )
}

// ─── Week Calendar ───────────────────────────────────────────
function WeekCalendar({ posts }) {
  const today = new Date()
  const weekStart = startOfWeek(today, { weekStartsOn: 1 })
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const scheduled = posts.filter(p => p.status === 'scheduled' && p.scheduled_at)

  return (
    <div className="card p-3 sm:p-5 overflow-hidden">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0 mb-4 min-w-0">
        <h2 className="text-sm font-semibold text-white/80">This Week</h2>
        <span className="text-[11px] sm:text-xs text-white/30">{format(weekStart, 'MMM d')} – {format(days[6], 'MMM d')}</span>
      </div>
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
        {days.map((day) => {
          const dayPosts = scheduled.filter(p => isSameDay(parseISO(p.scheduled_at), day))
          const isToday  = isSameDay(day, today)
          return (
            <div key={day.toISOString()} className="flex flex-col items-center gap-1">
              <span className="text-[9px] sm:text-[10px] text-white/30 uppercase">{format(day, 'EEE')}</span>
              <div className={`
                w-full aspect-square rounded-lg flex items-center justify-center relative
                text-xs sm:text-sm font-semibold transition-all
                ${isToday
                  ? 'bg-violet-600/30 border border-violet-500/50 text-violet-300'
                  : 'bg-white/[0.03] border border-white/[0.06] text-white/40'
                }
              `}>
                {format(day, 'd')}
                {dayPosts.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-violet-500 text-white text-[8px] sm:text-[9px] font-bold flex items-center justify-center">
                    {dayPosts.length}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Recent Post Row ─────────────────────────────────────────
function PostRow({ post }) {
  const platform = Object.keys(post.content ?? {})[0] ?? 'twitter'
  const text = post.content?.[platform] ?? ''
  const ICONS = { twitter: '𝕏', linkedin: 'in', instagram: '📸' }

  return (
    <div className="flex items-start gap-2 sm:gap-3 py-2 sm:py-3 border-b border-white/[0.06] last:border-0 min-w-0 overflow-hidden">
      <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-white/[0.06] flex items-center justify-center shrink-0 text-xs sm:text-sm mt-0.5">
        {ICONS[platform] ?? '📝'}
      </div>
      <div className="flex-1 min-w-0 overflow-hidden">
        <p className="text-xs text-white/70 truncate leading-relaxed">{text}</p>
        <div className="flex items-center gap-1 sm:gap-2 mt-1 flex-wrap min-w-0">
          <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white/25 shrink-0" />
          <span className="text-[10px] sm:text-[11px] text-white/30 truncate">{format(new Date(post.created_at), 'MMM d, h:mm a')}</span>
          <Badge label={post.status} variant={post.status} />
        </div>
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────
export default function DashboardPage() {
  const { user }                       = useAuth()
  const { profile, loading: profLoad } = useProfile()
  const { posts,   loading: postLoad } = usePosts()
  const navigate                       = useNavigate()

  const scheduled = posts.filter(p => p.status === 'scheduled').length
  const recent    = posts.slice(0, 5)

  if (profLoad) return <div className="flex items-center justify-center h-64"><Spinner /></div>

  const firstName = profile?.full_name?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'there'

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 md:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8 overflow-x-hidden">

      {/* Hero */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">Hey, {firstName} 👋</h2>
          <p className="text-xs sm:text-sm text-white/40 mt-1">Here's your content overview for today.</p>
        </div>
        <button onClick={() => navigate('/generate')} className="btn-primary self-start sm:self-auto text-sm">
          <Sparkles className="w-4 h-4" />
          Generate content
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <StatCard icon={Zap}         label="Credits left"     value={profile?.credits ?? 0}       sub="Free plan"              accent="violet" />
        <StatCard icon={FileText}    label="Posts created"    value={posts.length}                 sub="All time"               accent="blue"   />
        <StatCard icon={Calendar}    label="Scheduled"        value={scheduled}                    sub="Upcoming posts"         accent="emerald"/>
        <StatCard icon={TrendingUp}  label="Credits used"     value={profile?.credits_used ?? 0}   sub="Total generations"      accent="amber"  />
      </div>

      {/* Low credit banner */}
      {profile?.credits !== null && profile?.credits <= 3 && (
        <div className="rounded-2xl bg-amber-500/10 border border-amber-500/25 p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <Zap className="w-5 h-5 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
            <div>
              <p className="text-sm font-semibold text-amber-300">Running low on credits</p>
              <p className="text-xs text-amber-400/60">You have {profile.credits} credit{profile.credits !== 1 ? 's' : ''} remaining.</p>
            </div>
          </div>
          <button onClick={() => navigate('/billing')} className="btn-ghost text-xs shrink-0">
            Top up <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Two-column lower section */}
      <div className="grid lg:grid-cols-2 gap-4 sm:gap-6">

        {/* Recent posts */}
        <div className="card p-3 sm:p-5 overflow-hidden">
          <div className="flex items-center justify-between mb-4 gap-2">
            <h2 className="text-sm font-semibold text-white/80 truncate">Recent Posts</h2>
            <button onClick={() => navigate('/library')} className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 shrink-0 whitespace-nowrap">
              View all <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {postLoad ? (
            <Spinner className="py-8" />
          ) : recent.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-xs text-white/25">No posts yet.</p>
              <button onClick={() => navigate('/generate')} className="mt-3 text-xs text-violet-400 hover:text-violet-300">
                Generate your first post →
              </button>
            </div>
          ) : (
            <div>{recent.map(p => <PostRow key={p.id} post={p} />)}</div>
          )}
        </div>

        {/* Weekly calendar */}
        <WeekCalendar posts={posts} />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Write a post',    desc: 'AI-powered content for any platform', icon: Sparkles, to: '/generate', color: 'from-violet-600/20' },
          { label: 'Browse library',  desc: 'Manage and schedule saved drafts',    icon: FileText,  to: '/library',  color: 'from-blue-600/20'   },
          { label: 'Upgrade plan',    desc: 'Get more credits and features',       icon: Zap,       to: '/billing',  color: 'from-amber-600/20'  },
        ].map(item => (
          <button
            key={item.to}
            onClick={() => navigate(item.to)}
            className={`
              text-left p-5 rounded-2xl border border-white/[0.08]
              bg-gradient-to-br ${item.color} to-transparent
              hover:border-white/20 transition-all duration-200 group
            `}
          >
            <item.icon className="w-5 h-5 text-white/40 mb-3 group-hover:text-white/70 transition-colors" />
            <p className="text-sm font-semibold text-white/80 group-hover:text-white">{item.label}</p>
            <p className="text-xs text-white/30 mt-0.5">{item.desc}</p>
          </button>
        ))}
      </div>
    </div>
  )
}
