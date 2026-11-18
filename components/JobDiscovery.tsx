'use client';

import { useState, useEffect } from 'react';
import type { JobListing, JobScrapeResult, DeadlineNotification } from '@/types/jobs';
import { NotificationBanner } from '@/components/NotificationBanner';
import { getDeadlineNotifications } from '@/lib/jobs/scraper';
import clsx from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';

type LocationFilter = 'all' | 'remote' | 'hybrid' | 'onsite';
type SortBy = 'match' | 'deadline';

function MatchBar({ score }: { score: number }) {
  const color = score >= 90 ? 'bg-green-500' : score >= 75 ? 'bg-blue-500' : 'bg-amber-400';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
        <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-xs font-medium text-gray-600">{score}% match</span>
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
      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md transition-shadow flex flex-col gap-3"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 text-sm leading-snug">{job.title}</p>
          <p className="text-sm text-[#1B2A5A] font-medium">{job.company}</p>
          <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
            <span className="text-xs text-gray-500">{job.location}</span>
            <span className={clsx(
              'rounded-full px-1.5 py-0.5 text-xs font-medium',
              job.locationType === 'remote' ? 'bg-green-100 text-green-700' :
              job.locationType === 'hybrid' ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-600'
            )}>
              {job.locationType}
            </span>
          </div>
        </div>
        <span className="flex-shrink-0 text-xs text-gray-400">{job.source}</span>
      </div>

      {/* Match + deadline row */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <MatchBar score={job.matchScore} />
        {days !== null && (
          <span className={clsx(
            'text-xs font-semibold',
            isUrgent ? 'text-red-600' : isSoon ? 'text-amber-600' : 'text-gray-500'
          )}>
            {isUrgent && '⚠ '}{days === 0 ? 'Due today' : days < 0 ? 'Closed' : `${days}d left`}
          </span>
        )}
      </div>

      {/* Why it matches */}
      <p className="text-xs text-gray-600 leading-relaxed border-l-2 border-[#C5A900] pl-2">
        {job.matchReason}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {job.tags.slice(0, 4).map((t) => (
          <span key={t} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{t}</span>
        ))}
      </div>

      {/* Salary + CTA */}
      <div className="flex items-center justify-between mt-auto pt-1">
        {job.salaryRange && (
          <span className="text-xs font-medium text-gray-500">{job.salaryRange}</span>
        )}
        <a
          href={job.applicationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={clsx(
            'ml-auto rounded-lg px-3 py-2 text-xs font-semibold text-white transition-colors',
            isUrgent ? 'bg-red-600 hover:bg-red-700' : 'bg-[#1B2A5A] hover:bg-[#243672]'
          )}
        >
          {isUrgent ? '⚡ Apply Now' : 'View & Apply →'}
        </a>
      </div>
    </motion.div>
  );
}

export function JobDiscovery() {
  const [result, setResult] = useState<JobScrapeResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [locationFilter, setLocationFilter] = useState<LocationFilter>('all');
  const [sortBy, setSortBy] = useState<SortBy>('match');
  const [minScore, setMinScore] = useState(70);
  const [notifications, setNotifications] = useState<DeadlineNotification[]>([]);
  const [notifDays, setNotifDays] = useState(3);
  const [showSettings, setShowSettings] = useState(false);

  async function fetchJobs() {
    setLoading(true);
    try {
      const res = await fetch(`/api/jobs?minScore=${minScore}`);
      const data = await res.json() as JobScrapeResult;
      setResult(data);
      // Compute notifications at the configured threshold
      setNotifications(getDeadlineNotifications(data.listings, notifDays));
      setHasLoaded(true);
    } catch {
      console.error('Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  }

  // Auto-load on mount
  useEffect(() => {
    fetchJobs();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Recompute notifications when threshold changes
  useEffect(() => {
    if (result) {
      setNotifications(getDeadlineNotifications(result.listings, notifDays));
    }
  }, [notifDays, result]);

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
          <h2 className="font-semibold text-gray-900">🔍 AI Job Discovery</h2>
          {result && (
            <p className="text-xs text-gray-500 mt-0.5">
              {result.source === 'ai_web_search' ? '🌐 Live results from web search' : '📋 Curated demo listings'} 
              {' · '}{result.listings.length} matches found
              {' · '}<span className="text-gray-400">Last scanned {new Date(result.scrapedAt).toLocaleTimeString()}</span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Location filter */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-medium">
            {(['all', 'remote', 'hybrid', 'onsite'] as LocationFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setLocationFilter(f)}
                className={clsx(
                  'px-3 py-1.5 capitalize transition-colors',
                  locationFilter === f ? 'bg-[#1B2A5A] text-white' : 'text-gray-600 hover:bg-gray-50'
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
            className="rounded-lg border border-gray-200 px-2 py-1.5 text-xs text-gray-700 bg-white"
          >
            <option value="match">Sort: Best Match</option>
            <option value="deadline">Sort: Deadline</option>
          </select>

          {/* Settings toggle */}
          <button
            onClick={() => setShowSettings((s) => !s)}
            className={clsx(
              'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
              showSettings ? 'border-[#1B2A5A] bg-[#1B2A5A] text-white' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            )}
          >
            ⚙ Notifications
          </button>

          {/* Refresh */}
          <button
            onClick={fetchJobs}
            disabled={loading}
            className="rounded-lg bg-[#C5A900] px-3 py-1.5 text-xs font-semibold text-[#1B2A5A] hover:bg-yellow-400 transition-colors disabled:opacity-50"
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
            className="rounded-xl border border-[#1B2A5A]/20 bg-[#1B2A5A]/5 p-4 overflow-hidden"
          >
            <p className="font-semibold text-sm text-gray-900 mb-3">🔔 Deadline Notification Settings</p>
            <div className="flex flex-wrap items-center gap-6">
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Notify me when deadline is within</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 5, 7].map((d) => (
                    <button
                      key={d}
                      onClick={() => setNotifDays(d)}
                      className={clsx(
                        'rounded-full w-9 h-9 text-xs font-semibold border transition-colors',
                        notifDays === d ? 'bg-[#1B2A5A] text-white border-[#1B2A5A]' : 'border-gray-200 text-gray-600 hover:border-[#1B2A5A]'
                      )}
                    >
                      {d}d
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-600 block mb-1">Min match score</label>
                <div className="flex items-center gap-2">
                  {[60, 70, 80, 90].map((s) => (
                    <button
                      key={s}
                      onClick={() => setMinScore(s)}
                      className={clsx(
                        'rounded-full px-3 h-9 text-xs font-semibold border transition-colors',
                        minScore === s ? 'bg-[#1B2A5A] text-white border-[#1B2A5A]' : 'border-gray-200 text-gray-600 hover:border-[#1B2A5A]'
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
                  className="rounded-lg bg-[#1B2A5A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#243672] transition-colors"
                >
                  Apply & Rescan
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-3">
              Notifications appear as banners at the top of this page. Email notifications require PC email integration.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading state */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-100 rounded w-1/2 mb-4" />
              <div className="h-2 bg-gray-100 rounded w-full mb-2" />
              <div className="h-2 bg-gray-100 rounded w-5/6" />
            </div>
          ))}
        </div>
      )}

      {/* Results grid */}
      {!loading && hasLoaded && (
        <>
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
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
