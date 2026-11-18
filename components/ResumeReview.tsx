import type { ResumeSection, ResumeStrength } from '@/types/career';

// Relay design: strength by form. Missing = filled black, needs work = outlined, strong = quiet tag.
const strengthConfig: Record<ResumeStrength, { label: string; pill: string }> = {
  strong:     { label: 'Strong',     pill: 'dept-tag' },
  needs_work: { label: 'Needs Work', pill: 'status-pill' },
  missing:    { label: 'Missing',    pill: 'status-pill is-filled' },
};

export function ResumeReview({ sections }: { sections: ResumeSection[] }) {
  const score = Math.round(
    (sections.filter((s) => s.strength === 'strong').length / sections.length) * 100
  );

  return (
    <div className="space-y-5">
      {/* Overall score */}
      <div className="card-dark flex items-center gap-4">
        <div className="text-center">
          <p className="text-3xl font-black tracking-[-1px] tabular-nums">{score}%</p>
          <p className="text-[10px] font-extrabold uppercase tracking-[.1em] opacity-50 mt-0.5">Resume score</p>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm">
            {score >= 80 ? 'Your resume is in good shape!' : score >= 50 ? 'Some key gaps to address.' : 'Resume needs significant work before applying.'}
          </p>
          <p className="text-xs opacity-60 mt-0.5">
            {sections.filter((s) => s.strength === 'missing').length > 0
              ? `${sections.filter((s) => s.strength === 'missing').length} section(s) missing entirely`
              : 'All sections present'}
          </p>
        </div>
      </div>

      {/* Section breakdown */}
      <div className="space-y-3">
        {sections.map((s) => {
          const cfg = strengthConfig[s.strength];
          return (
            <div key={s.section} className="rounded-card-sm border border-line p-4 bg-white">
              <div className="flex items-center justify-between mb-2">
                <span className="font-extrabold text-sm text-ink">{s.section}</span>
                <span className={cfg.pill}>{cfg.label}</span>
              </div>
              <p className="text-xs text-ink/80 mb-2">{s.feedback}</p>
              <div className="flex items-start gap-1.5">
                <span className="text-muted text-xs mt-0.5 flex-shrink-0">→</span>
                <p className="text-xs text-muted">{s.suggestion}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Book appointment CTA */}
      <a
        href="https://careercenter.providence.edu"
        target="_blank"
        rel="noopener noreferrer"
        className="btn-outline w-full"
      >
        📅 Book a Resume Review at Career Center
      </a>
    </div>
  );
}
