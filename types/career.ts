export type InternshipStatus = 'not_started' | 'researching' | 'applied' | 'interviewing' | 'offered' | 'accepted';
export type ResumeStrength = 'strong' | 'needs_work' | 'missing';

export interface Internship {
  id: string;
  company: string;
  role: string;
  location: string;
  deadline: string | null;
  status: InternshipStatus;
  matchScore: number; // 0-100, how well it matches the student's profile
  tags: string[];
  applyUrl: string;
  notes?: string;
}

export interface ResumeSection {
  section: string;
  strength: ResumeStrength;
  feedback: string;
  suggestion: string;
}

export interface CareerProfile {
  targetRoles: string[];
  targetIndustries: string[];
  skills: string[];
  resumeLastUpdated: string | null;
  resumeSections: ResumeSection[];
  linkedInUrl: string | null;
  handshakeUrl: string | null;
  careerCenterAppointment: string | null;
  internships: Internship[];
  applicationDeadlineSoon: Internship[]; // deadlines within 14 days
}

export interface CareerData {
  profile: CareerProfile;
  fetchedAt: string;
}
