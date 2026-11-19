import { buildStudentContext } from '@/lib/twin/buildStudentContext';
import { AlertCard } from '@/components/AlertCard';
import { DeadlineList } from '@/components/DeadlineList';
import { DegreeProgress } from '@/components/DegreeProgress';
import { CalendarStrip } from '@/components/CalendarStrip';
import { Chat } from '@/components/Chat';
import { getDemoSession } from '@/lib/demoSession';
import { FadeUp, StaggerList, StaggerItem, SlideInLeft } from '@/components/Animate';
import { AppNav } from '@/components/AppNav';
import Link from 'next/link';
import { profileFromTwin } from '@/lib/connect/profile';
import { matchPeers } from '@/lib/connect/matching';
import { PEERS } from '@/lib/connect/data';

export default async function DashboardPage() {
  const session = getDemoSession();

  const context = await buildStudentContext(
    session.user.studentId,
    session.user.name ?? 'Student',
    session.user.email ?? '',
    session.user.accessToken
  );

  const { alerts, canvas, banner, calendar, career } = context;
  const firstName = session.user.name?.split(' ')[0] ?? 'Friar';
  // Connect: classmates to meet, matched from the student's own data.
  const meet = matchPeers(profileFromTwin(session.user.name ?? 'Student', banner.degreeAudit, career.profile), PEERS, 3);
  const highAlerts = alerts.filter((a) => a.severity === 'high');

  return (
    <div className="min-h-screen bg-white">
      <AppNav active="dashboard" email={session.user.email} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Greeting */}
        <FadeUp className="mb-6">
          <h1 className="page-title">
            Good {getTimeOfDay()}, {firstName} 👋
          </h1>
          <p className="text-muted text-sm mt-2">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            {highAlerts.length > 0 && (
              <span className="ml-2 font-bold text-ink">
                · {highAlerts.length} urgent item{highAlerts.length !== 1 ? 's' : ''} need your attention
              </span>
            )}
          </p>
        </FadeUp>

        {/* Urgent alerts */}
        {alerts.length > 0 && (
          <FadeUp delay={0.08}>
            <section className="mb-6">
              <h2 className="eyebrow mb-3">
                Alerts ({alerts.length})
              </h2>
              <StaggerList className="space-y-2">
                {alerts.slice(0, 4).map((alert) => (
                  <StaggerItem key={alert.id}>
                    <AlertCard alert={alert} />
                  </StaggerItem>
                ))}
              </StaggerList>
            </section>
          </FadeUp>
        )}

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: deadlines + calendar */}
          <SlideInLeft delay={0.15} className="lg:col-span-1 space-y-6">
            <div className="card">
              <h2 className="card-title mb-4">📚 Upcoming Deadlines</h2>
              <DeadlineList assignments={canvas.assignments} />
            </div>

            <div className="card">
              <h2 className="card-title mb-4">📅 Your Schedule</h2>
              <CalendarStrip events={calendar.events} />
            </div>
          </SlideInLeft>

          {/* Middle column: degree progress */}
          <FadeUp delay={0.2} className="lg:col-span-1">
            <div className="card h-full">
              <h2 className="card-title mb-4">🎓 Degree Progress</h2>
              <DegreeProgress audit={banner.degreeAudit} />
            </div>
          </FadeUp>

          {/* Right column: AI chat */}
          <FadeUp delay={0.25} className="lg:col-span-1">
            <div className="card p-0 flex flex-col overflow-hidden" style={{ height: '600px' }}>
              <div className="px-5 py-4 border-b border-line">
                <h2 className="card-title">💬 Ask FriarAI</h2>
                <p className="text-xs text-muted mt-0.5">Ask anything — powered by your academic profile</p>
              </div>
              <div className="flex-1 overflow-hidden">
                <Chat />
              </div>
            </div>
          </FadeUp>
        </div>

        {/* Connect: classmates to meet */}
        {meet.length > 0 && (
          <FadeUp delay={0.28}>
            <section className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="eyebrow">You should meet</h2>
                <Link href="/connect" className="text-xs font-bold text-ink underline">See matches &amp; clubs in Connect →</Link>
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                {meet.map((m) => (
                  <Link key={m.peer.id} href="/connect" className="card-white flex items-start gap-3 p-4 transition-colors hover:border-ink">
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-ink text-xs font-extrabold text-white">
                      {m.peer.name.split(' ').map((n) => n[0]).join('').slice(0, 2)}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-extrabold">{m.peer.name} <span className="font-normal text-muted">· {m.peer.major}</span></span>
                      <span className="mt-0.5 block text-xs leading-relaxed text-ink/70">{m.reason}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          </FadeUp>
        )}

        {/* Courses grid */}
        <FadeUp delay={0.3}>
          <section className="mt-6">
            <h2 className="eyebrow mb-3">
              Current Courses
            </h2>
            <StaggerList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {canvas.courses.map((course) => (
                <StaggerItem key={course.id}>
                  <div className="card p-4">
                    <p className="eyebrow mb-1">{course.courseCode}</p>
                    <p className="text-sm font-medium text-ink leading-snug mb-2">{course.name}</p>
                    {course.currentGrade && (
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-black tracking-[-.8px] text-ink">
                          {course.currentGrade}
                        </span>
                        {(course.currentScore ?? 100) < 70
                          ? <span className="status-pill">{course.currentScore}%</span>
                          : <span className="text-xs text-muted tabular-nums">{course.currentScore}%</span>}
                      </div>
                    )}
                  </div>
                </StaggerItem>
              ))}
            </StaggerList>
          </section>
        </FadeUp>
      </main>
    </div>
  );
}

function getTimeOfDay(): string {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

