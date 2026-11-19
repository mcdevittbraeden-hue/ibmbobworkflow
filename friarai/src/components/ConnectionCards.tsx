'use client'

import { useState } from 'react'

type Match = {
  id: string
  name: string
  major: string
  grad_year: number
  interests: string[]
  reason: string
}

const DEMO_MATCHES: Match[] = [
  {
    id: '1',
    name: 'Morgan Kelly',
    major: 'Finance',
    grad_year: 2027,
    interests: ['Investment Banking', 'Economics', 'Networking'],
    reason: 'You both share a passion for investment banking and are actively targeting finance internships — connecting now could mean sharing leads, prep tips, and interview strategies.',
  },
  {
    id: '2',
    name: 'Quinn Murphy',
    major: 'Economics',
    grad_year: 2026,
    interests: ['Finance', 'Investment Banking', 'Debate'],
    reason: "You share strong interests in finance and professional networking, and Quinn's Economics background complements your Finance major — great for study groups and career conversations.",
  },
  {
    id: '3',
    name: 'Taylor Brooks',
    major: 'Business Administration',
    grad_year: 2026,
    interests: ['Entrepreneurship', 'Marketing', 'Startups'],
    reason: "You both want to land jobs after graduation and share an interest in startups and networking — Taylor's marketing lens pairs well with your finance focus for any entrepreneurial ventures.",
  },
]

export default function ConnectionCards() {
  const [chatOpen, setChatOpen] = useState<string | null>(null)
  const [messages, setMessages] = useState<Record<string, { from: string; text: string }[]>>({})
  const [input, setInput] = useState('')

  function sendMessage(matchId: string, matchName: string) {
    if (!input.trim()) return
    setMessages((prev) => ({
      ...prev,
      [matchId]: [
        ...(prev[matchId] ?? []),
        { from: 'me', text: input.trim() },
      ],
    }))
    setInput('')

    const replies = [
      `Hey! Great to connect. I'd love to chat more about that.`,
      `Absolutely — I was thinking the same thing. When are you free?`,
      `That's exactly why I joined FriarAI! Let's set something up.`,
      `Yes! I've been looking for someone to talk to about this.`,
    ]
    const reply = replies[Math.floor(Math.random() * replies.length)]
    setTimeout(() => {
      setMessages((prev) => ({
        ...prev,
        [matchId]: [
          ...(prev[matchId] ?? []),
          { from: matchName, text: reply },
        ],
      }))
    }, 1200)
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
      {DEMO_MATCHES.map((match) => {
        const initials = match.name.split(' ').map((n) => n[0]).join('').toUpperCase()
        const isOpen = chatOpen === match.id

        return (
          <div key={match.id} style={{
            background: 'var(--white)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
          }}>
            {!isOpen ? (
              <div style={{ padding: 20, display: 'flex', flexDirection: 'column', flex: 1 }}>
                {/* Avatar + name */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%',
                    background: 'var(--black)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0,
                    letterSpacing: '-0.3px',
                  }}>
                    {initials}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--black)', letterSpacing: '-0.1px' }}>{match.name}</p>
                    <p style={{ fontSize: 11, color: 'var(--muted)', marginTop: 1 }}>{match.major} · &apos;{String(match.grad_year).slice(2)}</p>
                  </div>
                </div>

                {/* AI reason */}
                <p style={{
                  fontSize: 12.5, color: 'var(--muted)', lineHeight: 1.65,
                  marginBottom: 14, flex: 1,
                }}>
                  &ldquo;{match.reason}&rdquo;
                </p>

                {/* Interest tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 16 }}>
                  {match.interests.map((interest) => (
                    <span key={interest} style={{
                      fontSize: 11, fontWeight: 600, padding: '3px 9px',
                      background: 'var(--surface)', border: '1px solid var(--border-mid)',
                      borderRadius: 100, color: 'var(--muted)',
                    }}>
                      {interest}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => setChatOpen(match.id)}
                  style={{
                    width: '100%', padding: '10px 0',
                    background: 'var(--black)', color: '#fff',
                    fontSize: 13, fontWeight: 700,
                    border: 'none', borderRadius: 100,
                    cursor: 'pointer', letterSpacing: '-0.1px',
                    transition: 'background 0.12s',
                  }}
                >
                  Start Chat →
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', height: 280 }}>
                {/* Chat header */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 14px',
                  borderBottom: '1px solid var(--border)',
                }}>
                  <button
                    onClick={() => setChatOpen(null)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--muted)', fontSize: 14, padding: 0,
                    }}
                  >←</button>
                  <div style={{
                    width: 26, height: 26, borderRadius: '50%',
                    background: 'var(--black)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 800, color: '#fff',
                  }}>
                    {initials}
                  </div>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--black)' }}>{match.name}</span>
                </div>

                {/* Messages */}
                <div style={{
                  flex: 1, overflowY: 'auto', padding: '12px 14px',
                  display: 'flex', flexDirection: 'column', gap: 8,
                }}>
                  {!(messages[match.id]?.length) && (
                    <p style={{ color: 'var(--muted-2)', fontSize: 11, textAlign: 'center', paddingTop: 16 }}>
                      Say hi to {match.name.split(' ')[0]}!
                    </p>
                  )}
                  {(messages[match.id] ?? []).map((msg, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: msg.from === 'me' ? 'flex-end' : 'flex-start' }}>
                      <div style={{
                        maxWidth: '80%', padding: '8px 12px',
                        borderRadius: 12,
                        ...(msg.from === 'me'
                          ? { background: 'var(--black)', color: '#fff', borderBottomRightRadius: 3 }
                          : { background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--black)', borderBottomLeftRadius: 3 }),
                        fontSize: 12, lineHeight: 1.6,
                      }}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Input */}
                <div style={{
                  display: 'flex', gap: 8, padding: '8px 12px',
                  borderTop: '1px solid var(--border)',
                }}>
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage(match.id, match.name)}
                    placeholder="Message…"
                    style={{
                      flex: 1, padding: '7px 12px',
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)', color: 'var(--black)',
                      fontSize: 12, outline: 'none',
                    }}
                  />
                  <button
                    onClick={() => sendMessage(match.id, match.name)}
                    style={{
                      width: 32, height: 32, borderRadius: 8,
                      background: 'var(--black)', border: 'none',
                      color: '#fff', fontSize: 14, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                  >↑</button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
