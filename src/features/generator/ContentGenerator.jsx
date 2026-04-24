import { useState, useCallback } from 'react'
import { useAuth }     from '../../context/AuthContext'
import { useCredits }  from '../../hooks/useCredits'
import { useToast }    from '../../components/ui/Toast'
import { generateContent }    from '../../lib/ai/generateContent'
import { insertGeneratedPost } from '../../lib/supabase/posts'
import { schedulePost }        from '../../lib/supabase/posts'
import {
  Sparkles, Loader2, AlertCircle, CheckCircle2,
  Copy, Check, CalendarPlus, RotateCcw, Zap
} from 'lucide-react'

// ─── Constants ───────────────────────────────────────────────
const TONES = [
  { id: 'professional',  label: 'Professional',  emoji: '👔', desc: 'Polished & authoritative' },
  { id: 'quirky',        label: 'Quirky',         emoji: '🎲', desc: 'Fun & unexpected'        },
  { id: 'direct',        label: 'Direct',         emoji: '⚡', desc: 'Short & punchy'          },
  { id: 'inspirational', label: 'Inspirational',  emoji: '🌟', desc: 'Motivating & uplifting'  },
  { id: 'educational',   label: 'Educational',    emoji: '📚', desc: 'Informative & clear'     },
]

const PLATFORMS = [
  { id: 'twitter',   label: 'Twitter / X', charLimit: 280,  icon: '𝕏'  },
  { id: 'linkedin',  label: 'LinkedIn',    charLimit: 3000, icon: 'in' },
  { id: 'instagram', label: 'Instagram',   charLimit: 2200, icon: '📸' },
]

const PLATFORM_STYLE = {
  twitter:   { border: 'border-sky-500/30',  bg: 'bg-sky-500/10',  text: 'text-sky-300'  },
  linkedin:  { border: 'border-blue-500/30', bg: 'bg-blue-500/10', text: 'text-blue-300' },
  instagram: { border: 'border-pink-500/30', bg: 'bg-pink-500/10', text: 'text-pink-300' },
}

// ─── Generated Card ──────────────────────────────────────────
function GeneratedCard({ platform, content, postId }) {
  const { add }      = useToast()
  const [copied, setCopied]         = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [schedDate, setSchedDate]   = useState('')
  const [saving, setSaving]         = useState(false)
  const [scheduled, setScheduled]   = useState(false)

  const style      = PLATFORM_STYLE[platform.id]
  const charCount  = content.length
  const overLimit  = charCount > platform.charLimit
  const pct        = Math.min((charCount / platform.charLimit) * 100, 100)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSchedule = async () => {
    if (!schedDate || !postId) return
    setSaving(true)
    const { error } = await schedulePost(postId, new Date(schedDate).toISOString())
    setSaving(false)
    if (error) add('Failed to schedule post', 'error')
    else { setScheduled(true); setShowPicker(false); add('Post scheduled!', 'success') }
  }

  return (
    <div className={`rounded-2xl border ${style.border} ${style.bg} overflow-hidden animate-fade-up`}>
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.07]">
        <div className="flex items-center gap-2.5">
          <span className="text-base">{platform.icon}</span>
          <span className={`text-sm font-semibold ${style.text}`}>{platform.label}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs tabular-nums ${overLimit ? 'text-red-400' : 'text-white/30'}`}>
            {charCount}/{platform.charLimit}
          </span>
          {!scheduled ? (
            <button onClick={() => setShowPicker(v => !v)} title="Schedule"
              className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white/70 transition-all">
              <CalendarPlus className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span className="text-[11px] text-emerald-400 font-semibold">Scheduled ✓</span>
          )}
          <button onClick={handleCopy} title="Copy"
            className="p-1.5 rounded-lg hover:bg-white/10 text-white/30 hover:text-white/70 transition-all">
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-4">
        <p className="text-sm text-white/80 leading-relaxed whitespace-pre-wrap">{content}</p>
        <div className="mt-4 h-0.5 bg-white/10 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-500 ${overLimit ? 'bg-red-500' : pct > 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
            style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Inline scheduler */}
      {showPicker && (
        <div className="px-5 pb-4 flex items-center gap-2">
          <input type="datetime-local" value={schedDate}
            onChange={e => setSchedDate(e.target.value)}
            min={new Date().toISOString().slice(0, 16)}
            className="flex-1 input text-xs py-2" />
          <button onClick={handleSchedule} disabled={!schedDate || saving}
            className="btn-primary text-xs py-2 px-3">
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Save'}
          </button>
          <button onClick={() => setShowPicker(false)} className="text-xs text-white/35 hover:text-white/60 px-1">✕</button>
        </div>
      )}
    </div>
  )
}

// ─── Main Page ───────────────────────────────────────────────
export default function ContentGenerator() {
  const { user }                   = useAuth()
  const { credits, refresh }       = useCredits()
  const { add: toast }             = useToast()

  const [form, setForm]   = useState({ topic: '', tone: 'professional', platforms: ['twitter'] })
  const [status, setStatus]       = useState('idle')
  const [errorMsg, setErrorMsg]   = useState('')
  const [result, setResult]       = useState(null)
  const [savedPostId, setSavedPostId] = useState(null)

  const togglePlatform = useCallback((id) => {
    setForm(f => {
      const has = f.platforms.includes(id)
      if (has && f.platforms.length === 1) return f
      return { ...f, platforms: has ? f.platforms.filter(p => p !== id) : [...f.platforms, id] }
    })
  }, [])

  const handleGenerate = async () => {
    if (!form.topic.trim()) return
    if (credits !== null && credits < 1) {
      setStatus('error'); setErrorMsg('No credits remaining. Please top up to continue.')
      return
    }
    setStatus('loading'); setErrorMsg(''); setResult(null); setSavedPostId(null)

    try {
      const generated = await generateContent({ topic: form.topic, tone: form.tone, platforms: form.platforms })
      setResult(generated)

      const { data: post, error } = await insertGeneratedPost({
        userId: user.id, topic: form.topic, tone: form.tone,
        platforms: form.platforms, content: generated.content, imagePrompt: generated.imagePrompt,
      })
      if (error) throw error
      setSavedPostId(post.id)
      await refresh()
      setStatus('success')
      toast(`${form.platforms.length} post${form.platforms.length > 1 ? 's' : ''} generated!`, 'success')
    } catch (err) {
      setStatus('error')
      setErrorMsg(err.message || 'Something went wrong. Please try again.')
      toast('Generation failed', 'error')
    }
  }

  const handleReset = () => {
    setForm({ topic: '', tone: 'professional', platforms: ['twitter'] })
    setResult(null); setSavedPostId(null); setStatus('idle'); setErrorMsg('')
  }

  const isLoading   = status === 'loading'
  const canGenerate = form.topic.trim().length > 0 && !isLoading

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">

      {/* Form card */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-violet-400" />
            </div>
            <span className="text-sm font-semibold text-white/80">New Generation</span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-xs text-violet-400">
            <Zap className="w-3 h-3" /> {credits ?? '—'} credits
          </div>
        </div>

        <div className="p-5 space-y-6">
          {/* Topic */}
          <div>
            <label className="label block mb-2">Topic / Prompt</label>
            <div className="relative">
              <textarea value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
                maxLength={300} rows={3} disabled={isLoading}
                placeholder="e.g. Our new summer menu launches Friday — focus on the mango habanero salsa…"
                className="input resize-none pr-12 leading-relaxed" />
              <span className={`absolute bottom-3 right-3 text-[11px] tabular-nums ${form.topic.length > 250 ? 'text-amber-400' : 'text-white/25'}`}>
                {form.topic.length}/300
              </span>
            </div>
          </div>

          {/* Tone */}
          <div>
            <label className="label block mb-2">Tone</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
              {TONES.map(t => (
                <button key={t.id} onClick={() => setForm(f => ({ ...f, tone: t.id }))}
                  disabled={isLoading}
                  className={`
                    relative flex flex-col items-start gap-1 px-3 py-3 rounded-xl border text-left
                    transition-all duration-150 focus:outline-none
                    disabled:opacity-50
                    ${form.tone === t.id
                      ? 'bg-violet-600/20 border-violet-500/60 text-white'
                      : 'bg-white/[0.03] border-white/10 text-white/50 hover:border-white/20 hover:text-white/75'
                    }
                  `}>
                  <span className="text-lg leading-none">{t.emoji}</span>
                  <span className="text-xs font-semibold">{t.label}</span>
                  <span className="text-[10px] text-white/35 leading-tight hidden sm:block">{t.desc}</span>
                  {form.tone === t.id && <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-violet-400" />}
                </button>
              ))}
            </div>
          </div>

          {/* Platforms */}
          <div>
            <label className="label block mb-2">Platforms</label>
            <div className="flex flex-wrap gap-2">
              {PLATFORMS.map(p => {
                const active = form.platforms.includes(p.id)
                const st = PLATFORM_STYLE[p.id]
                return (
                  <button key={p.id} onClick={() => togglePlatform(p.id)} disabled={isLoading}
                    className={`
                      flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium
                      transition-all duration-150 disabled:opacity-50
                      ${active ? `${st.bg} ${st.border} ${st.text}` : 'bg-white/[0.03] border-white/10 text-white/50 hover:border-white/20 hover:text-white/75'}
                    `}>
                    <span className="text-base">{p.icon}</span>
                    {p.label}
                    {active && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Error */}
          {status === 'error' && (
            <div className="flex items-start gap-3 rounded-xl bg-red-500/10 border border-red-500/20 px-4 py-3">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{errorMsg}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button onClick={handleGenerate} disabled={!canGenerate} className="btn-primary flex-1 sm:flex-none py-3">
              {isLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</> : <><Sparkles className="w-4 h-4" /> Generate Posts</>}
            </button>
            {result && (
              <button onClick={handleReset} className="btn-ghost py-3">
                <RotateCcw className="w-3.5 h-3.5" /> Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Loading skeletons */}
      {isLoading && (
        <div className="space-y-4">
          {form.platforms.map(p => (
            <div key={p} className="card p-5 animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-white/10" />
                <div className="h-4 w-24 bg-white/10 rounded" />
              </div>
              <div className="space-y-2">
                {[100, 85, 65].map((w, i) => <div key={i} className="h-3 bg-white/10 rounded" style={{ width: `${w}%` }} />)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {status === 'success' && result && (
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-4 py-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <p className="text-sm text-emerald-300">
              {form.platforms.length} post{form.platforms.length > 1 ? 's' : ''} generated and saved to your library.
            </p>
          </div>

          {form.platforms.map(platformId => (
            <GeneratedCard
              key={platformId}
              platform={PLATFORMS.find(p => p.id === platformId)}
              content={result.content[platformId] ?? ''}
              postId={savedPostId}
            />
          ))}

          {result.imagePrompt && (
            <div className="rounded-2xl border border-amber-500/25 bg-amber-500/[0.06] p-5 animate-fade-up">
              <p className="label mb-2">🎨 Suggested Image Prompt</p>
              <p className="text-sm text-white/65 leading-relaxed">{result.imagePrompt}</p>
              <button onClick={() => navigator.clipboard?.writeText(result.imagePrompt)}
                className="mt-3 text-xs text-amber-400/60 hover:text-amber-400 transition-colors">
                Copy prompt →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
