import { Loader2 } from 'lucide-react'

export default function Spinner({ size = 'md', className = '' }) {
  const s = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-8 h-8' }[size]
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 className={`${s} text-violet-400 animate-spin`} />
    </div>
  )
}
