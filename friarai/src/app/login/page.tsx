'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <main style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 24px',
    }}>
      <div style={{ width: '100%', maxWidth: 380 }}>
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 36 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 11, background: 'var(--black)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 900, color: '#fff', letterSpacing: '-0.3px',
            marginBottom: 14,
          }}>F</div>
          <h1 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.8px', color: 'var(--black)', marginBottom: 4 }}>
            Welcome back
          </h1>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>Sign in to FriarAI</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 7 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@providence.edu"
              required
              style={{
                width: '100%', padding: '11px 14px',
                background: 'var(--white)', border: '1px solid var(--border-mid)',
                borderRadius: 'var(--radius)', color: 'var(--black)',
                fontSize: 13, outline: 'none',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 7 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={{
                width: '100%', padding: '11px 14px',
                background: 'var(--white)', border: '1px solid var(--border-mid)',
                borderRadius: 'var(--radius)', color: 'var(--black)',
                fontSize: 13, outline: 'none',
                transition: 'border-color 0.15s, box-shadow 0.15s',
              }}
            />
          </div>

          {error && (
            <div style={{
              padding: '11px 14px',
              background: '#fff5f5', border: '1px solid #fca5a5',
              borderRadius: 'var(--radius-sm)', fontSize: 12, color: '#b91c1c',
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '12px 0',
              background: 'var(--black)', color: '#fff',
              fontSize: 13, fontWeight: 700,
              border: 'none', borderRadius: 100,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.4 : 1,
              letterSpacing: '-0.1px', marginTop: 4,
              transition: 'background 0.12s',
            }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--muted-2)', marginTop: 24 }}>
          Don&apos;t have an account?{' '}
          <Link href="/signup" style={{ color: 'var(--black)', fontWeight: 700, textDecoration: 'underline' }}>
            Create one
          </Link>
        </p>
      </div>
    </main>
  )
}
