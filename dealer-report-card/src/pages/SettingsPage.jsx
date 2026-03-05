import { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { User, CreditCard, Bell, CheckCircle } from 'lucide-react'

const PLAN_LABELS = { free: 'Free', pro: 'Pro', team: 'Team', enterprise: 'Enterprise' }
const PLAN_COLORS = {
  free: { color: 'var(--text-muted)', bg: 'var(--surface-2)' },
  pro: { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  team: { color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  enterprise: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
}

export default function SettingsPage() {
  const { user, profile, fetchProfile } = useAuth()
  const [name, setName] = useState(profile?.name || '')
  const [company, setCompany] = useState(profile?.company || '')
  const [role, setRole] = useState(profile?.role || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const plan = profile?.plan || 'free'
  const planStyle = PLAN_COLORS[plan] || PLAN_COLORS.free

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    await supabase
      .from('profiles')
      .update({ name, company, role })
      .eq('id', user.id)
    await fetchProfile(user.id)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="animate-fade-in max-w-xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold mb-1" style={{ color: 'var(--text)' }}>Settings</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Manage your account and subscription</p>
      </div>

      {/* Plan card */}
      <div className="rounded-2xl p-5 mb-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2 mb-3">
          <CreditCard size={16} style={{ color: 'var(--text-muted)' }} />
          <h2 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>Subscription</h2>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sm font-medium px-2.5 py-1 rounded-lg" style={{ color: planStyle.color, background: planStyle.bg }}>
              {PLAN_LABELS[plan]} Plan
            </span>
            {plan === 'free' && (
              <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                {profile?.reports_this_month || 0} / 5 reports used this month
              </p>
            )}
          </div>
          {plan === 'free' && (
            <button
              className="px-4 py-2 rounded-xl text-sm font-medium"
              style={{ background: '#3b82f6', color: 'white', border: 'none', cursor: 'pointer' }}
              onClick={() => alert('Stripe integration coming in Phase 2!')}
            >
              Upgrade to Pro →
            </button>
          )}
        </div>

        {plan === 'free' && (
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--border)' }}>
            <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>PRO PLAN INCLUDES</p>
            <div className="space-y-1.5">
              {['Unlimited reports per month', 'PDF export & shareable links', 'JS-rendered inventory (Playwright)', 'Full report history', 'Priority scraping speed'].map(feat => (
                <div key={feat} className="flex items-center gap-2 text-sm" style={{ color: 'var(--text)' }}>
                  <CheckCircle size={13} style={{ color: '#10b981' }} />
                  {feat}
                </div>
              ))}
            </div>
            <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>$149/month · Cancel anytime</p>
          </div>
        )}
      </div>

      {/* Profile form */}
      <div className="rounded-2xl p-5" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="flex items-center gap-2 mb-4">
          <User size={16} style={{ color: 'var(--text-muted)' }} />
          <h2 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>Profile</h2>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>Email</label>
            <input
              type="text"
              value={user?.email || ''}
              disabled
              className="w-full px-3 py-2.5 rounded-xl text-sm"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
            />
          </div>
          <div>
            <label className="block text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>Full Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Robert Israel"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'DM Sans, sans-serif' }}
            />
          </div>
          <div>
            <label className="block text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>Company</label>
            <input
              type="text"
              value={company}
              onChange={e => setCompany(e.target.value)}
              placeholder="Dealer Alchemist"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'DM Sans, sans-serif' }}
            />
          </div>
          <div>
            <label className="block text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>Role</label>
            <input
              type="text"
              value={role}
              onChange={e => setRole(e.target.value)}
              placeholder="Regional Sales Director"
              className="w-full px-3 py-2.5 rounded-xl text-sm outline-none"
              style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', color: 'var(--text)', fontFamily: 'DM Sans, sans-serif' }}
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all"
            style={{ background: saved ? 'rgba(16,185,129,0.15)' : '#3b82f6', color: saved ? '#10b981' : 'white', border: 'none', cursor: 'pointer' }}
          >
            {saved ? <><CheckCircle size={14} /> Saved!</> : saving ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  )
}
