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

  return (
    <main className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-full bg-[#FDBB30] flex items-center justify-center mb-3">
            <span className="text-black font-bold text-lg">F</span>
          </div>
          <h1 className="text-white font-bold text-2xl">Build your profile</h1>
          <p className="text-gray-400 text-sm mt-1">Help FriarAI find the right connections for you</p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {([1, 2, 3] as Step[]).map((s) => (
            <div
              key={s}
              className={`flex-1 h-1 rounded-full transition-colors ${
                s <= step ? 'bg-[#FDBB30]' : 'bg-gray-800'
              }`}
            />
          ))}
        </div>

        {/* Step 1 — Basic info */}
        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-white font-semibold text-lg">Tell us about yourself</h2>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Full name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Alex Johnson"
                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#FDBB30] text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Major</label>
              <select
                value={major}
                onChange={(e) => setMajor(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-[#FDBB30] text-sm"
              >
                <option value="">Select your major</option>
                {MAJORS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Graduation year</label>
              <div className="flex gap-2">
                {GRAD_YEARS.map((y) => (
                  <button
                    key={y}
                    onClick={() => setGradYear(y)}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                      gradYear === y
                        ? 'bg-[#FDBB30] text-black'
                        : 'bg-gray-900 border border-gray-700 text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={() => setStep(2)}
              disabled={!name || !major}
              className="w-full py-2.5 bg-[#FDBB30] text-black font-semibold rounded-lg hover:bg-yellow-400 transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed mt-2"
            >
              Continue →
            </button>
          </div>
        )}

        {/* Step 2 — Interests */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-white font-semibold text-lg">What are you into?</h2>
              <p className="text-gray-500 text-sm mt-1">Pick up to 5 interests. These power your matches.</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {INTEREST_SUGGESTIONS.map((interest) => (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    interests.includes(interest)
                      ? 'bg-[#FDBB30] text-black'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={customInterest}
                onChange={(e) => setCustomInterest(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addCustomInterest()}
                placeholder="Add your own…"
                className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#FDBB30] text-sm"
              />
              <button
                onClick={addCustomInterest}
                className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors"
              >
                Add
              </button>
            </div>

            {interests.length > 0 && (
              <div>
                <p className="text-xs text-gray-500 mb-2">Selected ({interests.length}/5):</p>
                <div className="flex flex-wrap gap-2">
                  {interests.map((i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-[#FDBB30]/20 border border-[#FDBB30]/40 rounded-full text-[#FDBB30] text-xs flex items-center gap-1.5"
                    >
                      {i}
                      <button onClick={() => toggleInterest(i)} className="hover:text-white">×</button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="px-5 py-2.5 border border-gray-700 text-gray-400 rounded-lg text-sm hover:border-gray-500 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={interests.length === 0}
                className="flex-1 py-2.5 bg-[#FDBB30] text-black font-semibold rounded-lg hover:bg-yellow-400 transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continue →
              </button>
            </div>
          </div>
        )}

        {/* Step 3 — Goal */}
        {step === 3 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-white font-semibold text-lg">What&apos;s your main goal right now?</h2>
              <p className="text-gray-500 text-sm mt-1">This helps us find the most relevant connections.</p>
            </div>

            <div className="space-y-2">
              {GOALS.map((g) => (
                <button
                  key={g}
                  onClick={() => setGoal(g)}
                  className={`w-full px-4 py-3 rounded-lg text-sm text-left transition-colors ${
                    goal === g
                      ? 'bg-[#FDBB30]/15 border border-[#FDBB30] text-white'
                      : 'bg-gray-900 border border-gray-700 text-gray-300 hover:border-gray-500'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="px-5 py-2.5 border border-gray-700 text-gray-400 rounded-lg text-sm hover:border-gray-500 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={!goal || loading}
                className="flex-1 py-2.5 bg-[#FDBB30] text-black font-semibold rounded-lg hover:bg-yellow-400 transition-colors text-sm disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? 'Setting up your profile…' : 'Find my connections →'}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  )
}
