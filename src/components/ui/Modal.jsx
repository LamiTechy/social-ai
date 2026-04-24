// ─── Modal ───────────────────────────────────────────────────
// src/components/ui/Modal.jsx
import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Modal({ open, onClose, title, children, width = 'max-w-lg' }) {
  useEffect(() => {
    if (!open) return
    const handler = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`
        relative w-full ${width} rounded-2xl
        bg-[#141620] border border-white/10
        shadow-2xl animate-fade-up
      `}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.07]">
            <h2 className="text-sm font-semibold text-white">{title}</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg text-white/30 hover:text-white hover:bg-white/[0.07] transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
