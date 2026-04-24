import { useLocation } from 'react-router-dom'
import { Menu, Bell } from 'lucide-react'

const PAGE_TITLES = {
  '/':          { title: 'Dashboard',       subtitle: 'Welcome back 👋' },
  '/generate':  { title: 'AI Generator',    subtitle: 'Create platform-ready content in seconds' },
  '/library':   { title: 'Content Library', subtitle: 'Manage and schedule your saved posts' },
  '/accounts':  { title: 'Connected Accounts', subtitle: 'Link your social media profiles' },
  '/billing':   { title: 'Billing & Credits',  subtitle: 'Manage your plan and credit balance' },
}

export default function TopBar({ onMenuClick }) {
  const { pathname } = useLocation()
  const page = PAGE_TITLES[pathname] ?? { title: 'SocialAI', subtitle: '' }

  return (
    <header className="h-16 border-b border-white/[0.07] bg-[#0b0d13]/80 backdrop-blur-md flex items-center px-4 sm:px-6 gap-4 sticky top-0 z-10">
      {/* Mobile menu */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg text-white/40 hover:text-white hover:bg-white/[0.05] transition-all"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-[15px] font-semibold text-white leading-tight truncate">{page.title}</h1>
        <p className="text-xs text-white/40 hidden sm:block">{page.subtitle}</p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button className="p-2 rounded-lg text-white/30 hover:text-white/70 hover:bg-white/[0.05] transition-all relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-violet-500" />
        </button>
      </div>
    </header>
  )
}
