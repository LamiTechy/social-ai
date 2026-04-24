import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Sparkles, Eye, EyeOff, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const { signIn }   = useAuth()
  const navigate     = useNavigate()
  const [form, setForm]     = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const [showPw, setShowPw] = useState(false)

  const handle = async (e) => {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await signIn(form.email, form.password)
    if (error) { setError(error.message); setLoading(false) }
    else navigate('/')
  }

  return (
    <div className="min-h-screen bg-[#0b0d13] flex items-center justify-center p-4">
      {/* Background glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-[120px]" />
      </div>

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center mb-4 shadow-lg shadow-violet-900/40">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">Welcome back</h1>
          <p className="text-sm text-white/40 mt-1">Sign in to your SocialAI account</p>
        </div>

        {/* Card */}
        <div className="bg-white/[0.04] border border-white/10 rounded-2xl p-6">
          <form onSubmit={handle} className="space-y-4">
            <div>
              <label className="label block mb-1.5">Email</label>
              <input
                type="email" required
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="you@company.com"
                className="input"
              />
            </div>

            <div>
              <label className="label block mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} required
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="••••••••"
                  className="input pr-10"
                />
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
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Signing in…</> : 'Sign in'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-white/35 mt-5">
          No account?{' '}
          <Link to="/signup" className="text-violet-400 hover:text-violet-300 font-medium">
            Create one free →
          </Link>
        </p>
      </div>
    </div>
  )
}
