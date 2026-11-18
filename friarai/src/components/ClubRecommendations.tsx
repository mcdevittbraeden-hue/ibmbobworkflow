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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {DEMO_CLUBS.map((club) => (
        <div key={club.id} className="p-5 bg-gray-900 rounded-xl border border-gray-800 flex flex-col">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-white font-semibold text-sm leading-snug">{club.name}</h3>
            <a
              href={club.link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#FDBB30] hover:underline ml-3 flex-shrink-0"
            >
              Learn more →
            </a>
          </div>

          <p className="text-gray-400 text-xs leading-relaxed mb-3 flex-1">{club.reason}</p>

          <div className="flex flex-wrap gap-1.5 mb-2">
            {club.tags.map((tag) => (
              <span key={tag} className="px-2 py-0.5 bg-gray-800 border border-gray-700 rounded-full text-gray-500 text-xs">
                {tag}
              </span>
            ))}
          </div>

          <p className="text-gray-600 text-xs">{club.meeting_info}</p>
        </div>
      ))}
    </div>
  )
}
