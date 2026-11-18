# FriarAI

> The digital twin student success app for Providence College. FriarAI connects to Canvas, Banner/SIS, and Microsoft 365 to give every student a personalized, real-time academic coach powered by GPT-4o.

## What It Does

- **Digital Twin** — Builds a live snapshot of every student: courses, grades, deadlines, degree progress, and calendar
- **Proactive Alerts** — Surfaces urgent issues (overdue assignments, low grades, degree gaps) before the student asks
- **AI Chat** — Every response from GPT-4o is grounded in the student's real data, not generic advice
- **Issue Triage** — Describe any campus problem in plain English → routed to the exact right office
- **Degree Progress** — Visual breakdown of requirements vs. completion
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
│   ├── login/                    # SSO login page
│   └── layout.tsx
├── components/
│   ├── AlertCard.tsx             # Proactive alert display
│   ├── CalendarStrip.tsx         # Calendar events
│   ├── Chat.tsx                  # AI chat interface
│   ├── DeadlineList.tsx          # Upcoming assignment deadlines
│   └── DegreeProgress.tsx        # Degree audit visualization
├── lib/
│   ├── auth.ts                   # NextAuth config (Azure AD SSO)
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

---

## Deployment (Vercel)

```bash
# Connect to Vercel
npx vercel

# Or push to GitHub and import at vercel.com/new
```

Add all env vars in the Vercel dashboard under **Settings → Environment Variables**.

---

## Providence College Brand Colors

| Color | Hex |
|---|---|
| Navy | `#1B2A5A` |
| Gold | `#C5A900` |
| Black | `#000000` |
| White | `#FFFFFF` |
