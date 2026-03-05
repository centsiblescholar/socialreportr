import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { supabase } from '../lib/supabase'
import { FileText } from 'lucide-react'

export default function AuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-600 mb-4">
            <FileText size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--text)' }}>Dealer Report Card</h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Instant dealer intelligence for automotive sales reps
          </p>
        </div>

        {/* Auth card */}
        <div className="rounded-2xl p-6" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#3b82f6',
                    brandAccent: '#2563eb',
                    inputBackground: '#1a2234',
                    inputText: '#e2e8f0',
                    inputPlaceholder: '#64748b',
                    inputBorder: '#1e293b',
                    inputBorderFocus: '#3b82f6',
                    inputBorderHover: '#334155',
                    messageText: '#94a3b8',
                    anchorTextColor: '#3b82f6',
                    dividerBackground: '#1e293b',
                    defaultButtonBackground: '#1a2234',
                    defaultButtonBackgroundHover: '#1e293b',
                    defaultButtonText: '#e2e8f0',
                    defaultButtonBorder: '#1e293b',
                  },
                  borderWidths: { buttonBorderWidth: '1px', inputBorderWidth: '1px' },
                  radii: { borderRadiusButton: '10px', buttonBorderRadius: '10px', inputBorderRadius: '10px' },
                },
              },
              style: {
                container: { background: 'transparent' },
                label: { color: 'var(--text-muted)', fontSize: '13px' },
                button: { fontFamily: 'DM Sans, sans-serif' },
                input: { fontFamily: 'DM Sans, sans-serif' },
                anchor: { fontFamily: 'DM Sans, sans-serif' },
                message: { fontFamily: 'DM Sans, sans-serif' },
              },
            }}
            providers={[]}
            redirectTo={window.location.origin}
          />
        </div>

        <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
          Built by Manifest Lab X
        </p>
      </div>
    </div>
  )
}
