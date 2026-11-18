import { connection } from 'next/server';
import { getDemoSession } from '@/lib/demoSession';
import { getCareerData } from '@/lib/integrations/career';
import { getBannerData } from '@/lib/integrations/banner';
import { InternshipCard } from '@/components/InternshipCard';
import { ResumeReview } from '@/components/ResumeReview';
import { CareerChat } from '@/components/CareerChat';
import { JobDiscovery } from '@/components/JobDiscovery';
import { FadeUp, StaggerList, StaggerItem } from '@/components/Animate';
import { AppNav } from '@/components/AppNav';

/** Whole days until an ISO date (request-time; the page awaits connection()). */
function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

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
    <div className="min-h-screen bg-white">
      <AppNav active="career" email={session.user.email} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">

        {/* Hero header */}
        <div className="mb-6">
          <h1 className="page-title">Career Development</h1>
          <p className="text-muted text-sm mt-2">
            {audit.major} · {audit.minor ? `${audit.minor} Minor · ` : ''}{audit.expectedGraduationTerm} · GPA {audit.gpa.toFixed(2)}
          </p>
        </div>

        {/* Urgent application deadlines banner */}
        {urgentDeadlines.length > 0 && (
          <div className="mb-6 card-dark">
            <p className="font-extrabold text-sm mb-2">
              ⚠ {urgentDeadlines.length} application deadline{urgentDeadlines.length > 1 ? 's' : ''} in the next 14 days
            </p>
            <ul className="space-y-1">
              {urgentDeadlines.map((i) => {
                const days = daysUntil(i.deadline!);
                return (
                  <li key={i.id} className="text-sm flex justify-between gap-3">
                    <span className="opacity-75">{i.company} — {i.role}</span>
                    <span className="font-bold tabular-nums">{days <= 0 ? 'TODAY' : `${days}d`}</span>
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
              <div className="card p-4 text-center">
                <p className="text-3xl font-black tracking-[-1px] text-ink tabular-nums">{stat.value}</p>
                <p className="eyebrow mt-1">{stat.label}</p>
                {stat.sub && <p className="text-xs text-muted mt-0.5 truncate">{stat.sub}</p>}
              </div>
            </StaggerItem>
          ))}
        </StaggerList>

        {/* Target roles & skills */}
        <FadeUp delay={0.15} className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="card">
            <h2 className="card-title mb-3">🎯 Target Roles</h2>
            <ul className="space-y-1.5">
              {profile.targetRoles.map((r) => (
                <li key={r} className="flex items-center gap-2 text-sm text-ink/80">
                  <span className="h-1.5 w-1.5 rounded-full bg-ink flex-shrink-0" />
                  {r}
                </li>
              ))}
            </ul>
          </div>
          <div className="card">
            <h2 className="card-title mb-3">🛠 Skills on Resume</h2>
            <div className="flex flex-wrap gap-2">
              {profile.skills.map((s) => (
                <span key={s} className="dept-tag">
                  {s}
                </span>
              ))}
            </div>
            <p className="text-xs text-muted mt-3">Skills are pulled from your resume profile</p>
          </div>
        </FadeUp>

        {/* Main 3-col grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left: internship pipeline */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="card-title">💼 Internship Pipeline</h2>
              <span className="text-xs text-muted">Sorted by match score</span>
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
            <div className="card">
              <h2 className="card-title mb-4">📄 Resume Review</h2>
              <ResumeReview sections={profile.resumeSections} />
            </div>

            {/* Career AI chat */}
            <div className="card p-0 flex flex-col overflow-hidden" style={{ height: '540px' }}>
              <div className="px-5 py-4 border-b border-line">
                <h2 className="card-title">🤝 Career Coach</h2>
                <p className="text-xs text-muted mt-0.5">Knows your major, GPA, courses & target roles</p>
              </div>
              <div className="flex-1 overflow-hidden">
                <CareerChat />
              </div>
            </div>

          </FadeUp>
        </div>

        {/* AI Job Discovery */}
        <FadeUp delay={0.1} className="mt-8">
          <div className="card">
            <JobDiscovery />
          </div>
        </FadeUp>

        {/* PC Career resources footer */}
        <div className="mt-8 rounded-card bg-ink p-6 text-white">
          <h2 className="text-[17px] font-black tracking-[-.4px] mb-4">🏛 Providence College Career Resources</h2>
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
                className="rounded-card-sm border border-white/15 hover:border-white/60 transition-colors p-4 block"
              >
                <p className="font-bold text-sm">{r.name} →</p>
                <p className="text-xs text-white/60 mt-1">{r.desc}</p>
              </a>
            ))}
          </div>
        </div>

      </main>
    </div>
  );
}
