import { Loader2 } from 'lucide-react'

const VARIANTS = {
  primary: 'bg-violet-600 hover:bg-violet-500 active:bg-violet-700 text-white shadow-lg shadow-violet-900/30',
  ghost:   'border border-white/10 text-white/50 hover:border-white/25 hover:text-white/80 bg-transparent',
  danger:  'bg-red-600/20 hover:bg-red-600/30 border border-red-500/30 text-red-400',
  success: 'bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400',
}
const SIZES = {
  sm: 'px-3 py-1.5 text-xs rounded-lg gap-1.5',
  md: 'px-5 py-2.5 text-sm rounded-xl gap-2',
  lg: 'px-6 py-3 text-sm rounded-xl gap-2',
}

export default function Button({
  children, variant = 'primary', size = 'md',
  loading = false, disabled = false,
  icon: Icon, className = '', ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center font-semibold
        transition-all duration-200
        disabled:opacity-40 disabled:cursor-not-allowed
        ${VARIANTS[variant]} ${SIZES[size]} ${className}
      `}
      {...props}
    >
      {loading
        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
        : Icon && <Icon className="w-3.5 h-3.5" />
      }
      {children}
    </button>
  )
}
