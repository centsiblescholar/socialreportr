import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { LayoutDashboard, PlusCircle, Settings, LogOut, FileText } from 'lucide-react'

export default function Layout({ children }) {
  const { profile, signOut } = useAuth()
  const location = useLocation()

  const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/new', icon: PlusCircle, label: 'New Report' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ]

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/'
    return location.pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg)' }}>
      {/* Top nav */}
      <header style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 no-underline">
            <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
              <FileText size={14} className="text-white" />
            </div>
            <span className="font-semibold text-sm" style={{ color: 'var(--text)' }}>
              Dealer Report Card
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map(({ to, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors no-underline"
                style={{
                  color: isActive(to) ? '#3b82f6' : 'var(--text-muted)',
                  background: isActive(to) ? 'rgba(59,130,246,0.1)' : 'transparent',
                }}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
          </nav>

          {/* User menu */}
          <div className="flex items-center gap-3">
            <span className="text-xs hidden md:block" style={{ color: 'var(--text-muted)' }}>
              {profile?.plan === 'free' && (
                <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>
                  Free
                </span>
              )}
              {profile?.plan === 'pro' && (
                <span className="px-2 py-0.5 rounded text-xs font-medium" style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6' }}>
                  Pro
                </span>
              )}
            </span>
            <button
              onClick={signOut}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors"
              style={{ color: 'var(--text-muted)', background: 'transparent' }}
              title="Sign out"
            >
              <LogOut size={15} />
              <span className="hidden md:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {children}
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50" style={{ background: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
        <div className="flex">
          {navItems.map(({ to, icon: Icon, label }) => (
            <Link
              key={to}
              to={to}
              className="flex-1 flex flex-col items-center gap-1 py-3 text-xs no-underline transition-colors"
              style={{ color: isActive(to) ? '#3b82f6' : 'var(--text-muted)' }}
            >
              <Icon size={20} />
              {label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Mobile bottom padding */}
      <div className="md:hidden h-16" />
    </div>
  )
}
