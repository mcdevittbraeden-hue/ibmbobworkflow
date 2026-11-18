import type { BannerDegreeAudit, DegreeRequirement } from '@/types/banner';

function ProgressBar({ value, max, color = 'bg-[#1B2A5A]' }: { value: number; max: number; color?: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
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
        <span className="text-gray-700 font-medium truncate max-w-[200px]">{req.category}</span>
        <span className="text-gray-500 ml-2 flex-shrink-0">
          {done}/{total} cr
          {inProg > 0 && <span className="text-[#C5A900] ml-1">(+{inProg} in progress)</span>}
        </span>
      </div>
      <ProgressBar value={done} max={total} />
      <p className="text-xs text-gray-400">{pct}% complete</p>
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
            <p className="text-sm font-semibold text-gray-900">{audit.major}</p>
            {audit.minor && <p className="text-xs text-gray-500">Minor: {audit.minor}</p>}
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-[#1B2A5A]">{totalPct}%</p>
            <p className="text-xs text-gray-500">toward graduation</p>
          </div>
        </div>
        <ProgressBar value={audit.creditsCompleted} max={audit.totalCreditsRequired} color="bg-[#1B2A5A]" />
        <div className="flex justify-between mt-1 text-xs text-gray-500">
          <span>{audit.creditsCompleted} completed</span>
          <span>{audit.creditsInProgress} in progress</span>
          <span>{audit.creditsRemaining} remaining</span>
        </div>
      </div>

      {/* GPA & standing */}
      <div className="flex gap-4">
        <div className="flex-1 rounded-lg bg-gray-50 p-3 text-center border border-gray-100">
          <p className="text-xl font-bold text-gray-900">{audit.gpa.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-0.5">GPA</p>
        </div>
        <div className="flex-1 rounded-lg bg-gray-50 p-3 text-center border border-gray-100">
          <p className="text-sm font-semibold text-gray-900 leading-tight">{audit.expectedGraduationTerm}</p>
          <p className="text-xs text-gray-500 mt-0.5">Expected Grad</p>
        </div>
        <div className="flex-1 rounded-lg bg-gray-50 p-3 text-center border border-gray-100">
          <p className={`text-xs font-semibold leading-tight ${
            audit.academicStanding === 'Good Standing' || audit.academicStanding === "Dean's List"
              ? 'text-green-700'
              : 'text-red-700'
          }`}>
            {audit.academicStanding}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">Standing</p>
        </div>
      </div>

      {/* Requirement breakdown */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Requirements</p>
        {audit.requirements.map((req) => (
          <RequirementRow key={req.category} req={req} />
        ))}
      </div>
    </div>
  );
}
