/**
 * Career Data — mock for demo, replace with Handshake API in production.
 *
 * Production integration: Handshake Partner API
 *   https://joinhandshake.com/employers/api/
 */

import type { CareerData, Internship } from '@/types/career';

export async function getCareerData(studentId: string): Promise<CareerData> {
  // Always mock for now — swap for Handshake API when available
  return getMockCareerData(studentId);
}

function getMockCareerData(_studentId: string): CareerData {
  const now = new Date();
  const inDays = (n: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() + n);
    return d.toISOString();
  };

  const internships: Internship[] = [
    {
      id: 'i1',
      company: 'Goldman Sachs',
      role: 'Investment Banking Summer Analyst',
      location: 'New York, NY',
      deadline: inDays(6),
      status: 'researching',
      matchScore: 94,
      tags: ['Finance', 'Investment Banking', 'Competitive'],
      applyUrl: 'https://www.goldmansachs.com/careers',
      notes: 'Top target — matches Finance major + Data Science minor perfectly',
    },
    {
      id: 'i2',
      company: 'Fidelity Investments',
      role: 'Finance & Analytics Intern',
      location: 'Boston, MA (hybrid)',
      deadline: inDays(12),
      status: 'applied',
      matchScore: 91,
      tags: ['Finance', 'Analytics', 'Boston'],
      applyUrl: 'https://jobs.fidelity.com',
      notes: 'Application submitted 11/10 — awaiting response',
    },
    {
      id: 'i3',
      company: 'PwC',
      role: 'Financial Advisory Intern',
      location: 'Providence, RI / Boston, MA',
      deadline: inDays(21),
      status: 'not_started',
      matchScore: 88,
      tags: ['Consulting', 'Finance', 'Big Four'],
      applyUrl: 'https://www.pwc.com/us/en/careers',
    },
    {
      id: 'i4',
      company: 'State Street',
      role: 'Data Analytics & Finance Intern',
      location: 'Boston, MA',
      deadline: inDays(30),
      status: 'not_started',
      matchScore: 85,
      tags: ['Finance', 'Data Science', 'Asset Management'],
      applyUrl: 'https://www.statestreet.com/us/en/individual/about/careers',
    },
    {
      id: 'i5',
      company: 'Morgan Stanley',
      role: 'Wealth Management Summer Analyst',
      location: 'New York, NY',
      deadline: inDays(45),
      status: 'not_started',
      matchScore: 82,
      tags: ['Finance', 'Wealth Management', 'Competitive'],
      applyUrl: 'https://www.morganstanley.com/people-opportunities/students-graduates',
    },
  ];

  return {
    profile: {
      targetRoles: ['Investment Banking Analyst', 'Financial Analyst', 'Data Analyst'],
      targetIndustries: ['Investment Banking', 'Asset Management', 'Financial Technology'],
      skills: ['Excel / Financial Modeling', 'Python', 'SQL', 'Bloomberg Terminal', 'PowerPoint'],
      resumeLastUpdated: inDays(-45),
      resumeSections: [
        {
          section: 'Work Experience',
          strength: 'needs_work',
          feedback: 'You have 1 experience listed (PC Dining Hall supervisor). Needs more finance-relevant experience.',
          suggestion: 'Add any finance club roles, case competitions, or relevant coursework projects.',
        },
        {
          section: 'Education',
          strength: 'strong',
          feedback: '3.21 GPA, Finance major, Data Science minor — this is competitive for analyst roles.',
          suggestion: 'Add Dean\'s List if applicable, and list relevant coursework (Investments, Business Analytics).',
        },
        {
          section: 'Skills',
          strength: 'needs_work',
          feedback: 'Skills section is thin. Investment banking roles expect Excel, PowerPoint, and financial modeling.',
          suggestion: 'Add: Advanced Excel, Financial Modeling, Python (from your Data Science minor), Bloomberg.',
        },
        {
          section: 'Projects',
          strength: 'missing',
          feedback: 'No projects section — this is a major gap for finance roles.',
          suggestion: 'Add your Portfolio Analysis project from FIN 341 and any case competition work.',
        },
        {
          section: 'Activities & Leadership',
          strength: 'strong',
          feedback: 'Investment Club membership is relevant and impressive.',
          suggestion: 'If you hold any officer positions, make sure they are listed prominently.',
        },
      ],
      linkedInUrl: null,
      handshakeUrl: 'https://app.joinhandshake.com/users/demo',
      careerCenterAppointment: null,
      internships,
      applicationDeadlineSoon: internships.filter((i) => {
        if (!i.deadline) return false;
        const days = Math.ceil((new Date(i.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return days <= 14 && i.status !== 'accepted';
      }),
    },
    fetchedAt: new Date().toISOString(),
  };
}
