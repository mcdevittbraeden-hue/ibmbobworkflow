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

    // Simulate a reply after 1.2s
    const firstName = matchName.split(' ')[0]
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {DEMO_MATCHES.map((match) => {
        const initials = match.name.split(' ').map((n) => n[0]).join('').toUpperCase()
        const isOpen = chatOpen === match.id

        return (
          <div key={match.id} className="bg-gray-900 rounded-xl border border-gray-800 flex flex-col overflow-hidden">
            {!isOpen ? (
              <div className="p-5 flex flex-col flex-1">
                {/* Avatar + name */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-[#FDBB30]/20 border border-[#FDBB30]/40 flex items-center justify-center flex-shrink-0">
                    <span className="text-[#FDBB30] font-semibold text-sm">{initials}</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{match.name}</p>
                    <p className="text-gray-500 text-xs">{match.major} · &apos;{String(match.grad_year).slice(2)}</p>
                  </div>
                </div>

                {/* AI reason */}
                <p className="text-gray-300 text-sm leading-relaxed mb-3 flex-1">
                  &ldquo;{match.reason}&rdquo;
                </p>

                {/* Interest tags */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {match.interests.map((interest) => (
                    <span key={interest} className="px-2 py-0.5 bg-gray-800 border border-gray-700 rounded-full text-gray-400 text-xs">
                      {interest}
                    </span>
                  ))}
                </div>

                <button
                  onClick={() => setChatOpen(match.id)}
                  className="w-full py-2 bg-[#FDBB30] text-black font-semibold rounded-lg hover:bg-yellow-400 transition-colors text-sm"
                >
                  Start Chat →
                </button>
              </div>
            ) : (
              <div className="flex flex-col h-72">
                {/* Chat header */}
                <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800">
                  <button onClick={() => setChatOpen(null)} className="text-gray-500 hover:text-white text-sm mr-1">←</button>
                  <div className="w-7 h-7 rounded-full bg-[#FDBB30]/20 border border-[#FDBB30]/40 flex items-center justify-center">
                    <span className="text-[#FDBB30] font-semibold text-xs">{initials}</span>
                  </div>
                  <span className="text-white text-sm font-medium">{match.name}</span>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                  {!(messages[match.id]?.length) && (
                    <p className="text-gray-600 text-xs text-center pt-4">Say hi to {match.name.split(' ')[0]}!</p>
                  )}
                  {(messages[match.id] ?? []).map((msg, i) => (
                    <div key={i} className={`flex ${msg.from === 'me' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] px-3 py-1.5 rounded-xl text-xs leading-relaxed ${
                        msg.from === 'me' ? 'bg-[#FDBB30] text-black' : 'bg-gray-800 text-white'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Input */}
                <div className="flex gap-2 px-3 pb-3">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendMessage(match.id, match.name)}
                    placeholder="Message…"
                    className="flex-1 px-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#FDBB30] text-xs"
                  />
                  <button
                    onClick={() => sendMessage(match.id, match.name)}
                    className="px-3 py-1.5 bg-[#FDBB30] text-black font-semibold rounded-lg text-xs hover:bg-yellow-400 transition-colors"
                  >
                    Send
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
