# PadhaiShuru.com — Product Requirements Document

**Version:** 0.1 — Redesign / Rebuild from Eduneuro prototype  
**Date:** 2026-09-08  
**Author:** Sumanta Bhargab  
**Stakeholders:** Product, Engineering, Design, Content, Growth  
**Status:** Draft — ready for review

---

## 1. Executive Summary

PadhaiShuru.com is a full-stack GATE preparation platform built for Indian aspirants. It combines a verified question bank, an AI doubt engine, study analytics, mentorship access, and a social study environment into one product. The goal is to replace the current fragmented prep stack of coaching notes, random YouTube videos, scattered PDFs, and ad-hoc test series with a single trusted system that tracks progress, explains concepts, and connects learners with guidance.

This PRD defines the complete rebuild of the existing Eduneuro prototype into PadhaiShuru.com: a rebranded, tightened, and expanded version focused exclusively on GATE preparation, with stronger content depth, clearer monetization, better onboarding, and a more scalable architecture.

**Key outcomes expected from this build:**
- A production-ready MVP in 12–16 weeks
- Clear freemium conversion path with measurable drop-off points
- Content ingestion pipeline for 20+ branches and 18 years of PYQ history
- Trust and safety infrastructure for chat, mentorship, and user-generated content
- Mobile-first experience with optional Android wrapper

---

## 2. Product Vision & Strategy

### 2.1 Vision Statement
To become the default operating system for GATE preparation in India — a platform where every aspirant, regardless of geography or income, can access structured study material, instant conceptual help, performance analytics, and mentorship from day one.

### 2.2 Mission
PadhaiShuru.com exists to remove friction from GATE preparation. We do this by consolidating questions, explanations, analytics, and community into one honest, ad-light, learner-first product.

### 2.3 Core Value Propositions
- **One place for everything:** PYQs, analytics, AI help, formulas, cutoffs, mock tests, mentorship, study tracking, and chat.
- **Concept-first AI help:** Step-by-step explanations grounded in actual GATE content, not generic LLM output.
- **Evidence-based practice:** Topic weightage, difficulty trends, and mistake-driven recommendations based on 18 years of real papers.
- **Fair competition:** Verified study-time leaderboard and transparent prep metrics.
- **Mentorship access:** Structured booking flow with verified mentors, not random Discord servers.
- **Mobile-first design:** Works on cheap Android phones and 4G connections.

### 2.4 Target Audience Segments
1. Final-year undergraduate targeting GATE
2. Working professionals preparing part-time
3. Droppers/repeaters doing dedicated full-time prep
4. Third-year students exploring GATE as an option
5. Coaching institute students supplementing classroom learning

### 2.5 Market Opportunity
GATE attracts roughly 800K–1M applicants annually across 30+ branches. The Indian edtech test-prep market is large, but GATE-specific products remain fragmented. Current alternatives are either paper-based, coaching-app gated, or generic question banks without intelligent guidance.

### 2.6 Competitive Landscape
| Competitor | Strength | Weakness vs PadhaiShuru |
|---|---|---|
| MadeEasy / ACE apps | Brand trust, printed material | Poor UX, no AI help, offline-first |
| Unacademy / Byju's | Broad reach | Generic, not GATE-only, expensive |
| Gradeup / Testbook | Mock tests | Weak analytics, shallow PYQ coverage |
| GATEOverflow | Community Q&A | Unstructured, outdated UI, no tracking |
| Various PYQ PDFs | Cheap/free | No search, no analytics, no explanations |

### 2.7 Differentiation Strategy
PadhaiShuru differentiates through depth of GATE-specific intelligence, not breadth. The product is built around the GATE workflow: analyze papers, practice with context, get conceptual help, track weak areas, and get mentorship when stuck.

### 2.8 Monetization Strategy
Freemium with two paid tiers:
- **Free:** Full PYQ library, basic study tracker, leaderboard, 5 AI doubts/day, virtual library demo
- **Premium ₹49/month or ₹20/week:** Unlimited AI doubts, global study chat, premium content, predicted papers, advanced analytics, virtual library full access
- **Mentorship add-on:** Pay-per-session with mentors, platform takes 10–15% commission

### 2.9 Go-to-Market Strategy
1. **Pre-launch:** Waitlist with referral mechanics; content seeding on Instagram/YouTube/LinkedIn
2. **Soft launch:** Invite-only to 500–1,000 users for bug fixing and content gaps
3. **Public launch:** Product hunt, GATE forums, coaching tie-ups
4. **Scale phase:** Referral incentives, ambassador program, college partnerships

### 2.10 Success Metrics
| Metric | Target (6 months) |
|---|---|
| Registered users | 25,000 |
| Free-to-Premium conversion | 5–8% |
| DAU/MAU | 30%+ |
| Weekly active study users | 40%+ |
| AI doubt satisfaction | 4.2/5 |
| NPS | 40+ |

---

## 3. User Research

### 3.1 Personas

**Persona 1: Riya — Final Year Student**
- Age: 21 | Location: Pune, tier-2 | Branch: CS, mid-tier college
- Morning college, evening coaching, late-night self-study
- Budget: ₹0–₹500/month for prep tools
- Pain: Coaching moves too fast, YouTube is disorganized, PYQ books are outdated
- Use case: Evening PYQ practice + AI doubt clearing + weekly mock test
- Quote: “I know what I have to study, but I don’t know what to prioritize.”

**Persona 2: Arjun — Working Professional**
- Age: 27 | Location: Bangalore | Branch: EE, 2 years experience
- Studies 1–2 hours on weekdays, 5–6 hours on weekends
- Needs mobile-first, offline-capable content
- Pain: No time to attend coaching, can’t carry books everywhere
- Use case: Topic-wise practice during commute, weekend mocks, AI doubts on hard topics
- Quote: “My preparation has to fit into the gaps of my job.”

**Persona 3: Priya — Dropper**
- Age: 23 | Location: Delhi | Branch: EC, previous rank 4,500
- Full-time prep, 8–10 hours daily
- Needs intense practice, analytics, weak-area targeting
- Pain: Doesn’t know why she keeps repeating mistakes
- Use case: Daily mock tests, mistake bank review, mentorship for strategy
- Quote: “I need someone to tell me exactly what I’m doing wrong.”

**Persona 4: Vikram — Fresher**
- Age: 20 | Location: Hyderabad, tier-2 | Branch: ME, 3rd year
- Exploring options, unsure if GATE is right path
- Needs guidance on whether to prepare, which branch, what score is realistic
- Pain: Information overload, too many voices
- Use case: Browse GATE info, take diagnostic, get recommendation
- Quote: “I don’t even know where to start.”

**Persona 5: Sneha — Institute Student**
- Age: 22 | Location: Chennai | Branch: IN, coaching student
- Uses coaching material but wants more PYQ exposure and analytics
- Needs quick doubt resolution without waiting for doubt classes
- Use case: Post-class PYQ practice, AI doubts on homework, study timer
- Quote: “Coaching gives me direction, but I need more practice.”

### 3.2 User Journey Map
1. **Awareness:** Sees PadhaiShuru on Instagram/YouTube/friend referral
2. **Landing:** Reads homepage, sees free PYQ library and AI demo
3. **Signup:** Email or Google, chooses branch and target year
4. **Onboarding:** 30-second wizard: branch, goal, current level
5. **First Action:** Guided to either PYQ practice, AI doubt, or diagnostic
6. **Activation:** Completes first practice session or asks first AI doubt
7. **Habit:** Daily study timer, weekly mock test, streak building
8. **Conversion:** Hits AI doubt limit or sees premium feature → upgrade
9. **Retention:** Daily goal notifications, weekly reports, mentor discovery
10. **Advocacy:** Referral program, share progress, invite friends

---

## 4. Product Architecture

### 4.1 Module Overview
```
PadhaiShuru.com
├── Homepage & Onboarding
├── Authentication
├── GATE Paper Intelligence
├── PYQ Library
├── AI Doubt Engine
├── Study Tracker
├── Formulas Reference
├── Cutoffs & Ranks
├── Mock Tests & Analytics
├── Global Study Chat
├── Virtual Library
├── Mentorship
├── Profile & Achievements
├── Admin & CMS
└── Settings
```

### 4.2 Feature Inventory
Each module’s detailed features are specified in Section 5.

### 4.3 Feature Dependency Map
- Auth is a prerequisite for all personalized features
- PYQ Library is the foundation for AI Doubt Engine RAG context
- Study Tracker feeds into Leaderboard and Achievements
- Mock Tests depend on PYQ infrastructure and timer system
- Virtual Library depends on auth and real-time infrastructure
- Mentorship depends on auth, payments, and scheduling system

### 4.4 Release Phases

**MVP (Weeks 1–16)**
- Auth (Google + email)
- PYQ Library with branch/subject/topic hierarchy
- Basic practice mode with answer review
- AI Doubt Engine (free tier: 5/day)
- Study Tracker with timer and streaks
- Formulas reference
- Pricing and Razorpay integration
- Basic admin CMS for content

**V1 (Weeks 17–24)**
- Mock tests with auto-evaluation
- Advanced analytics dashboard
- Global study chat
- Virtual library 2D world
- Cutoffs and rank predictor
- Achievement system
- Referral program
- Announcements and billboard

**V2 (Weeks 25–36)**
- Mentorship marketplace
- Advanced AI features (image upload, multi-turn memory)
- Group study rooms with voice
- Mobile app polish (Capacitor)
- Offline mode
- Collaborative study features
- AI-generated study plans

---

## 5. Detailed Feature Specifications

### 5.1 Homepage & Onboarding

**Purpose:** Convert visitors to signed-up users with minimum friction.

**Landing Page Sections:**
- Hero: headline, subheadline, dual CTAs, trust signals
- How it works: 3-step visual
- PYQ Library preview: branch grid, quick stats
- Product demos: AI Doubt Engine, GATE Intelligence, Personalized Learning
- Features grid: free vs premium badges
- Pricing preview: two-card comparison
- Final CTA with urgency

**Sign-up Flow:**
- Option 1: Google OAuth (one tap)
- Option 2: Email + password with confirmation
- Username setup if missing
- Redirect to onboarding wizard

**Onboarding Wizard (3 screens):**
1. Select your GATE branch
2. Set your daily study goal (minutes)
3. Choose your target year/exam date

**User Stories:**
- US-HO-01: As a visitor, I can sign up with Google in one click
- US-HO-02: As a new user, I am guided through a 3-step onboarding
- US-HO-03: As a returning user, I land directly on my dashboard

**Acceptance Criteria:**
- Google OAuth completes in under 3 seconds
- Email signup sends confirmation within 30 seconds
- Onboarding is skippable and resumable
- All onboarding data is persisted to user profile

### 5.2 GATE Paper Intelligence

**Purpose:** Help users understand what topics matter most for each branch and year.

**Paper Detail Page Features:**
- Marks distribution by subject (bar chart)
- Marks distribution by topic (expandable)
- Difficulty trends across years (line chart)
- Repeated topics identification
- Topic weightage percentage
- Year-wise comparison tool
- Predicted topics for upcoming exam

**User Stories:**
- US-GI-01: As a user, I can view subject-wise marks distribution for any paper
- US-GI-02: As a user, I can compare difficulty trends across 5+ years
- US-GI-03: As a user, I can see which topics are most frequently asked

**Data Requirements:**
- 18 years of historical paper data per branch
- Topic tagging at 2–3 levels of granularity
- Difficulty labels per question
- Marks allocation per subject/topic

### 5.3 PYQ Library

**Purpose:** The core practice product — all GATE questions, filterable and searchable.

**Hierarchy:**
- Branch → Subject → Topic → Questions

**Question Card Features:**
- Question text with LaTeX math rendering
- Multiple option types: MCQ (single correct), MSQ (multiple correct), NAT (numerical answer), Subjective
- Year and marks indicator
- Difficulty badge
- Expandable answer with step-by-step explanation
- Tags: topic, subtopic, year, marks, difficulty
- Bookmark button
- Report error button
- Share button

**Filtering:**
- Branch selector (primary)
- Subject filter (secondary)
- Topic filter (tertiary)
- Year range slider
- Difficulty selector
- Question type selector
- Marked for review toggle
- Bookmarked only toggle
- Attempted/unattempted toggle

**Practice Modes:**
- Practice mode: unlimited time, instant feedback, explanations visible
- Exam mode: timed per session, feedback after completion, no explanations during

**Practice Session Features:**
- Question navigation panel
- Flag for review
- Clear response button
- Submit session → detailed results
- Time per question tracking
- Score and accuracy calculation

**PYQ Analytics Dashboard:**
- Accuracy by topic (bar chart)
- Accuracy trend over time (line chart)
- Time distribution by subject (pie chart)
- Weak topics list (auto-generated)
- Improvement suggestions
- Comparison with average/peer

**User Stories:**
- US-PYQ-01: As a user, I can browse questions by branch and subject
- US-PYQ-02: As a user, I can filter questions by year, topic, and difficulty
- US-PYQ-03: As a user, I can bookmark questions for later review
- US-PYQ-04: As a user, I can see my accuracy statistics by topic
- US-PYQ-05: As a user, I can take a timed practice session
- US-PYQ-06: As a user, I can review my mistakes in a dedicated mistake bank

**Data Requirements:**
- Full PYQ bank: 20+ branches, 18 years, ~1,500–3,000 questions per branch
- Each question: text, options, correct answer, explanation, topic tags, difficulty, year, marks
- User attempt records with timestamps and selected answers

### 5.4 AI Doubt Engine

**Purpose:** Instant, contextual, step-by-step academic help.

**Features:**
- Chat interface with message history
- Context awareness: knows which subject/topic user is currently studying
- Step-by-step explanations with LaTeX rendering
- Image upload for question screenshots
- Formula reference integration
- Conversation history persistence
- Rate limiting: 5/day free, unlimited premium
- Follow-up question support
- Response rating (thumbs up/down)
- Suggested related questions

**User Stories:**
- US-AI-01: As a free user, I can ask 5 AI doubts per day
- US-AI-02: As a premium user, I have unlimited AI doubt access
- US-AI-03: As a user, I can upload an image of a question
- US-AI-04: As a user, I can see step-by-step mathematical derivations
- US-AI-05: As a user, I can rate AI responses for quality improvement

**Technical Requirements:**
- Groq API integration with fallback
- RAG pipeline using content_resources table
- Prompt engineering for GATE-specific responses
- KaTeX rendering for math
- Conversation context window: last 20 messages

### 5.5 Study Tracker

**Purpose:** Build study habits with verified, honest time tracking.

**Features:**
- Start/stop/pause timer
- Page visibility detection (pauses when tab is hidden)
- Session verification algorithm
- Customizable daily goal
- Streak tracking with animations
- Productivity heatmap (GitHub-style)
- Weekly/Monthly/All-time stats
- Subject-wise time distribution
- Session notes
- Reminder notifications
- Session history with details

**User Stories:**
- US-ST-01: As a user, I can start a study session timer
- US-ST-02: As a user, I can set a daily study goal
- US-ST-03: As a user, I can view my study streak and productivity heatmap
- US-ST-04: As a user, I get reminders when I haven’t studied today

### 5.6 Formulas Reference

**Purpose:** Quick-access formula bank organized by branch and subject.

**Features:**
- Branch-wise formula categories
- Subject-wise organization
- Search by keyword
- LaTeX rendering
- Bookmark important formulas
- Add personal notes to any formula
- Formula of the day

**User Stories:**
- US-FM-01: As a user, I can search formulas by keyword
- US-FM-02: As a user, I can bookmark frequently used formulas
- US-FM-03: As a user, I can add personal notes to formulas

### 5.7 Cutoffs & Ranks

**Purpose:** Help users understand cutoffs and estimate their standing.

**Features:**
- Historical cutoff data by branch and year
- Category-wise cutoffs (GEN/SC/ST/OBC/EWS)
- PSU recruitment cutoffs
- College-wise opening/closing ranks
- Rank predictor tool based on expected score
- Score vs rank estimation

**User Stories:**
- US-CO-01: As a user, I can view historical cutoffs for my branch
- US-CO-02: As a user, I can estimate my rank based on expected score

### 5.8 Mock Tests & Analytics

**Purpose:** Simulate real exam conditions and provide deep performance insights.

**Features:**
- Full-length mock tests per branch
- Subject-wise mini tests
- Timed test interface with auto-submit
- Question palette with navigation
- Section-wise timing
- Post-test detailed analytics:
  - Score and percentile
  - Speed analysis
  - Accuracy by topic
  - Comparison with toppers
  - Weak topic identification
  - Time-wasted analysis
- Test history and trend
- Review mode with explanations

**User Stories:**
- US-MT-01: As a user, I can take a full-length mock test under timed conditions
- US-MT-02: As a user, I can review my performance by topic after a test
- US-MT-03: As a user, I can compare my scores with previous attempts

### 5.9 Global Study Chat

**Purpose:** Connect aspirants for motivation, discussion, and peer learning.

**Features:**
- Real-time global chat (premium)
- Branch-specific channels
- Topic-specific rooms
- Text messaging
- Moderation: mute, ban, report
- User presence indicators
- Message reactions
- Pinned messages
- Chat history

**User Stories:**
- US-GC-01: As a premium user, I can chat with other aspirants in real time
- US-GC-02: As a user, I can join branch-specific chat channels
- US-GC-03: As a user, I can report inappropriate messages

### 5.10 Virtual Library

**Purpose:** 2D multiplayer study environment for focused co-study.

**Features:**
- Isometric 2D library world rendered on canvas
- Multiple rooms: Main Reading, Quiet Zone, Group Study, Discussion Room, Private Booth
- Player avatars with customization
- WASD/arrow key movement + mobile D-pad
- Collision detection
- Proximity-based voice chat
- Ambient music toggle
- Study session sync with timer
- Room capacity limits
- Connection state management

**User Stories:**
- US-VL-01: As a user, I can enter a 2D library world
- US-VL-02: As a user, I can see and move my avatar in real time
- US-VL-03: As a user, I can join different study rooms
- US-VL-04: As a user, I can enable proximity voice chat

### 5.11 Mentorship

**Purpose:** Connect aspirants with verified mentors for guidance.

**Features:**
- Mentor directory with profiles
- Search and filter mentors
- Mentor ratings and reviews
- Book session flow
- Calendar-based slot selection
- Payment per session
- Pre-session questionnaire
- Video/audio call integration
- Session notes
- Mentor verification system

**User Stories:**
- US-MN-01: As a user, I can browse verified mentors by branch
- US-MN-02: As a user, I can book and pay for a mentorship session
- US-MN-03: As a mentor, I can manage my availability and sessions

### 5.12 Profile & Achievements

**Purpose:** Gamify progress and build identity within the platform.

**Features:**
- Profile customization (avatar, display name, bio)
- Study statistics dashboard
- Achievement badges system
- Level progression
- Public profile (optional)
- Progress certificates
- Referral dashboard with unique link

**User Stories:**
- US-PF-01: As a user, I can customize my profile
- US-PF-02: As a user, I can earn badges for achievements
- US-PF-03: As a user, I can track my referral performance

### 5.13 Admin & CMS

**Purpose:** Internal tools for content management and platform operations.

**Features:**
- Admin dashboard with key metrics
- Content management (PYQs, formulas, notes)
- User management (view, ban, upgrade/downgrade)
- Announcement creation and management
- Billboard/sponsor ad management
- Payment tracking
- Mentor approval
- Chat moderation dashboard
- Analytics dashboard
- Role-based access (admin, editor, viewer)

### 5.14 Settings

**Purpose:** User preferences and account management.

**Features:**
- Profile editing
- Notification preferences
- Theme toggle (dark/light)
- Language selection
- Subscription management
- Data export
- Account deletion
- Connected accounts

---

## 6. User Experience Design

### 6.1 Information Architecture
```
Homepage
├── /library — PYQ Library hub
│   ├── /pyqs/[branch] — Branch-specific practice
│   └── branches, subjects, topics
├── /gate — GATE Paper Intelligence
│   ├── /gate/[paperId] — Paper details
│   ├── /gate/[paperId]/questions — Question listing
│   ├── /gate/[paperId]/practice — Practice mode
│   ├── /gate/[paperId]/doubt — Doubt session
│   └── /gate/[paperId]/questions/[questionId] — Question detail
├── /doubts — AI Doubt Engine
├── /dashboard — Study dashboard
├── /chat — Global study chat (premium)
├── /leaderboard — Study leaderboard
├── /library/world — Virtual Library (premium)
├── /pricing — Subscription plans
├── /profile — User profile
├── /formulas — Formula reference
├── /cutoffs — Cutoff data
├── /announcements — Platform announcements
├── /login — Authentication
└── /admin/* — Admin panel
```

### 6.2 Navigation Structure
- **Desktop:** Sticky top navigation bar with logo, links, auth buttons
- **Mobile:** Bottom navigation bar (Home, Library, Doubts, Dashboard, Profile)
- **Within app:** Breadcrumbs on nested pages, back buttons, related links

### 6.3 User Flows
Detailed flows are specified in the feature sections above. Key flows:
1. Signup → Onboarding → Dashboard → First action
2. Browse PYQs → Filter → Practice → Review
3. Ask AI doubt → Get response → Follow-up → Bookmark
4. Start timer → Study → Complete → View stats → Streak
5. Hit limit → Upgrade prompt → Pricing → Payment → Unlock
6. Take mock test → Submit → Analytics → Review weak areas
7. Enter virtual library → Choose room → Study → Interact

### 6.4 Design System Requirements
- **Typography:** Inter for body, Playfair Display for headings
- **Colors:** Warm off-white background (#FAF8F5), amber accent (#B8710E), semantic colors for success/error
- **Spacing:** 8px base grid
- **Radius:** Consistent border radius (8px/12px/16px/24px)
- **Shadows:** Subtle, minimal
- **Animations:** Fade-in on scroll, micro-interactions on hover/click
- **Dark mode:** Full dark theme with proper contrast
- **Accessibility:** Semantic HTML, focus states, ARIA labels, keyboard navigation, reduced motion support
- **Responsive:** Mobile-first, 390px to 1440px+

### 6.5 Responsive Breakpoints
- Mobile: 390px–639px
- Tablet: 640px–1023px
- Desktop: 1024px+

### 6.6 Offline Behavior
- PYQ library: cache last viewed questions
- Formulas: cache entire formula bank
- Study timer: works offline, syncs on reconnect
- Chat: show offline indicator, queue messages

---

## 7. Technical Architecture

### 7.1 Tech Stack
- **Framework:** Next.js 16 (App Router, TypeScript, Turbopack)
- **Styling:** Tailwind CSS v4 with `@theme inline`
- **Database:** Supabase (PostgreSQL + Row Level Security)
- **Auth:** Supabase Auth (Google OAuth + email/password)
- **AI:** Groq SDK (`openai/gpt-oss-120b`) with RAG
- **Payments:** Razorpay
- **Real-time:** Supabase Realtime
- **Charts:** Recharts
- **Math:** KaTeX
- **Code:** highlight.js
- **Markdown:** react-markdown + remark-math + rehype-highlight + rehype-katex
- **PDF:** @react-pdf/renderer, pdfjs-dist
- **Mobile:** Capacitor 8 (Android)
- **Analytics:** Vercel Analytics

### 7.2 System Architecture
```
Client (Next.js SSR + Client Components)
    │
    ├── Supabase Client (browser)
    │   ├── Auth (Google, Email)
    │   ├── Database (PostgreSQL via RPC/Query)
    │   ├── Realtime (Chat, Virtual Library)
    │   └── Storage (File uploads)
    │
    ├── API Routes (Next.js App Router)
    │   ├── AI endpoints (Groq proxy)
    │   ├── PYQ CRUD + search
    │   ├── Study sessions + stats
    │   ├── Payment webhooks
    │   └── Admin operations
    │
    ├── Groq API (AI Doubt Engine)
    │
    └── Razorpay (Payments)
```

### 7.3 Database Architecture
See Section 7.3.1 for summarized schema. Full schema in database documentation.

### 7.4 Caching Strategy
- **Static content:** Next.js built-in caching
- **PYQ data:** Server-side caching with 5-minute TTL
- **AI responses:** Not cached (context-dependent)
- **Leaderboard:** 1-minute cache
- **User stats:** Real-time from database
- **Formula bank:** Static data, cached indefinitely

### 7.5 Background Jobs
- Daily stats aggregation
- Streak calculation
- Notification dispatch
- AI response quality analysis
- Content ingestion pipeline

### 7.6 Real-time Requirements
- Global chat messages (Supabase Realtime)
- Virtual library player positions (Supabase Broadcast)
- Announcement notifications (Supabase Realtime)
- Typing indicators in chat

---

## 8. API Specifications

### 8.1 Design Principles
- RESTful where practical
- Consistent response shape: `{ success, data?, error? }`
- JWT auth via Supabase session cookies
- Rate limiting per tier and endpoint
- Input validation on all write endpoints
- Pagination: cursor-based for large datasets

### 8.2 Authentication Flow
1. Client calls Supabase Auth (Google OAuth or email/password)
2. Supabase returns session with JWT
3. JWT stored in httpOnly cookie (server) + localStorage (client)
4. API routes verify JWT via Supabase server client
5. RLS policies enforce authorization at database level

### 8.3 Rate Limiting
- Free tier AI doubts: 10 requests/minute
- Premium AI doubts: 20 requests/minute
- Chat messages: 30 messages/minute
- API write endpoints: 20 requests/minute
- Static content: No limit

### 8.4 Error Handling
- 400: Validation error with field-level messages
- 401: Unauthenticated
- 403: Authenticated but not authorized
- 404: Resource not found
- 429: Rate limited with retry-after
- 500: Server error with request ID

### 8.5 Key Endpoints by Domain

**PYQ Library:**
- `GET /api/pyq/branches` — List branches
- `GET /api/pyq/branches/[branch]/subjects` — Subjects in branch
- `GET /api/pyq/questions` — List questions with filters
- `GET /api/pyq/questions/[id]` — Single question
- `POST /api/pyq/attempts` — Submit attempt
- `GET/POST /api/pyq/bookmarks` — Bookmark management
- `GET/POST /api/pyq/mistakes` — Mistake tracking
- `GET /api/pyq/analytics` — User analytics

**AI Doubt:**
- `POST /api/ai/doubt` — Premium AI doubt
- `POST /api/ai/doubt/free` — Free-tier AI doubt
- `GET /api/ai/doubt/free` — Check usage status

**Study Tracker:**
- `POST /api/study/sessions` — Start session
- `PATCH /api/study/sessions/[id]` — End session
- `GET /api/study/stats` — Get stats
- `POST /api/study/goal` — Update daily goal

**GATE Data:**
- `GET /api/gate/papers` — List papers
- `GET /api/gate/papers/[paperId]` — Paper details
- `GET /api/gate/trends/[paperId]` — Topic trends

**Payments:**
- `POST /api/subscriptions/create-order` — Create Razorpay order
- `POST /api/subscriptions/verify` — Verify payment
- `POST /api/webhooks/razorpay` — Webhook handler

**Chat:**
- `GET /api/chat/messages` — Get messages
- `POST /api/chat/messages` — Send message

**Admin:**
- `GET/POST /api/admin/users` — List/create users
- `PATCH /api/admin/users/[id]/plan` — Update plan
- `POST /api/admin/content/upload` — Upload content
- `GET /api/admin/resources` — List resources

---

## 9. Integrations

### 9.1 Supabase
- **Auth:** Email/password + Google OAuth
- **Database:** PostgreSQL with RLS
- **Storage:** File uploads for profile avatars, mentor photos
- **Realtime:** Chat messages, virtual library presence
- **Edge Functions:** Optional for heavy processing

### 9.2 Groq AI
- **Model:** `openai/gpt-oss-120b`
- **Use:** AI Doubt Engine
- **RAG:** Retrieval from content_resources table
- **Rate limiting:** Client-side + server-side
- **Fallback:** Graceful degradation with error message

### 9.3 Razorpay
- **Payment methods:** Cards, UPI, wallets, net banking
- **Subscriptions:** Auto-debit for recurring plans
- **Webhooks:** Payment success/failure handling
- **Refunds:** Manual + automated triggers
- **Invoices:** Auto-generated via Razorpay

### 9.4 KaTeX
- Math rendering in AI responses and formula bank
- Server-side pre-rendering for static formulas
- Client-side rendering for dynamic content

### 9.5 Recharts
- Analytics charts for user dashboards
- Heatmap for productivity
- Trend charts for PYQ analytics

### 9.6 Capacitor
- Android app wrapper
- Deep linking
- Push notifications via Firebase
- Native features: camera for question upload, haptic feedback

### 9.7 Additional Integrations
- **Firebase Cloud Messaging:** Push notifications
- **Sentry:** Error tracking
- **Vercel Analytics:** Usage analytics
- **Resend:** Transactional emails

---

## 10. Security & Compliance

### 10.1 Authentication & Authorization
- Supabase Auth with email verification
- Google OAuth with email matching
- Session management via httpOnly cookies
- JWT refresh automation
- Role-based access: user, premium, admin, super_admin

### 10.2 Data Protection
- TLS 1.3 for all connections
- Row Level Security on all tables
- PII encryption at rest
- Minimal data collection principle

### 10.3 Application Security
- Input sanitization on all user inputs
- SQL injection prevention via parameterized queries
- XSS prevention via React auto-escaping + CSP headers
- CSRF protection via SameSite cookies
- Rate limiting on all public endpoints
- File upload validation (type, size, content)

### 10.4 Payment Security
- Razorpay handles card data (PCI compliant)
- Webhook signature verification
- Idempotent webhook processing
- Order amount validation server-side

### 10.5 Content Moderation
- User-generated content flagged for review
- Report system for chat messages
- Auto-moderation for common spam patterns
- Admin moderation dashboard

### 10.6 Privacy & Compliance
- Privacy policy page
- Terms of service page
- Cookie consent banner
- Data export functionality
- Account deletion flow
- DPDP Act compliance for Indian users

---

## 11. Non-Functional Requirements

### 11.1 Performance
- First Contentful Paint: < 1.5s on 4G
- Time to Interactive: < 3s on 4G
- API response time: < 200ms (p95)
- AI doubt response: < 5s (p95)
- Page transitions: < 300ms

### 11.2 Scalability
- Support 100K+ registered users
- 10K+ concurrent users
- Horizontal scaling via Vercel + Supabase
- Database connection pooling

### 11.3 Availability
- 99.5% uptime target
- Graceful degradation for AI service outages
- Maintenance mode support

### 11.4 Browser Support
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers: Chrome Mobile, Safari iOS

### 11.5 Mobile
- PWA-ready with service worker
- Capacitor Android app
- Touch-optimized interactions
- 16px minimum font size to prevent zoom
- Safe area insets for notched devices

### 11.6 SEO
- Server-rendered pages
- Dynamic meta tags per page
- Open Graph tags
- Structured data for content
- Sitemap generation
- robots.txt

### 11.7 Analytics
- Vercel Analytics for performance
- Custom event tracking for key actions
- Funnel analysis for conversion
- Cohort analysis for retention

---

## 12. Content Strategy

### 12.1 Content Types
- PYQ questions with explanations
- Formula bank entries
- GATE paper analysis articles
- Announcement posts
- Study guides and tips
- Mentor profiles

### 12.2 Content Management Workflow
1. Content created in admin CMS
2. Editor review for accuracy
3. Subject-matter expert verification (for PYQs)
4. Publishing with branch/subject/topic tags
5. Periodic review and update cycle

### 12.3 Content Creation Guidelines
- PYQ explanations: step-by-step, concept-first
- Formulas: LaTeX formatted, with units and examples
- Analysis: data-driven, sourced from historical papers
- All content: original or properly attributed

### 12.4 SEO Content Strategy
- Branch-specific landing pages
- Topic-wise long-form guides
- PYQ solution pages with rich snippets
- Comparison content: GATE branches, colleges
- Regular blog posts on prep strategy

---

## 13. Launch Plan

### 13.1 MVP Scope
- Auth (Google + email)
- PYQ Library (3–5 branches initially)
- Practice mode
- AI Doubt Engine (free tier)
- Study Tracker
- Formulas (1–2 branches)
- Pricing + Razorpay
- Basic admin CMS

### 13.2 Beta Testing Plan
- Invite 200–500 users from waitlist
- 2-week intensive testing
- Bug bounty: ₹100–₹500 per valid bug report
- Content accuracy review by subject experts
- Performance testing on 3G/4G connections

### 13.3 Launch Checklist
- [ ] All MVP features tested and stable
- [ ] Content seeded for initial branches
- [ ] Payment flow tested end-to-end
- [ ] Legal pages published (privacy, terms)
- [ ] SEO baseline configured
- [ ] Analytics tracking live
- [ ] Error monitoring configured
- [ ] Support channel ready
- [ ] Launch announcement prepared

### 13.4 Post-Launch Roadmap
- Week 1–2: Bug fixes, content gaps
- Week 3–4: Add 5 more branches
- Week 5–8: Mock tests, analytics
- Week 9–12: Chat, virtual library
- Week 13–16: Mentorship, advanced features

---

## 14. Success Metrics & KPIs

### 14.1 Acquisition
- Signups per day
- Signup sources (organic, referral, paid)
- Cost per acquisition
- Landing page conversion rate

### 14.2 Activation
- % users completing onboarding
- % users taking first action within 24h
- Time to first practice session
- Time to first AI doubt

### 14.3 Retention
- DAU / MAU
- 7-day retention
- 30-day retention
- Study session frequency
- Streak distribution

### 14.4 Revenue
- Free-to-Premium conversion rate
- Monthly recurring revenue
- Average revenue per user
- Churn rate
- Lifetime value

### 14.5 Product Health
- AI doubt satisfaction rating
- PYQ accuracy rate
- Mock test completion rate
- Chat message volume
- Virtual library concurrent users
- Support ticket volume and resolution time

---

## 15. Risk Assessment

### 15.1 Technical Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| AI service downtime | Medium | High | Fallback messages, queue system |
| Database performance at scale | Medium | High | Connection pooling, caching, read replicas |
| Mobile app rejection | Low | Medium | Follow Capacitor guidelines, test thoroughly |
| Payment webhook failures | Low | High | Idempotent processing, reconciliation jobs |

### 15.2 Business Risks
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Content inaccuracies | Medium | High | Expert review process, user reporting |
| Low conversion rate | Medium | High | A/B testing pricing, onboarding optimization |
| Competitor feature parity | Medium | Medium | Focus on GATE-specific depth |
| User acquisition cost spike | Medium | High | Organic growth via referrals, content SEO |

---

## 16. Open Questions

1. Should we support branches beyond the initial 5 at launch, or phase them in?
2. What is the minimum viable mentor network size?
3. Should virtual library be premium-only or free with limits?
4. How do we handle PYQ copyright concerns?
5. What is the target content accuracy threshold before launch?
6. Should we offer annual subscription plans?
7. What is the role of AI-generated study plans vs human-designed ones?
8. Should we build a native iOS app or stick to PWA + Android?

---

## 17. Appendices

### 17.1 Glossary
- **PYQ:** Previous Year Questions
- **RAG:** Retrieval-Augmented Generation
- **RLS:** Row Level Security
- **MSQ:** Multiple Select Question
- **NAT:** Numerical Answer Type
- **JWT:** JSON Web Token
- **TAM:** Total Addressable Market
- **SAM:** Serviceable Addressable Market
- **SOM:** Serviceable Obtainable Market

### 17.2 References
- Eduneuro prototype codebase
- GATE official website and past papers
- Indian edtech market reports
- Supabase documentation
- Razorpay integration guides

### 17.3 Related Documents
- Database schema specification
- API design document
- Content guidelines
- Design system documentation
- Deployment runbook

---

*This document is a living artifact. It should be reviewed and updated at the end of each sprint and at each major milestone.*
