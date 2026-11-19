'use client'

const DEMO_CLUBS = [
  {
    id: 'club-1',
    name: 'Providence College Investment Club',
    reason: 'Perfect for Finance and Economics students looking to build real investing skills and connect with Wall Street-bound peers.',
    tags: ['Finance', 'Investing', 'Networking'],
    meeting_info: 'Wednesdays 7pm, Ruane Center 105',
    link: 'https://my.providence.edu',
  },
  {
    id: 'club-2',
    name: 'PC Entrepreneurs & Startups',
    reason: 'Connects ambitious students who want to build something — perfect if you have an idea or want to find co-founders.',
    tags: ['Entrepreneurship', 'Startups', 'Innovation'],
    meeting_info: 'Thursdays 6:30pm, Slavin 112',
    link: 'https://my.providence.edu',
  },
  {
    id: 'club-3',
    name: 'Friar Data & Analytics Club',
    reason: 'Builds Python and data analytics skills that employers in finance, consulting, and tech are actively recruiting for.',
    tags: ['Data Science', 'Coding', 'Analytics'],
    meeting_info: 'Tuesdays 7pm, Harkins Hall 203',
    link: 'https://my.providence.edu',
  },
  {
    id: 'club-4',
    name: 'PC Marketing & Brand Strategy Club',
    reason: 'Real campaigns for real local brands — strong alumni network and pairs perfectly with Business and Finance majors.',
    tags: ['Marketing', 'Strategy', 'Business'],
    meeting_info: 'Wednesdays 6pm, Ruane Center 210',
    link: 'https://my.providence.edu',
  },
]

export default function ClubRecommendations() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
      {DEMO_CLUBS.map((club) => (
        <div key={club.id} style={{
          padding: 20,
          background: 'var(--white)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          display: 'flex', flexDirection: 'column',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
            <h3 style={{
              fontSize: 13, fontWeight: 700, color: 'var(--black)',
              lineHeight: 1.35, letterSpacing: '-0.1px',
            }}>{club.name}</h3>
            <a
              href={club.link}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 11, fontWeight: 700, color: 'var(--black)',
                textDecoration: 'underline', marginLeft: 12, flexShrink: 0,
                whiteSpace: 'nowrap',
              }}
            >
              Learn more →
            </a>
          </div>

          <p style={{
            fontSize: 12, color: 'var(--muted)', lineHeight: 1.65,
            marginBottom: 12, flex: 1,
          }}>{club.reason}</p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
            {club.tags.map((tag) => (
              <span key={tag} style={{
                fontSize: 10.5, fontWeight: 600, padding: '3px 9px',
                background: 'var(--surface)', border: '1px solid var(--border-mid)',
                borderRadius: 100, color: 'var(--muted)',
              }}>
                {tag}
              </span>
            ))}
          </div>

          <p style={{ fontSize: 11, color: 'var(--muted-2)' }}>{club.meeting_info}</p>
        </div>
      ))}
    </div>
  )
}
