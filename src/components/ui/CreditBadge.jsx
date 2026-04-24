import { Zap } from 'lucide-react'

export default function CreditBadge({ credits }) {
  if (credits === null) return null
  const low   = credits <= 3
  const empty = credits === 0
  return (
    <div className={`
      flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border
      ${empty ? 'bg-red-500/15 border-red-500/40 text-red-300'
      : low   ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
               : 'bg-violet-500/15 border-violet-500/30 text-violet-300'}
    `}>
      <Zap className="w-3 h-3" />
      {credits} credit{credits !== 1 ? 's' : ''}
    </div>
  )
}
