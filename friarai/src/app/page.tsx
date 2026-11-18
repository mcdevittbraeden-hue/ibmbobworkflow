import Link from 'next/link'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-black flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-5 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#FDBB30] flex items-center justify-center">
            <span className="text-black font-bold text-sm">F</span>
          </div>
          <span className="text-white font-semibold text-lg tracking-tight">FriarAI</span>
        </div>
        <Link
          href="/dashboard"
          className="px-4 py-2 text-sm bg-[#FDBB30] text-black font-semibold rounded-lg hover:bg-yellow-400 transition-colors"
        >
          See the demo →
        </Link>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-6 text-center py-24">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#FDBB30]/10 border border-[#FDBB30]/30 rounded-full text-[#FDBB30] text-xs font-medium mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-[#FDBB30]"></span>
          Providence College Student Success Platform
        </div>

        <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight max-w-3xl mb-6">
          Find your people.<br />
          <span className="text-[#FDBB30]">Thrive at PC.</span>
        </h1>

        <p className="text-lg text-gray-400 max-w-xl mb-10 leading-relaxed">
          FriarAI connects you with students who share your goals, recommends clubs that match your interests,
          and helps you make the most of your time at Providence College.
        </p>

        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-[#FDBB30] text-black font-semibold rounded-lg hover:bg-yellow-400 transition-colors text-sm"
          >
            See the demo →
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="px-8 pb-24 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            <div key={f.title} className="p-6 bg-gray-900 rounded-xl border border-gray-800">
              <div className="text-2xl mb-3">{f.icon}</div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="text-center py-6 border-t border-gray-800 text-xs text-gray-600">
        © 2024 FriarAI · Providence College · Built for student success
      </footer>
    </main>
  )
}
