export interface DegreeRequirement {
  category: string;
  required: number;
  completed: number;
  inProgress: number;
  remaining: number;
}

export interface BannerDegreeAudit {
  studentId: string;
  major: string;
  minor?: string;
  concentration?: string;
  catalogYear: number;
  totalCreditsRequired: number;
  creditsCompleted: number;
  creditsInProgress: number;
  creditsRemaining: number;
  gpa: number;
  academicStanding: 'Good Standing' | 'Academic Warning' | 'Academic Probation' | 'Dean\'s List';
  expectedGraduationTerm: string;
  requirements: DegreeRequirement[];
}

export interface BannerRegistration {
  term: string;
  courses: Array<{
    crn: string;
    subject: string;
    courseNumber: string;
    title: string;
    credits: number;
    grade?: string;
  }>;
}

export interface BannerData {
  degreeAudit: BannerDegreeAudit;
  registrationHistory: BannerRegistration[];
  fetchedAt: string;
}
