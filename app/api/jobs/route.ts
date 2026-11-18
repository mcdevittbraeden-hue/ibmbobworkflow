import { connection } from 'next/server';
import { getDemoSession } from '@/lib/demoSession';
import { getBannerData } from '@/lib/integrations/banner';
import { getCareerData } from '@/lib/integrations/career';
import { scrapeJobsForStudent } from '@/lib/jobs/scraper';
import { NextResponse } from 'next/server';
import type { JobSearchPreferences } from '@/types/jobs';

export async function GET(req: Request) {
  await connection();
  const session = getDemoSession();

  const { searchParams } = new URL(req.url);
  const minScore = Number(searchParams.get('minScore') ?? '70');

  const [banner, career] = await Promise.all([
    getBannerData(session.user.studentId),
    getCareerData(session.user.studentId),
  ]);

  const prefs: JobSearchPreferences = {
    roles: career.profile.targetRoles,
    industries: career.profile.targetIndustries,
    locations: ['Boston, MA', 'New York, NY', 'Providence, RI', 'Remote'],
    locationType: ['onsite', 'hybrid', 'remote'],
    minMatchScore: minScore,
  };

  const result = await scrapeJobsForStudent(banner.degreeAudit, career.profile, prefs);
  return NextResponse.json(result);
}
