export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mb-5">
          <Icon className="w-6 h-6 text-white/25" />
        </div>
      )}
      <h3 className="text-sm font-semibold text-white/60 mb-1">{title}</h3>
      {description && <p className="text-xs text-white/30 max-w-xs mb-5">{description}</p>}
      {action}
    </div>
  )
}
