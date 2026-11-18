import type { BannerDegreeAudit, DegreeRequirement } from '@/types/banner';

function ProgressBar({ value, max, color = 'bg-ink' }: { value: number; max: number; color?: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="h-2 w-full rounded-full bg-surface2 overflow-hidden">
      <div
        className={`h-full rounded-full transition-all ${color}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function RequirementRow({ req }: { req: DegreeRequirement }) {
  const total = req.required;
  const done = req.completed;
  const inProg = req.inProgress;
  const pct = Math.round((done / total) * 100);

  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs">
        <span className="text-ink/80 font-medium truncate max-w-[200px]">{req.category}</span>
        <span className="text-muted ml-2 flex-shrink-0">
          {done}/{total} cr
          {inProg > 0 && <span className="text-muted ml-1">(+{inProg} in progress)</span>}
        </span>
      </div>
      <ProgressBar value={done} max={total} />
      <p className="text-xs text-muted">{pct}% complete</p>
    </div>
  );
}

export function DegreeProgress({ audit }: { audit: BannerDegreeAudit }) {
  const totalPct = Math.round((audit.creditsCompleted / audit.totalCreditsRequired) * 100);

  return (
    <div className="space-y-5">
      {/* Overall progress */}
      <div>
        <div className="flex justify-between items-end mb-2">
          <div>
            <p className="text-sm font-black tracking-[-.4px] text-ink">{audit.major}</p>
            {audit.minor && <p className="text-xs text-muted">Minor: {audit.minor}</p>}
          </div>
          <div className="text-right">
            <p className="text-3xl font-black tracking-[-1px] text-ink tabular-nums">{totalPct}%</p>
            <p className="text-xs text-muted">toward graduation</p>
          </div>
        </div>
        <ProgressBar value={audit.creditsCompleted} max={audit.totalCreditsRequired} color="bg-ink" />
        <div className="flex justify-between mt-1 text-xs text-muted">
          <span>{audit.creditsCompleted} completed</span>
          <span>{audit.creditsInProgress} in progress</span>
          <span>{audit.creditsRemaining} remaining</span>
        </div>
      </div>

      {/* GPA & standing */}
      <div className="flex gap-4">
        <div className="flex-1 rounded-card-sm bg-white p-3 text-center border border-line">
          <p className="text-xl font-black tracking-[-.6px] text-ink tabular-nums">{audit.gpa.toFixed(2)}</p>
          <p className="text-xs text-muted mt-0.5">GPA</p>
        </div>
        <div className="flex-1 rounded-card-sm bg-white p-3 text-center border border-line">
          <p className="text-sm font-black tracking-[-.4px] text-ink leading-tight">{audit.expectedGraduationTerm}</p>
          <p className="text-xs text-muted mt-0.5">Expected Grad</p>
        </div>
        <div className="flex-1 rounded-card-sm bg-white p-3 text-center border border-line">
          <p className={`text-xs font-semibold leading-tight ${
            audit.academicStanding === 'Good Standing' || audit.academicStanding === "Dean's List"
              ? 'font-bold text-ink'
              : 'font-extrabold text-ink underline decoration-2 underline-offset-2'
          }`}>
            {audit.academicStanding}
          </p>
          <p className="text-xs text-muted mt-0.5">Standing</p>
        </div>
      </div>

      {/* Requirement breakdown */}
      <div className="space-y-3">
        <p className="eyebrow">Requirements</p>
        {audit.requirements.map((req) => (
          <RequirementRow key={req.category} req={req} />
        ))}
      </div>
    </div>
  );
}
