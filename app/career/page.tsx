import { connection } from 'next/server';
import { getDemoSession } from '@/lib/demoSession';
import { getCareerData } from '@/lib/integrations/career';
import { getBannerData } from '@/lib/integrations/banner';
import { InternshipCard } from '@/components/InternshipCard';
import { ResumeReview } from '@/components/ResumeReview';
import { CareerChat } from '@/components/CareerChat';
import { JobDiscovery } from '@/components/JobDiscovery';
import { FadeUp, StaggerList, StaggerItem } from '@/components/Animate';
import Link from 'next/link';

export default async function CareerPage() {
  await connection();
  const session = getDemoSession();
  const [careerData, bannerData] = await Promise.all([
    getCareerData(session.user.studentId),
    getBannerData(session.user.studentId),
  ]);

  const { profile } = careerData;
  const audit = bannerData.degreeAudit;
  const urgentDeadlines = profile.applicationDeadlineSoon.filter((i) => i.status !== 'accepted');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <header className="bg-[#1B2A5A] text-white px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-md">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center">
              <span className="text-[#1B2A5A] text-sm font-black">F</span>
            </div>
            <span className="font-bold text-lg">FriarAI</span>
          </Link>
          <span className="text-blue-300 hidden sm:block">›</span>
          <span className="text-white font-semibold hidden sm:block">Career Development</span>
          <Link href="/study" className="hidden md:block rounded-md px-3 py-1.5 text-sm font-medium text-blue-200 hover:bg-white/10 hover:text-white transition-colors">
            Study Coach
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-blue-200 text-sm hidden sm:block">{session.user.email}</span>
          <span className="rounded-full bg-[#C5A900] px-2.5 py-0.5 text-xs font-semibold text-[#1B2A5A]">DEMO</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">

        {/* Hero header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Career Development</h1>
          <p className="text-gray-500 text-sm mt-1">
            {audit.major} · {audit.minor ? `${audit.minor} Minor · ` : ''}{audit.expectedGraduationTerm} · GPA {audit.gpa.toFixed(2)}
          </p>
        </div>

        {/* Urgent application deadlines banner */}
        {urgentDeadlines.length > 0 && (
          <div className="mb-6 rounded-xl border-l-4 border-red-500 bg-red-50 p-4">
            <p className="font-semibold text-red-800 text-sm mb-2">
              ⚠ {urgentDeadlines.length} application deadline{urgentDeadlines.length > 1 ? 's' : ''} in the next 14 days
            </p>
            <ul className="space-y-1">
              {urgentDeadlines.map((i) => {
                const days = Math.ceil((new Date(i.deadline!).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return (
                  <li key={i.id} className="text-sm text-red-700 flex justify-between">
                    <span>{i.company} — {i.role}</span>
                    <span className="font-semibold">{days <= 0 ? 'TODAY' : `${days}d`}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Career stats strip */}
        <StaggerList className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Target Roles', value: profile.targetRoles.length.toString(), sub: profile.targetRoles[0] },
            { label: 'Opportunities', value: profile.internships.length.toString(), sub: 'tracked' },
            { label: 'Applications', value: profile.internships.filter((i) => ['applied','interviewing','offered','accepted'].includes(i.status)).length.toString(), sub: 'submitted' },
            { label: 'Top Match', value: `${profile.internships[0]?.matchScore ?? 0}%`, sub: profile.internships[0]?.company },
          ].map((stat) => (
            <StaggerItem key={stat.label}>
              <div className="rounded-xl bg-white border border-gray-200 p-4 shadow-sm text-center">
                <p className="text-2xl font-black text-[#1B2A5A]">{stat.value}</p>
                <p className="text-xs font-semibold text-gray-700 mt-0.5">{stat.label}</p>
                {stat.sub && <p className="text-xs text-gray-400 mt-0.5 truncate">{stat.sub}</p>}
              </div>
            </StaggerItem>
          ))}
        </StaggerList>

        {/* Target roles & skills */}
        <FadeUp delay={0.15} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="rounded-xl bg-white border border-gray-200 p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-3">🎯 Target Roles</h2>
            <ul className="space-y-1.5">
              {profile.targetRoles.map((r) => (
                <li key={r} className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#C5A900] flex-shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl bg-white border border-gray-200 p-5 shadow-sm">
            <h2 className="font-semibold text-gray-900 mb-3">🛠 Skills on Resume</h2>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((s) => (
                <span key={s} className="rounded-full bg-[#1B2A5A] text-white px-3 py-1 text-xs font-medium">
                  {s}
                </span>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-3">Skills are pulled from your resume profile</p>
          </div>
        </FadeUp>

        {/* Main 3-col grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: internship pipeline */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">💼 Internship Pipeline</h2>
              <span className="text-xs text-gray-500">Sorted by match score</span>
            </div>
            <StaggerList className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {profile.internships.map((i) => (
                <StaggerItem key={i.id}>
                  <InternshipCard internship={i} />
                </StaggerItem>
              ))}
            </StaggerList>
          </div>

          {/* Right: resume review + AI coach */}
          <FadeUp delay={0.2} className="lg:col-span-1 space-y-6">

            {/* Resume review */}
            <div className="rounded-xl bg-white border border-gray-200 p-5 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-4">📄 Resume Review</h2>
              <ResumeReview sections={profile.resumeSections} />
            </div>

            {/* Career AI chat */}
            <div className="rounded-xl bg-white border border-gray-200 shadow-sm flex flex-col" style={{ height: '540px' }}>
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">🤝 Career Coach</h2>
                <p className="text-xs text-gray-500 mt-0.5">Knows your major, GPA, courses & target roles</p>
              </div>
              <div className="flex-1 overflow-hidden">
                <CareerChat />
              </div>
            </div>

          </FadeUp>
        </div>

        {/* AI Job Discovery */}
        <FadeUp delay={0.1} className="mt-8">
          <div className="rounded-xl bg-white border border-gray-200 p-6 shadow-sm">
            <JobDiscovery />
          </div>
        </FadeUp>

        {/* PC Career resources footer */}
        <div className="mt-8 rounded-xl bg-[#1B2A5A] p-6 text-white">
          <h2 className="font-semibold mb-4">🏛 Providence College Career Resources</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { name: 'Career Center', desc: 'Resume reviews, mock interviews, job fairs', url: 'https://careercenter.providence.edu' },
              { name: 'Handshake', desc: 'Job & internship postings curated for PC students', url: 'https://app.joinhandshake.com' },
              { name: 'PC Alumni Network', desc: 'Connect with Friars working in your target industry', url: 'https://alumni.providence.edu' },
            ].map((r) => (
              <a
                key={r.name}
                href={r.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg bg-white/10 hover:bg-white/20 transition-colors p-4 block"
              >
                <p className="font-semibold text-sm">{r.name}</p>
                <p className="text-xs text-blue-200 mt-1">{r.desc}</p>
              </a>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
