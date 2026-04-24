import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useProfile } from '../../hooks/useProfile'
import {
  LayoutDashboard, Sparkles, BookOpen,
  Link2, CreditCard, LogOut, Zap, X
} from 'lucide-react'

const NAV = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard'  },
  { to: '/generate',  icon: Sparkles,        label: 'Generate'   },
  { to: '/library',   icon: BookOpen,        label: 'Library'    },
  { to: '/accounts',  icon: Link2,           label: 'Accounts'   },
  { to: '/billing',   icon: CreditCard,      label: 'Billing'    },
]

export default function Sidebar({ open, onClose }) {
  const { user, signOut } = useAuth()
  const { profile }       = useProfile()
  const navigate          = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <>
      {/* Sidebar panel */}
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
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={onClose}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium
                transition-all duration-150
                ${isActive
                  ? 'bg-violet-600/20 text-violet-300 border border-violet-500/25'
                  : 'text-white/50 hover:text-white/80 hover:bg-white/[0.05] border border-transparent'
                }
              `}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Credits pill */}
        <div className="px-3 py-3">
          <div
            onClick={() => { navigate('/billing'); onClose() }}
            className={`
              flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer
              border transition-all duration-150
              ${profile?.credits !== null && profile?.credits <= 3
                ? 'bg-amber-500/10 border-amber-500/25 hover:bg-amber-500/15'
                : 'bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.07]'
              }
            `}
          >
            <div className={`
              w-7 h-7 rounded-lg flex items-center justify-center shrink-0
              ${profile?.credits !== null && profile?.credits <= 3 ? 'bg-amber-500/20' : 'bg-violet-500/20'}
            `}>
              <Zap className={`w-3.5 h-3.5 ${profile?.credits !== null && profile?.credits <= 3 ? 'text-amber-400' : 'text-violet-400'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white/80">
                {profile?.credits ?? '—'} credits left
              </p>
              <p className="text-[10px] text-white/35 truncate">
                {profile?.credits !== null && profile?.credits <= 3 ? 'Running low — top up' : 'Click to manage'}
              </p>
            </div>
          </div>
        </div>

        {/* User + Sign out */}
        <div className="px-3 py-3 border-t border-white/[0.07]">
          <div className="flex items-center gap-3 px-2 py-1.5 rounded-xl group">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-white">
                {(user?.email?.[0] ?? 'U').toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-white/80 truncate">{user?.email}</p>
              <p className="text-[10px] text-white/35">Free plan</p>
            </div>
            <button
              onClick={handleSignOut}
              title="Sign out"
              className="p-1.5 rounded-lg text-white/25 hover:text-red-400 hover:bg-red-500/10 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}
