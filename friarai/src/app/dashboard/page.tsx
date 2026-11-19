import Nav from '@/components/Nav'
import ConnectionCards from '@/components/ConnectionCards'
import ClubRecommendations from '@/components/ClubRecommendations'

export default function DashboardPage() {
  const profile = {
    name: 'Jordan Mitchell',
    major: 'Finance',
    interests: ['Investment Banking', 'Startups', 'Networking'],
  }

  return (
    <main style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Nav userName={profile.name} />
      <div style={{ maxWidth: 1024, margin: '0 auto', padding: '40px 32px' }}>

        {/* Welcome */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{
            fontSize: 28, fontWeight: 900, letterSpacing: '-1px',
            color: 'var(--black)', marginBottom: 6,
          }}>
            Welcome back, Jordan
          </h1>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>
            Here&apos;s who you should meet and what to get involved in.
          </p>
        </div>

        {/* Profile chips */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 36 }}>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '4px 12px',
            background: 'var(--black)', color: '#fff',
            borderRadius: 100, letterSpacing: '0.02em',
          }}>
            {profile.major}
          </span>
          {profile.interests.map((interest) => (
            <span key={interest} style={{
              fontSize: 11, fontWeight: 600, padding: '4px 12px',
              background: 'var(--white)', border: '1px solid var(--border-mid)',
              borderRadius: 100, color: 'var(--muted)',
            }}>
              {interest}
            </span>
          ))}
        </div>

        {/* Connection cards */}
        <section style={{ marginBottom: 48 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.6px', color: 'var(--black)' }}>
              People You Should Meet
            </h2>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted-2)' }}>
              Matched by AI · Based on your profile
            </span>
          </div>
          <ConnectionCards />
        </section>

        {/* Club recommendations */}
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, letterSpacing: '-0.6px', color: 'var(--black)' }}>
              Clubs For You
            </h2>
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted-2)' }}>
              Recommended by FriarAI
            </span>
          </div>
          <ClubRecommendations />
        </section>
      </div>
    </main>
  )
}
