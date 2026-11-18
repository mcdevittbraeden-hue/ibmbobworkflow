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
    <nav className="border-b border-gray-800 bg-black px-6 py-4">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#FDBB30] flex items-center justify-center">
            <span className="text-black font-bold text-xs">F</span>
          </div>
          <span className="text-white font-semibold tracking-tight">FriarAI</span>
        </Link>

        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition-colors">
            Home
          </Link>
          <div className="flex items-center gap-3 pl-4 border-l border-gray-800">
            <div className="w-8 h-8 rounded-full bg-[#FDBB30]/20 border border-[#FDBB30]/40 flex items-center justify-center">
              <span className="text-[#FDBB30] font-semibold text-xs">{initials}</span>
            </div>
            <span className="text-sm text-gray-500">{userName}</span>
          </div>
        </div>
      </div>
    </nav>
  )
}
