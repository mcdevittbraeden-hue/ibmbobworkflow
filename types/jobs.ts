export interface JobListing {
  id: string;
  title: string;
  company: string;
  location: string;
  locationType: 'remote' | 'hybrid' | 'onsite';
  deadline: string | null; // ISO date
  applicationUrl: string;
  description: string;
  matchReason: string; // why AI thinks this matches the student
  matchScore: number; // 0-100
  source: string; // e.g. "LinkedIn", "Handshake", "Company Website"
  postedAt: string | null;
  tags: string[];
  salaryRange?: string;
  scrapedAt: string;
}

export interface JobSearchPreferences {
  roles: string[];
  industries: string[];
  locations: string[];
  locationType: ('remote' | 'hybrid' | 'onsite')[];
  minMatchScore: number;
}

export interface NotificationPreferences {
  enabled: boolean;
  daysBeforeDeadline: number; // default 3
  email: string;
  channels: ('dashboard' | 'email')[];
}

export interface JobScrapeResult {
  listings: JobListing[];
  searchQuery: string;
  scrapedAt: string;
  source: 'ai_web_search' | 'mock';
}

export interface DeadlineNotification {
  id: string;
  jobId: string;
  jobTitle: string;
  company: string;
  deadline: string;
  daysRemaining: number;
  applicationUrl: string;
  dismissed: boolean;
}
