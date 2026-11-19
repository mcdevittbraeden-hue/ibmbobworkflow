'use client'

import Link from 'next/link'

export default function Nav({ userName }: { userName: string }) {
  const initials = userName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <nav style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '14px 32px',
      borderBottom: '1px solid var(--border)',
      background: 'var(--white)',
    }}>
      <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
        <div style={{
          width: 28, height: 28, borderRadius: 7, background: 'var(--black)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 900, color: '#fff', letterSpacing: '-0.3px', flexShrink: 0,
        }}>F</div>
        <span style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.4px', color: 'var(--black)' }}>FriarAI</span>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Link href="/dashboard" style={{
          fontSize: 13, color: 'var(--muted)', textDecoration: 'none', fontWeight: 500,
        }}>
          Home
        </Link>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          paddingLeft: 16, borderLeft: '1px solid var(--border)',
        }}>
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'var(--surface-2)', border: '1.5px solid var(--border-mid)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 700, color: 'var(--muted)', letterSpacing: '-0.2px',
          }}>
            {initials}
          </div>
          <span style={{ fontSize: 13, color: 'var(--muted-2)' }}>{userName}</span>
        </div>
      </div>
    </nav>
  )
}
