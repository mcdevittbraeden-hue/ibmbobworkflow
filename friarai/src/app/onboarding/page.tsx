'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const MAJORS = [
  'Accounting', 'Biology', 'Business Administration', 'Chemistry',
  'Computer Science', 'Economics', 'Education', 'English', 'Finance',
  'Health Policy & Management', 'History', 'Marketing', 'Mathematics',
  'Nursing', 'Philosophy', 'Political Science', 'Psychology',
  'Public & Community Service', 'Social Work', 'Sociology', 'Theology',
]

const INTEREST_SUGGESTIONS = [
  'Investment Banking', 'Startups', 'Research', 'Community Service',
  'Sports', 'Music', 'Art', 'Film', 'Writing', 'Coding', 'Data Science',
  'Healthcare', 'Politics', 'Education', 'Faith & Spirituality',
  'Entrepreneurship', 'Social Justice', 'Sustainability', 'Fitness',
  'Photography', 'Travel', 'Gaming', 'Business Consulting',
]

const GOALS = [
  'Find a study group for my classes',
  'Land an internship or job after graduation',
  'Get more involved in campus life',
  'Build my professional network',
  'Find friends who share my interests',
  'Explore career options in my major',
]

const GRAD_YEARS = [2025, 2026, 2027, 2028]

type Step = 1 | 2 | 3

export default function OnboardingPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>(1)
  const [name, setName] = useState('')
  const [major, setMajor] = useState('')
  const [gradYear, setGradYear] = useState<number>(2027)
  const [interests, setInterests] = useState<string[]>([])
  const [customInterest, setCustomInterest] = useState('')
  const [goal, setGoal] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function toggleInterest(interest: string) {
    setInterests((prev) =>
      prev.includes(interest) ? prev.filter((i) => i !== interest) : [...prev, interest].slice(0, 5)
    )
  }

  function addCustomInterest() {
    const trimmed = customInterest.trim()
    if (trimmed && !interests.includes(trimmed) && interests.length < 5) {
      setInterests((prev) => [...prev, trimmed])
      setCustomInterest('')
    }
  }

  async function handleSubmit() {
    if (!goal) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/profile/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, major, grad_year: gradYear, interests, goal }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save profile')
      }

      router.push('/dashboard')
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '11px 14px',
    background: '#fff', border: '1px solid var(--border-mid)',
    borderRadius: 'var(--radius)', color: 'var(--black)',
    fontSize: 13, outline: 'none',
    fontFamily: 'inherit',
  }

  const primaryBtn = (disabled?: boolean) => ({
    padding: '11px 0', width: '100%',
    background: disabled ? 'var(--black)' : 'var(--black)', color: '#fff',
    fontSize: 13, fontWeight: 700,
    border: 'none', borderRadius: 100,
    cursor: disabled ? 'not-allowed' as const : 'pointer' as const,
    opacity: disabled ? 0.3 : 1,
    letterSpacing: '-0.1px',
    transition: 'background 0.12s',
    fontFamily: 'inherit',
  })

  const ghostBtn = {
    padding: '11px 20px',
    background: 'transparent', color: 'var(--muted)',
    fontSize: 13, fontWeight: 600,
    border: '1px solid var(--border-mid)', borderRadius: 100,
    cursor: 'pointer' as const,
    transition: 'border-color 0.12s',
    fontFamily: 'inherit',
  }

  return (
    <main style={{
      minHeight: '100vh', background: 'var(--bg)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 24px',
    }}>
      <div style={{ width: '100%', maxWidth: 520 }}>

        {/* Logo + header */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 36 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 11, background: 'var(--black)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 900, color: '#fff', letterSpacing: '-0.3px',
            marginBottom: 14,
          }}>F</div>
          <h1 style={{ fontSize: 24, fontWeight: 900, letterSpacing: '-0.9px', color: 'var(--black)', marginBottom: 4 }}>
            Build your profile
          </h1>
          <p style={{ fontSize: 13, color: 'var(--muted)' }}>Help FriarAI find the right connections for you</p>
        </div>

        {/* Step dots */}
        <div style={{ display: 'flex', gap: 5, marginBottom: 32 }}>
          {([1, 2, 3] as Step[]).map((s) => (
            <div key={s} style={{
              flex: 1, height: 3, borderRadius: 3,
              background: s <= step ? 'var(--black)' : 'var(--border-mid)',
              opacity: s < step ? 0.3 : 1,
              transition: 'background 0.2s',
            }} />
          ))}
        </div>

        {/* Step 1 */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 6 }}>Step 1 of 3</p>
              <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.7px', color: 'var(--black)' }}>Tell us about yourself</h2>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 7 }}>Full name</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Alex Johnson" style={inputStyle} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 7 }}>Major</label>
              <select value={major} onChange={(e) => setMajor(e.target.value)} style={{ ...inputStyle, appearance: 'none' as const }}>
                <option value="">Select your major</option>
                {MAJORS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 7 }}>Graduation year</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {GRAD_YEARS.map((y) => (
                  <button key={y} onClick={() => setGradYear(y)} style={{
                    flex: 1, padding: '10px 0',
                    background: gradYear === y ? 'var(--black)' : 'var(--white)',
                    color: gradYear === y ? '#fff' : 'var(--muted)',
                    border: `1px solid ${gradYear === y ? 'var(--black)' : 'var(--border-mid)'}`,
                    borderRadius: 'var(--radius-sm)', fontSize: 13, fontWeight: 600,
                    cursor: 'pointer', transition: 'all 0.12s', fontFamily: 'inherit',
                  }}>
                    {y}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={() => setStep(2)} disabled={!name || !major} style={primaryBtn(!name || !major)}>
              Continue →
            </button>
          </div>
        )}

        {/* Step 2 */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 6 }}>Step 2 of 3</p>
              <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.7px', color: 'var(--black)', marginBottom: 4 }}>What are you into?</h2>
              <p style={{ fontSize: 12, color: 'var(--muted)' }}>Pick up to 5 interests. These power your matches.</p>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {INTEREST_SUGGESTIONS.map((interest) => (
                <button key={interest} onClick={() => toggleInterest(interest)} style={{
                  fontSize: 12, fontWeight: 500, padding: '6px 13px',
                  background: interests.includes(interest) ? 'var(--black)' : 'var(--white)',
                  color: interests.includes(interest) ? '#fff' : 'var(--muted)',
                  border: `1px solid ${interests.includes(interest) ? 'var(--black)' : 'var(--border-mid)'}`,
                  borderRadius: 100, cursor: 'pointer',
                  transition: 'all 0.12s', fontFamily: 'inherit',
                }}>
                  {interest}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={customInterest}
                onChange={(e) => setCustomInterest(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCustomInterest()}
                placeholder="Add your own…"
                style={{ ...inputStyle, flex: 1 }}
              />
              <button onClick={addCustomInterest} style={{
                padding: '11px 18px',
                background: 'var(--surface-2)', color: 'var(--black)',
                border: '1px solid var(--border-mid)', borderRadius: 'var(--radius-sm)',
                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}>Add</button>
            </div>

            {interests.length > 0 && (
              <div>
                <p style={{ fontSize: 11, color: 'var(--muted-2)', marginBottom: 8 }}>Selected ({interests.length}/5):</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {interests.map((i) => (
                    <span key={i} style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      fontSize: 12, fontWeight: 600, padding: '4px 10px 4px 12px',
                      background: 'var(--surface-2)', border: '1px solid var(--border-mid)',
                      borderRadius: 100, color: 'var(--black)',
                    }}>
                      {i}
                      <button onClick={() => toggleInterest(i)} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--muted)', fontSize: 13, padding: 0, lineHeight: 1,
                      }}>×</button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(1)} style={ghostBtn}>← Back</button>
              <button onClick={() => setStep(3)} disabled={interests.length === 0} style={{ ...primaryBtn(interests.length === 0), flex: 1 }}>
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 3 */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--muted-2)', marginBottom: 6 }}>Step 3 of 3</p>
              <h2 style={{ fontSize: 20, fontWeight: 900, letterSpacing: '-0.7px', color: 'var(--black)', marginBottom: 4 }}>What&apos;s your main goal?</h2>
              <p style={{ fontSize: 12, color: 'var(--muted)' }}>This helps us find the most relevant connections.</p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {GOALS.map((g) => (
                <button key={g} onClick={() => setGoal(g)} style={{
                  padding: '13px 16px', textAlign: 'left',
                  background: goal === g ? 'var(--black)' : 'var(--white)',
                  color: goal === g ? '#fff' : 'var(--black)',
                  border: `1px solid ${goal === g ? 'var(--black)' : 'var(--border-mid)'}`,
                  borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 500,
                  cursor: 'pointer', transition: 'all 0.12s', fontFamily: 'inherit',
                  letterSpacing: '-0.1px',
                }}>
                  {g}
                </button>
              ))}
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

            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setStep(2)} style={ghostBtn}>← Back</button>
              <button onClick={handleSubmit} disabled={!goal || loading} style={{ ...primaryBtn(!goal || loading), flex: 1 }}>
                {loading ? 'Setting up your profile…' : 'Find my connections →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
