# PadhaiShuru (formerly EduNeuro)

## What It Is

PadhaiShuru is a **GATE preparation platform** — a full-stack web app that helps engineering students prepare for the GATE (Graduate Aptitude Test in Engineering) exam. It combines a free previous-year-questions library, an AI doubt engine, study tracking, and premium features (mock tests, analytics, mentorship).

The domain is `padhaishuru.com`. The app is built with **Next.js 16 (App Router) + React 19 + TypeScript + Supabase + Tailwind CSS v4**. It also packages as a **Capacitor Android app**.

---

## Why We're Building It

GATE prep in India is fragmented: students hunt for PDFs of previous papers, struggle to find reliable answer keys, and have no way to track which topics they're weak in. PadhaiShuru solves this by:

1. **Centralizing every GATE PYQ** — all 20 branches, searchable by subject, topic, year, difficulty.
2. **AI-powered doubt clearing** — free tier gets 5 questions/day via Groq; premium gets unlimited.
3. **Learning intelligence** — mistake bank, heatmaps, trend analysis, predicted papers.
4. **Low friction** — no card required to start. Freemium model with Razorpay subscriptions.

---

## High-Level Architecture

```
Browser / Capacitor WebView
    │
    ▼
Next.js 16 App Router (Turbopack dev / production build)
    │
    ├── Server Components (pages, layouts)
    ├── Route Handlers (API routes under src/app/api/)
    │
    ├── Supabase SSR Client (@supabase/ssr + @supabase/auth-helpers-nextjs)
    │   ├── Session from HTTP-only cookies (createServerClient — async!)
    │   ├── Service-role client for admin reads (createServiceClient — sync)
    │   └── Auth: email/password + Google OAuth
    │
    ├── Groq SDK (AI doubt engine)
    │
    ├── Static data layer (JSON files on disk)
    │   └── data/pyq/processed/*.json — 797 questions across 20 branches
    │   └── Used as fallback when Supabase is unavailable
    │
    └── Razorpay (subscription payments)
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16.3.1 (App Router, Turbopack) |
| Language | TypeScript 5 (strict mode) |
| Styling | Tailwind CSS v4 + CSS variables for theming |
| UI | React 19, Framer Motion 13 |
| Fonts | Inter (body), Playfair Display (headings) via next/font |
| Auth | Supabase Auth (email/password + Google OAuth) |
| Database | Supabase (PostgreSQL) — session-backed via `@supabase/ssr` |
| AI | Groq SDK (`openai/gpt-oss-120b`) |
| Payments | Razorpay (INR, webhooks) |
| Analytics | Vercel Analytics |
| Mobile | Capacitor 8 (Android wrapper) |
| PDF | pdfjs-dist, @react-pdf/renderer, pdfkit |
| Charts | Recharts |
| Markdown/Math | react-markdown, rehype-highlight, rehype-katex, remark-math, KaTeX |
| Linting | ESLint 9 (flat config) |

---

## Directory Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout — fonts, ThemeProvider, Nav, Footer, ChatWidget
│   ├── page.tsx                # Homepage (hero, CTAs, mockups)
│   ├── globals.css             # Tailwind imports + CSS variables for light/dark theme
│   ├── pyqs/[branch]/          # Branch page — subjects list + practice session
│   │   └── _components/
│   │       └── SubjectPracticeSession.tsx  # Quiz/browse mode for a subject
│   ├── gate/[paperId]/         # Paper-by-paper practice (different from PYQ library)
│   ├── library/                # Virtual library (3D game world)
│   ├── dashboard/              # User dashboard
│   ├── pricing/                # Pricing page
│   ├── login/                  # Auth pages
│   └── api/                    # Route handlers
│       ├── pyq/                # PYQ CRUD + analytics
│       │   ├── branches/       # Branch list, branch detail, subjects
│       │   ├── questions/      # Paginated question search with filters
│       │   ├── attempts/       # Record answer attempts
│       │   ├── bookmarks/      # Bookmark questions
│       │   ├── mistakes/       # Mistake bank
│       │   ├── search/         # Full-text search
│       │   ├── analytics/      # Heatmap + trends
│       │   └── admin/          # Review queue, stats
│       ├── ai/doubt/           # Premium AI doubt endpoint
│       ├── ai/doubt/free/      # Free-tier AI doubt (5/day)
│       ├── subscriptions/      # Razorpay order creation + verification
│       ├── study/              # Study sessions, goals, stats
│       └── webhooks/razorpay/  # Razorpay webhook handler
├── components/
│   ├── Nav.tsx                 # Global navigation
│   ├── Footer.tsx              # Global footer
│   ├── ThemeProvider.tsx       # Dark/light theme
│   ├── pyq/                    # PYQ-specific components (heatmap, trends, etc.)
│   └── landing/                # Homepage mockups
├── lib/
│   ├── supabase/
│   │   └── server.ts           # createServerClient (ASYNC!) + createServiceClient
│   ├── pyq/
│   │   ├── branches.ts         # Branch registry (20 GATE branches, subjects, topics)
│   │   ├── static-questions.ts # Loads from data/pyq/processed/*.json
│   │   ├── processed-loader.ts # Reads processed JSON files from disk
│   │   ├── taxonomy.ts         # Subject/topic ID generation + lookups
│   │   └── types.ts            # PYQ TypeScript types
│   ├── auth/
│   │   └── user.ts             # getUser() — ALWAYS await createServerClient()
│   ├── entitlements.ts         # Premium check (profile plan OR active subscription)
│   ├── api/
│   │   └── response.ts         # Standardized API responses (ok, fail, unauthorized, etc.)
│   ├── rate-limit/
│   │   └── db.ts               # Supabase RPC-based rate limiter
│   └── hooks/
│       └── useAuth.ts          # Client-side auth hook
├── config/
│   └── plans.ts                # Single source of truth for subscription plans
├── modules/
│   ├── chat/                   # Chat widget (mock + real)
│   ├── virtual-library/        # 3D virtual library game world
│   ├── content-cms/            # Content management
│   └── announcements/          # Announcements
└── data/
    ├── gate-papers-analysis.ts # CSE/ECE analytics data
    ├── questions-cse-toc.ts    # Legacy CSE TOC questions (fallback)
    └── pyq/                    # PYQ question data
        ├── raw/                # 33 raw scraped JSON files
        ├── processed/          # 20 normalized JSON files (797 questions)
        └── verified/           # Verified answers (empty for now)
```

---

## Critical Gotchas

### 1. `createServerClient()` is ASYNC

```ts
// WRONG — returns Promise<SupabaseClient | null>, .auth doesn't exist on Promise
const supabase = createServerClient()
const { data } = await supabase.auth.getUser()

// CORRECT — always await
const supabase = await createServerClient()
if (!supabase) return null // or throw
const { data } = await supabase.auth.getUser()
```

This applies in: `src/lib/auth/user.ts`, `src/lib/entitlements.ts`, `src/lib/rate-limit/db.ts`, and any route handler that uses session-based auth.

### 2. `ok()` returns `Response`, not a plain object

```ts
// ok() calls Response.json() internally — safe to return from route handlers
return ok({ data: ... })

// badRequest, unauthorized, forbidden, serverError all return Response too
return badRequest("Missing field")
```

### 3. `forbidden()` and `badRequest()` take ONE data argument

```ts
// WRONG — these don't accept a second metadata arg
return forbidden("Message", { extra: "data" })

// CORRECT — the data IS the error message
return forbidden("Message")
```

### 4. Static data path

The processed JSON files live at `data/pyq/processed/` relative to the project root. The loader uses `join(process.cwd(), "data", "pyq", "processed")` — NOT `..` (that goes one level too far up).

### 5. Supabase RPC for rate limiting

The rate limiter (`src/lib/rate-limit/db.ts`) calls a Postgres function `rate_limit_check`. If it doesn't exist in the DB, the code fails OPEN (allows the request). The SQL for this function needs to be deployed separately.

---

## Data Flow: PYQ Questions

```
User visits /pyqs/[branch]?subject=X
    │
    ▼
SubjectPracticeSession (client component)
    │
    ├── Fetches /api/pyq/branches/[branch]/subjects
    │   ├── Tries Supabase DB first (session client)
    │   └── Falls back to static loader → data/pyq/processed/[BRANCH].json
    │
    ├── Fetches /api/pyq/questions?branch=X&subject=Y
    │   ├── Tries Supabase DB first (paginated, filtered)
    │   └── Falls back to static loader (paginated in-memory)
    │
    └── Renders questions with browse/quiz mode
        ├── Browse: click answer → immediate reveal
        └── Quiz: click answer → stores attempt, reveal on demand
```

---

## Subscription & Entitlement System

### Plans (`src/config/plans.ts`)
| Plan | ID | Price (INR) | Duration | AI Doubts |
|------|----|----|----------|-----------|
| Free | `free` | ₹0 | ∞ | 5/day |
| Weekly | `weekly` | ₹20 | 7 days | Unlimited |
| Monthly | `monthly` | ₹49 | 30 days | Unlimited |

### Entitlement Check (`src/lib/entitlements.ts`)
`requirePremium(userId)` throws `PremiumRequiredError` if the user is NOT premium. It checks BOTH:
1. `profiles.plan` — admin-granted premium (legacy enum: `weekly_premium`, `monthly_premium`)
2. `user_subscriptions` — active Razorpay subscription with non-expired `expires_at`

### Payment Flow
1. Frontend calls `POST /api/subscriptions/create-order` → creates Razorpay order
2. User pays via Razorpay checkout
3. Razorpay webhook hits `POST /api/webhooks/razorpay` → creates subscription record
4. `POST /api/subscriptions/verify` → client-side verification

---

## AI Doubt Engine

### Two endpoints:
- `POST /api/ai/doubt` — Premium only, uses `ai_messages` table for conversation history
- `POST /api/ai/doubt/free` — Free tier (5/day), uses `doubt_conversations` + `doubt_usage_tracking`

### RAG (Retrieval-Augmented Generation)
Both endpoints fetch relevant `content_resources` from Supabase using keyword matching and inject them as context into the Groq system prompt.

### Rate Limiting
Calls `rate_limit_check` Supabase RPC. Premium: 20 req/min, Free: 10 req/min. Fails open if RPC unavailable.

---

## Database Schema (Key Tables)

```
profiles          — user profiles (plan, role, referral_code)
user_subscriptions — active Razorpay subscriptions
pyq_branches      — GATE branch metadata
pyq_subjects      — subjects per branch
pyq_questions     — all questions (1,646 rows across 20 branches)
pyq_attempts      — user answer attempts
pyq_bookmarks     — user bookmarks
ai_messages       — premium conversation history
doubt_conversations — free-tier conversation history
doubt_usage_tracking — daily usage counters
content_resources — library content for RAG
```

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable key>
SUPABASE_SERVICE_ROLE_KEY=<service role key — keep secret>

# AI
GROQ_API_KEY=<Groq API key>

# Payments
NEXT_PUBLIC_RAZORPAY_KEY_ID=<Razorpay key>
RAZORPAY_KEY_SECRET=<Razorpay secret>
NEXT_PUBLIC_RAZORPAY_WEBHOOK_SECRET=<webhook secret>
```

---

## Scripts & Data Pipeline

### Ingest PYQs into Supabase
```bash
export $(grep -E '^(NEXT_PUBLIC_SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY)=' .env.local | xargs)
npx tsx scripts/pyq/ingest-to-supabase.ts
```
Reads `data/pyq/processed/*.json` and upserts into `pyq_branches`, `pyq_subjects`, `pyq_questions`. Uses `onConflict: "question_id"` so it's idempotent.

### Re-process raw data
```bash
npx tsx scripts/pyq/extract-all-pyqs.ts
```
Reads `data/pyq/raw/*.json` + `tmp/gate-*` files → outputs `data/pyq/processed/<branch>.json`.

### Seed branch registry
```bash
npx tsx scripts/pyq/seed-branches.ts
```

---

## Development

```bash
npm run dev      # Start dev server on port 3000
npm run build    # Production build (also copies pdf.worker.min.mjs)
npm run lint     # ESLint
npm run start    # Production server
```

### Important: Only one dev server at a time
Next.js won't start if port 3000 is already in use. Kill existing: `taskkill //F //PID <pid>`

---

## Branding Note

Formerly "EduNeuro" — rebranded to "PadhaiShuru" in Sep 2026. All user-facing copy, domain references, and display names updated. Internal variable names may still reference the old name.

---

## Known Issues / Workarounds

1. **Some processed questions have null answers** — the extraction pipeline didn't fill answers for all questions. The ingestion script handles this with `q.answer ?? ""`. The practice session UI matches answers by both letter and text.

2. **The `/api/pyq/questions` endpoint is session-based** — anonymous requests get only the static fallback (~59 questions). Logged-in users get the full DB-backed 1,646. This is intentional for rate-limiting and premium feature gating.

3. **Rate limit RPC may not exist in DB** — the code fails open (allows requests) but logs a warning. Deploy the SQL from `migrations/` if you want proper rate limiting.

4. **The virtual library module has pre-existing ESLint warnings** — `src/modules/virtual-library/world/` has 263 lint errors that predate this session. They don't affect the build or any other part of the app.

5. **Ambient music module accesses refs during render** — `src/modules/virtual-library/world/ambient-music.ts` has 2 React hooks warnings. Pre-existing, not introduced in this session.
