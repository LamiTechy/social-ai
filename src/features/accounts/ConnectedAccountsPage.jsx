import { useEffect, useState } from 'react'
import { useAuth }   from '../../context/AuthContext'
import { useToast }  from '../../components/ui/Toast'
import { fetchConnectedAccounts, disconnectAccount, fetchUserPosts } from '../../lib/supabase/posts'
import Spinner    from '../../components/ui/Spinner'
import { Link2, Link2Off, CheckCircle2, Clock, Loader2, TrendingUp, Twitter, Linkedin, Instagram, Facebook } from 'lucide-react'

const PLATFORMS = [
  {
    id: 'twitter', label: 'Twitter / X', icon: Twitter,
    desc: 'Post tweets and threads directly from SocialAI.',
    color: 'sky',
  },
  {
    id: 'linkedin', label: 'LinkedIn', icon: Linkedin,
    desc: 'Share professional updates to your LinkedIn profile.',
    color: 'blue',
  },
  {
    id: 'instagram', label: 'Instagram', icon: Instagram,
    desc: 'Schedule Instagram posts and captions.',
    color: 'pink',
  },
  {
    id: 'facebook', label: 'Facebook', icon: Facebook,
    desc: 'Publish to your Facebook page or profile.',
    color: 'blue',
  },
]

const COLOR_MAP = {
  sky:  { bg: 'bg-sky-500/10',  border: 'border-sky-500/25',  text: 'text-sky-400'  },
  blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/25', text: 'text-blue-400' },
  pink: { bg: 'bg-pink-500/10', border: 'border-pink-500/25', text: 'text-pink-400' },
}

function PlatformCard({ platform, account, onDisconnect, postCount }) {
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
    toast('Platform connection is not implemented yet.', 'info')
  }

  return (
    <div className={`card p-5 flex flex-col gap-4 ${connected ? `border ${c.border} ${c.bg}` : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${connected ? c.bg : 'bg-white/[0.05]'} border ${connected ? c.border : 'border-white/10'}`}>
            <platform.icon className={`w-5 h-5 ${connected ? c.text : 'text-white/60'}`} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-white/90">{platform.label}</p>
            {connected && account.platform_username && (
              <p className={`text-xs font-medium ${c.text}`}>@{account.platform_username}</p>
            )}
          </div>
        </div>
        {connected
          ? <span className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-full whitespace-nowrap">
              <CheckCircle2 className="w-3 h-3" /> Connected
            </span>
          : <span className="flex items-center gap-1.5 text-[11px] text-white/30 font-medium bg-white/[0.04] border border-white/10 px-2 py-1 rounded-full whitespace-nowrap">
              <Clock className="w-3 h-3" /> Not connected
            </span>
        }
      </div>

      <p className="text-xs text-white/40 leading-relaxed">{platform.desc}</p>

      {connected && (
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-white/[0.03] border border-white/10">
          <TrendingUp className="w-3.5 h-3.5 text-white/30" />
          <span className="text-xs text-white/60">{postCount} post{postCount !== 1 ? 's' : ''} published</span>
        </div>
      )}

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
  const [posts, setPosts]       = useState([])
  const [loading, setLoading]   = useState(true)
  const { add: toast }          = useToast()

  useEffect(() => {
    Promise.all([
      fetchConnectedAccounts(user.id),
      fetchUserPosts({ status: 'published', limit: 1000 })
    ])
      .then(([{ data: accts }, { data: postList }]) => {
        setAccounts(accts ?? [])
        setPosts(postList ?? [])
      })
      .finally(() => setLoading(false))
  }, [user.id])

  const handleDisconnect = async (accountId) => {
    const { error } = await disconnectAccount(accountId)
    if (!error) setAccounts(a => a.filter(x => x.id !== accountId))
    return { error }
  }

  const getPostCount = (platformId) => {
    return posts.filter(p => p.platforms?.includes(platformId)).length
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
              postCount={getPostCount(platform.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
