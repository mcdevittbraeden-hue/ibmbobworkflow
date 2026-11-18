/**
 * Providence College Campus Information
 * Single source of truth for all campus offices, services, and resources.
 * Update this file when office details change.
 */

export type CampusCategory =
  | 'dining'
  | 'housing'
  | 'financial_aid'
  | 'academics'
  | 'athletics'
  | 'health_wellness'
  | 'student_life'
  | 'it_facilities'
  | 'public_safety'
  | 'registrar';

export interface CampusHours {
  weekday: string;
  weekend?: string;
  notes?: string;
}

export interface CampusOffice {
  id: string;
  name: string;
  category: CampusCategory;
  description: string;
  building: string;
  phone: string;
  email?: string;
  url: string;
  hours?: CampusHours;
  quickFacts: string[];
  commonIssues: Array<{ issue: string; resolution: string }>;
}

export interface DiningHall {
  id: string;
  name: string;
  location: string;
  hours: { breakfast?: string; lunch?: string; dinner?: string; lateNight?: string };
  acceptsMealPlan: boolean;
  features: string[];
  notes?: string;
}

export interface Residence {
  id: string;
  name: string;
  type: 'freshman' | 'upperclass' | 'suite' | 'apartment';
  capacity: number;
  features: string[];
  notes?: string;
}

export interface StudentOrg {
  id: string;
  name: string;
  category: string;
  description: string;
  contactEmail?: string;
  instagramHandle?: string;
}

// ─── Offices ─────────────────────────────────────────────────────────────────

export const CAMPUS_OFFICES: CampusOffice[] = [
  {
    id: 'financial-aid',
    name: 'Financial Aid Office',
    category: 'financial_aid',
    description: 'Administers all federal, state, and institutional financial aid including grants, loans, scholarships, and work-study.',
    building: 'Harkins Hall, Room 110',
    phone: '(401) 865-2286',
    email: 'finaid@providence.edu',
    url: 'https://financial-aid.providence.edu',
    hours: { weekday: 'Mon–Fri 8:30am–4:30pm', weekend: 'Closed' },
    quickFacts: [
      'FAFSA priority deadline: February 1',
      'Verification documents can be uploaded via the Student Portal',
      'Emergency funds available through the Dean of Students',
      'Work-Study positions posted on Handshake',
    ],
    commonIssues: [
      { issue: 'Missing financial aid award', resolution: 'Log in to the Student Portal and check your To-Do List for missing documents. Email finaid@providence.edu if items are complete.' },
      { issue: 'Billing hold on account', resolution: 'Contact Student Accounts at (401) 865-2284. Holds must be resolved before registration.' },
      { issue: 'FAFSA not received', resolution: 'Verify your FAFSA was submitted with PC\'s school code (003406) and check studentaid.gov for status.' },
    ],
  },
  {
    id: 'registrar',
    name: 'Office of the Registrar',
    category: 'registrar',
    description: 'Manages course registration, transcripts, enrollment verification, degree audits, and academic records.',
    building: 'Harkins Hall, Room 103',
    phone: '(401) 865-2282',
    email: 'registrar@providence.edu',
    url: 'https://registrar.providence.edu',
    hours: { weekday: 'Mon–Fri 8:30am–4:30pm' },
    quickFacts: [
      'Registration appointments are assigned by credit hours — more credits = earlier appointment',
      'Official transcripts ordered through Parchment (parchment.com)',
      'Enrollment verification letters available same-day via the Student Portal',
      'Add/Drop period is the first two weeks of each semester',
    ],
    commonIssues: [
      { issue: 'Registration hold', resolution: 'Log into the Student Portal and check your holds. Common holds: missing immunization records (Health Services), financial balance (Student Accounts), or academic hold (Dean\'s Office).' },
      { issue: 'Dropped from a class', resolution: 'Contact the Registrar immediately. If within Add/Drop, re-register. After Add/Drop, requires instructor and Dean approval.' },
      { issue: 'Wrong grade recorded', resolution: 'Contact your professor first. If unresolved, submit a grade appeal form through the Registrar\'s office.' },
    ],
  },
  {
    id: 'residence-life',
    name: 'Office of Residence Life',
    category: 'housing',
    description: 'Manages on-campus housing assignments, residential programming, resident advisors, and community standards.',
    building: 'Slavin Center, Room 209',
    phone: '(401) 865-2392',
    email: 'reslife@providence.edu',
    url: 'https://residence-life.providence.edu',
    hours: { weekday: 'Mon–Fri 8:30am–4:30pm', notes: 'RA on-call 24/7 in every hall' },
    quickFacts: [
      'Housing selection for returning students happens in spring semester',
      'Roommate requests submitted through the housing portal by April 1',
      'Maintenance requests submitted at facilities.providence.edu',
      'All freshmen are required to live on campus',
    ],
    commonIssues: [
      { issue: 'Broken AC or heating', resolution: 'Submit a facilities work order at facilities.providence.edu. For emergencies (no heat in winter), call Facilities at (401) 865-2290 or contact your RA.' },
      { issue: 'Roommate conflict', resolution: 'Contact your Resident Advisor (RA) first for mediation. If unresolved, escalate to your Area Coordinator.' },
      { issue: 'Locked out of room', resolution: 'Contact your RA or Public Safety at (401) 865-2391 for a temporary key. Replacement keys issued by Residence Life.' },
    ],
  },
  {
    id: 'student-accounts',
    name: 'Student Accounts',
    category: 'financial_aid',
    description: 'Handles tuition billing, payment plans, refunds, and account holds.',
    building: 'Harkins Hall, Room 108',
    phone: '(401) 865-2284',
    email: 'studentaccounts@providence.edu',
    url: 'https://studentaccounts.providence.edu',
    hours: { weekday: 'Mon–Fri 8:30am–4:30pm' },
    quickFacts: [
      'Tuition bills due August 1 (fall) and January 1 (spring)',
      'Payment plans available through Nelnet (nelnet.com)',
      '1098-T tax forms available in the Student Portal by January 31',
      'Direct deposit for refunds set up in the Student Portal',
    ],
    commonIssues: [
      { issue: 'Unexpected tuition charge', resolution: 'Review your bill in the Student Portal. Contact Student Accounts with your student ID and a description of the charge.' },
      { issue: 'Refund not received', resolution: 'Verify your direct deposit info in the Student Portal. ACH refunds take 3–5 business days after disbursement.' },
    ],
  },
  {
    id: 'health-services',
    name: 'Health Services',
    category: 'health_wellness',
    description: 'Provides primary care, immunizations, women\'s health, and referrals to specialists for enrolled students.',
    building: 'Cunningham Hall',
    phone: '(401) 865-2422',
    email: 'healthservices@providence.edu',
    url: 'https://health.providence.edu',
    hours: { weekday: 'Mon–Fri 8:30am–5:00pm', weekend: 'Sat 10am–2pm (fall/spring)', notes: 'After-hours urgent care: Kent Hospital ER or CVS MinuteClinic' },
    quickFacts: [
      'All students must submit immunization records before arrival',
      'Free STI testing available on request',
      'Flu shots available each fall — no appointment needed',
      'Prescription refills require an appointment',
    ],
    commonIssues: [
      { issue: 'Need immunization records for registration hold', resolution: 'Upload records to the health portal at health.providence.edu/portal. Processing takes 2–3 business days.' },
      { issue: 'After-hours illness', resolution: 'For non-emergencies: CVS MinuteClinic (Atwells Ave) or Urgent Care of Rhode Island. For emergencies: call 911 or go to Kent Hospital ER.' },
    ],
  },
  {
    id: 'counseling',
    name: 'Counseling & Psychological Services (CAPS)',
    category: 'health_wellness',
    description: 'Free and confidential mental health counseling, crisis support, and psychiatric services for enrolled students.',
    building: 'Cunningham Hall',
    phone: '(401) 865-2343',
    url: 'https://counseling.providence.edu',
    hours: { weekday: 'Mon–Fri 8:30am–4:30pm', notes: '24/7 crisis line: (401) 865-2343. National crisis line: 988.' },
    quickFacts: [
      'All services are free and confidential for enrolled students',
      'Initial consultation appointments available same week',
      'Crisis walk-in hours: Mon–Fri 11am–1pm',
      'Mindfulness and wellness workshops offered each semester',
    ],
    commonIssues: [
      { issue: 'Feeling overwhelmed / need to talk to someone', resolution: 'Call CAPS at (401) 865-2343 to schedule an initial consultation. Walk-in crisis hours are Mon–Fri 11am–1pm.' },
      { issue: 'Mental health emergency', resolution: 'Call Public Safety at (401) 865-2391 or 911. The 24/7 crisis line is (401) 865-2343. National crisis line: 988.' },
    ],
  },
  {
    id: 'public-safety',
    name: 'Public Safety',
    category: 'public_safety',
    description: 'Provides campus security, emergency response, parking enforcement, and escorts for the PC community.',
    building: 'Howley Hall',
    phone: '(401) 865-2391',
    url: 'https://publicsafety.providence.edu',
    hours: { weekday: '24/7', weekend: '24/7' },
    quickFacts: [
      'Emergency: (401) 865-2391 or blue light stations around campus',
      'Safe walk program available — call for an escort anytime',
      'Lost & Found located at the Public Safety office',
      'Parking permits required for all vehicles on campus',
    ],
    commonIssues: [
      { issue: 'Feel unsafe or need an escort', resolution: 'Call Public Safety at (401) 865-2391 for a safe walk to any campus location, any time of day or night.' },
      { issue: 'Vehicle towed or ticketed', resolution: 'Contact Public Safety at (401) 865-2391. Towed vehicles are taken to Central Towing — (401) 331-0999.' },
    ],
  },
  {
    id: 'it-help',
    name: 'IT Help Desk',
    category: 'it_facilities',
    description: 'Technical support for PC accounts, wifi, software, classroom technology, and device issues.',
    building: 'Phillips Memorial Library, Lower Level',
    phone: '(401) 865-2642',
    email: 'helpdesk@providence.edu',
    url: 'https://it.providence.edu',
    hours: { weekday: 'Mon–Fri 8am–8pm', weekend: 'Sat–Sun 10am–6pm' },
    quickFacts: [
      'Free Microsoft Office 365 for all enrolled students',
      'Campus wifi: PCGuest (open), PCSecure (requires PC login)',
      'VPN required to access some campus resources off-campus',
      'Software downloads available at software.providence.edu',
    ],
    commonIssues: [
      { issue: 'Can\'t log into PC account', resolution: 'Go to myaccount.providence.edu to reset your password. If still locked, call the Help Desk at (401) 865-2642.' },
      { issue: 'Wifi not working in dorm', resolution: 'Connect to PCSecure with your PC credentials. Submit a ticket at it.providence.edu/help if issues persist.' },
    ],
  },
  {
    id: 'career-center',
    name: 'Career Center',
    category: 'academics',
    description: 'Provides career counseling, resume reviews, mock interviews, job fairs, and internship resources for all PC students.',
    building: 'Slavin Center, Room 108',
    phone: '(401) 865-2082',
    email: 'career@providence.edu',
    url: 'https://careercenter.providence.edu',
    hours: { weekday: 'Mon–Fri 8:30am–4:30pm', notes: 'Drop-in hours: Mon–Thu 1–4pm' },
    quickFacts: [
      'Book appointments through Handshake (joinhandshake.com)',
      'On-campus recruiting events posted on Handshake',
      'Resume reviews available as drop-in Mon–Thu 1–4pm',
      'Big Four and finance firms recruit heavily from PC',
    ],
    commonIssues: [
      { issue: 'Need resume feedback', resolution: 'Walk in Mon–Thu 1–4pm for a quick review, or book a 30-min appointment on Handshake for in-depth feedback.' },
      { issue: 'Looking for internships', resolution: 'Log in to Handshake (joinhandshake.com) with your PC email for curated postings. The Career Center also hosts industry-specific fairs each semester.' },
    ],
  },
  {
    id: 'facilities',
    name: 'Facilities Management',
    category: 'it_facilities',
    description: 'Handles all campus maintenance, repairs, and work orders for buildings, dorms, and grounds.',
    building: 'Facilities Building (behind Raymond Hall)',
    phone: '(401) 865-2290',
    url: 'https://facilities.providence.edu',
    hours: { weekday: 'Mon–Fri 7am–4pm', notes: 'Emergency maintenance: (401) 865-2391 (Public Safety) after hours' },
    quickFacts: [
      'Submit work orders at facilities.providence.edu/workorder',
      'Emergency repairs (no heat, flooding): call Public Safety at (401) 865-2391',
      'Pest control requests handled through Residence Life',
      'Work orders typically addressed within 2–3 business days',
    ],
    commonIssues: [
      { issue: 'Broken AC in dorm room', resolution: 'Submit a work order at facilities.providence.edu/workorder. Include your room number and describe the issue. For extreme heat, contact your RA who can escalate.' },
      { issue: 'No hot water in dorm', resolution: 'Submit an urgent work order immediately. If it\'s been more than 24 hours, contact Residence Life at (401) 865-2392.' },
      { issue: 'Broken furniture or fixture', resolution: 'Submit a work order at facilities.providence.edu/workorder with photos if possible.' },
    ],
  },
  {
    id: 'athletics',
    name: 'PC Friars Athletics',
    category: 'athletics',
    description: 'Providence College competes in Division I NCAA athletics. The Friars field 18 varsity sports.',
    building: 'Concannon Fitness Center / Dunkin\' Donuts Center (men\'s basketball)',
    phone: '(401) 865-2271',
    url: 'https://friars.com',
    hours: { weekday: 'Concannon Fitness Center: Mon–Fri 6am–11pm', weekend: 'Sat–Sun 8am–9pm' },
    quickFacts: [
      'Students get free admission to most home athletic events with PC ID',
      'Men\'s Basketball games at Dunkin\' Donuts Center — student tickets via friars.com',
      'Intramural sports registration through Campus Rec (campusrec.providence.edu)',
      'Concannon Fitness Center is free for all enrolled students',
    ],
    commonIssues: [
      { issue: 'Get tickets to a basketball game', resolution: 'Log in to friars.com with your PC email. Student tickets for Big East games are limited — claim yours early.' },
      { issue: 'Join an intramural sport', resolution: 'Register at campusrec.providence.edu. Intramurals include basketball, soccer, volleyball, flag football, and more.' },
    ],
  },
  {
    id: 'student-affairs',
    name: 'Dean of Students Office',
    category: 'student_life',
    description: 'Supports student success, wellbeing, conduct, and advocacy. First stop for any issue that doesn\'t fit elsewhere.',
    building: 'Slavin Center, Room 209',
    phone: '(401) 865-2392',
    email: 'dos@providence.edu',
    url: 'https://studentaffairs.providence.edu',
    hours: { weekday: 'Mon–Fri 8:30am–4:30pm' },
    quickFacts: [
      'Emergency funding available for unexpected hardships',
      'Handles student conduct and community standards',
      'Can advocate on behalf of students with other offices',
      'First point of contact for students in crisis',
    ],
    commonIssues: [
      { issue: 'Experiencing a personal crisis or hardship', resolution: 'Contact the Dean of Students at (401) 865-2392 or dos@providence.edu. They can connect you with emergency funds, extensions, and support resources.' },
      { issue: 'Conflict with a professor', resolution: 'Start by talking to your professor directly. If unresolved, speak with your academic advisor or the department chair. The Dean\'s office can mediate if needed.' },
    ],
  },
];

// ─── Dining Halls ─────────────────────────────────────────────────────────────

export const DINING_HALLS: DiningHall[] = [
  {
    id: 'ray-cafe',
    name: 'Raymond Dining Hall',
    location: 'Raymond Hall',
    hours: {
      breakfast: 'Mon–Fri 7:30–10am',
      lunch: 'Mon–Fri 11am–2pm',
      dinner: 'Mon–Sun 5–8pm',
    },
    acceptsMealPlan: true,
    features: ['All-you-care-to-eat', 'Vegan & vegetarian options', 'Allergen-free station', 'Halal options available'],
    notes: 'Main dining hall — largest on campus. Required meal plan swipe location.',
  },
  {
    id: 'slavin-grille',
    name: 'Slavin Grille',
    location: 'Slavin Center, Lower Level',
    hours: {
      breakfast: 'Mon–Fri 7:30–10:30am',
      lunch: 'Mon–Fri 11am–3pm',
    },
    acceptsMealPlan: true,
    features: ['Retail dining', 'Grab & go', 'Starbucks coffee', 'Accepts Friar Bucks'],
    notes: 'Great for quick meals between classes. Accepts Friar Bucks and meal equivalency.',
  },
  {
    id: 'phillips-cafe',
    name: 'Phillips Memorial Library Café',
    location: 'Phillips Memorial Library, 1st floor',
    hours: {
      breakfast: 'Mon–Thu 7:30am–9pm',
      lunch: 'Fri 7:30am–5pm',
    },
    acceptsMealPlan: true,
    features: ['Coffee & espresso drinks', 'Light snacks', 'Study-friendly', 'Accepts Friar Bucks'],
  },
  {
    id: 'aquinas-cafe',
    name: 'Aquinas Café',
    location: 'Aquinas Hall',
    hours: { lunch: 'Mon–Fri 7:30am–3pm' },
    acceptsMealPlan: true,
    features: ['Convenience store items', 'Sandwiches & wraps', 'Accepts Friar Bucks'],
  },
];

// ─── Residence Halls ──────────────────────────────────────────────────────────

export const RESIDENCE_HALLS: Residence[] = [
  { id: 'mcdermott', name: 'McDermott Hall', type: 'freshman', capacity: 220, features: ['Double rooms', 'Community bathrooms', 'Freshman community', 'Close to Raymond Dining'] },
  { id: 'meagher', name: 'Meagher Hall', type: 'freshman', capacity: 200, features: ['Double rooms', 'Community bathrooms', 'Freshman community', 'Central campus location'] },
  { id: 'davis', name: 'Davis Hall', type: 'freshman', capacity: 180, features: ['Double rooms', 'Suite-style bathrooms', 'Freshman community', 'Near Slavin Center'] },
  { id: 'fennell', name: 'Fennell Hall', type: 'upperclass', capacity: 280, features: ['Single and double rooms', 'Air conditioning', 'Upperclass students', 'Quiet building'] },
  { id: 'bedford', name: 'Bedford Hall', type: 'suite', capacity: 320, features: ['Suite-style rooms', 'Semi-private bathrooms', 'Upperclass', 'Air conditioning', 'Common kitchen'] },
  { id: 'phillips', name: 'Phillips Hall Apartments', type: 'apartment', capacity: 240, features: ['Full kitchen', 'Living room', '4-person apartments', 'Senior priority', 'On-campus but most independent'] },
  { id: 'dominican', name: 'Dominican Hall', type: 'upperclass', capacity: 180, features: ['Single rooms', 'Air conditioning', 'Quiet community', 'Close to academic buildings'] },
];

// ─── Student Organizations ────────────────────────────────────────────────────

export const STUDENT_ORGS: StudentOrg[] = [
  { id: 'student-congress', name: 'Student Congress', category: 'Government', description: 'The official student government of Providence College, representing all students in matters of campus policy and community.' },
  { id: 'investment-club', name: 'Investment Club', category: 'Finance & Business', description: 'Student-run investment portfolio and education series focused on equity research, valuation, and portfolio management.' },
  { id: 'finance-society', name: 'Finance Society', category: 'Finance & Business', description: 'Connects finance students with industry professionals through speaker series, networking events, and recruiting prep.' },
  { id: 'data-analytics', name: 'Data Analytics Club', category: 'Technology', description: 'Hands-on projects in data science, machine learning, and analytics with real datasets.' },
  { id: 'bbd', name: 'Business and Beyond Day', category: 'Finance & Business', description: 'Annual finance networking event bringing Wall Street and Boston finance professionals to campus.' },
  { id: 'caps-club', name: 'Club Athletics', category: 'Recreation', description: 'Club sports including rugby, lacrosse, volleyball, and more — competitive but non-varsity.' },
  { id: 'campus-ministry', name: 'Campus Ministry', category: 'Faith & Service', description: 'Catholic faith community offering Mass, retreats, service trips, and spiritual direction.' },
  { id: 'multicultural', name: 'Multicultural Student Congress', category: 'Culture & Identity', description: 'Umbrella organization for multicultural clubs, programming, and advocacy on campus.' },
  { id: 'newspaper', name: 'The Cowl', category: 'Media & Arts', description: 'The official student newspaper of Providence College, published weekly.' },
  { id: 'comedy', name: 'Friars Club (Comedy)', category: 'Media & Arts', description: 'The student comedy troupe performing sketch and improv comedy shows throughout the year.' },
  { id: 'rotc', name: 'Army ROTC', category: 'Service & Leadership', description: 'Officer training program open to PC students. Scholarship opportunities available.' },
];

// ─── Helper: get offices by category ─────────────────────────────────────────

export function getOfficesByCategory(category: CampusCategory): CampusOffice[] {
  return CAMPUS_OFFICES.filter((o) => o.category === category);
}

export function getOfficeById(id: string): CampusOffice | undefined {
  return CAMPUS_OFFICES.find((o) => o.id === id);
}

export function searchCampusInfo(query: string): CampusOffice[] {
  const q = query.toLowerCase();
  return CAMPUS_OFFICES.filter(
    (o) =>
      o.name.toLowerCase().includes(q) ||
      o.description.toLowerCase().includes(q) ||
      o.commonIssues.some((i) => i.issue.toLowerCase().includes(q)) ||
      o.quickFacts.some((f) => f.toLowerCase().includes(q))
  );
}
