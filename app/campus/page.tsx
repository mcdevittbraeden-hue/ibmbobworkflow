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
import { AppNav } from '@/components/AppNav';

const CATEGORY_META: Record<CampusCategory, { label: string; emoji: string }> = {
  dining:          { label: 'Dining',          emoji: '🍽' },
  housing:         { label: 'Housing',         emoji: '🏠' },
  financial_aid:   { label: 'Financial Aid',   emoji: '💰' },
  academics:       { label: 'Academics',       emoji: '📚' },
  athletics:       { label: 'Athletics',       emoji: '⚡' },
  health_wellness: { label: 'Health',          emoji: '❤️' },
  student_life:    { label: 'Student Life',    emoji: '🎓' },
  it_facilities:   { label: 'IT & Facilities', emoji: '🔧' },
  public_safety:   { label: 'Public Safety',   emoji: '🛡' },
  registrar:       { label: 'Registrar',       emoji: '📋' },
};

export default function CampusPage() {
  const session = getDemoSession();

  return (
    <div className="min-h-screen bg-white">
      <AppNav active="campus" email={session.user.email} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        <FadeUp>
          <div className="mb-6">
            <h1 className="page-title">Campus Information</h1>
            <p className="text-muted text-sm mt-2">Every office, dining hall, residence, and resource at Providence College.</p>
          </div>
        </FadeUp>

        {/* Two-column layout: info left, AI triage right */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left 2/3: campus info */}
          <div className="lg:col-span-2 space-y-8">

            {/* Office directory */}
            <FadeUp delay={0.05}>
              <section>
                <h2 className="eyebrow mb-4">📞 Campus Offices</h2>
                <StaggerList className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {CAMPUS_OFFICES.map((office) => {
                    const meta = CATEGORY_META[office.category];
                    return (
                      <StaggerItem key={office.id}>
                        <div className="card p-4 h-full flex flex-col gap-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="font-extrabold tracking-[-.2px] text-sm text-ink">{office.name}</p>
                              <p className="text-xs text-muted mt-0.5">{office.building}</p>
                            </div>
                            <span className="dept-tag flex-shrink-0">
                              {meta.emoji} {meta.label}
                            </span>
                          </div>
                          <p className="text-xs text-ink/80 leading-relaxed">{office.description}</p>
                          <div className="flex flex-wrap gap-3 mt-auto pt-2 border-t border-line text-xs">
                            <a href={`tel:${office.phone}`} className="text-ink font-medium hover:underline">
                              📞 {office.phone}
                            </a>
                            {office.email && (
                              <a href={`mailto:${office.email}`} className="text-ink font-medium hover:underline truncate">
                                ✉ {office.email}
                              </a>
                            )}
                            <a href={office.url} target="_blank" rel="noopener noreferrer"
                              className="text-muted font-semibold hover:underline ml-auto">
                              Website →
                            </a>
                          </div>
                          {office.hours && (
                            <p className="text-xs text-muted">{office.hours.weekday}{office.hours.notes ? ` · ${office.hours.notes}` : ''}</p>
                          )}
                          {/* Common issues */}
                          <details className="mt-1">
                            <summary className="text-xs text-ink font-medium cursor-pointer hover:underline">
                              Common issues & solutions ▾
                            </summary>
                            <ul className="mt-2 space-y-2">
                              {office.commonIssues.map((ci) => (
                                <li key={ci.issue} className="text-xs rounded-card-sm bg-white p-2 border border-line">
                                  <p className="font-semibold text-ink/80">❓ {ci.issue}</p>
                                  <p className="text-muted mt-0.5">→ {ci.resolution}</p>
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
                <h2 className="eyebrow mb-4">🍽 Dining Halls</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {DINING_HALLS.map((d) => (
                    <div key={d.id} className="card p-4">
                      <p className="font-extrabold tracking-[-.2px] text-sm text-ink">{d.name}</p>
                      <p className="text-xs text-muted mb-2">{d.location}</p>
                      <div className="space-y-0.5 text-xs text-ink/80">
                        {d.hours.breakfast && <p>🌅 Breakfast: {d.hours.breakfast}</p>}
                        {d.hours.lunch    && <p>☀️ Lunch: {d.hours.lunch}</p>}
                        {d.hours.dinner   && <p>🌙 Dinner: {d.hours.dinner}</p>}
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-3">
                        {d.features.map((f) => (
                          <span key={f} className="dept-tag">{f}</span>
                        ))}
                      </div>
                      {d.notes && <p className="text-xs text-muted mt-2 italic">{d.notes}</p>}
                    </div>
                  ))}
                </div>
              </section>
            </FadeUp>

            {/* Residence Halls */}
            <FadeUp delay={0.15}>
              <section>
                <h2 className="eyebrow mb-4">🏠 Residence Halls</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {RESIDENCE_HALLS.map((r) => (
                    <div key={r.id} className="card p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="font-extrabold tracking-[-.2px] text-sm text-ink">{r.name}</p>
                        <span className="dept-tag flex-shrink-0 capitalize">
                          {r.type}
                        </span>
                      </div>
                      <p className="text-xs text-muted mb-2">Capacity: {r.capacity}</p>
                      <div className="flex flex-wrap gap-1">
                        {r.features.map((f) => (
                          <span key={f} className="text-xs text-muted">· {f}</span>
                        ))}
                      </div>
                      {r.notes && <p className="text-xs text-muted mt-2 italic">{r.notes}</p>}
                    </div>
                  ))}
                </div>
              </section>
            </FadeUp>

            {/* Student Orgs */}
            <FadeUp delay={0.2}>
              <section>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="eyebrow">🎓 Student Organizations</h2>
                  <Link href="/connect" className="text-xs font-bold text-ink underline">See clubs matched to you →</Link>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {STUDENT_ORGS.map((org) => (
                    <div key={org.id} className="card p-4">
                      <p className="font-extrabold tracking-[-.2px] text-sm text-ink">{org.name}</p>
                      <span className="dept-tag mt-1 mb-2">
                        {org.category}
                      </span>
                      <p className="text-xs text-ink/80 leading-relaxed">{org.description}</p>
                    </div>
                  ))}
                </div>
              </section>
            </FadeUp>

          </div>

          {/* Right 1/3: AI campus triage chat */}
          <FadeUp delay={0.1} className="lg:col-span-1">
            <div className="sticky top-20">
              <div className="card p-0 flex flex-col overflow-hidden" style={{ height: '640px' }}>
                <div className="px-5 py-4 border-b border-line">
                  <h2 className="card-title">🏛 Campus Issue Triage</h2>
                  <p className="text-xs text-muted mt-0.5">Describe any problem — I&apos;ll route you to the right office with their exact contact info</p>
                </div>
                <div className="flex-1 overflow-hidden">
                  <CampusChat />
                </div>
              </div>
              <Link href="/relay" className="card-dark mt-4 block hover:bg-ink-hover transition-colors">
                <p className="text-[10px] font-extrabold uppercase tracking-[.1em] opacity-50">Relay</p>
                <p className="mt-0.5 text-sm font-extrabold">Need someone to actually fix it?</p>
                <p className="mt-1 text-xs opacity-75">Relay finds the people who can fix it, drafts the message and tracks the case until it&apos;s resolved.</p>
                <p className="mt-2 text-sm font-bold underline">Send it with Relay →</p>
              </Link>
            </div>
          </FadeUp>

        </div>
      </main>
    </div>
  );
}
