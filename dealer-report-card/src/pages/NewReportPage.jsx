import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Search, AlertCircle, CheckCircle, Loader, Globe } from 'lucide-react'

const STEPS = [
  { id: 'fetching_homepage',  label: 'Fetching homepage...' },
  { id: 'crawling_subpages',  label: 'Scanning service, trade-in & finance pages...' },
  { id: 'analyzing',          label: 'Analyzing tech stack & opportunities...' },
  { id: 'complete',           label: 'Finalizing report...' },
]

function normalizeUrl(input) {
  let url = input.trim()
  if (!url.startsWith('http')) url = 'https://' + url
  try { return new URL(url).href.replace(/\/$/, '') }
  catch { return null }
}

export default function NewReportPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState('idle') // idle | running | error
  const [error, setError] = useState('')
  const [stepsDone, setStepsDone] = useState([])
  const [activeStep, setActiveStep] = useState(null)
  const pollRef = useRef(null)
  const reportIdRef = useRef(null)

  // Cleanup polling on unmount
  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  function updateStepsFromStage(stage) {
    if (!stage) return
    const idx = STEPS.findIndex(s => s.id === stage)
    if (idx === -1) return

    // Mark all previous steps as done
    const done = STEPS.slice(0, idx).map(s => s.id)
    if (stage === 'complete') done.push('complete')
    setStepsDone(done)
    setActiveStep(stage === 'complete' ? null : stage)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const normalized = normalizeUrl(url)
    if (!normalized) {
      setError('Please enter a valid dealer URL (e.g. bannerford.com)')
      return
    }

    setStatus('running')
    setError('')
    setStepsDone([])
    setActiveStep('fetching_homepage')

    try {
      // Create a pending report record
      const { data: report, error: insertErr } = await supabase
        .from('reports')
        .insert({ user_id: user.id, dealer_url: normalized, status: 'running' })
        .select()
        .single()

      if (insertErr) throw insertErr
      reportIdRef.current = report.id

      // Start polling for progress updates every 3s
      pollRef.current = setInterval(async () => {
        const { data } = await supabase
          .from('reports')
          .select('status, progress_stage')
          .eq('id', reportIdRef.current)
          .single()

        if (data?.progress_stage) {
          updateStepsFromStage(data.progress_stage)
        }

        if (data?.status === 'complete') {
          clearInterval(pollRef.current)
          setStepsDone(STEPS.map(s => s.id))
          setActiveStep(null)
          setTimeout(() => navigate(`/report/${reportIdRef.current}`), 600)
        } else if (data?.status === 'error') {
          clearInterval(pollRef.current)
          setStatus('error')
          setError('Report generation failed. Please try again.')
        }
      }, 3000)

      // Call the scraper edge function (runs in background)
      const { error: fnErr } = await supabase.functions.invoke('scrape', {
        body: { reportId: report.id, url: normalized },
      })

      if (fnErr) throw fnErr

      // Edge function returned — mark complete if polling hasn't already
      clearInterval(pollRef.current)
      setStepsDone(STEPS.map(s => s.id))
      setActiveStep(null)
      setTimeout(() => navigate(`/report/${report.id}`), 600)

    } catch (err) {
      console.error(err)
      if (pollRef.current) clearInterval(pollRef.current)
      setStatus('error')
      setError(err.message || 'Something went wrong. Please try again.')
    }
  }

  const EXAMPLES = [
    'bannerford.com',
    'toyotaofcovington.com',
    'autonation.com',
  ]

  return (
    <div className="animate-fade-in max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-semibold mb-1" style={{ color: 'var(--text)' }}>New Report</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Enter a dealership URL to generate a full intelligence report. We crawl multiple pages for thorough results — typically 30-60 seconds.
        </p>
      </div>

      {/* Input card */}
      <div className="p-6 rounded-2xl mb-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <form onSubmit={handleSubmit}>
          <label className="block text-xs font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
            DEALER WEBSITE URL
          </label>
          <div className="flex gap-3">
            <div className="flex-1 flex items-center gap-2 px-3 rounded-xl" style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
              <Globe size={16} style={{ color: 'var(--text-muted)' }} className="flex-shrink-0" />
              <input
                type="text"
                value={url}
                onChange={e => { setUrl(e.target.value); setError('') }}
                placeholder="bannerford.com"
                disabled={status === 'running'}
                className="flex-1 bg-transparent py-3 text-sm outline-none"
                style={{ color: 'var(--text)', fontFamily: 'DM Sans, sans-serif' }}
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={status === 'running' || !url.trim()}
              className="px-5 py-3 rounded-xl text-sm font-medium flex items-center gap-2 transition-all flex-shrink-0"
              style={{
                background: status === 'running' || !url.trim() ? 'var(--surface-2)' : '#3b82f6',
                color: status === 'running' || !url.trim() ? 'var(--text-muted)' : 'white',
                cursor: status === 'running' || !url.trim() ? 'not-allowed' : 'pointer',
                border: '1px solid transparent',
              }}
            >
              {status === 'running' ? <Loader size={15} className="animate-spin" /> : <Search size={15} />}
              {status === 'running' ? 'Running...' : 'Run Report'}
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 mt-3 text-sm" style={{ color: '#ef4444' }}>
              <AlertCircle size={14} />
              {error}
            </div>
          )}
        </form>

        {/* Example URLs */}
        {status === 'idle' && (
          <div className="mt-4">
            <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>Try an example:</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map(ex => (
                <button
                  key={ex}
                  onClick={() => setUrl(ex)}
                  className="text-xs px-2.5 py-1 rounded-lg transition-colors"
                  style={{ background: 'var(--surface-2)', color: '#3b82f6', border: '1px solid var(--border)', cursor: 'pointer' }}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Progress steps */}
      {status === 'running' && (
        <div className="p-6 rounded-2xl animate-fade-in" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h3 className="text-sm font-medium mb-4" style={{ color: 'var(--text)' }}>Crawling dealer site...</h3>
          <div className="space-y-3">
            {STEPS.map((step) => {
              const done = stepsDone.includes(step.id)
              const active = step.id === activeStep
              return (
                <div key={step.id} className="flex items-center gap-3">
                  <div className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                    {done ? (
                      <CheckCircle size={16} style={{ color: '#10b981' }} />
                    ) : active ? (
                      <Loader size={16} className="animate-spin" style={{ color: '#3b82f6' }} />
                    ) : (
                      <div className="w-4 h-4 rounded-full border" style={{ borderColor: 'var(--border)' }} />
                    )}
                  </div>
                  <span className="text-sm" style={{ color: done ? '#10b981' : active ? 'var(--text)' : 'var(--text-muted)' }}>
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
          <p className="text-xs mt-4" style={{ color: 'var(--text-muted)' }}>
            We scan the homepage plus service, trade-in, and finance pages for thorough detection.
          </p>
        </div>
      )}

      {/* What you'll get */}
      {status === 'idle' && (
        <div className="p-5 rounded-2xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <h3 className="text-xs font-medium mb-3" style={{ color: 'var(--text-muted)' }}>WHAT'S INCLUDED IN EACH REPORT</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              '📊 Inventory overview (new/used counts)',
              '🚗 Vehicle make & model breakdown',
              '⚙️ Technology stack (70+ fingerprints)',
              '🔍 SEO audit with letter grade',
              '🎯 Sales opportunities with pitch angles',
              '💰 Price distribution analysis',
              '🏦 Lender mix (Phase 3)',
              '⭐ Reviews & reputation (Phase 2)',
            ].map(item => (
              <div key={item} className="text-xs py-1" style={{ color: 'var(--text-muted)' }}>
                {item}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
