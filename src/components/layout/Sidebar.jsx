import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth }    from '../../context/AuthContext'
import { useProfile } from '../../context/ProfileContext'
import {
  LayoutDashboard, Sparkles, BookOpen,
  Link2, LogOut, Crown, X
} from 'lucide-react'

const NAV = [
  { to: '/',         icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/generate', icon: Sparkles,        label: 'Generate'  },
  { to: '/library',  icon: BookOpen,        label: 'Library'   },
  { to: '/accounts', icon: Link2,           label: 'Accounts'  },
]

const PLAN_BADGE = {
  free:    { label: 'Free',    color: 'text-white/35' },
  starter: { label: 'Starter', color: 'text-violet-400' },
  pro:     { label: 'Pro',     color: 'text-amber-400' },
}

export default function Sidebar({ open, onClose }) {
  const { user, signOut } = useAuth()
  const { profile }       = useProfile()
  const navigate          = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  const plan = profile?.plan ?? 'free'
  const planBadge = PLAN_BADGE[plan] ?? PLAN_BADGE.free

  return (
    <aside className={`
      fixed lg:static inset-y-0 left-0 z-30
      w-64 flex flex-col
      bg-[#0e1018] border-r border-white/[0.07]
      transition-transform duration-300 ease-in-out
      ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      {/* Logo */}
      <div className="flex items-center justify-between px-5 h-16 border-b border-white/[0.07]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-[15px] font-bold tracking-tight text-white">SocialAI</span>
        </div>
        <button onClick={onClose} className="lg:hidden p-1 text-white/40 hover:text-white">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'} onClick={onClose}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
              transition-all duration-150
              ${isActive
                ? 'bg-violet-600/20 text-violet-300 border border-violet-500/25'
                : 'text-white/50 hover:text-white/80 hover:bg-white/[0.05] border border-transparent'
              }
            `}>
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User + plan + sign out */}
      <div className="px-3 py-3 border-t border-white/[0.07]">
        <div className="flex items-center gap-3 px-2 py-1.5 rounded-xl">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-white">
              {(user?.email?.[0] ?? 'U').toUpperCase()}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white/80 truncate">
              {profile?.full_name || user?.email}
            </p>
            <p className={`text-[10px] font-medium flex items-center gap-1 ${planBadge.color}`}>
              {plan === 'pro' && <Crown className="w-2.5 h-2.5" />}
              {planBadge.label} plan
            </p>
          </div>
          <button onClick={handleSignOut} title="Sign out"
            className="p-1.5 rounded-lg text-white/25 hover:text-red-400 hover:bg-red-500/10 transition-all">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}