const VARIANTS = {
  draft:     'bg-white/10 text-white/50 border-white/10',
  scheduled: 'bg-blue-500/15 text-blue-300 border-blue-500/25',
  published: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25',
  failed:    'bg-red-500/15 text-red-300 border-red-500/25',
  free:      'bg-white/10 text-white/50 border-white/10',
  starter:   'bg-violet-500/15 text-violet-300 border-violet-500/25',
  pro:       'bg-amber-500/15 text-amber-300 border-amber-500/25',
}

export default function Badge({ label, variant = 'draft' }) {
  return (
    <span className={`
      inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold
      border uppercase tracking-wider
      ${VARIANTS[variant] ?? VARIANTS.draft}
    `}>
      {label}
    </span>
  )
}
