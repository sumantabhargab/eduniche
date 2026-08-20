# Eduneuro

Pre-launch website for Eduneuro — an AI-powered, neuroscience-informed platform for learning real-world skills through active practice and personalized feedback.

## Quick Start

```bash
npm install
cp .env.example .env.local
# Fill in your Supabase credentials in .env.local
npm run dev
```

## Stack

- **Next.js 16** (App Router, TypeScript, Turbopack)
- **Tailwind CSS** (v4 with @theme inline)
- **Supabase** (PostgreSQL + RLS)
- **Fonts**: Inter (sans) + Playfair Display (serif)

## Architecture

```
src/
  app/
    page.tsx           — Main homepage (all sections)
    layout.tsx         — Root layout + fonts + metadata
    globals.css        — Design tokens, animations, reduced-motion
    api/
      waitlist/route.ts    — POST: Create waitlist signup + referral attribution
      leaderboard/route.ts — GET: Top referrers from database
      ref/[code]/route.ts  — GET: Validate referral code
  components/
    ProductDemo.tsx       — Interactive learning demo (guitar example)
    Leaderboard.tsx       — Live top-referrers from DB
    WaitlistForm.tsx      — Form with validation + post-signup referral panel
  lib/
    supabase/
      server.ts       — createClient() + createServiceClient()
      client.ts       — Browser client (for future use)
      client-browser.ts — Browser client instance
middleware.ts         — Sets referral cookie from URL params
supabase/schema.sql   — Database schema + RLS + RPC
```

## Database Setup

1. Go to your Supabase project → SQL Editor
2. Run the SQL in `supabase/schema.sql`

Required env vars:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Referral System

1. User visits `/?ref=ABC123` → middleware sets cookie
2. User signs up → API reads cookie + ref param → validates referral code → increments referrer's count
3. After signup → user gets their own unique referral link
4. Verified referrals only (actual signups count, not clicks)

## Deployment (Vercel)

1. Push to GitHub
2. Import into Vercel
3. Set environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy

## Features

- Real waitlist with email deduplication
- Referral system with unique codes
- Leaderboard (top 50 by verified referrals)
- Position tracking
- Rate limiting (5 req/min per IP)
- Server-side validation
- RLS policies
- Responsive design (390px → 1440px+)
- Reduced motion support
- Accessibility (semantic HTML, focus states, labels)
- SEO (title, meta description, OG metadata)
