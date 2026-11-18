'use client';

import { useState, useEffect, useMemo } from 'react';
import type { JobListing, JobScrapeResult, DeadlineNotification } from '@/types/jobs';
import { NotificationBanner } from '@/components/NotificationBanner';
import { getDeadlineNotifications } from '@/lib/jobs/scraper';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

type LocationFilter = 'all' | 'remote' | 'hybrid' | 'onsite';
type SortBy = 'match' | 'deadline';

function MatchBar({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 rounded-full bg-surface2 overflow-hidden flex-shrink-0">
        <div className="h-full rounded-full bg-ink transition-all duration-700" style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-medium text-ink/80 tabular-nums">{score}% match</span>
    </div>
  );
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function JobCard({ job }: { job: JobListing }) {
  const days = daysUntil(job.deadline);
  const isUrgent = days !== null && days <= 3;
  const isSoon = days !== null && days <= 10;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.25 }}
      className="card-white p-5 flex flex-col gap-3"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-black tracking-[-.4px] text-ink text-[15px] leading-snug">{job.title}</p>
          <p className="text-sm text-ink font-medium">{job.company}</p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className="text-xs text-muted">{job.location}</span>
            <span className="dept-tag capitalize">
              {job.locationType}
            </span>
          </div>
        </div>
        <span className="flex-shrink-0 text-xs text-muted">{job.source}</span>
      </div>

      {/* Match + deadline row */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <MatchBar score={job.matchScore} />
        {days !== null && (
          <span className={clsx(
            'text-xs tabular-nums',
            isUrgent ? 'font-extrabold text-ink' : isSoon ? 'font-semibold text-ink' : 'text-muted'
          )}>
            {isUrgent && '⚠ '}{days === 0 ? 'Due today' : days < 0 ? 'Closed' : `${days}d left`}
          </span>
        )}
      </div>

      {/* Why it matches */}
      <p className="text-xs text-ink/80 leading-relaxed border-l-2 border-ink pl-2">
        {job.matchReason}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {job.tags.slice(0, 4).map((t) => (
          <span key={t} className="dept-tag">{t}</span>
        ))}
      </div>

      {/* Salary + CTA */}
      <div className="flex items-center justify-between mt-auto pt-1">
        {job.salaryRange && (
          <span className="text-xs font-medium text-muted">{job.salaryRange}</span>
        )}
        <a
          href={job.applicationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-primary btn-sm ml-auto"
        >
          {isUrgent ? '⚡ Apply Now' : 'View & Apply →'}
        </a>
      </div>
    </motion.div>
  );
}

export function JobDiscovery() {
  const [result, setResult] = useState<JobScrapeResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [locationFilter, setLocationFilter] = useState<LocationFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('match');
  const [minScore, setMinScore] = useState(70);
  const [notifDays, setNotifDays] = useState(3);
  const [showSettings, setShowSettings] = useState(false);

  async function loadJobs(score: number) {
    try {
      const res = await fetch(`/api/jobs?minScore=${score}`);
      const data = await res.json() as JobScrapeResult;
      setResult(data);
      setHasLoaded(true);
    } catch {
      console.error('Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  }

  function fetchJobs() {
    setLoading(true);
    void loadJobs(minScore);
  }

  // Auto-load on mount (loading starts true; state is only set when the request settles)
  useEffect(() => {
    let cancelled = false;
    fetch('/api/jobs?minScore=70')
      .then((res) => res.json() as Promise<JobScrapeResult>)
      .then((data) => {
        if (cancelled) return;
        setResult(data);
        setHasLoaded(true);
      })
      .catch(() => console.error('Failed to fetch jobs'))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  // Deadline notifications at the configured threshold
  const notifications: DeadlineNotification[] = useMemo(
    () => (result ? getDeadlineNotifications(result.listings, notifDays) : []),
    [result, notifDays],
  );

  const filtered = (result?.listings ?? [])
    .filter((j) => locationFilter === 'all' || j.locationType === locationFilter)
    .sort((a, b) => {
      if (sortBy === 'match') return b.matchScore - a.matchScore;
      const dA = a.deadline ? new Date(a.deadline).getTime() : Infinity;
      const dB = b.deadline ? new Date(b.deadline).getTime() : Infinity;
      return dA - dB;
    });

  return (
    <div className="space-y-5">
      {/* Notification banners */}
      <NotificationBanner notifications={notifications} />

      {/* Header + controls */}
      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h2 className="card-title">🔍 AI Job Discovery</h2>
          {result && (
            <p className="text-xs text-muted mt-0.5">
              {result.source === 'ai_web_search' ? '🌐 Live results from web search' : '📋 Curated demo listings'} 
              {' · '}{result.listings.length} matches found
              {' · '}<span className="text-muted">Last scanned {new Date(result.scrapedAt).toLocaleTimeString()}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Location filter */}
          <div className="flex gap-1 rounded-full border border-line bg-white p-1 text-xs font-semibold">
            {(['all', 'remote', 'hybrid', 'onsite'] as LocationFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setLocationFilter(f)}
                className={clsx(
                  'rounded-full px-3 py-1 capitalize transition-colors',
                  locationFilter === f ? 'bg-ink text-white' : 'text-muted hover:text-ink'
                )}
              >
                {f}
              </button>
            ))}
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortBy)}
            className="rounded-full border-2 border-line px-3 py-1.5 text-xs font-semibold text-ink bg-white focus:border-ink focus:outline-none"
          >
            <option value="match">Sort: Best Match</option>
            <option value="deadline">Sort: Deadline</option>
          </select>

          {/* Settings toggle */}
          <button
            onClick={() => setShowSettings((s) => !s)}
            className={clsx(
              'btn-sm',
              showSettings ? 'btn-primary' : 'btn-ghost'
            )}
          >
            ⚙ Notifications
          </button>

          {/* Refresh */}
          <button
            onClick={fetchJobs}
            disabled={loading}
            className="btn-primary btn-sm"
          >
            {loading ? '⟳ Scanning...' : '⟳ Refresh'}
          </button>
        </div>
      </div>

      {/* Notification settings panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="card-white p-5 overflow-hidden"
          >
            <p className="font-extrabold text-sm text-ink mb-3">🔔 Deadline notification settings</p>
            <div className="flex flex-wrap items-center gap-6">
              <div>
                <label className="text-xs font-medium text-ink/80 block mb-1">Notify me when deadline is within</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 5, 7].map((d) => (
                    <button
                      key={d}
                      onClick={() => setNotifDays(d)}
                      className={clsx(
                        'rounded-full w-9 h-9 text-xs font-semibold border transition-colors',
                        notifDays === d ? 'bg-ink text-white border-ink' : 'border-line text-ink/80 hover:border-ink'
                      )}
                    >
                      {d}d
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-ink/80 block mb-1">Min match score</label>
                <div className="flex items-center gap-2">
                  {[60, 70, 80, 90].map((s) => (
                    <button
                      key={s}
                      onClick={() => setMinScore(s)}
                      className={clsx(
                        'rounded-full px-3 h-9 text-xs font-semibold border transition-colors',
                        minScore === s ? 'bg-ink text-white border-ink' : 'border-line text-ink/80 hover:border-ink'
                      )}
                    >
                      {s}%+
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-end">
                <button
                  onClick={fetchJobs}
                  className="btn-primary btn-sm"
                >
                  Apply & Rescan
                </button>
              </div>
            </div>
            <p className="text-xs text-muted mt-3">
              Notifications appear as banners at the top of this page. Email notifications require PC email integration.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="card-white p-5 animate-pulse">
              <div className="h-4 bg-surface2 rounded w-3/4 mb-2" />
              <div className="h-3 bg-surface2 rounded w-1/2 mb-4" />
              <div className="h-2 bg-surface2 rounded w-full mb-2" />
              <div className="h-2 bg-surface2 rounded w-5/6" />
            </div>
          ))}
        </div>
      )}

      {/* Results grid */}
      {!loading && hasLoaded && (
        <>
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-muted">
              <p className="text-4xl mb-3">🔍</p>
              <p className="font-medium">No listings match your current filters.</p>
              <p className="text-sm mt-1">Try lowering the minimum match score or changing location filter.</p>
            </div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              <AnimatePresence>
                {filtered.map((job) => (
                  <JobCard key={job.id} job={job} />
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
