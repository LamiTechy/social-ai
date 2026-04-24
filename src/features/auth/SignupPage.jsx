import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Sparkles, Eye, EyeOff, Loader2, CheckCircle2 } from 'lucide-react'

export default function SignupPage() {
  const { signUp } = useAuth()
  const navigate   = useNavigate()
  const [form, setForm]     = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const [done, setDone]     = useState(false)
  const [showPw, setShowPw] = useState(false)

  const handle = async (e) => {
    e.preventDefault()
    if (form.password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setLoading(true); setError('')
    const { error } = await signUp(form.email, form.password, { full_name: form.name })
    setLoading(false)
    if (error) setError(error.message)
    else setDone(true)
  }

  if (done) return (
    <div className="min-h-screen bg-[#0b0d13] flex items-center justify-center p-4">
      <div className="text-center max-w-sm">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-7 h-7 text-emerald-400" />
        </div>
        <h2 className="text-lg font-bold text-white mb-2">Check your email</h2>
        <p className="text-sm text-white/40">
          We sent a confirmation link to <span className="text-white/70">{form.email}</span>. Click it to activate your account.
        </p>
        <Link to="/login" className="inline-block mt-6 text-sm text-violet-400 hover:text-violet-300">← Back to login</Link>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#0b0d13] flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-[120px]" />
      </div>

      <div className="w-full max-w-sm relative">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-violet-900/40">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">Start for free</h1>
          <p className="text-sm text-white/40 mt-1">10 free credits, no card required</p>
        </div>

        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6">
          <form onSubmit={handle} className="space-y-4">
            <div>
              <label className="label block mb-1.5">Your name</label>
              <input type="text" required value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Jane Doe" className="input" />
            </div>
            <div>
              <label className="label block mb-1.5">Email</label>
              <input type="email" required value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="you@company.com" className="input" />
            </div>
            <div>
              <label className="label block mb-1.5">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} required value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="Min 8 characters" className="input pr-10" />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full py-3">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</> : 'Create free account'}
            </button>
          </form>

          <p className="text-[11px] text-white/25 mt-4 text-center">
            By signing up you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>

        <p className="text-center text-xs text-white/35 mt-5">
          Already have an account?{' '}
          <Link to="/login" className="text-violet-400 hover:text-violet-300 font-medium">Sign in →</Link>
        </p>
      </div>
    </div>
  )
}
