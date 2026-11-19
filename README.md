# FriarAI

> The digital twin student success app for Providence College. FriarAI connects to Canvas, Banner/SIS, and Microsoft 365 to give every student a personalized, real-time academic coach powered by GPT-4o.

## What It Does

- **Digital Twin** — Builds a live snapshot of every student: courses, grades, deadlines, degree progress, and calendar
- **Proactive Alerts** — Surfaces urgent issues (overdue assignments, low grades, degree gaps) before the student asks
- **AI Chat** — Every response from GPT-4o is grounded in the student's real data, not generic advice
- **Campus Information** — Office directory, dining, housing and student orgs, plus an AI issue-triage chat (`/campus`)
- **Relay** — Describe a campus problem in your own words → FriarAI routes it to the right office in the campus directory, drafts one message, and tracks the case from Delivered to Resolved (`/relay`)
- **Connect** — Classmates and clubs matched to your profile, with a reason for every match, plus messaging (`/connect`)
- **Degree Progress** — Visual breakdown of requirements vs. completion
- **Study Coach** — Upload a syllabus → study calendar, "how do you feel about this exam?" check-ins, when-to-start and what-to-study recommendations, academic risk scores, alerts and study habits (`/study`)
- **Providence College SSO** — Students sign in with their @providence.edu Microsoft account

## Local Development Setup

### 1. Clone and install

```bash
git clone <your-repo-url>
cd friarai
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Then fill in `.env.local` — see the section below. For local dev, only `AUTH_SECRET` and `OPENAI_API_KEY` are required. All other integrations will use realistic mock data.

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **Note:** Without SSO configured, the login page will error. To test locally without SSO, temporarily bypass middleware or add a dev-mode login.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `AUTH_SECRET` | ✅ Always | Random string for session encryption. Generate: `openssl rand -base64 32` |
| `AUTH_MICROSOFT_ENTRA_ID_ID` | Production | Azure AD Application client ID |
| `AUTH_MICROSOFT_ENTRA_ID_SECRET` | Production | Azure AD client secret |
| `AUTH_MICROSOFT_ENTRA_ID_TENANT_ID` | Production | Azure AD tenant ID |
| `OPENAI_API_KEY` | ✅ Always | OpenAI API key (server-side only, never `NEXT_PUBLIC_`) |
| `CANVAS_API_URL` | Production | Canvas base URL (e.g. `https://canvas.providence.edu`) — blank = mock data |
| `CANVAS_CLIENT_ID` | Production | Canvas OAuth2 developer key |
| `CANVAS_CLIENT_SECRET` | Production | Canvas OAuth2 secret |
| `ETHOS_API_URL` | Production | Ellucian Ethos API base URL — blank = mock data |
| `ETHOS_API_KEY` | Production | Ethos service-account API key |
| `NEXTAUTH_URL` | Production | App public URL (e.g. `https://friarai.providence.edu`) |

---

## Integration Registration (PC IT Tasks)

### Azure AD (SSO + Calendar)
1. In [Azure Portal](https://portal.azure.com) → Azure Active Directory → App registrations → New registration
2. Name: `FriarAI`
3. Redirect URI: `https://your-domain/api/auth/callback/microsoft-entra-id`
4. Add API permissions: `openid`, `profile`, `email`, `offline_access`, `Calendars.Read`
5. Create a client secret
6. Copy tenant ID, client ID, and secret into env vars

### Canvas LMS
1. In Canvas admin → Developer Keys → New API Key
2. Set redirect URI to `https://your-domain/api/auth/canvas/callback`
3. Enable scopes: `url:GET|/api/v1/courses`, `url:GET|/api/v1/users/:user_id/enrollments`
4. Note the Client ID and secret

### Ellucian Ethos API
1. Contact PC's Banner/Ethos team to provision a service-account API key
2. Confirm which API resources are available: `degree-audit`, `student-academic-standings`, `section-registrations`

---

## Project Structure

```
friarai/
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/   # NextAuth.js SSO handler
│   │   ├── chat/                 # Streaming GPT-4o endpoint
│   │   └── context/              # Student context API
│   ├── dashboard/                # Main dashboard page
│   ├── study/                    # Step 3 Study Coach
│   ├── campus/                   # Campus information + issue triage
│   ├── relay/                    # Relay case tracking
│   ├── connect/                  # Connect: classmate + club matching, messages
│   ├── career/                   # Career development + job discovery
│   ├── login/                    # SSO login page
│   ├── globals.css               # Design system (Relay tokens + components)
│   └── layout.tsx
├── components/
│   ├── AppNav.tsx                # Shared top navigation for every page
│   ├── relay/RelayApp.tsx        # Relay case UI
│   ├── study/                    # Study Coach UI
│   ├── AlertCard.tsx             # Proactive alert display
│   ├── CalendarStrip.tsx         # Calendar events
│   ├── Chat.tsx                  # AI chat interface
│   ├── DeadlineList.tsx          # Upcoming assignment deadlines
│   └── DegreeProgress.tsx        # Degree audit visualization
├── lib/
│   ├── auth.ts                   # NextAuth config (Azure AD SSO)
│   ├── relay/issues.ts           # Relay scenarios + issue detection (demo data)
│   ├── campus/pcData.ts          # Campus offices, dining, housing, orgs
│   ├── studyCoach/               # Study Coach engine (see Step 3 below)
│   ├── integrations/
│   │   ├── canvas.ts             # Canvas REST API adapter
│   │   ├── banner.ts             # Ellucian Ethos/Banner adapter
│   │   └── calendar.ts           # Microsoft Graph calendar adapter
│   └── twin/
│       ├── buildStudentContext.ts # Aggregates all integration data
│       ├── formatContextForAI.ts  # Formats context as GPT-4o system prompt
│       └── alertEngine.ts         # Proactive alert detection
└── types/
    ├── canvas.ts                  # Canvas type definitions
    ├── banner.ts                  # Banner/SIS type definitions
    ├── calendar.ts                # Calendar type definitions
    ├── twin.ts                    # StudentContext & Alert types
    └── next-auth.d.ts             # NextAuth session type extensions
```

---

## Step 3: Study Coach (Student Success)

`/study` turns the student's Canvas deadlines and uploaded syllabi into a study plan that adapts to how they feel about each exam.

**What a student gets**

1. **Calendar breakdown.** Canvas assignments appear automatically. When a student uploads a syllabus (PDF, Word, text or pasted), FriarAI pulls out every exam, quiz, paper and project with its date, grade weight and topics. A syllabus item that matches a Canvas assignment upgrades it instead of duplicating it. The student reviews everything before it's saved.
2. **Check-ins.** 14, 7, 3 and 1 day before each exam, paper or project, FriarAI asks: "How do you feel about Exam 2?" The student rates overall confidence (1–5) and each topic, and can add topics if Canvas didn't list them. Exams 3–7 days out also show a check-in alert on the dashboard.
3. **When to start and what to study.** For example: "Start 12 days before (Fri, Nov 13), study *Deferred taxes* first." Weaker topics get more sessions, earlier. The last session is always a full review. Papers and projects follow phases (outline → draft → revise → proofread).
4. **Academic risk.** Each deadline gets a 0–100 score (On track / Watch / At risk) with plain reasons, such as "rated 2/5", "worth 25%", "ideal start was 5 days ago" or "3 other deadlines within 3 days".
5. **Alerts.** In-page alerts, browser notifications while open, and **Add to calendar**: an `.ics` file with every session, deadline and check-in, each with a reminder (Outlook / M365, Google, Apple).
6. **Study habits.** Sessions are balanced across courses under a daily limit (2–4 hours). In a crunch week, less urgent sessions are shortened and the student is told why. Habit tips adapt, e.g. "Get help on ACC 302 this week" when confidence is low.
7. **AI coach.** The Study Coach chat sends a summary of check-ins, weak topics and next sessions to `/api/chat` (`studyContext`), so GPT-4o can quiz the student on exactly what they're weak at.

**How it's built**

| Path | Purpose |
|---|---|
| `app/study/page.tsx` | Page; loads Canvas data from the twin |
| `components/study/` | Client UI: `StudyCoach`, `CheckinDialog`, `PlanDetail`, `SyllabusUpload`, `StudyCalendar` |
| `app/api/syllabus/route.ts` | Syllabus → deadlines. Uses GPT-4o when `OPENAI_API_KEY` is set, otherwise (or on failure) the offline parser |
| `lib/studyCoach/riskEngine.ts` | Pure logic: lead days, topic priority, risk score, check-in schedule, load balancing, habits, AI summary |
| `lib/studyCoach/syllabusParser.ts` | Offline rule-based syllabus parser |
| `lib/studyCoach/courses.ts` | Canvas → Study Coach courses; merges syllabi and Canvas refreshes without losing check-ins |
| `lib/studyCoach/calendarExport.ts` | `.ics` export with reminders |
| `lib/studyCoach/studyAlerts.ts` | Study alerts + browser notifications |
| `lib/studyCoach/storage.ts` | Check-ins and settings in `localStorage` (swap for a database later) |
| `tests/studyCoach.test.ts` | `npm test` (Node's built-in runner, no extra dependencies) |

**Tuning the recommendations** (all in `riskEngine.ts`):

```
lead days = baseline (exam 7, final 10, quiz 3, paper 10, project 14)
          × (1 + (3 − confidence) × 0.25)      # confidence 1 → ×1.5, 5 → ×0.5
          × 1.35 if ≥ 25% of grade (× 1.15 if ≥ 15%)
          + 1 per other deadline within 3 days (max 3), clamped to 1–21
topic priority = 6 − topic rating (unrated = 3); sessions handed out weakest-first
risk ≥ 55 = At risk, ≥ 35 = Watch
```

**Limits / next steps:** check-ins live in the browser until FriarAI has a database. Browser notifications only fire while the tab is open (the `.ics` reminders cover the rest; Web Push would need a service worker + backend). Tutoring hours and office links should come from official PC sources, not be hard-coded.

---

## Team Branch Strategy

| Branch | Purpose |
|---|---|
| `main` | Stable, deployed to production |
| `feat/scaffold-auth` | Auth & project setup |
| `feat/canvas-integration` | Canvas adapter |
| `feat/banner-calendar` | Banner + Calendar adapters |
| `feat/twin-engine` | Digital Twin Engine |
| `feat/chat-ui` | AI chat interface |
| `feat/dashboard` | Dashboard UI |
| `feat/study-coach` | Step 3: Study Coach (academic risk, syllabus → study plan) — merged |
| `feat/new-feature` | Campus Information page + universal nav — merged |
| `relay-demo` | Relay demo app + branding guide — merged; Relay is now `/relay` and its design is the app-wide design system |
| `relay-branding` | Relay redesign prototype — merged; its intro screen, steps, motion and AI analysis are in `/relay` (prototype kept at `relay/demo-redesign.html`) |
| `relay-ui` / `shep/student-engagement` | Student Engagement app — **not merged as an app**; its features are rebuilt in `/connect` |

---

## Deployment (Vercel)

```bash
# Connect to Vercel
npx vercel

# Or push to GitHub and import at vercel.com/new
```

Add all env vars in the Vercel dashboard under **Settings → Environment Variables**.

---

## Relay and Connect

**Relay** (`/relay`, Gabriel): intro screen on first visit, then four steps: describe → confirm → find who can fix it → review and send, then track the case.
- `POST /api/relay/analyze`: with `OPENAI_API_KEY`, GPT restates the problem, tags it, **picks 1–2 offices from the campus directory** (`lib/campus/pcData.ts`) and drafts the email. The key stays on the server.
- Without a key, it builds the case offline: a built-in scenario when it clearly fits, otherwise keyword routing to the matching office, quoting the student's words (`lib/relay/analysis.ts`).
- Built-in scenarios use placeholder staff names (demo data). AI and offline cases address real offices instead of inventing people.

**Connect** (`/connect`, features from Shep's Student Engagement app): a profile pre-filled from the student's data (major, minor, career interests) and editable with a 3-step flow; "You should meet" classmates; "Clubs for you"; and messages with each match. A "You should meet" row also shows on the dashboard.
- `POST /api/connect`: with `OPENAI_API_KEY`, `text-embedding-3-small` similarity is blended with the rule score and GPT writes each reason.
- Without a key, the offline matcher in `lib/connect/matching.ts` scores shared and related interests, major, goal and class year, and writes a specific reason.
- Classmates are fictional demo profiles. Club times and rooms need confirming with Student Activities. Chat replies are simulated, and the profile and messages are saved in the browser (a database would make chat real).

## Design System (Relay)

The whole app uses the Relay branding guide (`relay/BRANDING.md`, by the Relay team). Tokens and component classes live in `app/globals.css`, so pages use them instead of raw colors:

| Token / class | Use |
|---|---|
| `ink` `#0a0a0a` | Text, primary buttons, active nav, urgent states |
| `surface` `#f5f5f5` · `surface2` `#eeeeee` | Cards and secondary surfaces |
| `line` `#e0e0e0` | Every border and divider |
| `muted` `#888888` · `muted2` `#c0c0c0` | Labels, meta text, placeholders |
| `success` `#18c964` | Resolved / success only (e.g. internship offer) |
| `.btn-primary` `.btn-ghost` `.btn-outline` | 100px pill buttons |
| `.card` `.card-white` `.card-dark` `.card-bordered` | 20px-radius cards, borders not shadows |
| `.status-pill` (`.is-filled`, `.is-muted`, `.is-success`) · `.dept-tag` · `.chip` | Status, categories, quick picks |
| `.eyebrow` `.page-title` `.card-title` | Uppercase labels; weight-900 headings with tight tracking |

**Rules:** black and white only; severity and risk are shown by *form*, not color (filled black = urgent / at risk, outlined = attention / watch, gray tag = info / on track). Use `AppNav` for the header on every page. The original standalone Relay demo is kept at `relay/index.html` for reference.
