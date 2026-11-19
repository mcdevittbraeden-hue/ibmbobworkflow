/**
 * Connect demo data, from Shep's Student Engagement app (branch relay-ui:
 * onboarding options, demo students and clubs).
 *
 * DEMO DATA: the students are fictional. Club meeting times, rooms and
 * descriptions are placeholders for the prototype and must be confirmed
 * with Student Activities before launch.
 */

import type { Club, Peer } from '@/types/connect';

export const MAJORS = [
  'Accounting', 'Biology', 'Business Administration', 'Chemistry',
  'Computer Science', 'Economics', 'Education', 'English', 'Finance',
  'Health Policy & Management', 'History', 'Marketing', 'Mathematics',
  'Nursing', 'Philosophy', 'Political Science', 'Psychology',
  'Public & Community Service', 'Social Work', 'Sociology', 'Theology',
];

export const INTEREST_SUGGESTIONS = [
  'Investment Banking', 'Startups', 'Research', 'Community Service',
  'Sports', 'Music', 'Art', 'Film', 'Writing', 'Coding', 'Data Science',
  'Healthcare', 'Politics', 'Education', 'Faith & Spirituality',
  'Entrepreneurship', 'Social Justice', 'Sustainability', 'Fitness',
  'Photography', 'Travel', 'Gaming', 'Business Consulting', 'Networking',
];

export const GOALS = [
  'Find a study group for my classes',
  'Land an internship or job after graduation',
  'Get more involved in campus life',
  'Build my professional network',
  'Find friends who share my interests',
  'Explore career options in my major',
];

export const GRAD_YEARS = [2026, 2027, 2028, 2029];
export const MAX_INTERESTS = 5;

/** Fictional PC students. */
export const PEERS: Peer[] = [
  { id: 'jordan-mitchell', name: 'Jordan Mitchell', major: 'Finance', gradYear: 2026, interests: ['Investment Banking', 'Startups', 'Networking', 'Business Consulting'], goal: 'Land an internship or job after graduation' },
  { id: 'morgan-kelly', name: 'Morgan Kelly', major: 'Finance', gradYear: 2027, interests: ['Investment Banking', 'Economics', 'Networking', 'Business Consulting'], goal: 'Land an internship or job after graduation' },
  { id: 'quinn-murphy', name: 'Quinn Murphy', major: 'Economics', gradYear: 2026, interests: ['Finance', 'Investment Banking', 'Politics', 'Debate'], goal: 'Build my professional network' },
  { id: 'taylor-brooks', name: 'Taylor Brooks', major: 'Business Administration', gradYear: 2026, interests: ['Entrepreneurship', 'Marketing', 'Startups', 'Networking'], goal: 'Land an internship or job after graduation' },
  { id: 'alex-chen', name: 'Alex Chen', major: 'Computer Science', gradYear: 2026, interests: ['Coding', 'Data Science', 'Startups', 'Machine Learning'], goal: 'Find friends who share my interests' },
  { id: 'drew-patel', name: 'Drew Patel', major: 'Computer Science', gradYear: 2027, interests: ['Data Science', 'Coding', 'Startups', 'Gaming'], goal: 'Build my professional network' },
  { id: 'riley-santos', name: 'Riley Santos', major: 'Marketing', gradYear: 2026, interests: ['Marketing', 'Social Media', 'Entrepreneurship', 'Photography'], goal: 'Get more involved in campus life' },
  { id: 'casey-nguyen', name: 'Casey Nguyen', major: 'Nursing', gradYear: 2027, interests: ['Healthcare', 'Community Service', 'Research', 'Fitness'], goal: 'Find a study group for my classes' },
  { id: 'sam-oconnor', name: "Sam O'Connor", major: 'Political Science', gradYear: 2027, interests: ['Politics', 'Community Service', 'Writing', 'Social Justice'], goal: 'Get more involved in campus life' },
  { id: 'jamie-flores', name: 'Jamie Flores', major: 'Biology', gradYear: 2027, interests: ['Research', 'Healthcare', 'Sustainability', 'Community Service'], goal: 'Explore career options in my major' },
];

export const CLUBS: Club[] = [
  { id: 'investment-club', name: 'Providence College Investment Club', description: 'Students passionate about financial markets, investing, and Wall Street careers. Members pitch stocks, run a mock portfolio, and host alumni from top investment banks.', tags: ['Finance', 'Investing', 'Wall Street', 'Networking'], meetingInfo: 'Wednesdays 7pm, Ruane Center 105', link: 'https://my.providence.edu' },
  { id: 'entrepreneurs', name: 'PC Entrepreneurs & Startups', description: 'A community for student founders and future entrepreneurs. Hosts pitch competitions, connects students with local VCs, and runs workshops on starting a business.', tags: ['Entrepreneurship', 'Startups', 'Business', 'Innovation'], meetingInfo: 'Thursdays 6:30pm, Slavin 112', link: 'https://my.providence.edu' },
  { id: 'data-analytics', name: 'Friar Data & Analytics Club', description: 'For students interested in data science, machine learning, and analytics. Build projects, compete in Kaggle competitions, and learn Python and SQL together.', tags: ['Data Science', 'Coding', 'Machine Learning', 'Analytics'], meetingInfo: 'Tuesdays 7pm, Harkins Hall 203', link: 'https://my.providence.edu' },
  { id: 'pre-health', name: 'PC Pre-Health Society', description: 'Supporting students pursuing healthcare careers — medicine, nursing, public health, and research. Hosts MCAT prep, hospital shadowing, and health career panels.', tags: ['Healthcare', 'Pre-Med', 'Nursing', 'Research'], meetingInfo: 'Mondays 6pm, Science Complex 150', link: 'https://my.providence.edu' },
  { id: 'ministry-service', name: 'Campus Ministry & Service', description: 'Faith-driven service and community. Coordinates volunteer programs, mission trips, and retreats. Open to all students seeking purpose and community.', tags: ['Faith & Spirituality', 'Community Service', 'Volunteering'], meetingInfo: 'Fridays 5pm, St. Dominic Chapel', link: 'https://my.providence.edu' },
  { id: 'marketing', name: 'PC Marketing & Brand Strategy Club', description: 'Students learning modern marketing — social media, brand strategy, advertising, and consumer behavior. Partners with local businesses for real campaigns.', tags: ['Marketing', 'Business', 'Social Media', 'Strategy'], meetingInfo: 'Wednesdays 6pm, Ruane Center 210', link: 'https://my.providence.edu' },
  { id: 'political-union', name: 'Student Political Union', description: 'Bi-partisan debate, political discussions, and civic engagement. Hosts speakers, runs voter registration drives, and discusses current events.', tags: ['Politics', 'Policy', 'Debate', 'Civic Engagement'], meetingInfo: 'Tuesdays 6pm, Feinstein 201', link: 'https://my.providence.edu' },
  { id: 'writers-guild', name: 'PC Writers Guild', description: 'A creative writing community for fiction, poetry, journalism, and screenwriting. Hosts workshops, readings, and publishes the student literary magazine.', tags: ['Writing', 'Creative Writing', 'Literature', 'Journalism'], meetingInfo: 'Thursdays 7pm, Phillips Memorial Library', link: 'https://my.providence.edu' },
  { id: 'sustainability', name: 'Friars for Sustainability', description: 'Advocates for environmental sustainability on campus. Runs recycling programs, organizes climate events, and advises college on green initiatives.', tags: ['Sustainability', 'Environment', 'Community Service'], meetingInfo: 'Mondays 7pm, Feinstein 105', link: 'https://my.providence.edu' },
  { id: 'film-society', name: 'PC Film Society', description: 'Weekly screenings, filmmaking workshops, and movie discussions. Members produce short films for campus and regional film festivals.', tags: ['Film', 'Photography', 'Art', 'Creativity'], meetingInfo: 'Fridays 7pm, Hunt-Cavanagh Gallery', link: 'https://my.providence.edu' },
];

/** Simulated replies for the demo chat. */
export const DEMO_REPLIES = [
  "Hey! Great to connect. I'd love to chat more about that.",
  'Absolutely — I was thinking the same thing. When are you free?',
  "That's exactly why I joined FriarAI! Let's set something up.",
  "Yes! I've been looking for someone to talk to about this.",
];
