import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { PlusCircle, Clock, CheckCircle, AlertCircle, Loader, ChevronRight, Building2 } from 'lucide-react'

const PLAN_LIMITS = { free: 5, pro: Infinity, team: Infinity, enterprise: Infinity }

function StatusBadge({ status }) {
  const map = {
    pending:  { icon: Clock, label: 'Pending',  color: '#94a3b8', bg: 'rgba(148,163,184,0.1)' },
    running:  { icon: Loader, label: 'Running',  color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
    complete: { icon: CheckCircle, label: 'Done', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    error:    { icon: AlertCircle, label: 'Error', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
  }
  const cfg = map[status] || map.pending
  const Icon = cfg.icon
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium"
      style={{ color: cfg.color, background: cfg.bg }}>
      <Icon size={11} className={status === 'running' ? 'animate-spin' : ''} />
      {cfg.label}
    </span>
  )
}

export default function DashboardPage() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReports()
    // Poll for running reports
    const interval = setInterval(() => {
      if (reports.some(r => r.status === 'running' || r.status === 'pending')) {
        fetchReports()
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [reports.length])

  async function fetchReports() {
    const { data } = await supabase
      .from('reports')
      .select('id, dealer_url, dealer_name, status, created_at')
      .order('created_at', { ascending: false })
      .limit(50)
    setReports(data || [])
    setLoading(false)
  }

  const limit = PLAN_LIMITS[profile?.plan || 'free']
  const used = profile?.reports_this_month || 0
  const atLimit = used >= limit

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold mb-1" style={{ color: 'var(--text)' }}>
            Dashboard
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Your dealer intelligence reports
          </p>
        </div>
        <button
          onClick={() => navigate('/new')}
          disabled={atLimit}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
          style={{
            background: atLimit ? 'var(--surface-2)' : '#3b82f6',
            color: atLimit ? 'var(--text-muted)' : 'white',
            border: '1px solid transparent',
            cursor: atLimit ? 'not-allowed' : 'pointer',
          }}
        >
          <PlusCircle size={16} />
          New Report
        </button>
      </div>

      {/* Usage bar (free plan) */}
      {profile?.plan === 'free' && (
        <div className="mb-6 p-4 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
              Reports this month
            </span>
            <span className="text-xs font-mono" style={{ color: 'var(--text)' }}>
              {used} / {limit}
            </span>
          </div>
          <div className="h-1.5 rounded-full" style={{ background: 'var(--border)' }}>
            <div
              className="h-1.5 rounded-full transition-all"
              style={{
                width: `${Math.min((used / limit) * 100, 100)}%`,
                background: atLimit ? '#ef4444' : '#3b82f6',
              }}
            />
          </div>
          {atLimit && (
            <p className="text-xs mt-2" style={{ color: '#ef4444' }}>
              Monthly limit reached.{' '}
              <Link to="/settings" style={{ color: '#3b82f6' }}>Upgrade to Pro</Link> for unlimited reports.
            </p>
          )}
        </div>
      )}

      {/* Reports list */}
      {loading ? (
        <div className="flex justify-center py-16">
          <Loader size={24} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-20 rounded-2xl" style={{ border: '1px dashed var(--border)' }}>
          <Building2 size={40} className="mx-auto mb-3" style={{ color: 'var(--border)' }} />
          <h3 className="font-medium mb-1" style={{ color: 'var(--text)' }}>No reports yet</h3>
          <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>
            Run your first report to get instant dealer intelligence.
          </p>
          <button
            onClick={() => navigate('/new')}
            className="px-4 py-2 rounded-xl text-sm font-medium"
            style={{ background: '#3b82f6', color: 'white' }}
          >
            Run First Report
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {reports.map(report => (
            <Link
              key={report.id}
              to={report.status === 'complete' ? `/report/${report.id}` : '#'}
              className="flex items-center gap-4 p-4 rounded-xl transition-colors no-underline group"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                cursor: report.status === 'complete' ? 'pointer' : 'default',
              }}
            >
              {/* Icon */}
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'var(--surface-2)' }}>
                <Building2 size={18} style={{ color: '#3b82f6' }} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate" style={{ color: 'var(--text)' }}>
                  {report.dealer_name || report.dealer_url}
                </div>
                <div className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {report.dealer_name ? report.dealer_url : ''}
                  {report.created_at && (
                    <span>{report.dealer_name ? ' · ' : ''}{new Date(report.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  )}
                </div>
              </div>

              {/* Status + arrow */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <StatusBadge status={report.status} />
                {report.status === 'complete' && (
                  <ChevronRight size={16} style={{ color: 'var(--text-muted)' }}
                    className="group-hover:translate-x-0.5 transition-transform" />
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
