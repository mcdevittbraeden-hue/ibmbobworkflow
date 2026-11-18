/**
 * Banner/SIS Integration Adapter (Ellucian Ethos API)
 *
 * Production: Uses Ellucian Ethos API with service-account credentials.
 * Development: Returns realistic mock data when ETHOS_API_URL is not set.
 *
 * Required env vars (production):
 *   ETHOS_API_URL     — e.g. https://integrate.elluciancloud.com
 *   ETHOS_API_KEY     — service-account API key from Ellucian Ethos
 */

import type { BannerData, BannerDegreeAudit, BannerRegistration } from '@/types/banner';

const ETHOS_BASE = process.env.ETHOS_API_URL ?? '';
const ETHOS_KEY = process.env.ETHOS_API_KEY ?? '';

const cache = new Map<string, { data: BannerData; expiresAt: number }>();
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes (SIS data changes less often)

async function getEthosToken(): Promise<string> {
  const res = await fetch(`${ETHOS_BASE}/auth`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${ETHOS_KEY}` },
  });
  if (!res.ok) throw new Error(`Ethos auth failed: ${res.status}`);
  return res.text();
}

async function fetchEthos<T>(endpoint: string, token: string): Promise<T> {
  const res = await fetch(`${ETHOS_BASE}/api${endpoint}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  if (!res.ok) throw new Error(`Ethos API error: ${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

export async function getBannerData(studentId: string): Promise<BannerData> {
  const cached = cache.get(studentId);
  if (cached && cached.expiresAt > Date.now()) return cached.data;

  if (!ETHOS_BASE) {
    const mock = getMockBannerData(studentId);
    cache.set(studentId, { data: mock, expiresAt: Date.now() + CACHE_TTL_MS });
    return mock;
  }

  const token = await getEthosToken();
  const [audit, history] = await Promise.all([
    fetchEthos<BannerDegreeAudit>(`/degree-audit?student=${studentId}`, token),
    fetchEthos<BannerRegistration[]>(`/registration-history?student=${studentId}`, token),
  ]);

  const data: BannerData = { degreeAudit: audit, registrationHistory: history, fetchedAt: new Date().toISOString() };
  cache.set(studentId, { data, expiresAt: Date.now() + CACHE_TTL_MS });
  return data;
}

// ─── Mock Data ──────────────────────────────────────────────────────────────

function getMockBannerData(studentId: string): BannerData {
  const degreeAudit: BannerDegreeAudit = {
    studentId,
    major: 'Finance',
    minor: 'Data Science',
    catalogYear: 2022,
    totalCreditsRequired: 120,
    creditsCompleted: 74,
    creditsInProgress: 15,
    creditsRemaining: 31,
    gpa: 3.21,
    academicStanding: 'Good Standing',
    expectedGraduationTerm: 'Spring 2026',
    requirements: [
      { category: 'Core Curriculum (DWC)', required: 24, completed: 18, inProgress: 3, remaining: 3 },
      { category: 'Finance Major Courses', required: 36, completed: 24, inProgress: 6, remaining: 6 },
      { category: 'Business Core', required: 24, completed: 20, inProgress: 4, remaining: 0 },
      { category: 'Data Science Minor', required: 18, completed: 9, inProgress: 3, remaining: 6 },
      { category: 'Free Electives', required: 18, completed: 3, inProgress: 0, remaining: 15 },
    ],
  };

  const registrationHistory: BannerRegistration[] = [
    {
      term: 'Fall 2024',
      courses: [
        { crn: '12345', subject: 'ACC', courseNumber: '302', title: 'Intermediate Financial Accounting', credits: 3, grade: 'B+' },
        { crn: '12346', subject: 'FIN', courseNumber: '341', title: 'Investments', credits: 3, grade: 'A-' },
        { crn: '12347', subject: 'MGT', courseNumber: '310', title: 'Business Analytics', credits: 3 },
        { crn: '12348', subject: 'DWC', courseNumber: '201', title: 'Development of Western Civilization', credits: 3 },
        { crn: '12349', subject: 'BUS', courseNumber: '220', title: 'Business Law', credits: 3 },
      ],
    },
  ];

  return { degreeAudit, registrationHistory, fetchedAt: new Date().toISOString() };
}
