import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowLeft, Share2, Download, RefreshCw, Loader, AlertCircle,
         TrendingUp, Settings, Search, Target, Car, DollarSign } from 'lucide-react'

// ---- Sub-components ----

function StatCard({ value, label }) {
  return (
    <div className="p-4 rounded-xl text-center" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
      <div className="text-2xl font-bold font-mono mb-1" style={{ color: '#3b82f6' }}>{value}</div>
      <div className="text-xs uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>{label}</div>
    </div>
  )
}

function SectionCard({ icon: Icon, title, children }) {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
      <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: '1px solid var(--border)' }}>
        <Icon size={18} style={{ color: '#3b82f6' }} />
        <h2 className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function TechBadge({ name, detected }) {
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium mr-1.5 mb-1.5"
      style={detected
        ? { background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)' }
        : { background: 'rgba(148,163,184,0.08)', color: 'var(--text-muted)', border: '1px solid var(--border)', fontStyle: 'italic' }
      }>
      {detected ? '✓ ' : ''}{name}
    </span>
  )
}

function SeoCheck({ name, status, detail }) {
  const cfg = {
    true:      { icon: '✓', color: '#10b981', bg: 'rgba(16,185,129,0.06)' },
    partial:   { icon: '⚠', color: '#fbbf24', bg: 'rgba(251,191,36,0.06)' },
    false:     { icon: '✗', color: '#ef4444', bg: 'rgba(239,68,68,0.06)' },
  }[String(status)] || { icon: '?', color: 'var(--text-muted)', bg: 'transparent' }

  return (
    <div className="flex items-start gap-3 px-3 py-2.5 rounded-lg mb-1.5 text-sm" style={{ background: cfg.bg }}>
      <span className="font-bold flex-shrink-0 w-4 text-center" style={{ color: cfg.color }}>{cfg.icon}</span>
      <span className="font-medium w-36 flex-shrink-0" style={{ color: 'var(--text)' }}>{name}</span>
      <span style={{ color: 'var(--text-muted)' }}>{detail}</span>
    </div>
  )
}

function OppCard({ category, priority, detail, pitch_angle }) {
  const priorityStyle = {
    HIGH:   { color: '#ef4444', bg: '#ef4444' },
    MEDIUM: { color: '#f97316', bg: '#f97316' },
    LOW:    { color: '#3b82f6', bg: '#3b82f6' },
  }[priority] || { color: '#94a3b8', bg: '#94a3b8' }

  return (
    <div className="rounded-xl p-4 mb-3" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderLeft: `3px solid ${priorityStyle.bg}` }}>
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>{category}</span>
        <span className="text-xs font-bold px-2 py-0.5 rounded text-white" style={{ background: priorityStyle.bg }}>
          {priority}
        </span>
      </div>
      <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>{detail}</p>
      <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.15)' }}>
        <span className="font-semibold" style={{ color: '#3b82f6' }}>Pitch: </span>
        <span style={{ color: 'var(--text-muted)' }}>{pitch_angle}</span>
      </div>
    </div>
  )
}

function BarChart({ data, maxVal }) {
  const max = maxVal || Math.max(...data.map(d => d.count), 1)
  return (
    <div className="space-y-2">
      {data.map(({ label, count }) => (
        <div key={label} className="flex items-center gap-3 text-sm">
          <span className="w-28 text-right flex-shrink-0 truncate" style={{ color: 'var(--text-muted)' }}>{label}</span>
          <div className="flex-1 h-5 rounded" style={{ background: 'var(--surface-2)' }}>
            <div className="h-5 rounded transition-all" style={{ width: `${(count / max) * 100}%`, background: '#3b82f6', minWidth: count > 0 ? '4px' : '0' }} />
          </div>
          <span className="w-8 text-right font-mono text-xs flex-shrink-0" style={{ color: 'var(--text)' }}>{count}</span>
        </div>
      ))}
    </div>
  )
}

const gradeColor = { 'A': '#10b981', 'B+': '#34d399', 'B': '#6ee7b7', 'C+': '#fbbf24', 'C': '#f59e0b', 'D': '#f97316', 'F': '#ef4444' }

// ---- Main Page ----

export default function ReportPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sharing, setSharing] = useState(false)
  const [shareUrl, setShareUrl] = useState('')

  useEffect(() => {
    fetchReport()
  }, [id])

  async function fetchReport() {
    const { data } = await supabase
      .from('reports')
      .select('*')
      .eq('id', id)
      .single()
    setReport(data)
    setLoading(false)

    // Poll if still running
    if (data?.status === 'running' || data?.status === 'pending') {
      setTimeout(fetchReport, 3000)
    }
  }

  async function handleShare() {
    setSharing(true)
    const { data } = await supabase
      .from('report_shares')
      .insert({ report_id: id })
      .select()
      .single()
    if (data) {
      const url = `${window.location.origin}/share/${data.share_token}`
      setShareUrl(url)
      await navigator.clipboard.writeText(url).catch(() => {})
    }
    setSharing(false)
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader size={24} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
      </div>
    )
  }

  if (!report) {
    return (
      <div className="text-center py-20">
        <AlertCircle size={32} className="mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
        <p style={{ color: 'var(--text-muted)' }}>Report not found.</p>
      </div>
    )
  }

  if (report.status === 'running' || report.status === 'pending') {
    const stageLabels = {
      fetching_homepage: 'Fetching homepage...',
      crawling_subpages: 'Scanning service, trade-in & finance pages...',
      analyzing: 'Analyzing tech stack & opportunities...',
    }
    const stageMsg = stageLabels[report.progress_stage] || 'Starting analysis...'
    return (
      <div className="text-center py-20">
        <Loader size={32} className="mx-auto mb-3 animate-spin" style={{ color: '#3b82f6' }} />
        <p className="font-medium mb-1" style={{ color: 'var(--text)' }}>{stageMsg}</p>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>We crawl multiple pages for thorough results — typically 30–60 seconds.</p>
      </div>
    )
  }

  if (report.status === 'error') {
    return (
      <div className="text-center py-20">
        <AlertCircle size={32} className="mx-auto mb-3" style={{ color: '#ef4444' }} />
        <p className="font-medium mb-1" style={{ color: 'var(--text)' }}>Report failed</p>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{report.error_message || 'Unknown error.'}</p>
      </div>
    )
  }

  const d = report.data || {}
  const dealer = d.dealer_info || {}
  const inventory = d.inventory || {}
  const tech = d.tech_stack || {}
  const seo = d.seo || {}
  const opps = d.opportunities || []

  const topMakes = Object.entries(inventory.makes || {}).sort((a,b) => b[1]-a[1]).slice(0,8).map(([label,count]) => ({ label, count }))
  const topModels = Object.entries(inventory.models || {}).sort((a,b) => b[1]-a[1]).slice(0,8).map(([label,count]) => ({ label, count }))

  const techSections = [
    { label: 'Website Platform', items: tech.website_platform || [] },
    { label: 'DMS / CRM', items: tech.dms_crm || [] },
    { label: 'Chat & Messaging', items: tech.chat_messaging || [] },
    { label: 'Digital Retailing', items: tech.digital_retailing || [] },
    { label: 'Marketing & Retargeting', items: tech.marketing_retargeting || [] },
    { label: 'Trade-In Tools', items: tech.trade_in_tools || [] },
    { label: 'Service Scheduling', items: tech.scheduling || [] },
  ]

  return (
    <div className="animate-fade-in pb-8">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6 gap-3">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-sm transition-colors"
          style={{ color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex items-center gap-2">
          {shareUrl ? (
            <span className="text-xs px-3 py-2 rounded-xl" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
              Link copied!
            </span>
          ) : (
            <button
              onClick={handleShare}
              disabled={sharing}
              className="flex items-center gap-2 text-sm px-3 py-2 rounded-xl transition-colors"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', cursor: 'pointer' }}
            >
              <Share2 size={14} /> Share
            </button>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="rounded-2xl p-6 mb-5 relative overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)' }} />
        <div className="inline-block text-xs font-mono px-2 py-1 rounded-full mb-3" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}>
          Dealer Intelligence Report
        </div>
        <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text)' }}>
          {dealer.dealer_name || report.dealer_name || 'Report'}
        </h1>
        <p className="text-sm font-mono mb-1" style={{ color: 'var(--text-muted)' }}>{dealer.url || report.dealer_url}</p>
        {dealer.address && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{dealer.address}</p>}
        {dealer.phone && <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{dealer.phone}</p>}
        {dealer.brands?.length > 0 && (
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Brands: {dealer.brands.join(', ')}</p>
        )}
        <p className="text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
          Generated {new Date(report.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>

      {/* Inventory stats */}
      <SectionCard icon={Car} title="Inventory Overview">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          <StatCard value={inventory.total_count || 0} label="Total" />
          <StatCard value={inventory.new_count || 0} label="New" />
          <StatCard value={inventory.used_count || 0} label="Used" />
          <StatCard value={inventory.avg_new_price ? `$${Math.round(inventory.avg_new_price/1000)}K` : 'N/A'} label="Avg New" />
        </div>
        {topMakes.length > 0 && (
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Top Makes</h3>
              <BarChart data={topMakes} />
            </div>
            <div>
              <h3 className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>Top Models</h3>
              <BarChart data={topModels} />
            </div>
          </div>
        )}
        {topMakes.length === 0 && (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            No vehicle data extracted — site may use JavaScript rendering. (Phase 2: Playwright will solve this.)
          </p>
        )}
      </SectionCard>

      <div className="mt-4" />

      {/* Tech stack */}
      <SectionCard icon={Settings} title="Technology Stack">
        <div className="space-y-4">
          {techSections.map(({ label, items }) => (
            <div key={label} className="flex flex-col sm:flex-row sm:items-start gap-2">
              <span className="text-xs w-40 flex-shrink-0 pt-1" style={{ color: 'var(--text-muted)' }}>{label}</span>
              <div className="flex flex-wrap">
                {items.length > 0
                  ? items.map(t => <TechBadge key={t} name={t} detected />)
                  : <TechBadge name="Not Detected" detected={false} />
                }
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
          {tech.all_detected?.length || 0} technologies identified from HTML source analysis.
        </p>
      </SectionCard>

      <div className="mt-4" />

      {/* SEO */}
      <SectionCard icon={Search} title="SEO Report Card">
        <div className="flex items-center gap-6 mb-5">
          <div className="text-center">
            <div className="text-6xl font-bold font-mono leading-none" style={{ color: gradeColor[seo.grade] || '#94a3b8' }}>
              {seo.grade || '?'}
            </div>
            <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{seo.score || 0} / 100</div>
          </div>
          <div className="flex-1">
            <div className="h-2 rounded-full" style={{ background: 'var(--border)' }}>
              <div className="h-2 rounded-full" style={{ width: `${seo.score || 0}%`, background: gradeColor[seo.grade] || '#94a3b8' }} />
            </div>
            <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
              Based on 10-point on-page audit
            </p>
          </div>
        </div>
        <div>
          {(seo.checks || []).map(([name, status, detail], i) => (
            <SeoCheck key={i} name={name} status={status} detail={detail} />
          ))}
        </div>
      </SectionCard>

      <div className="mt-4" />

      {/* Opportunities */}
      <SectionCard icon={Target} title={`Sales Opportunities (${opps.length})`}>
        {opps.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            No significant gaps detected — this dealer has solid coverage.
          </p>
        ) : (
          opps.map((opp, i) => <OppCard key={i} {...opp} />)
        )}
      </SectionCard>

      <div className="mt-4" />

      {/* Lender mix placeholder */}
      <div className="rounded-2xl p-6 text-center" style={{ background: 'var(--surface)', border: '1px dashed var(--border)' }}>
        <DollarSign size={28} className="mx-auto mb-2" style={{ color: 'var(--border)' }} />
        <h3 className="font-semibold mb-1" style={{ color: 'var(--text)' }}>Lender Mix</h3>
        <p className="text-sm mb-1" style={{ color: 'var(--text-muted)' }}>
          Lender/lienholder data requires a Cross-Sell or DataOne subscription.
        </p>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Phase 3 premium feature · ~$200–400/mo per state
        </p>
      </div>
    </div>
  )
}
