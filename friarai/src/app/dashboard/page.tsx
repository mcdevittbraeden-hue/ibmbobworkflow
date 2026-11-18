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
    <main className="min-h-screen bg-black">
      <Nav userName={profile.name} />
      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">
            Welcome back, Jordan 👋
          </h1>
          <p className="text-gray-400 mt-1 text-sm">
            Here&apos;s who you should meet and what to get involved in.
          </p>
        </div>

        {/* Profile chip */}
        <div className="flex flex-wrap gap-2 mb-8">
          <span className="px-3 py-1 bg-[#FDBB30]/10 border border-[#FDBB30]/30 rounded-full text-[#FDBB30] text-xs font-medium">
            Finance
          </span>
          {profile.interests.map((interest) => (
            <span key={interest} className="px-3 py-1 bg-gray-800 border border-gray-700 rounded-full text-gray-400 text-xs">
              {interest}
            </span>
          ))}
        </div>

        {/* Connection cards */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">People You Should Meet</h2>
            <span className="text-xs text-gray-500">Matched by AI · Based on your profile</span>
          </div>
          <ConnectionCards />
        </section>

        {/* Club recommendations */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Clubs For You</h2>
            <span className="text-xs text-gray-500">Recommended by FriarAI</span>
          </div>
          <ClubRecommendations />
        </section>
      </div>
    </main>
  )
}
