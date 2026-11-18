-- ============================================================
-- FriarAI Seed Data — Run AFTER schema.sql
-- Paste into Supabase SQL Editor
-- ============================================================

-- Clubs (embeddings will be generated via the seed script)
-- We insert without embeddings first; the Node seed script adds them.
-- For the demo, insert clubs directly here with empty embeddings
-- then run scripts/seed-embeddings.ts to populate vectors.

insert into public.clubs (name, description, tags, meeting_info, link) values
(
  'Providence College Investment Club',
  'Students passionate about financial markets, investing, and Wall Street careers. Members pitch stocks, run a mock portfolio, and host alumni from top investment banks.',
  array['Finance', 'Investing', 'Wall Street', 'Networking'],
  'Wednesdays 7pm, Ruane Center 105',
  'https://my.providence.edu'
),
(
  'PC Entrepreneurs & Startups',
  'A community for student founders and future entrepreneurs. Hosts pitch competitions, connects students with local VCs, and runs workshops on starting a business.',
  array['Entrepreneurship', 'Startups', 'Business', 'Innovation'],
  'Thursdays 6:30pm, Slavin 112',
  'https://my.providence.edu'
),
(
  'Friar Data & Analytics Club',
  'For students interested in data science, machine learning, and analytics. Build projects, compete in Kaggle competitions, and learn Python and SQL together.',
  array['Data Science', 'Coding', 'Machine Learning', 'Analytics'],
  'Tuesdays 7pm, Harkins Hall 203',
  'https://my.providence.edu'
),
(
  'PC Pre-Health Society',
  'Supporting students pursuing healthcare careers — medicine, nursing, public health, and research. Hosts MCAT prep, hospital shadowing, and health career panels.',
  array['Healthcare', 'Pre-Med', 'Nursing', 'Research'],
  'Mondays 6pm, Science Complex 150',
  'https://my.providence.edu'
),
(
  'Campus Ministry & Service',
  'Faith-driven service and community. Coordinates volunteer programs, mission trips, and retreats. Open to all students seeking purpose and community.',
  array['Faith & Spirituality', 'Community Service', 'Volunteering'],
  'Fridays 5pm, St. Dominic Chapel',
  'https://my.providence.edu'
),
(
  'PC Marketing & Brand Strategy Club',
  'Students learning modern marketing — social media, brand strategy, advertising, and consumer behavior. Partners with local businesses for real campaigns.',
  array['Marketing', 'Business', 'Social Media', 'Strategy'],
  'Wednesdays 6pm, Ruane Center 210',
  'https://my.providence.edu'
),
(
  'Student Political Union',
  'Bi-partisan debate, political discussions, and civic engagement. Hosts speakers, runs voter registration drives, and discusses current events.',
  array['Politics', 'Policy', 'Debate', 'Civic Engagement'],
  'Tuesdays 6pm, Feinstein 201',
  'https://my.providence.edu'
),
(
  'PC Writers Guild',
  'A creative writing community for fiction, poetry, journalism, and screenwriting. Hosts workshops, readings, and publishes the student literary magazine.',
  array['Writing', 'Creative Writing', 'Literature', 'Journalism'],
  'Thursdays 7pm, Phillips Memorial Library',
  'https://my.providence.edu'
),
(
  'Friars for Sustainability',
  'Advocates for environmental sustainability on campus. Runs recycling programs, organizes climate events, and advises college on green initiatives.',
  array['Sustainability', 'Environment', 'Community Service'],
  'Mondays 7pm, Feinstein 105',
  'https://my.providence.edu'
),
(
  'PC Film Society',
  'Weekly screenings, filmmaking workshops, and movie discussions. Members produce short films for campus and regional film festivals.',
  array['Film', 'Photography', 'Art', 'Creativity'],
  'Fridays 7pm, Hunt-Cavanagh Gallery',
  'https://my.providence.edu'
);
