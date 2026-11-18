import type { ResumeSection, ResumeStrength } from '@/types/career';
import clsx from 'clsx';

const strengthConfig: Record<ResumeStrength, { label: string; icon: string; bar: string; text: string }> = {
  strong:      { label: 'Strong',      icon: '✅', bar: 'bg-green-500', text: 'text-green-700' },
  needs_work:  { label: 'Needs Work',  icon: '⚠️', bar: 'bg-amber-400', text: 'text-amber-700' },
  missing:     { label: 'Missing',     icon: '❌', bar: 'bg-red-400',   text: 'text-red-700'   },
};

export function ResumeReview({ sections }: { sections: ResumeSection[] }) {
  const score = Math.round(
    (sections.filter((s) => s.strength === 'strong').length / sections.length) * 100
  );

  return (
    <div className="space-y-5">
      {/* Overall score */}
      <div className="flex items-center gap-4 rounded-xl bg-[#1B2A5A] p-4 text-white">
        <div className="text-center">
          <p className="text-3xl font-black">{score}%</p>
          <p className="text-xs text-blue-200 mt-0.5">Resume Score</p>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm">
            {score >= 80 ? 'Your resume is in good shape!' : score >= 50 ? 'Some key gaps to address.' : 'Resume needs significant work before applying.'}
          </p>
          <p className="text-xs text-blue-200 mt-0.5">
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
            <div key={s.section} className="rounded-lg border border-gray-100 p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm text-gray-900">{cfg.icon} {s.section}</span>
                <span className={clsx('text-xs font-semibold', cfg.text)}>{cfg.label}</span>
              </div>
              <p className="text-xs text-gray-600 mb-2">{s.feedback}</p>
              <div className="flex items-start gap-1.5">
                <span className="text-[#C5A900] text-xs mt-0.5 flex-shrink-0">💡</span>
                <p className="text-xs text-gray-500">{s.suggestion}</p>
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
        className="flex items-center justify-center gap-2 rounded-xl border-2 border-[#1B2A5A] px-4 py-3 text-sm font-semibold text-[#1B2A5A] hover:bg-[#1B2A5A] hover:text-white transition-colors"
      >
        📅 Book a Resume Review at Career Center
      </a>
    </div>
  );
}
