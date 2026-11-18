import { buildStudentContext } from '@/lib/twin/buildStudentContext';
import { AlertCard } from '@/components/AlertCard';
import { DeadlineList } from '@/components/DeadlineList';
import { DegreeProgress } from '@/components/DegreeProgress';
import { CalendarStrip } from '@/components/CalendarStrip';
import { Chat } from '@/components/Chat';
import { getDemoSession } from '@/lib/demoSession';

export default async function DashboardPage() {
  const session = getDemoSession();

  const context = await buildStudentContext(
    session.user.studentId,
    session.user.name ?? 'Student',
    session.user.email ?? '',
    session.user.accessToken
  );

  const { alerts, canvas, banner, calendar } = context;
  const firstName = session.user.name?.split(' ')[0] ?? 'Friar';
  const highAlerts = alerts.filter((a) => a.severity === 'high');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top nav */}
      <header className="bg-[#1B2A5A] text-white px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-md">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center">
            <span className="text-[#1B2A5A] text-sm font-black">F</span>
          </div>
          <span className="font-bold text-lg">FriarAI</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-blue-200 text-sm hidden sm:block">{session.user.email}</span>
          <span className="rounded-full bg-[#C5A900] px-2.5 py-0.5 text-xs font-semibold text-[#1B2A5A]">
            DEMO
          </span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Greeting */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Good {getTimeOfDay()}, {firstName} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-0.5">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            {highAlerts.length > 0 && (
              <span className="ml-2 text-red-600 font-medium">
                · {highAlerts.length} urgent item{highAlerts.length !== 1 ? 's' : ''} need your attention
              </span>
            )}
          </p>
        </div>

        {/* Urgent alerts */}
        {alerts.length > 0 && (
          <section className="mb-6">
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Alerts ({alerts.length})
            </h2>
            <div className="space-y-2">
              {alerts.slice(0, 4).map((alert) => (
                <AlertCard key={alert.id} alert={alert} />
              ))}
            </div>
          </section>
        )}

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column: deadlines + calendar */}
          <div className="lg:col-span-1 space-y-6">
            <div className="rounded-xl bg-white border border-gray-200 p-5 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-4">📚 Upcoming Deadlines</h2>
              <DeadlineList assignments={canvas.assignments} />
            </div>

            <div className="rounded-xl bg-white border border-gray-200 p-5 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-4">📅 Your Schedule</h2>
              <CalendarStrip events={calendar.events} />
            </div>
          </div>

          {/* Middle column: degree progress */}
          <div className="lg:col-span-1">
            <div className="rounded-xl bg-white border border-gray-200 p-5 shadow-sm h-full">
              <h2 className="font-semibold text-gray-900 mb-4">🎓 Degree Progress</h2>
              <DegreeProgress audit={banner.degreeAudit} />
            </div>
          </div>

          {/* Right column: AI chat */}
          <div className="lg:col-span-1">
            <div className="rounded-xl bg-white border border-gray-200 shadow-sm flex flex-col" style={{ height: '600px' }}>
              <div className="px-5 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">💬 Ask FriarAI</h2>
                <p className="text-xs text-gray-500 mt-0.5">Ask anything — powered by your academic profile</p>
              </div>
              <div className="flex-1 overflow-hidden">
                <Chat />
              </div>
            </div>
          </div>
        </div>

        {/* Courses grid */}
        <section className="mt-6">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Current Courses
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {canvas.courses.map((course) => (
              <div key={course.id} className="rounded-xl bg-white border border-gray-200 p-4 shadow-sm">
                <p className="text-xs text-[#C5A900] font-semibold mb-1">{course.courseCode}</p>
                <p className="text-sm font-medium text-gray-900 leading-snug mb-2">{course.name}</p>
                {course.currentGrade && (
                  <div className="flex items-center justify-between">
                    <span className={`text-lg font-bold ${gradeColor(course.currentScore ?? 0)}`}>
                      {course.currentGrade}
                    </span>
                    <span className="text-xs text-gray-400">{course.currentScore}%</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
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

function gradeColor(score: number): string {
  if (score >= 90) return 'text-green-600';
  if (score >= 80) return 'text-blue-600';
  if (score >= 70) return 'text-amber-600';
  return 'text-red-600';
}
