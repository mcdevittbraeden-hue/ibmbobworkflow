/**
 * AI Job Scraper
 *
 * Uses OpenAI Responses API with web_search_preview to find real, live
 * internship and job postings matching the student's profile.
 *
 * Falls back to curated mock data when OPENAI_API_KEY is not set.
 */

import type { JobListing, JobScrapeResult, JobSearchPreferences } from '@/types/jobs';
import type { BannerDegreeAudit } from '@/types/banner';
import type { CareerProfile } from '@/types/career';

export async function scrapeJobsForStudent(
  audit: BannerDegreeAudit,
  careerProfile: CareerProfile,
  prefs: JobSearchPreferences
): Promise<JobScrapeResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return getMockJobScrapeResult(prefs);
  }

  const searchQuery = buildSearchQuery(audit, careerProfile, prefs);

  try {
    // Use OpenAI Responses API with web search
    const res = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        tools: [{ type: 'web_search_preview' }],
        input: `You are a career research assistant. Search the web RIGHT NOW for real, currently open internship and job postings that match this student profile.

Student Profile:
- Major: ${audit.major}${audit.minor ? `, Minor: ${audit.minor}` : ''}
- GPA: ${audit.gpa}
- Target Roles: ${prefs.roles.join(', ')}
- Target Industries: ${prefs.industries.join(', ')}
- Preferred Locations: ${prefs.locations.join(', ')}
- Location Type: ${prefs.locationType.join(', ')}
- Skills: ${careerProfile.skills.join(', ')}

Search for: ${searchQuery}

For each listing you find, return a JSON array with these exact fields:
{
  "title": "exact job title",
  "company": "company name",
  "location": "city, state",
  "locationType": "remote|hybrid|onsite",
  "deadline": "YYYY-MM-DD or null",
  "applicationUrl": "direct application URL",
  "description": "2-3 sentence summary of the role",
  "matchReason": "1 sentence explaining why this matches the student",
  "matchScore": 0-100,
  "source": "LinkedIn|Handshake|Company Website|Indeed|etc",
  "postedAt": "YYYY-MM-DD or null",
  "tags": ["tag1", "tag2"],
  "salaryRange": "$X-$Y/hr or null"
}

Return ONLY valid JSON array. Find at least 5-8 real current listings. Focus on roles with applications still open.`,
      }),
    });

    if (!res.ok) {
      console.error('OpenAI Responses API error:', res.status);
      return getMockJobScrapeResult(prefs);
    }

    const data = await res.json() as {
      output?: Array<{ type: string; content?: Array<{ type: string; text?: string }> }>;
    };

    // Extract text from the response output
    const textContent = data.output
      ?.find((o) => o.type === 'message')
      ?.content?.find((c) => c.type === 'output_text')?.text ?? '';

    // Parse JSON from the response
    const jsonMatch = textContent.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return getMockJobScrapeResult(prefs);
    }

    const rawListings = JSON.parse(jsonMatch[0]) as Array<Record<string, unknown>>;
    const listings: JobListing[] = rawListings.map((l, i) => ({
      id: `scraped-${Date.now()}-${i}`,
      title: String(l.title ?? ''),
      company: String(l.company ?? ''),
      location: String(l.location ?? ''),
      locationType: (l.locationType as JobListing['locationType']) ?? 'onsite',
      deadline: l.deadline ? String(l.deadline) : null,
      applicationUrl: String(l.applicationUrl ?? '#'),
      description: String(l.description ?? ''),
      matchReason: String(l.matchReason ?? ''),
      matchScore: Number(l.matchScore ?? 75),
      source: String(l.source ?? 'Web'),
      postedAt: l.postedAt ? String(l.postedAt) : null,
      tags: Array.isArray(l.tags) ? l.tags.map(String) : [],
      salaryRange: l.salaryRange ? String(l.salaryRange) : undefined,
      scrapedAt: new Date().toISOString(),
    }));

    return {
      listings: listings.sort((a, b) => b.matchScore - a.matchScore),
      searchQuery,
      scrapedAt: new Date().toISOString(),
      source: 'ai_web_search',
    };
  } catch (err) {
    console.error('Job scrape failed, using mock:', err);
    return getMockJobScrapeResult(prefs);
  }
}

function buildSearchQuery(
  audit: BannerDegreeAudit,
  careerProfile: CareerProfile,
  prefs: JobSearchPreferences
): string {
  const roles = prefs.roles.slice(0, 2).join(' OR ');
  const locations = prefs.locations.slice(0, 2).join(' OR ');
  return `${roles} internship 2025 2026 application open ${locations} ${audit.major}`;
}

export function getDeadlineNotifications(listings: JobListing[], daysThreshold = 3) {
  const now = Date.now();
  return listings
    .filter((l) => {
      if (!l.deadline) return false;
      const days = Math.ceil((new Date(l.deadline).getTime() - now) / (1000 * 60 * 60 * 24));
      return days >= 0 && days <= daysThreshold;
    })
    .map((l) => {
      const days = Math.ceil((new Date(l.deadline!).getTime() - now) / (1000 * 60 * 60 * 24));
      return {
        id: `notif-${l.id}`,
        jobId: l.id,
        jobTitle: l.title,
        company: l.company,
        deadline: l.deadline!,
        daysRemaining: days,
        applicationUrl: l.applicationUrl,
        dismissed: false,
      };
    });
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

function getMockJobScrapeResult(prefs: JobSearchPreferences): JobScrapeResult {
  const inDays = (n: number) => {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return d.toISOString().split('T')[0];
  };

  const listings: JobListing[] = [
    {
      id: 'mock-1',
      title: 'Investment Banking Summer Analyst',
      company: 'Goldman Sachs',
      location: 'New York, NY',
      locationType: 'onsite',
      deadline: inDays(3),
      applicationUrl: 'https://www.goldmansachs.com/careers/students/programs/americas/summer-analyst-program.html',
      description: 'Join our Investment Banking Division as a Summer Analyst. Work alongside senior bankers on live M&A and capital markets transactions across industry coverage and product groups.',
      matchReason: 'Direct match for Finance major targeting investment banking. Data Science minor strengthens the analytics component.',
      matchScore: 95,
      source: 'Goldman Sachs Careers',
      postedAt: inDays(-14),
      tags: ['Investment Banking', 'M&A', 'Finance', 'New York'],
      salaryRange: '$85,000/yr (annualized)',
      scrapedAt: new Date().toISOString(),
    },
    {
      id: 'mock-2',
      title: 'Finance & Analytics Rotational Intern',
      company: 'Fidelity Investments',
      location: 'Boston, MA',
      locationType: 'hybrid',
      deadline: inDays(10),
      applicationUrl: 'https://jobs.fidelity.com/jobs/categories/internships',
      description: 'Rotational internship across Corporate Finance, Investment Management, and Data Analytics. Ideal for students who combine finance and quantitative skills.',
      matchReason: 'Boston location matches preference, hybrid model, and directly leverages the Data Science minor alongside Finance major.',
      matchScore: 92,
      source: 'Handshake',
      postedAt: inDays(-7),
      tags: ['Finance', 'Analytics', 'Boston', 'Hybrid', 'Rotational'],
      salaryRange: '$28-32/hr',
      scrapedAt: new Date().toISOString(),
    },
    {
      id: 'mock-3',
      title: 'Financial Advisory Intern',
      company: 'PwC',
      location: 'Providence, RI / Boston, MA',
      locationType: 'hybrid',
      deadline: inDays(18),
      applicationUrl: 'https://www.pwc.com/us/en/careers/campus.html',
      description: 'Work with PwC\'s Deals practice advising clients on M&A transactions, valuations, and financial due diligence. Local office presence in Providence and Boston.',
      matchReason: 'Local to Providence, Big Four experience is highly valued for investment banking recruiting, and matches consulting interest.',
      matchScore: 88,
      source: 'PwC Campus Recruiting',
      postedAt: inDays(-5),
      tags: ['Consulting', 'M&A', 'Big Four', 'Providence', 'Valuation'],
      salaryRange: '$30-35/hr',
      scrapedAt: new Date().toISOString(),
    },
    {
      id: 'mock-4',
      title: 'Quantitative Finance Intern',
      company: 'State Street',
      location: 'Boston, MA',
      locationType: 'onsite',
      deadline: inDays(25),
      applicationUrl: 'https://www.statestreet.com/us/en/individual/about/careers',
      description: 'Join State Street\'s Quantitative Research team building financial models and data pipelines for asset management strategies.',
      matchReason: 'Perfect intersection of Finance major and Data Science minor. Quantitative skills are directly applicable.',
      matchScore: 87,
      source: 'LinkedIn',
      postedAt: inDays(-10),
      tags: ['Quantitative Finance', 'Python', 'Data Science', 'Asset Management'],
      salaryRange: '$30/hr',
      scrapedAt: new Date().toISOString(),
    },
    {
      id: 'mock-5',
      title: 'Corporate Finance Summer Analyst',
      company: 'Raytheon Technologies',
      location: 'Waltham, MA',
      locationType: 'hybrid',
      deadline: inDays(32),
      applicationUrl: 'https://careers.rtx.com',
      description: 'Support corporate finance team with financial planning, budget analysis, and variance reporting for a Fortune 100 defense & aerospace company.',
      matchReason: 'Strong corporate finance experience to diversify resume beyond banking. Boston area and hybrid model match preferences.',
      matchScore: 81,
      source: 'Indeed',
      postedAt: inDays(-3),
      tags: ['Corporate Finance', 'Fortune 100', 'FP&A', 'Waltham'],
      salaryRange: '$25-28/hr',
      scrapedAt: new Date().toISOString(),
    },
    {
      id: 'mock-6',
      title: 'Wealth Management Intern',
      company: 'Morgan Stanley',
      location: 'Boston, MA',
      locationType: 'onsite',
      deadline: inDays(40),
      applicationUrl: 'https://www.morganstanley.com/people-opportunities/students-graduates',
      description: 'Work directly with Financial Advisors serving high-net-worth clients. Responsibilities include portfolio analysis, client reporting, and market research.',
      matchReason: 'Wealth management pathway complements investment banking target, Morgan Stanley brand name strengthens resume.',
      matchScore: 83,
      source: 'Morgan Stanley Campus',
      postedAt: inDays(-8),
      tags: ['Wealth Management', 'High Net Worth', 'Morgan Stanley', 'Boston'],
      salaryRange: '$22-25/hr',
      scrapedAt: new Date().toISOString(),
    },
  ];

  return {
    listings: listings.filter((l) => l.matchScore >= prefs.minMatchScore),
    searchQuery: `${prefs.roles[0]} internship ${prefs.locations[0]}`,
    scrapedAt: new Date().toISOString(),
    source: 'mock',
  };
}
