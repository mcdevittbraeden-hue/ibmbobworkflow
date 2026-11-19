import Link from 'next/link'

export default function LandingPage() {
  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Nav */}
      <nav style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '20px 40px',
        borderBottom: '1px solid var(--border)',
        background: 'var(--white)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8, background: 'var(--black)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 900, color: '#fff', letterSpacing: '-0.3px',
          }}>F</div>
          <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.4px', color: 'var(--black)' }}>FriarAI</span>
        </div>
        <Link href="/dashboard" style={{
          padding: '10px 22px',
          background: 'var(--black)', color: '#fff',
          fontSize: 13, fontWeight: 700,
          borderRadius: 100, textDecoration: 'none',
          letterSpacing: '-0.2px',
          transition: 'background 0.15s',
        }}>
          See the demo →
        </Link>
      </nav>

      {/* Hero */}
      <section style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '80px 24px', textAlign: 'center',
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
          color: 'var(--muted)', background: 'var(--surface)',
          border: '1px solid var(--border-mid)', borderRadius: 100,
          padding: '5px 14px', marginBottom: 32,
        }}>
          <span style={{
            width: 5, height: 5, borderRadius: '50%', background: 'var(--black)',
            display: 'inline-block', animation: 'pulse 1.8s ease-in-out infinite',
          }} />
          Providence College Student Success Platform
        </div>

        <h1 style={{
          fontSize: 'clamp(36px, 6vw, 64px)', fontWeight: 900,
          letterSpacing: '-2.5px', lineHeight: 1.08,
          color: 'var(--black)', marginBottom: 20, maxWidth: 640,
        }}>
          Find your people.<br />
          <span style={{ opacity: 0.3 }}>Thrive at PC.</span>
        </h1>

        <p style={{
          fontSize: 16, color: 'var(--muted)', maxWidth: 460,
          marginBottom: 36, lineHeight: 1.7,
        }}>
          FriarAI connects you with students who share your goals, recommends clubs that match your interests,
          and helps you make the most of your time at Providence College.
        </p>

        <Link href="/dashboard" style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '13px 28px',
          background: 'var(--black)', color: '#fff',
          fontSize: 14, fontWeight: 700,
          borderRadius: 100, textDecoration: 'none',
          letterSpacing: '-0.2px',
          boxShadow: '0 1px 3px rgba(17,17,16,.12), 0 6px 20px rgba(17,17,16,.15)',
        }}>
          Try the demo →
        </Link>
      </section>

      {/* Features */}
      <section style={{ padding: '0 40px 80px', maxWidth: 960, margin: '0 auto', width: '100%' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            {
              icon: '🤝',
              title: 'AI-Matched Connections',
              desc: 'Meet students with compatible goals, majors, and interests — with an AI-written reason explaining why you should connect.',
            },
            {
              icon: '💬',
              title: 'In-App Messaging',
              desc: 'Start a conversation directly inside FriarAI. No need to exchange numbers or find each other on social media.',
            },
            {
              icon: '🎯',
              title: 'Club Recommendations',
              desc: 'AI analyzes your profile and tells you exactly which clubs and organizations fit your interests and goals.',
            },
          ].map((f) => (
            <div key={f.title} style={{
              padding: 24,
              background: 'var(--white)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius)',
            }}>
              <div style={{ fontSize: 24, marginBottom: 12 }}>{f.icon}</div>
              <h3 style={{ fontWeight: 700, fontSize: 14, color: 'var(--black)', marginBottom: 8, letterSpacing: '-0.2px' }}>{f.title}</h3>
              <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer style={{
        textAlign: 'center', padding: '20px',
        borderTop: '1px solid var(--border)',
        fontSize: 11, color: 'var(--muted-2)',
      }}>
        © 2024 FriarAI · Providence College · Built for student success
      </footer>
    </main>
  )
}
