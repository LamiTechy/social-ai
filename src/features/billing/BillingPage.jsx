import { useState, useEffect } from 'react'
import { useProfile }         from '../../hooks/useProfile'
import { useCredits }         from '../../hooks/useCredits'
import { useAuth }            from '../../context/AuthContext'
import { useToast }           from '../../components/ui/Toast'
import { fetchCreditHistory }  from '../../lib/supabase/posts'
import { supabase }            from '../../lib/supabase/client'
import Spinner  from '../../components/ui/Spinner'
import { Zap, CheckCircle2, CreditCard, ArrowUpRight } from 'lucide-react'
import { format } from 'date-fns'

const PLANS = [
  {
    id: 'free', label: 'Free', price: 0, currency: '₦',
    credits: 10, period: 'one-time',
    features: ['10 AI generations', '3 platforms', 'Content library', 'Basic scheduling'],
    cta: 'Current plan',
  },
  {
    id: 'starter', label: 'Starter', price: 5000, currency: '₦',
    credits: 100, period: 'month',
    features: ['100 credits/month', 'All platforms', 'Priority generation', 'Advanced scheduling', 'Email support'],
    cta: 'Upgrade to Starter',
    highlight: false,
  },
  {
    id: 'pro', label: 'Pro', price: 15000, currency: '₦',
    credits: 400, period: 'month',
    features: ['400 credits/month', 'All platforms', 'Image generation', 'Analytics dashboard', 'Priority support', 'Team seats (2)'],
    cta: 'Upgrade to Pro',
    highlight: true,
  },
]

const TOPUP_PACKS = [
  { credits: 20,  price: 1000, label: 'Starter Pack' },
  { credits: 50,  price: 2000, label: 'Growth Pack', popular: true },
  { credits: 120, price: 4000, label: 'Power Pack' },
]

// ─── Add credits via secure RPC (bypasses RLS safely) ─────────
async function addCreditsViaRPC(userId, creditsToAdd, description) {
  const { data: newBalance, error } = await supabase.rpc('add_credits', {
    p_user_id:     userId,
    p_amount:      creditsToAdd,
    p_description: description,
  })
  if (error) throw error
  return newBalance
}

// ─── Paystack helper ──────────────────────────────────────────
function initPaystack({ email, amount, metadata, onSuccess, onClose }) {
  const key = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY
  if (!key) { alert('VITE_PAYSTACK_PUBLIC_KEY not set in .env.local'); return }
  if (typeof window.PaystackPop === 'undefined') { alert('Paystack script not loaded.'); return }

  const handler = window.PaystackPop.setup({
    key,
    email,
    amount: amount * 100,
    currency: 'NGN',
    metadata,
    callback: function(response) { onSuccess(response) },
    onClose:  function() { onClose() },
  })
  handler.openIframe()
}

// ─── Plan Card ────────────────────────────────────────────────
function PlanCard({ plan, currentPlan, userId, userEmail, onUpgraded }) {
  const [loading, setLoading] = useState(false)
  const { add: toast }        = useToast()
  const isCurrent   = plan.id === currentPlan
  const isHighlight = plan.highlight

  const handleUpgrade = () => {
    if (isCurrent || plan.id === 'free') return
    setLoading(true)
    initPaystack({
      email: userEmail,
      amount: plan.price,
      metadata: { plan: plan.id, credits: plan.credits },
      onSuccess: async () => {
        try {
          await addCreditsViaRPC(userId, plan.credits, `Plan upgrade to ${plan.label}`)
          await supabase.from('profiles').update({ plan: plan.id, subscription_status: 'active' }).eq('id', userId)
          toast(`🎉 Upgraded to ${plan.label}! ${plan.credits} credits added.`, 'success')
          onUpgraded?.()
        } catch (err) {
          console.error(err)
          toast('Payment received but credits failed: ' + err.message, 'error')
        }
        setLoading(false)
      },
      onClose: () => setLoading(false),
    })
  }

  return (
    <div className={`relative flex flex-col rounded-2xl border p-6 gap-5
      ${isHighlight ? 'bg-violet-600/10 border-violet-500/40' : 'card'}`}>
      {isHighlight && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-violet-600 text-[11px] font-bold text-white">
          Most Popular
        </span>
      )}
      <div>
        <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1">{plan.label}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-white">
            {plan.price === 0 ? 'Free' : `${plan.currency}${plan.price.toLocaleString()}`}
          </span>
          {plan.price > 0 && <span className="text-sm text-white/40">/ {plan.period}</span>}
        </div>
        <p className="text-xs text-white/40 mt-1">
          <Zap className="w-3 h-3 inline mr-1 text-violet-400" />
          {plan.credits} credits {plan.period === 'month' ? 'per month' : 'included'}
        </p>
      </div>
      <ul className="space-y-2 flex-1">
        {plan.features.map(f => (
          <li key={f} className="flex items-center gap-2 text-xs text-white/60">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />{f}
          </li>
        ))}
      </ul>
      <button onClick={handleUpgrade} disabled={isCurrent || loading}
        className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed
          ${isCurrent
            ? 'bg-white/[0.06] text-white/30 border border-white/10'
            : isHighlight
              ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/30'
              : 'btn-ghost justify-center'
          }`}>
        {loading ? 'Processing…' : isCurrent ? '✓ Current plan' : plan.cta}
      </button>
    </div>
  )
}

// ─── Top-up Section ───────────────────────────────────────────
function TopUpSection({ userId, userEmail, onPurchased }) {
  const [loading, setLoading] = useState(null)
  const { add: toast }        = useToast()

  const handleBuy = (pack) => {
    setLoading(pack.credits)
    initPaystack({
      email: userEmail,
      amount: pack.price,
      metadata: { type: 'topup', credits: pack.credits },
      onSuccess: async () => {
        try {
          const newBalance = await addCreditsViaRPC(userId, pack.credits, `Credit top-up (${pack.credits} credits)`)
          toast(`✅ ${pack.credits} credits added! New balance: ${newBalance}`, 'success')
          onPurchased?.()
        } catch (err) {
          console.error(err)
          toast('Payment received but credits failed: ' + err.message, 'error')
        }
        setLoading(null)
      },
      onClose: () => setLoading(null),
    })
  }

  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center">
          <Zap className="w-4 h-4 text-amber-400" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white/80">Buy Credits</p>
          <p className="text-xs text-white/35">One-time top-up, no subscription needed</p>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {TOPUP_PACKS.map(pack => (
          <button key={pack.credits} onClick={() => handleBuy(pack)}
            disabled={loading === pack.credits}
            className={`relative flex flex-col items-center gap-1.5 p-4 rounded-xl border transition-all duration-200
              ${pack.popular
                ? 'bg-amber-500/10 border-amber-500/30 hover:border-amber-500/50'
                : 'bg-white/[0.03] border-white/10 hover:border-white/25'}`}>
            {pack.popular && (
              <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 text-[10px] font-bold text-amber-400 bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded-full">
                Best value
              </span>
            )}
            <span className="text-xl font-bold text-white">{pack.credits}</span>
            <span className="text-[11px] text-white/40">credits</span>
            <span className="text-xs font-semibold text-white/70 mt-1">
              {loading === pack.credits ? 'Processing…' : `₦${pack.price.toLocaleString()}`}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Credit History ───────────────────────────────────────────
function CreditHistory() {
  const [txns, setTxns]       = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchCreditHistory(15)
      .then(({ data }) => setTxns(data))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner className="py-8 mx-auto" />
  if (txns.length === 0) return <p className="text-xs text-white/30 text-center py-8">No transactions yet.</p>

  return (
    <div className="space-y-1">
      {txns.map(tx => (
        <div key={tx.id} className="flex items-center gap-3 px-2 py-3 rounded-xl hover:bg-white/[0.03]">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0
            ${tx.amount > 0 ? 'bg-emerald-500/15' : 'bg-violet-500/15'}`}>
            {tx.amount > 0
              ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
              : <Zap className="w-3.5 h-3.5 text-violet-400" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-white/70 truncate">{tx.description ?? tx.event_type}</p>
            <p className="text-[11px] text-white/30">{format(new Date(tx.created_at), 'MMM d, yyyy · h:mm a')}</p>
          </div>
          <div className="text-right shrink-0">
            <p className={`text-sm font-bold ${tx.amount > 0 ? 'text-emerald-400' : 'text-white/60'}`}>
              {tx.amount > 0 ? '+' : ''}{tx.amount}
            </p>
            <p className="text-[11px] text-white/25">{tx.balance_after} left</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────
export default function BillingPage() {
  const { user }             = useAuth()
  const { profile, loading, refresh: refreshProfile } = useProfile()
  const { credits, refresh } = useCredits()
  const [historyKey, setHistoryKey] = useState(0)

  const handlePurchased = () => {
    refresh()
    refreshProfile()
    setHistoryKey(k => k + 1)
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Spinner /></div>

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-end justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Billing & Credits</h2>
          <p className="text-sm text-white/40 mt-1">Manage your plan and credit balance</p>
        </div>
        <div className="flex items-center gap-3 card px-5 py-3 self-start sm:self-auto">
          <Zap className="w-4 h-4 text-violet-400" />
          <div>
            <p className="text-lg font-bold text-white leading-none">{credits ?? '—'}</p>
            <p className="text-[11px] text-white/35">credits remaining</p>
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Plans</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {PLANS.map(plan => (
            <PlanCard key={plan.id} plan={plan}
              currentPlan={profile?.plan ?? 'free'}
              userId={user?.id} userEmail={user?.email ?? ''}
              onUpgraded={handlePurchased} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">One-Time Top-Up</h3>
        <TopUpSection userId={user?.id} userEmail={user?.email ?? ''} onPurchased={handlePurchased} />
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wider">Credit History</h3>
        <div className="card p-5">
          <CreditHistory key={historyKey} />
        </div>
      </section>

      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] p-5">
        <div className="flex items-start gap-3">
          <CreditCard className="w-4 h-4 text-white/30 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-semibold text-white/50 mb-1">Payment powered by Paystack</p>
            <p className="text-xs text-white/30 leading-relaxed">
              Test card: <span className="text-violet-400 font-mono">4084 0840 8408 4081</span> · Any future expiry · CVV: 408
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}