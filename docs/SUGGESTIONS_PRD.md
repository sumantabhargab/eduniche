# PadhaiShuru — Suggestions PRD

**Version:** 2.0
**Date:** 2026-09-11
**Author:** PadhaiShuru Product Team
**Status:** Draft — Pending Review
**Target Audience:** Indian GATE aspirants, 18–28 years (college students + working professionals preparing for GATE CSE/ECE/EE/ME/CE/IN and 14 other branches)

---

## 1. Executive Summary

This PRD documents 10 high-impact feature additions to PadhaiShuru, derived from a direct
aspirant-perspective audit of padhaishuru.com. The platform already has the data layer
(797 PYQs across 20 branches, 18 years of GATE papers, analytics infrastructure). The gap
is the *exam-day workflow*: plan → revise → simulate → benchmark.

This version (2.0) is tailored for the Indian 18–28 aspirant demographic: price-sensitive,
mobile-first, WhatsApp-native, coaching-aligned, and highly social. Features have been
resequenced to match what this audience actually pays for.

---

## 2. Feature Inventory

| # | Feature | Priority | Effort | Rationale |
|---|---------|----------|--------|-----------|
| 1 | Real Mock Test Environment | P0 | High | #1 reason aspirants pay — realistic GATE simulation with negative marking, timer, subject-wise distribution matching real exam |
| 2 | Formula Sheet + Quick Revision Mode | P0 | Medium | Last-month daily use case; WhatsApp-shareable; zero auth friction → viral loop |
| 3 | Previous Year Cutoffs Dashboard | P0 | Low | Every aspirant checks this. Category-wise (Gen/OBC/SC/ST/PwD) with branch comparison. Data already exists. |
| 4 | AIR (All-India Rank) Predictor | P0 | Low | Highest shareability. Aspirants screenshot and share on WhatsApp/Instagram. Zero-cost viral growth. |
| 5 | Topic Weightage Heatmap | P1 | Medium | "Which topics to skip?" — aspirants need this for smart preparation, not random PYQ solving |
| 6 | Personalized Study Plan Generator | P1 | High | Converts free users to paid — "I'll pay if you tell me exactly what to study each day" |
| 7 | Syllabus Tracker with Visual Progress | P1 | Medium | Gamifies prep; pair with study plan. Critical for working professionals who study in chunks |
| 8 | Bookmark + Personal Notes on Questions | P1 | Medium | Bookmarks API exists; add notes + export. Working professionals especially need "pick up where I left off" |
| 9 | Per-Question Community Explanations | P2 | High | Network effects, but moderation overhead. Phase this after user base crosses 5K |
| 10 | PWA + Offline Mode | P2 | Medium | Critical for final month when aspirants go offline for focused revision |

---

## 3. Market Context: Indian GATE Aspirant (18–28)

This PRD is designed for the following user profile:

| Characteristic | Detail |
|---------------|--------|
| **Age** | 18–28 (college final-year + 1–2 years experience + working professionals) |
| **Device** | 70%+ mobile-first. Budget Android phones (4GB RAM, slow data). Jio/5G but spotty coverage. |
| **Payment** | Price-sensitive. ₹20–₹50/month is the sweet spot. UPI (Google Pay/PhonePe/Paytm) is expected. Card payment is a friction point. |
| **Social** | WhatsApp-native. Shares scores, predictions, study plans. Joins Telegram groups. |
| **Language** | Hinglish comfortable. Prefers Roman Hindi in UI copy. Full English for technical content. |
| **Coachings** | Many attend MadeEasy, ACE, Unacademy, or self-study. Expects PYQ solutions to match coaching answer keys. Notes conflict between official answer key and coaching keys. |
| **Mindset** | Short-term, goal-driven. 6–12 month prep window. Needs daily motivation, streak tracking, visible progress. Anxious about rank, cutoff, "will I qualify?" |
| **Study Pattern** | 2–4 hours/day on weekdays, 6–8 hours on weekends. Studies in bursts (exam-month = 12+ hours). |
| **Willingness to Pay** | Free tier must be genuinely useful (PYQs + 5 AI doubts). Premium is ₹49/month — less than one chai per day. |

### Design Principles for This Audience

1. **Mobile is the primary device** — every feature must work flawlessly at 390px width
2. **Offline matters** — final month revision often happens without reliable internet
3. **WhatsApp is the share channel** — every shareable artifact (scores, predictions, study plans) must have a WhatsApp share button
4. **UPI-first payments** — Razorpay UPI must be the default, not card
5. **Instant gratification** — study plan, mock test, formula sheet should all be accessible within 3 taps from homepage
6. **Low cognitive load** — aspirants already overwhelmed. UI must be clean, scannable, action-oriented
7. **Trust through transparency** — show real user counts, AIR rankings, success stories on the homepage
8. **No jargon in pricing** — show ₹/day, not ₹/month. "₹1.60/day" feels cheaper than "₹49/month"

---

## 3. Market Context: Indian GATE Aspirant (18–28)

#### 3.1.1 Functional Requirements

**FR-1.1 — Plan Input Form**
Onboarding flow (one-time) collects:

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Target Exam Date | Date | Yes | Gate 2025/2026 session |
| Target Rank / Score | Number | Yes | e.g., AIR < 500 or score > 70 |
| Current Level | Select | Yes | Beginner / Intermediate / Advanced |
| Weak Subjects | Multi-select | No | Pre-populated from attempt history |
| Available Hours/Day | Number | Yes | Range 1–12 |
| Prep Start Date | Date | Yes | Defaults to today |

**FR-1.2 — Plan Generation Engine**

A server-side function (`/api/study/plan/generate`) that:

1. Fetches the user's PYQ attempt history from `pyq_attempts`
2. Computes per-subject accuracy (correct / total attempted)
3. Cross-references subject accuracy with PYQ frequency data
4. Allocates study hours using a weighted algorithm:
   - 40% weight to weak subjects (low accuracy)
   - 30% weight to high-frequency subjects (appear every year)
   - 20% weight to remaining subjects (rotation)
   - 10% weight to revision of previously mastered topics
5. Generates a day-by-day plan for N days until exam date
6. Each day entry contains:
   - Subject(s) to study
   - Topics within those subjects
   - Number of PYQs to solve
   - Whether it's a "revision day" (full-subject recap)
   - Whether it's a "mock day" (full-length test)
7. **Coaching alignment:** Shows "PadhaiShuru equivalent: MadeEasy Book Page 245" or
   "ACE Academy Topic: Dynamic Programming" for each topic. Bridges self-study with
   coaching material trust.

**FR-1.2a — WhatsApp Shareable Study Plan**

Each weekly plan generates a shareable image with:
- Week number, subjects covered, PYQs target, hours planned
- "📚 PadhaiShuru Study Plan — Week 3, GATE CSE"
- Opens WhatsApp share intent

**FR-1.3 — Plan Display**

- Calendar-style weekly view (Mon–Sun blocks)
- Each day shows: subjects, topics, PYQ count, estimated time
- Color-coded: green (strong), yellow (work needed), red (weak area focus)
- Drag-to-reschedule any day's tasks
- "Regenerate plan" button if user's situation changes

**FR-1.4 — Plan Adaptation**

The system re-evaluates the plan every 3 days based on:

- Mock test scores (if mock tests exist — see 3.2)
- PYQ attempt accuracy trends
- Study streak consistency

If accuracy in a subject improves from 40% → 70%, that subject's allocation decreases
and hours shift to the next weakest subject. The user sees a notification:
"Your DBMS accuracy improved — adjusted your plan. 2h shifted to TOC."

#### 3.1.2 Technical Specifications

| Aspect | Detail |
|--------|--------|
| **New Tables** | `study_plans` (id, user_id, input_params JSONB, generated_plan JSONB, created_at, active BOOLEAN), `study_plan_entries` (id, plan_id, day_date, subject_id, topics TEXT[], pyq_count, is_revision, is_mock, completed BOOLEAN) |
| **New API Routes** | `POST /api/study/plan/generate`, `GET /api/study/plan/current`, `PATCH /api/study/plan/entries/:id` (mark complete), `POST /api/study/plan/regenerate` |
| **Algorithm Location** | `src/lib/study/plan-generator.ts` — pure function, testable, deterministic given same inputs |
| **Caching** | Generated plans cached in Supabase for 24h; regeneration requires explicit action |
| **RLS** | Users can CRUD own plans only; `study_plan_entries` references `pyq_subjects` for subject validation |
| **Dependencies** | Uses existing `pyq_attempts`, `pyq_questions` (for frequency calc), `pyq_subjects` |

#### 3.1.3 UI Specifications

```
┌─────────────────────────────────────────────────────────────┐
│  My Study Plan                                    [Regen]  │
│                                                             │
│  Target: AIR < 500  │  Days Left: 87  │  Streak: 12 days  │
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │  MON 15  │ │  TUE 16  │ │  WED 17  │ │  THU 18  │     │
│  │ DBMS     │ │ TOC      │ │ REVISION │ │ MOCK TEST│     │
│  │ 3 topics │ │ 2 topics │ │ Full DBMS│ │ Full    │     │
│  │ 25 PYQs  │ │ 15 PYQs  │ │ 40 PYQs  │ │ 65 PYQs │     │
│  │ ████░░   │ │ ███░░░   │ │ ██████░  │ │ ██░░░░░ │     │
│  │ 2.5 hrs  │ │ 1.5 hrs  │ │ 3.0 hrs  │ │ 3.0 hrs │     │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘     │
│                                                             │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐     │
│  │  FRI 19  │ │  SAT 20  │ │  SUN 21  │ │  ...     │     │
│  │ Algo     │ │ REVISION │ │ REST     │ │          │     │
│  │ DP focus │ │ All weak │ │ No tasks │ │          │     │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘     │
└─────────────────────────────────────────────────────────────┘
```

- Mobile-first cards swipeable horizontally
- Desktop shows 4 cards per row
- Color intensity maps to subject weakness level
- Completed days get a strikethrough + checkmark animation
- Clicking a card expands it to show topic list with individual checkboxes

---

### 3.1 Real Mock Test Environment

#### 3.1.1 Functional Requirements

**FR-2.1 — Test Creation**

Tests are generated from PYQ data with configurable parameters:

| Parameter | Options | Default |
|-----------|---------|---------|
| Branch | Any GATE branch | CSE |
| Subjects | Multi-select | All subjects |
| Number of Questions | 30 / 55 / 65 | 65 (full test) |
| Duration | 30 / 90 / 180 min | 180 min |
| Negative Marking | Yes / No | Yes (−⅓ for wrong — matches actual GATE) |
| Mix | Easy/Med/Hard distribution | Historical GATE pattern per branch |

**FR-2.1a — Test Series Naming**

Free users get "PadhaiShuru All India Mock Test" (weekly, timed, leaderboard-ranked).
Premium users get additional "Branch-wise Topic Tests" and "Subject-specific Mini Mocks."

**FR-2.1b — Coaching Alignment**

Aspirants often cross-reference with MadeEasy/ACE test series. Add a "Compare with
MadeEasy" or "Expected score in ACE" hint based on PYQ difficulty mapping. This
builds immediate trust — aspirants see "this feels like the real thing."

**FR-2.2 — Test Interface (Exam Mode)**

The test screen is a distraction-free full-screen experience:

1. **Timer** — Large countdown at top-right, turns red at < 15 min. Shows Hindi label
   "बचा हुआ समय" alongside English for aspirants who prefer it.
2. **Question Navigator** — Side panel with numbered circles (green=answered, orange=flagged, gray=unattempted). Bottom-sheet on mobile.
3. **One question at a time** — No scrolling through all questions. Reduces cognitive load.
4. **Save & Next / Flag for Review** buttons
5. **Auto-submit** when timer hits 00:00. Shows a 10-second "submit now" warning popup.
6. **No back-navigation** after submitting (configurable — aspirants want it locked)
7. **Calculator** — Basic on-screen calculator for aptitude/math sections. Engineering
   aspirants expect this in the real exam.
8. **Language toggle** — English / Hindi for question instructions. Technical terms
   remain in English (e.g., "Consider the following C code" stays, but "What is the output?"
   → "आउटपुट क्या है?").

**FR-2.3 — Post-Test Analysis**

Immediately after submission, a detailed report — mobile-optimized:

```
┌──────────────────────────────────────────┐
│  Mock Test Report — GATE CSE             │
│  Score: 62/100 │ AIR Predicted: ~1,200   │
│  Accuracy: 76% │ Attempted: 52/65        │
│                                          │
│  ── Subject Breakdown ──                  │
│  DBMS    ████████████░░  18/20  (90%)    │
│  TOC     ██████░░░░░░░░  10/15  (67%)    │
│  Algo    ████████░░░░░░  12/15  (80%)    │
│  CN      ████░░░░░░░░░░   8/15  (53%)  ← weak │
│                                          │
│  ── Time Management ──                    │
│  DBMS  22 min  (target: 25) ✓            │
│  CN    38 min  (target: 25) ⚠ over       │
│                                          │
│  ── Wrong Questions ──                    │
│  → Q12 (CN) — TCP/IP                     │
│  → Q34 (Algo) — DP                        │
│  → Q51 (TOC) — PDA                        │
│                                          │
│  [Review All] [Retry Wrong] [Share Score] │
└──────────────────────────────────────────┘
```

**FR-2.3a — Score Sharing (WhatsApp)**

After every mock test, a "Share Score" button generates a shareable image (using
`@react-pdf/renderer` → canvas → PNG) with:

- Test name, date, score, AIR prediction
- Subject-wise bar chart
- PadhaiShuru branding
- Opens WhatsApp share intent with pre-filled text

Aspirants screenshot this anyway — give them a button that does it perfectly.

**FR-2.4 — Historical Performance Tracking**

- Store every mock test result in `mock_test_attempts`
- Track score trend over time (line chart)
- Show improvement velocity: "Your score increased by 8 marks in 2 weeks — keep going!"
- "If this was GATE 2024, you'd have qualified" — aspirants think in terms of qualifying, not just scoring
- All-India leaderboard for free mock tests (weekly reset, top 50 shown)

#### 3.1.2 Technical Specifications

| Aspect | Detail |
|--------|--------|
| **New Tables** | `mock_tests` (id, user_id, branch_id, test_type — enum: 'full'/ 'subject'/ 'topic', config JSONB, questions JSONB, duration_min, created_at), `mock_test_attempts` (id, user_id, test_id, answers JSONB, score, total_marks, attempted_count, flagged_count, time_taken_sec, completed_at, air_prediction), `mock_test_responses` (id, attempt_id, question_id, user_answer, is_correct, time_taken_sec) |
| **New API Routes** | `POST /api/mock-tests/generate`, `POST /api/mock-tests/:id/start`, `POST /api/mock-tests/:id/submit`, `GET /api/mock-tests/:id/report`, `GET /api/mock-tests/history`, `GET /api/mock-tests/leaderboard?test_type=free_weekly` |
| **Question Selection** | Weighted random — proportional to historical frequency per subject. Avoids repeating the same question in consecutive tests for the same user. Difficulty distribution matches GATE: ~15% easy, 60% medium, 25% hard (CSE-specific; configurable per branch). |
| **Timer** | Client-side countdown with server-side validation on submit (server records `time_taken_sec` and rejects if > duration × 1.5 — catches tab-switch abuse) |
| **Auto-save** | Answers auto-saved to `mock_test_responses` every 10 seconds via debounced API call. Critical for mobile — app-switch, call-drop, low battery shouldn't lose progress. |
| **Full-screen API** | Use Fullscreen API; detect ESC exit and show a warning toast (not blocking — aspirants might accidentally exit). On mobile, use `screen.orientation.lock('portrait')` to prevent landscape switching mid-test. |
| **Share Image** | Server-side PNG generation via `@react-pdf/renderer` or `canvas` npm package. Pre-render on submit, store in Supabase Storage for 24h, return CDN URL. |
| **Leaderboard** | Weekly free mock tests → leaderboard by score. Shows rank, name, score, branch. Top 50 displayed. Motivates aspirants to compete. |

#### 3.2.3 UI Specifications

Test screen layout:

```
┌─────────────────────────────────────────────────────────────────┐
│  ⏱ 02:34:12 remaining                          [N] Nav  [?]   │
│  GATE CSE Full Test                                     [Exit]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Q. 23 of 65  [Medium]  [2 Marks]                              │
│                                                                 │
│  Consider the following C code:                                │
│                                                                 │
│     int main() {                                               │
│       int x = 5;                                               │
│       printf("%d", ++x + x++);                                 │
│       return 0;                                                │
│     }                                                          │
│                                                                 │
│  What is the output?                                            │
│                                                                 │
│  ○ (A) 6                                                        │
│  ○ (B) 7                                                       │
│  ○ (C) 12                                                      │
│  ○ (D) Undefined behavior                                      │
│                                                                 │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│  [Flag ⚑]              [Save & Next →]    [Mark for Review ⬇]  │
│                                                                 │
│  ● ● ● ● ● ● ○ ○ ○ ○ ○ ○ ● ○ ● ● ● ● ● ○ ●  ← Navigator    │
└─────────────────────────────────────────────────────────────────┘
```

---

### 3.3 Formula Sheet + Quick Revision Mode

#### 3.3.1 Functional Requirements

**FR-3.1 — Formula Repository**

Each subject has a curated formula sheet stored as structured content:

| Field | Type | Notes |
|-------|------|-------|
| Subject | Text | CSE, ECE, etc. |
| Topic | Text | DBMS-Normalization, Algo-DP |
| Formula | LaTeX string | Render with KaTeX |
| Context | Text | "When to use", prerequisites |
| Memory Tip | Text | Short mnemonic or trick |

**FR-3.2 — Revision Mode**

Three modes:

1. **Browse Mode** — Scrollable formula sheets per subject, searchable by keyword. Shows
   coaching reference: "MadeEasy Vol. 2, Page 187" alongside the formula.
2. **Flashcard Mode** — Formula on front, explanation/context on back. Swipe left/right.
   Works great on mobile for bus/train commute study sessions.
3. **Speed Revision** — 30-second timed cards. Auto-advances. Shows only formulas
   you've marked as "hard to remember." Designed for the night before exam — 200
   formulas in 60 minutes.

**FR-3.2a — WhatsApp Share**

Every formula card has a share button. Generates an image with the formula + PadhaiShuru
logo. Aspirants share formula sheets in WhatsApp study groups.

**FR-3.2b — Offline PDF Download**

One-tap PDF download per subject (A4, print-optimized). Aspirants save this for the
"no internet" revision week before GATE. This is the #1 thing aspirants search for on
Google: "GATE CSE formulas PDF free download."

**FR-3.3 — Export / Print**

- PDF export per subject (using `@react-pdf/renderer`)
- Print-optimized CSS (`@media print`)
- Shareable link per formula (deep link)

#### 3.3.2 Technical Specifications

| Aspect | Detail |
|--------|--------|
| **Storage** | New table `formulas` (id, branch_id, subject, topic, formula_latex, context, memory_tip, created_at). Also a Supabase Storage bucket for formula images if LaTeX rendering is insufficient |
| **API Routes** | `GET /api/formulas?branch=X&subject=Y`, `GET /api/formulas/search?q=X` |
| **Rendering** | KaTeX (already a dependency) for server-side rendering in PDFs; client-side for interactive mode |
| **Seed Data** | Manual curation — each subject needs ~50–100 key formulas. Community submissions with admin approval (see 3.7) |

#### 3.3.3 UI Specifications

Flashcard mode:

```
┌─────────────────────────────────────────┐
│  CSE — DBMS                      [1/47] │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │                                 │    │
│  │   2NF = 1NF +                   │    │
│  │   no partial dependency         │    │
│  │                                 │    │
│  │   A → B is partial if           │    │
│  │   A is not a superkey          │    │
│  │                                 │    │
│  └─────────────────────────────────┘    │
│                                         │
│  [🔄 Flip]    [😊 Easy] [😐 Medium] [😰 Hard]│
│                                         │
│  ● ━━━━━━━━━━━━━━━━━━━━━━━━━━ Progress  │
└─────────────────────────────────────────┘
```

---

### 3.4 Syllabus Tracker with Visual Progress

#### 3.4.1 Functional Requirements

**FR-4.1 — Syllabus Registry**

Each GATE branch has a structured syllabus tree:

```
CSE
├── Engineering Mathematics
│   ├── Linear Algebra
│   │   ├── Matrix operations
│   │   ├── Eigenvalues/eigenvectors
│   │   └── ...
│   ├── Probability & Statistics
│   └── ...
├── Digital Logic
├── Computer Organization
├── ...
```

Leaves (individual topics) are the tracking units.

**FR-4.2 — Progress Tracking**

User actions:

- "Mark as covered" on any topic
- Bulk mark: "I studied all of Linear Algebra today"
- Bulk unmark: if they reset

Progress is computed as:

```
coverage = topics_marked / total_topics_in_subject
weighted_coverage = Σ (topic_weight × coverage) / Σ topic_weight
```

Where topic weights are derived from PYQ frequency (topics with more PYQs = higher weight).

**FR-4.3 — Visual Display**

- Progress ring per subject (circular progress, 0–100%)
- Overall syllabus coverage percentage
- Color-coded map: green (>70%), yellow (30–70%), red (<30%)
- "Recommended next topic" — the highest-weight topic not yet marked as covered

#### 3.4.2 Technical Specifications

| Aspect | Detail |
|--------|--------|
| **New Tables** | `syllabus_tree` (id, branch_id, subject, topic_path TEXT[], depth, weight FLOAT, pyq_count), `user_syllabus_progress` (id, user_id, topic_id, covered BOOLEAN, covered_at, source — enum: 'manual' / 'pyq_attempt' / 'mock_test') |
| **Auto-marking** | Topics auto-mark as "covered" when user has correctly answered ≥3 PYQs from that topic (reduces manual tracking burden) |
| **API Routes** | `GET /api/syllabus?branch=X`, `PATCH /api/syllabus/progress/:topicId`, `GET /api/syllabus/progress` |

#### 3.4.3 UI Specifications

```
┌─────────────────────────────────────────────────────────────┐
│  Syllabus Tracker — CSE                                     │
│                                                             │
│  Overall: ████████████░░░░░░  47% covered                  │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  Eng. Math   │  │  Digital Logic│  │  Comp. Org   │     │
│  │    ████████   │  │    █████████ │  │    ████░░░░   │     │
│  │    62%       │  │    88%       │  │    35%       │     │
│  │  5/8 topics  │  │  7/8 topics  │  │  3/9 topics  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │  DSA         │  │  TOC         │  │  DBMS        │     │
│  │  ████░░░░░░  │  │  ██████░░░░  │  │  ████████░░  │     │
│  │  22%        │  │  55%        │  │  71%        │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│                                                             │
│  Recommended: Eigenvalues (Eng. Math) — 12 PYQs, high freq  │
│                                                             │
│  [Click any subject to expand topic list + mark covered]    │
└─────────────────────────────────────────────────────────────┘
```

---

### 3.5 Previous Year Cutoffs Dashboard

#### 3.5.1 Functional Requirements

**FR-5.1 — Data Display**

A public page (`/cutoffs`) showing — GATE uses category-wise cutoffs, and aspirants
obsess over this:

| Year | Branch | Gen | OBC-NCL | SC | ST | PwD | Qualifying Marks (Gen) |
|------|--------|-----|---------|----|----|-----|----------------------|
| 2024 | CSE | 763 | 542 | 507 | 430 | 280 | 30.3 |
| 2023 | CSE | 892 | 634 | 593 | 504 | 328 | 26.5 |
| 2022 | CSE | 1016 | 721 | 674 | 573 | 374 | 26.5 |

Note: "Gen" = General category. "OBC-NCL" = Other Backward Classes — Non Creamy Layer.
Aspirants check their specific category only.

**FR-5.1a — Coaching Comparison**

Show cutoff alongside "MadeEasy predicted cutoff" and "ACE Academy predicted cutoff"
(if available). Builds trust that PadhaiShuru is as reliable as coaching institutes.

**FR-5.2 — Interactive Features**

- **Category badge prominently displayed** — aspirants immediately see their category tab
- Branch selector (dropdown) — 20 branches
- Year range: 2020–2024 (GATE started publishing structured cutoff data from ~2018)
- Predicted cutoff for current year (based on historical trend line + difficulty factor)
- "My score vs cutoff" — user enters their expected score and category, sees:
  - "✓ You would have qualified in 2024, 2023, 2022"
  - "⚠ You would NOT have qualified in 2021 (cutoff: 26.0)"
- **WhatsApp share** — "Share my cutoff analysis" button

**FR-5.3 — Comparison Mode**

Side-by-side comparison of two branches (e.g., CSE vs ECE) to help aspirants decide.
Shows: cutoff trends, average placements, scope for higher studies (MTech/PhD).
Working professionals use this to decide "should I switch to ECE for better PSU chances?"

#### 3.5.2 Technical Specifications

| Aspect | Detail |
|--------|--------|
| **Data Source** | `data/cutoffs/` directory with JSON files per branch per year, or Supabase table `cutoffs` (branch_id, year, category, qualifying_score, air_cutoff) |
| **API** | `GET /api/cutoffs?branch=X&years=5&category=gen` — already exists but unused |
| **Charts** | Recharts (already a dependency) for trend lines |
| **Computation** | Predicted cutoff = linear regression on last 3 years + ±5% volatility buffer |

#### 3.5.3 UI Specifications

```
┌─────────────────────────────────────────────────────────────┐
│  GATE Cutoffs — CSE                              [Branch ▼] │
│                                                             │
│  ┌─────────────────────────┐  ┌─────────────────────────┐  │
│  │  Predicted 2025: 31.0   │  │  My Expected Score:     │  │
│  │  (trend: +0.7/yr)      │  │  [____35____]           │  │
│  │                         │  │                         │  │
│  │  ✓ Would qualify all    │  │  Min qualifying: 30.3   │  │
│  │    5 years shown        │  │  Max seen: 33.0  │  │
│  └─────────────────────────┘  └─────────────────────────┘  │
│                                                             │
│  Year  │ General │ OBC   │ SC    │ ST    │ Qualifying       │
│  2024  │ 763     │ 542   │ 507   │ 430   │ 30.3             │
│  2023  │ 892     │ 634   │ 593   │ 504   │ 26.5             │
│  2022  │ 1016    │ 721   │ 674   │ 573   │ 26.5             │
│  2021  │ 1275    │ 904   │ 845   │ 718   │ 26.0             │
│  2020  │ 1397    │ 991   │ 927   │ 787   │ 25.2             │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  📈 Trend Graph: Qualifying Score Over Years         │    │
│  │  [Recharts line chart]                               │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

### 3.6 Topic Weightage Heatmap

#### 3.6.1 Functional Requirements

**FR-6.1 — Heatmap Generation**

For a selected branch, compute for each (subject, topic) pair:

| Metric | Computation |
|--------|-------------|
| PYQ Count | COUNT from `pyq_questions` where branch + subject + topic match |
| Year Span | First year appeared → Last year appeared |
| Average Marks | AVG(marks) per question in this topic |
| Difficulty Distribution | % easy / medium / hard |
| Frequency Score | PYQ count × avg marks (higher = more important) |

**FR-6.2 — Heatmap Display**

- X-axis: Subjects (CS: DBMS, TOC, Algo, CN, ...)
- Y-axis: Topics within each subject
- Cell color intensity = frequency score (darker = more important)
- Cell content: "8Q · 2 marks avg · 2015–2024"
- Click cell → navigates to PYQ list filtered by that exact topic

**FR-6.3 — Heatmap View Modes**

| Mode | Sort By | Use Case |
|------|---------|----------|
| Frequency | PYQ count desc | "What's most asked?" |
| Marks Weight | PYQ count × marks desc | "What carries most weight in exam?" |
| Recency | Appeared in most recent years | "What's trending now?" |
| Difficulty | Hard topics first | "What's toughest?" |

#### 3.6.2 Technical Specifications

| Aspect | Detail |
|--------|--------|
| **Computation** | Server-side aggregation query on `pyq_questions` grouped by `(branch_id, subject, topic)`. Results cached for 24h. |
| **API** | `GET /api/pyq/analytics/heatmap?branch=X&mode=frequency` — endpoint exists but needs the aggregation backend |
| **Frontend** | Custom grid (not a library heatmap) for precise control over cell rendering and click behavior |
| **Data Quality** | Only include topics with ≥ 2 PYQs (avoid noise from one-off questions) |

#### 3.6.3 UI Specifications

```
┌─────────────────────────────────────────────────────────────────┐
│  Topic Weightage — CSE                     [Frequency ▼] [2024]│
│                                                                 │
│         DBMS    TOC     Algo     CN      CO      DL     OS     │
│  RDBMS  ██████  ░░░░░  ░░░░░   ░░░░░  ░░░░░  ░░░░░  ░░░░░   │
│         18Q 2m   0Q     0Q      0Q      0Q      0Q      0Q     │
│                                                                 │
│  Normal █████░  ░░░░░  ░░░░░   ░░░░░  ░░░░░  ░░░░░  ░░░░░   │
│         12Q 2m   0Q     0Q      0Q      0Q      0Q      0Q     │
│                                                                 │
│  SQL    ████░   ░░░░░  ░░░░░   ░░░░░  ░░░░░  ░░░░░  ░░░░░   │
│         10Q 2m   0Q     0Q      0Q      0Q      0Q      0Q     │
│                                                                 │
│  PL/SQL ██░░░   ░░░░░  ░░░░░   ░░░░░  ░░░░░  ░░░░░  ░░░░░   │
│          6Q 1m   0Q     0Q      0Q      0Q      0Q      0Q     │
│                                                                 │
│  Trans  ░░░░░   ████░  ░░░░░   ░░░░░  ░░░░░  ░░░░░  ░░░░░   │
│          0Q      9Q 2m  0Q      0Q      0Q      0Q      0Q     │
│                                                                 │
│  DP     ░░░░░   ░░░░░  ██████  ░░░░░  ░░░░░  ░░░░░  ░░░░░   │
│          0Q      0Q     16Q 2m  0Q      0Q      0Q      0Q     │
│                                                                 │
│  [...]  (scrollable)                                             │
│                                                                 │
│  Darker = more important. Click any cell to practice.           │
└─────────────────────────────────────────────────────────────────┘
```

---

### 3.7 Per-Question Community Explanations

#### 3.7.1 Functional Requirements

**FR-7.1 — Submission**

Logged-in users can submit an explanation for any PYQ:

- Text explanation (markdown supported)
- Optional image attachment (handwritten solution, diagram — very common in Indian
  study culture — aspirants share photos of their notebook solutions)
- Tags: "shortcut", "trick", "alternative-method", "common-mistake",
  "coaching-key-differs" (when MadeEasy/ACE answer differs from official GATE key —
  this is a HIGH-value tag for aspirants who trust coaching keys)

**FR-7.2 — Moderation**

- Submissions enter a "pending" state
- Admins review via `/admin/pyq/review-queue`
- **Trust signal:** Approved explanations show the submitter's "verified contributor"
  badge. Aspirants trust peer-verified content more than anonymous.
- **Coaching conflict resolution:** When an explanation says "official key says A, but
  MadeEasy/ACE says B" — add a label: "⚠️ Answer key conflict — verify before exam."
  This is the kind of content aspirants will fight over in WhatsApp groups.
- Users earn "Contributor" badge for approved explanations. Badges shown on profile.

**FR-7.3 — Display**

On the question view page:

```
Q. Consider the following C code...

(A) 6           ← Official GATE answer key
(B) 7
(C) 12
(D) UB

─── Community Explanations (3) ───────────────────────────────

👤 Rahul K. ✓Verified  [Shortcut]  👍 42
"Solve in 20 seconds: ++x = 6 before addition,
x++ = 7 after. But order of evaluation in function
arguments is unspecified → UB. Key insight: check
if the compiler matters."
[Read more ▼]  [📤 Share]

⚠️ Note from Priya S.: "MadeEasy answer key says (C)
but official GATE key says (D). Verify with latest
notification before exam."  👍 89  [📌 Save]
[Submit your explanation]
```

**FR-7.3a — WhatsApp Share per Explanation**

Each explanation has a share button. Generates an image with the question snippet +
explanation summary. "Sharing explanations" is how aspirants build reputation in
WhatsApp groups.

#### 3.7.2 Technical Specifications

| Aspect | Detail |
|--------|--------|
| **New Tables** | `question_explanations` (id, question_id, user_id, content_markdown, tags TEXT[], status — enum: pending/approved/rejected, upvotes, created_at), `explanation_images` (id, explanation_id, storage_path) |
| **API Routes** | `POST /api/pyq/questions/:id/explanations`, `GET /api/pyq/questions/:id/explanations`, `POST /api/pyq/explanations/:id/upvote`, admin routes for moderation |
| **Storage** | Supabase Storage bucket `explanations` for images |
| **Moderation** | Admin panel extension; existing admin auth via `admin/login` |
| **Rate Limit** | Max 3 submissions/day for free users, unlimited for premium |

---

### 3.8 AIR (All-India Rank) Predictor

#### 3.8.1 Functional Requirements

**FR-8.1 — Predictor Tool**

Simple single-page tool — must load in < 2 seconds because aspirants check this daily:

1. User enters: expected marks (0–100)
2. Selects: GATE branch, paper year (or "predict for 2025"), **category (Gen/OBC/SC/ST/PwD)**
3. System shows: predicted rank range (e.g., "AIR 450–620"), qualifying status, and a message

**FR-8.1a — Category-Aware Prediction**

Predictions must be category-specific. Same marks → very different AIR in Gen vs OBC.
The predictor shows both: "Your rank: 450–620 (Gen), 180–320 (OBC-NCL)."

**FR-8.1b — Motivational Messaging**

Aspirants are anxious. Use encouraging but realistic copy:

- < 500 AIR: "🎯 Excellent! You're in top 0.5%. Focus on revision now."
- 500–1500 AIR: "💪 Strong chance! With 1–2 more months, you can break into top 500."
- > 5000 AIR: "📈 Room for improvement. Your DBMS score is pulling you down — focus there."
- Not qualifying: "⚠️ Current score doesn't meet cutoff. Here's what to focus on: [link to study plan]"

**FR-8.1c — WhatsApp Shareability**

This is the #1 viral feature. The share image shows:
- Your score, predicted AIR, branch, category
- A comparison bar: "You vs last year's cutoff"
- One-line motivational message
- Opens directly to WhatsApp

**FR-8.2 — Prediction Model**

Based on historical data:

```
predicted_air = interpolate(historical_cutoff_data, user_marks, category)
range_width = ± (predicted_air * 0.12)  # 12% confidence interval — tighter than generic
```

Data sources: `cutoffs` table with historical AIR-to-score mappings per category per branch.

**FR-8.3 — Output**

```
┌──────────────────────────────────┐
│  AIR Predictor — CSE 2025        │
│  Category: General               │
│                                  │
│  Your Expected Score: [___65___] │
│                                  │
│  ┌──────────────────────────┐    │
│  │  Predicted AIR: 180–320  │    │
│  │  ████████████████░░░░░░  │    │
│  │                          │    │
│  │  🎯 Excellent!           │    │
│  │  Top 0.5% of all        │    │
│  │  test-takers.            │    │
│  │                          │    │
│  │  ✓ Qualifying: 65 > 31   │    │
│  │  ✓ Likely PSU eligible   │    │
│  └──────────────────────────┘    │
│                                  │
│  [📤 Share on WhatsApp]          │
│                                  │
│  Based on 2020–2024 data.        │
└──────────────────────────────────┘
```

#### 3.8.2 Technical Specifications

| Aspect | Detail |
|--------|--------|
| **Data** | Historical cutoff data — needs to be curated/imported per branch per year |
| **API** | `GET /api/predictor/air?branch=X&marks=Y` |
| **Computation** | Server-side interpolation. No client-side math — prevents manipulation of the algorithm |
| **Caching** | Results cached for the session (same inputs → same output) |

---

### 3.9 Bookmark + Personal Notes on Questions

#### 3.9.1 Functional Requirements

**FR-9.1 — Notes**

On any PYQ view:

- "Add Note" button opens an inline textarea
- Notes support markdown (bold, italic, code, lists)
- Notes are private — only visible to the user who wrote them
- Edit / Delete own notes
- Notes appear as a collapsible section below the question

**FR-9.2 — Enhanced Bookmarks**

Existing bookmarks get upgraded:

| Field | Type | Notes |
|-------|------|-------|
| Bookmark | Boolean | Existing — just added/few |
| Note | Text | New — markdown supported |
| Tags | Array of strings | User-defined: "revision", "tricky", "must-revise" |
| Reminder | Date | Optional — "remind me to revisit this" |

**FR-9.3 — Notes Dashboard**

A dedicated page (`/dashboard/notes`) showing:

- All notes across all subjects, searchable
- Filter by subject, tag, date
- Sort by: recently added, oldest first, random (spaced repetition style)
- Bulk export notes as PDF or markdown

#### 3.9.2 Technical Specifications

| Aspect | Detail |
|--------|--------|
| **New Fields** | Add `note TEXT`, `tags TEXT[]`, `remind_at TIMESTAMPTZ` to existing `pyq_bookmarks` table |
| **New Table** | `question_notes` (id, user_id, question_id, note_markdown, tags TEXT[], remind_at, created_at, updated_at) — separate from bookmarks for cleaner queries |
| **API Routes** | `POST /api/pyq/questions/:id/notes`, `PATCH /api/pyq/notes/:id`, `DELETE /api/pyq/notes/:id`, `GET /api/dashboard/notes` |

---

### 3.10 PWA + Offline Mode

#### 3.10.1 Functional Requirements

**FR-10.1 — Web App Manifest**

- `manifest.json` with app name, icons, theme color, display: standalone
- Install prompt on Chrome/Edge (beforeinstallprompt event)

**FR-10.2 — Service Worker (Workbox)**

Caching strategy:

| Resource Type | Strategy | Reason |
|---------------|----------|--------|
| App shell (HTML/JS/CSS) | Stale-while-revalidate | Instant load, update in background |
| PYQ data (JSON) | Cache-first | Offline access to questions |
| Formula sheets | Cache-first | Revision without internet |
| User data (attempts, notes) | Network-first | Must be fresh, fallback to cache |
| Images (explanations, avatars) | Cache-first | Bandwidth saving |

**FR-10.3 — Offline Indicators**

- Banner at bottom (not top — aspirants find top banners annoying during study):
  "📴 Offline — PYQs & formulas available. Notes will sync when you're back online."
- Queue failed writes (notes, attempts) and sync when back online
- Show sync status: "3 notes synced ✓" after reconnect
- **Offline-first PYQ download:** Let aspirants pre-download their entire branch's PYQs
  in one tap. "Download CSE PYQs (12MB) — available offline." This is the #1 request
  from aspirants in Tier 2/3 cities with unreliable internet.

**FR-10.4 — Capacitor Alignment**

The existing Capacitor Android build continues to work. PWA is the web equivalent — same
data, different delivery. No code duplication needed. The Capacitor build should get the
same offline-first treatment.

**FR-10.5 — Data Saver Mode**

Detect `navigator.connection.saveData` (Android Data Saver). When active:
- Disable auto-play videos in virtual library
- Serve compressed images
- Skip analytics pings
- Show a "Data Saver mode active" indicator

#### 3.10.2 Technical Specifications

| Aspect | Detail |
|--------|--------|
| **Library** | `@serwist/next` — Workbox wrapper for Next.js App Router |
| **Manifest** | `app/manifest.ts` or `public/manifest.json` with dynamic manifest via Next.js route |
| **Offline Page** | Custom offline fallback (`app/offline/page.tsx`) with cached content links |
| **Background Sync** | Queue failed API calls in IndexedDB, replay on reconnect |
| **Storage** | Cache PYQ JSON files (already on disk) + formula data via service worker |

---

## 4. Cross-Feature Technical Considerations

### 4.1 Authentication & Authorization

- All user-specific features require `createServerClient()` (async — never forget)
- Premium checks via `src/lib/entitlements.ts` (`requirePremium(userId)`)
- Admin checks via role in `profiles.role` column

### 4.2 Database Architecture

All new features use the existing Supabase backend:

- RLS policies on all new tables (user-scoped access)
- UUID primary keys throughout
- `created_at` timestamps on all tables
- JSONB for flexible config (study plans, mock test configs)
- Indexes on `user_id` for all user-scoped tables

### 4.3 API Design Standards

- All responses use `ok()`, `badRequest()`, `unauthorized()`, `forbidden()`, `serverError()` from `src/lib/api/response.ts`
- All server clients are `await`-ed (async `createServerClient()`)
- Rate limiting via `rate_limit_check` RPC on all write endpoints
- Standard response shape: `{ data, error?, meta? }`
- **WhatsApp sharing endpoint:** `GET /api/share/:type/:id` — generates a PNG image and
  returns a shareable URL. Types: `score-card`, `study-plan-week`, `formula-card`,
  `cutoff-analysis`, `air-prediction`
- **Offline data endpoint:** `GET /api/branch/:id/offline-bundle` — returns compressed
  JSON bundle of all PYQs for a branch (for pre-download)

### 4.4 UI/UX Standards

- Mobile-first: 390px minimum viewport. 80% of traffic will be mobile.
- **WhatsApp green (#25D366)** used sparingly for share buttons only — not as brand color
- **Font loading:** Use `font-display: swap` for Inter/Playfair. On 3G, fonts must not
  block rendering. FOUT is acceptable.
- **Image optimization:** All images use `next/image` with `priority` on above-fold content.
  Formula images use lazy loading. Compress PNGs for formula share cards.
- **Dark/light theme via CSS variables + `ThemeProvider`**
- Framer Motion for page transitions and micro-interactions — but respect
  `prefers-reduced-motion`
- Tailwind v4 with `@theme inline`
- Accessibility: semantic HTML, focus states, labels on inputs
- **Language:** Primary copy in Hinglish for onboarding/engagement (e.g., "Apna plan
  banayein"). Technical content remains English. Toggle available but defaults to English.
- **Pricing display:** Always show per-day cost. "₹49/month" → "₹1.60/day (less than a chai)"
- **Social proof on pricing page:** "2,400+ students already upgraded this month"
- **No sticky headers on study pages** — aspirants reading long questions need every pixel

---

## 5. Migration & Rollout Plan

### Phase 1 — Quick Wins (Weeks 1–4) — Ship fast, build trust
- **Cutoffs Dashboard (3.5)** — uses existing API, just build UI. Every aspirant needs this.
- **AIR Predictor (3.8)** — simple tool, highest shareability. WhatsApp viral loop.
- **Formula Sheet (3.3)** — fastest to ship. Start with CSE + ECE (highest demand branches).
  Include "download PDF" button from day one. Aspirants search "GATE CSE formulas PDF" on
  Google — capture that intent.

### Phase 2 — Core Experience (Weeks 5–10) — Convert free to paid
- **Mock Test Environment (3.1)** — the #1 reason aspirants pay. Ship with 1 free test/week,
  unlimited for premium. Weekly leaderboard drives FOMO.
- **Topic Weightage Heatmap (3.6)** — makes GATE Intelligence actionable. "Which topics to
  skip?" is the most common aspirant question.
- **Syllabus Tracker (3.4)** — gamifies prep. Works with study plan.

### Phase 3 — Retention (Weeks 11–16) — Keep them coming back
- **Study Plan Generator (3.1)** — most complex. Ship after mock tests are stable so the
  plan can reference test performance. Coaching-aligned references build trust.
- **Bookmarks + Notes (3.8)** — quick win. Working professionals especially need this.
- **PWA + Offline (3.10)** — ship before exam season (Dec–Jan). Offline bundle download
  is the killer feature for final-month revision.

### Phase 4 — Community (Weeks 17–24) — Network effects
- **Community Explanations (3.7)** — launch only after 5K+ registered users. Moderation
  overhead is real. The "coaching key conflict" tag is the differentiator.

---

## 8. Competitive Landscape & Positioning

| Competitor | What they do well | PadhaiShuru's edge |
|------------|-------------------|-------------------|
| **Gradeup (BYJU'S)** | Full test series, live classes | We're free-first. PYQs are free. Gradeup locks everything behind paywall. |
| **Testbook** | Huge test bank, low pricing (₹149/year) | Our AI doubt engine + personalized plan is something Testbook doesn't have. |
| **Unacademy** | Educator-driven, free + paid | We're PYQ-first, not educator-first. More structured, less content overload. |
| **MadeEasy/ACE** | Trusted by 10+ years, test series | We reference their material (bridge gap) AND provide digital-first features (AI, analytics, offline). |
| **YouTube channels** | Free content, trusted | Unstructured, no practice tracking, no personalized feedback. |

### Positioning Statement

> "PadhaiShuru — India's first AI-powered GATE prep platform that gives you a personalized
> study plan, realistic mock tests, and instant doubt solving — for less than the price of
> a chai per day."

### Go-to-Market Signals for Indian Audience

1. **Free tier must be genuinely useful** — 5 AI doubts/day + full PYQ access is enough
   to hook aspirants. The moment they experience the AI doubt engine, they'll want more.
2. **Pricing anchoring** — Show "MadeEasy: ₹15,000/year | Testbook: ₹149/year |
   PadhaiShuru: ₹588/year" — we're cheaper than Testbook on monthly, more feature-rich.
3. **Referral = WhatsApp forward** — "Refer 3 friends, get 1 month free" → they'll share
   in GATE prep groups, college WhatsApp groups, Telegram channels.
4. **Trust badges** — Show "10,000+ PYQs solved", "4.8★ rating", "Used by students from
   IITs, NITs, GFTIs" on homepage.
5. **Exam calendar integration** — "GATE 2025 applications open in August. Start your
   prep today." Time-bound messaging drives urgency.

---

## 9. Open Questions

1. **Content curation for formulas** — Who writes the formula sheets? Subject experts,
   community, or both? Recommendation: expert-curated first, community-contributed after
   5K users.
2. **Cutoff data sourcing** — Where do we get historical cutoff data per branch per year
   per category? GATE official website (IISc) publishes these. Need to scrape/curate.
3. **Coaching reference mapping** — How do we map PadhaiShuru topics to MadeEasy/ACE
   page numbers? Manual mapping per branch, or partner with coaching institutes?
4. **Mock test question selection** — Do we reuse PYQs or generate new questions? Current
   approach reuses PYQs. Aspirants prefer PYQs (they trust historical questions more).
5. **AIR prediction accuracy** — What confidence interval is acceptable? ±12% for
   category-specific predictions. ±15% is too wide — aspirants will lose trust.
6. **Moderation capacity** — Who reviews community explanations? Initially admin-only.
   Scale to trusted users ("moderators") after 5K users.
7. **Language strategy** — Do we translate all UI to Hinglish, or keep English-only
   for technical content? Recommendation: Hinglish for navigation/engagement, English
   for questions/answers (aspirants are comfortable with English technical terms).
8. **Pricing psychology** — Should we show ₹/day ("₹1.60/day = 1 chai") or ₹/month
   on the pricing page? A/B test both. Indian aspirants respond strongly to
   "less than chai" framing.

---

## 7. Success Metrics

| Feature | Primary Metric | Target | Notes |
|---------|---------------|--------|-------|
| Mock Tests | Tests completed per user | > 2/month for premium | Weekly free test drives conversion |
| Formula Sheets | PDF downloads | > 500/week | Organic Google traffic driver |
| Cutoffs | Page visits | > 20% of homepage traffic | Seasonal spike during result season (March) |
| AIR Predictor | Tool uses | > 2,000/day near exam dates | #1 viral feature — WhatsApp shares |
| Study Plan | Users with active plan | > 40% of logged-in users | Most complex; low initial adoption OK |
| Syllabus Tracker | Topics marked covered | > 60% syllabus coverage | Paired with study plan |
| Topic Heatmap | PYQ clicks from heatmap | > 30% lead to practice | Must feel actionable, not decorative |
| Community Explanations | Submissions | > 50/month after 3 months | Phase 4 — only after 5K users |
| Notes/Bookmarks | Notes created per user | > 5 per active user | Working professionals love this |
| PWA | Offline bundle downloads | > 30% of logged-in users | Critical before Dec–Jan exam season |
| WhatsApp Shares | Total share actions | > 1,000/week | Every shareable feature tracked |
| Free→Premium Conversion | % free users upgrading | > 5% in first 90 days | Driven by mock test access |

### India-Specific Engagement Signals

- **Exam season spikes:** Track traffic/cutoffs/mock-test usage peaks in Feb–March (GATE results)
  and Aug–Sep (GATE application window). These are when aspirants are most active.
- **WhatsApp share rate:** Every feature with sharing should track share→click ratio.
  Target: > 30% of shared links get clicked (WhatsApp is a trust signal, not just distribution).
- **Mobile session duration:** Target > 12 minutes per session on mobile (aspirants study
  in focused bursts on phones). Desktop sessions > 25 minutes.
- **Return rate:** 60%+ of users who take one mock test return for another within 7 days.

---

*End of PRD*
