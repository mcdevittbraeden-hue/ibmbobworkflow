import {
  CAMPUS_OFFICES,
  DINING_HALLS,
  RESIDENCE_HALLS,
  STUDENT_ORGS,
} from '@/lib/campus/pcData';
import type { CampusCategory } from '@/lib/campus/pcData';
import { CampusChat } from '@/components/CampusChat';
import { FadeUp, StaggerList, StaggerItem } from '@/components/Animate';
import { getDemoSession } from '@/lib/demoSession';
import Link from 'next/link';

const CATEGORY_META: Record<CampusCategory, { label: string; emoji: string; color: string }> = {
  dining:       { label: 'Dining',        emoji: '🍽',  color: 'bg-orange-100 text-orange-700' },
  housing:      { label: 'Housing',       emoji: '🏠',  color: 'bg-blue-100 text-blue-700' },
  financial_aid:{ label: 'Financial Aid', emoji: '💰',  color: 'bg-green-100 text-green-700' },
  academics:    { label: 'Academics',     emoji: '📚',  color: 'bg-purple-100 text-purple-700' },
  athletics:    { label: 'Athletics',     emoji: '⚡',  color: 'bg-red-100 text-red-700' },
  health_wellness:{ label: 'Health',      emoji: '❤️',  color: 'bg-pink-100 text-pink-700' },
  student_life: { label: 'Student Life',  emoji: '🎓',  color: 'bg-indigo-100 text-indigo-700' },
  it_facilities:{ label: 'IT & Facilities',emoji: '🔧', color: 'bg-gray-100 text-gray-700' },
  public_safety:{ label: 'Public Safety', emoji: '🛡',  color: 'bg-slate-100 text-slate-700' },
  registrar:    { label: 'Registrar',     emoji: '📋',  color: 'bg-teal-100 text-teal-700' },
};

export default function CampusPage() {
  const session = getDemoSession();

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
          <span className="text-white font-semibold hidden sm:block">Campus Info</span>
          <nav className="hidden md:flex items-center gap-1 ml-4">
            <Link href="/career" className="rounded-md px-3 py-1.5 text-sm font-medium text-blue-200 hover:bg-white/10 hover:text-white transition-colors">
              Career
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-blue-200 text-sm hidden sm:block">{session.user.email}</span>
          <span className="rounded-full bg-[#C5A900] px-2.5 py-0.5 text-xs font-semibold text-[#1B2A5A]">DEMO</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <FadeUp>
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Campus Information</h1>
            <p className="text-gray-500 text-sm mt-1">Every office, dining hall, residence, and resource at Providence College.</p>
          </div>
        </FadeUp>

        {/* Two-column layout: info left, AI triage right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left 2/3: campus info */}
          <div className="lg:col-span-2 space-y-8">

            {/* Office directory */}
            <FadeUp delay={0.05}>
              <section>
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">📞 Campus Offices</h2>
                <StaggerList className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {CAMPUS_OFFICES.map((office) => {
                    const meta = CATEGORY_META[office.category];
                    return (
                      <StaggerItem key={office.id}>
                        <div className="rounded-xl bg-white border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow h-full flex flex-col gap-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-sm text-gray-900">{office.name}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{office.building}</p>
                            </div>
                            <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${meta.color}`}>
                              {meta.emoji} {meta.label}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 leading-relaxed">{office.description}</p>
                          <div className="flex flex-wrap gap-3 mt-auto pt-2 border-t border-gray-50 text-xs">
                            <a href={`tel:${office.phone}`} className="text-[#1B2A5A] font-medium hover:underline">
                              📞 {office.phone}
                            </a>
                            {office.email && (
                              <a href={`mailto:${office.email}`} className="text-[#1B2A5A] font-medium hover:underline truncate">
                                ✉ {office.email}
                              </a>
                            )}
                            <a href={office.url} target="_blank" rel="noopener noreferrer"
                              className="text-[#C5A900] font-semibold hover:underline ml-auto">
                              Website →
                            </a>
                          </div>
                          {office.hours && (
                            <p className="text-xs text-gray-400">{office.hours.weekday}{office.hours.notes ? ` · ${office.hours.notes}` : ''}</p>
                          )}
                          {/* Common issues */}
                          <details className="mt-1">
                            <summary className="text-xs text-[#1B2A5A] font-medium cursor-pointer hover:underline">
                              Common issues & solutions ▾
                            </summary>
                            <ul className="mt-2 space-y-2">
                              {office.commonIssues.map((ci) => (
                                <li key={ci.issue} className="text-xs rounded-lg bg-gray-50 p-2 border border-gray-100">
                                  <p className="font-semibold text-gray-700">❓ {ci.issue}</p>
                                  <p className="text-gray-500 mt-0.5">→ {ci.resolution}</p>
                                </li>
                              ))}
                            </ul>
                          </details>
                        </div>
                      </StaggerItem>
                    );
                  })}
                </StaggerList>
              </section>
            </FadeUp>

            {/* Dining */}
            <FadeUp delay={0.1}>
              <section>
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">🍽 Dining Halls</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {DINING_HALLS.map((d) => (
                    <div key={d.id} className="rounded-xl bg-white border border-gray-200 p-4 shadow-sm">
                      <p className="font-semibold text-sm text-gray-900">{d.name}</p>
                      <p className="text-xs text-gray-500 mb-2">{d.location}</p>
                      <div className="space-y-0.5 text-xs text-gray-600">
                        {d.hours.breakfast && <p>🌅 Breakfast: {d.hours.breakfast}</p>}
                        {d.hours.lunch    && <p>☀️ Lunch: {d.hours.lunch}</p>}
                        {d.hours.dinner   && <p>🌙 Dinner: {d.hours.dinner}</p>}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {d.features.map((f) => (
                          <span key={f} className="rounded-full bg-orange-50 text-orange-700 px-2 py-0.5 text-xs">{f}</span>
                        ))}
                      </div>
                      {d.notes && <p className="text-xs text-gray-400 mt-2 italic">{d.notes}</p>}
                    </div>
                  ))}
                </div>
              </section>
            </FadeUp>

            {/* Residence Halls */}
            <FadeUp delay={0.15}>
              <section>
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">🏠 Residence Halls</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {RESIDENCE_HALLS.map((r) => (
                    <div key={r.id} className="rounded-xl bg-white border border-gray-200 p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="font-semibold text-sm text-gray-900">{r.name}</p>
                        <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                          r.type === 'freshman' ? 'bg-blue-100 text-blue-700' :
                          r.type === 'apartment' ? 'bg-green-100 text-green-700' :
                          r.type === 'suite' ? 'bg-purple-100 text-purple-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {r.type}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mb-2">Capacity: {r.capacity}</p>
                      <div className="flex flex-wrap gap-1">
                        {r.features.map((f) => (
                          <span key={f} className="text-xs text-gray-500">· {f}</span>
                        ))}
                      </div>
                      {r.notes && <p className="text-xs text-gray-400 mt-2 italic">{r.notes}</p>}
                    </div>
                  ))}
                </div>
              </section>
            </FadeUp>

            {/* Student Orgs */}
            <FadeUp delay={0.2}>
              <section>
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">🎓 Student Organizations</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {STUDENT_ORGS.map((org) => (
                    <div key={org.id} className="rounded-xl bg-white border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                      <p className="font-semibold text-sm text-gray-900">{org.name}</p>
                      <span className="inline-block mt-1 mb-2 rounded-full bg-indigo-50 text-indigo-700 px-2 py-0.5 text-xs font-medium">
                        {org.category}
                      </span>
                      <p className="text-xs text-gray-600 leading-relaxed">{org.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            </FadeUp>

          </div>

          {/* Right 1/3: AI campus triage chat */}
          <FadeUp delay={0.1} className="lg:col-span-1">
            <div className="sticky top-20">
              <div className="rounded-xl bg-white border border-gray-200 shadow-sm flex flex-col" style={{ height: '700px' }}>
                <div className="px-5 py-4 border-b border-gray-100">
                  <h2 className="font-semibold text-gray-900">🏛 Campus Issue Triage</h2>
                  <p className="text-xs text-gray-500 mt-0.5">Describe any problem — I&apos;ll route you to the right office with their exact contact info</p>
                </div>
                <div className="flex-1 overflow-hidden">
                  <CampusChat />
                </div>
              </div>
            </div>
          </FadeUp>

        </div>
      </main>
    </div>
  );
}
