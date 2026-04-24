import { useEffect, useState } from 'react'
import { useAuth }   from '../../context/AuthContext'
import { useToast }  from '../../components/ui/Toast'
import { fetchConnectedAccounts, disconnectAccount } from '../../lib/supabase/posts'
import Spinner    from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import { Link2, Link2Off, CheckCircle2, Clock, Loader2 } from 'lucide-react'

const PLATFORMS = [
  {
    id: 'twitter', label: 'Twitter / X', icon: '𝕏',
    desc: 'Post tweets and threads directly from SocialAI.',
    color: 'sky',
  },
  {
    id: 'linkedin', label: 'LinkedIn', icon: 'in',
    desc: 'Share professional updates to your LinkedIn profile.',
    color: 'blue',
  },
  {
    id: 'instagram', label: 'Instagram', icon: '📸',
    desc: 'Schedule Instagram posts and captions.',
    color: 'pink',
  },
  {
    id: 'facebook', label: 'Facebook', icon: '📘',
    desc: 'Publish to your Facebook page or profile.',
    color: 'blue',
  },
]

const COLOR_MAP = {
  sky:  { bg: 'bg-sky-500/10',  border: 'border-sky-500/25',  text: 'text-sky-400'  },
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/25', text: 'text-blue-400' },
  pink: { bg: 'bg-pink-500/10', border: 'border-pink-500/25', text: 'text-pink-400' },
}

function PlatformCard({ platform, account, onDisconnect }) {
  const [disconnecting, setDisconnecting] = useState(false)
  const { add: toast } = useToast()
  const c = COLOR_MAP[platform.color] ?? COLOR_MAP.blue
  const connected = !!account

  const handleDisconnect = async () => {
    setDisconnecting(true)
    const { error } = await onDisconnect(account.id)
    setDisconnecting(false)
    if (error) toast('Failed to disconnect', 'error')
    else toast(`${platform.label} disconnected`, 'info')
  }

  // In production this would redirect to OAuth flow
  const handleConnect = () => {
    toast('OAuth flow coming soon — wire up your platform credentials in .env', 'info')
  }

  return (
    <div className={`card p-5 flex flex-col gap-4 ${connected ? `border ${c.border} ${c.bg}` : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl ${connected ? c.bg : 'bg-white/[0.05]'} border ${connected ? c.border : 'border-white/10'}`}>
            {platform.icon}
          </div>
          <div>
            <p className="text-sm font-semibold text-white/90">{platform.label}</p>
            {connected && account.platform_username && (
              <p className={`text-xs font-medium ${c.text}`}>@{account.platform_username}</p>
            )}
          </div>
        </div>
        {connected
          ? <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full">
              <CheckCircle2 className="w-3 h-3" /> Connected
            </span>
          : <span className="flex items-center gap-1.5 text-[11px] text-white/30 font-medium bg-white/[0.04] border border-white/10 px-2 py-1 rounded-full">
              <Clock className="w-3 h-3" /> Not connected
            </span>
        }
      </div>

      <p className="text-xs text-white/40 leading-relaxed">{platform.desc}</p>

      {connected ? (
        <button onClick={handleDisconnect} disabled={disconnecting} className="btn-ghost text-xs self-start">
          {disconnecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Link2Off className="w-3 h-3" />}
          Disconnect
        </button>
      ) : (
        <button onClick={handleConnect} className="btn-primary text-xs self-start">
          <Link2 className="w-3 h-3" /> Connect {platform.label}
        </button>
      )}
    </div>
  )
}

export default function ConnectedAccountsPage() {
  const { user }                = useAuth()
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading]   = useState(true)
  const { add: toast }          = useToast()

  useEffect(() => {
    fetchConnectedAccounts(user.id)
      .then(({ data }) => setAccounts(data ?? []))
      .finally(() => setLoading(false))
  }, [user.id])

  const handleDisconnect = async (accountId) => {
    const { error } = await disconnectAccount(accountId)
    if (!error) setAccounts(a => a.filter(x => x.id !== accountId))
    return { error }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Connected Accounts</h2>
        <p className="text-sm text-white/40 mt-1">Link your social profiles to publish directly from SocialAI.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20"><Spinner size="lg" /></div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {PLATFORMS.map(platform => (
            <PlatformCard
              key={platform.id}
              platform={platform}
              account={accounts.find(a => a.platform === platform.id) ?? null}
              onDisconnect={handleDisconnect}
            />
          ))}
        </div>
      )}

      <div className="card p-5 bg-blue-500/[0.04] border-blue-500/20">
        <p className="text-xs font-semibold text-blue-300 mb-1">OAuth Setup Required</p>
        <p className="text-xs text-white/40 leading-relaxed">
          To enable real OAuth connections, create apps on each platform's developer portal and add your client IDs/secrets to your Supabase Edge Function environment variables. See the <code className="text-violet-400">SETUP.md</code> for a step-by-step guide.
        </p>
      </div>
    </div>
  )
}
