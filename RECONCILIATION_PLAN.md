# DATABASE RECONCILIATION PLAN
## Eduniche — Safe Path from Current Hybrid State to Stable MVP

**Date**: 2026-08-29
**Status**: PLANNING ONLY — Do not execute until reviewed and approved
**Strategy**: C — New remote baseline migration + idempotent feature migrations

---

## TABLE OF CONTENTS

1. [Current Remote State](#1-current-remote-state)
2. [Current Local State](#2-current-local-state)
3. [Statement-by-Statement Classification](#3-statement-by-statement-classification)
4. [Conflicts](#4-conflicts)
5. [Legacy Systems](#5-legacy-systems)
6. [MVP Systems](#6-mvp-systems)
7. [Exact Database Changes Required](#7-exact-database-changes-required)
8. [Migration Strategy](#8-migration-strategy)
9. [Application Code Changes](#9-application-code-changes)
10. [Security Changes](#10-security-changes)
11. [Testing Plan](#11-testing-plan)
12. [Execution Plan](#12-execution-plan)

---

## 1. CURRENT REMOTE STATE

### 1.1 Tables in Remote Database (7)

| Table | Columns (remote) | Source | Notes |
|-------|------------------|--------|-------|
| `profiles` | id (PK→auth.users), role (admin/student), display_name, created_at, updated_at | Manual or schema.sql | **Missing**: username, avatar_url, daily_goal_minutes, timezone |
| `content_folders` | id (UUID), name, parent_id (self-FK), path (TEXT), depth (INT), branch, subject, resource_type, sort_order, created_at, updated_at, created_by | Migration 20260101 | Matches migration definition |
| `content_resources` | id (UUID), name, original_filename, mime_type, file_size, storage_path, folder_id (FK), branch, subject, resource_type, visibility (draft/published/archived), tags[], description, created_at, updated_at, uploaded_by | Migration 20260101 | **Missing**: access_tier (free/premium) |
| `waitlist_users` | id (UUID), email (UNIQUE), referral_code, position, learning_challenge, created_at | schema.sql | Manual insertion or schema.sql |
| `leaderboard` | (TABLE — columns mirror waitlist_users) | Manual addition | **CONFLICT**: schema.sql defines it as VIEW, remote has it as TABLE |
| `study_rooms` | id (TEXT PK), name, description, branch_id, mode (focus/discussion), max_participants, is_open, seed, created_at | Migration 20260202 | TEXT PK is unusual; data may exist |
| `announcements` | id (UUID), title, content, type (info/urgent/event), priority (low/medium/high), status (draft/published/archived), target_type (all/premium/free), target_branch, target_subject, created_by, scheduled_at, expires_at, created_at, updated_at | Migration 20260128 | Has seed data |
| `announcement_reads` | id (UUID), announcement_id (FK), user_id (FK), read_at | Migration 20260128 | UNIQUE(announcement_id, user_id) |
| `storage.buckets` | id, name, public | Migration 20260101 | eduniche-content bucket exists |

### 1.2 Extensions

| Extension | Status |
|-----------|--------|
| `uuid-ossp` | Active (from schema.sql or manual) |
| `pg_trgm` | Active (from migration 20260101) |
| `pgcrypto` | **NOT active** (needed for gen_random_uuid() in multiple migrations) |
| `plpgsql` | Active (implicit, needed for triggers) |

### 1.3 RLS Policies

| Table | Policies |
|-------|----------|
| `profiles` | Users read own, Users update own |
| `content_folders` | Admin full |
| `content_resources` | Admin full, Public read published |
| `announcements` | Admin full CRUD, Users read published/non-expired |
| `announcement_reads` | Admin full, Users own |

### 1.4 RPC Functions

| Function | Status |
|----------|--------|
| `increment_referral_count()` | SECURITY DEFINER — from schema.sql |
| `chat_create_conversation()` | Does NOT exist (migration 20240101 has DROP IF EXISTS but no CREATE evidence) |
| `chat_send_message()` | Does NOT exist |

### 1.5 Migration History

| Table | Status |
|-------|--------|
| `supabase_migrations.schema_migrations` | **EMPTY** — zero entries |

### 1.6 Auth Users

| Status |
|--------|
| Unknown — cannot enumerate via SQL without service_role direct access |

### 1.7 What Is NOT in Remote

| Expected Object | Expected By |
|----------------|-------------|
| `study_sessions` | Migrations 20260902, 20260905, app routes |
| `user_subscriptions` | Migration 20260903, app routes |
| `user_badges` | Migration 20260905, app routes |
| `badge_definitions` | Migration 20260905 |
| `chat_messages` | Migration 20260904, app routes |
| `moderation_logs` | Migration 20260904 |
| `muted_users` | Migration 20260904 |
| `banned_users` | Migration 20260904 |
| `ai_conversations` | Migration 20260201 |
| `ai_messages` | Migration 20260201 |
| `conversations` | Migration 20240101 |
| `conversation_participants` | Migration 20240101 |
| `messages` | Migration 20240101 |
| `storage.objects` policies for chat_media | Migration 20260904 |

---

## 2. CURRENT LOCAL STATE

### 2.1 Migration Files

| File | Purpose | Status |
|------|---------|--------|
| `20240101_chat_system.sql` | Old chat: conversations, messages, RPCs | NOT in remote |
| `20260101_content_cms.sql` | Content CMS: profiles, folders, resources, storage | PARTIALLY in remote |
| `20260128_announcements.sql` | Announcements system | PARTIALLY in remote |
| `20260201_ai_doubt_engine.sql` | AI Doubt Engine | NOT in remote |
| `20260202_study_rooms.sql` | Study Rooms | PARTIALLY in remote |
| `20260901_user_profiles.sql` | Profile columns + RLS update | NOT in remote |
| `20260902_study_sessions.sql` | Study sessions + streak RPC | NOT in remote |
| `20260903_subscriptions.sql` | Subscriptions + RPCs | NOT in remote |
| `20260904_global_chat.sql` | New global chat | NOT in remote |
| `20260905_leaderboard_badges.sql` | Leaderboard fix + badges + access_tier | NOT in remote |
| `20260906_content_access_tiers.sql` | Refined access_tier policies + breadcrumbs RPC | NOT in remote |

### 2.2 Application Routes Expecting These Tables

| Route | Tables Used |
|-------|-------------|
| `GET /api/study/stats` | study_sessions, profiles |
| `POST /api/study/sessions` | study_sessions |
| `GET /api/study/sessions` | study_sessions |
| `PATCH /api/study/sessions/[id]` | study_sessions |
| `GET /api/leaderboard` | study_sessions, profiles |
| `GET /api/chat/messages` | chat_messages, muted_users, banned_users |
| `POST /api/chat/messages` | chat_messages |
| `POST /api/ai/doubt` | ai_conversations, ai_messages, user_subscriptions |
| `POST /api/subscriptions/create-order` | user_subscriptions |
| `POST /api/subscriptions/verify` | user_subscriptions |
| `GET/PATCH /api/admin/content/*` | content_folders, content_resources |
| `GET /admin/announcements` | announcements |

### 2.3 Application Components Expecting These Features

| Component | Database Dependency |
|-----------|---------------------|
| `/dashboard` | study_sessions (timer), profiles (username, daily_goal_minutes, timezone) |
| `/library` | content_folders, content_resources (access_tier), get_folder_breadcrumbs() |
| `/chat` | chat_messages, muted_users, banned_users |
| `/admin/chat` | conversations, messages (OLD system) |
| `/doubts` | ai_conversations, ai_messages |
| `/pricing` | user_subscriptions (for display) |

---

## 3. STATEMENT-BY-STATEMENT CLASSIFICATION

### 3.1 `20260101_content_cms.sql`

| Statement | Classification | Notes |
|-----------|---------------|-------|
| `CREATE EXTENSION IF NOT EXISTS "uuid-ossp"` | **ALREADY EXISTS** | Safe to re-run (IF NOT EXISTS) |
| `CREATE EXTENSION IF NOT EXISTS pg_trgm` | **ALREADY EXISTS** | Safe to re-run |
| `CREATE EXTENSION IF NOT EXISTS pgcrypto` | **MISSING — SAFE TO CREATE** | Required by other migrations |
| `CREATE TABLE IF NOT EXISTS profiles` | **ALREADY EXISTS BUT DIFFERENT** | Remote has role/display_name only; local adds username, avatar_url, etc. via later migration. Base table matches. |
| `ALTER TABLE profiles ENABLE ROW LEVEL SECURITY` | **ALREADY EXISTS** | Idempotent |
| `DROP POLICY IF EXISTS + CREATE "Users read own profile"` | **NEEDS UPDATE** | Remote has this; but later migration adds `public_read_public_profile_fields` policy |
| `DROP POLICY IF EXISTS + CREATE "Users update own profile"` | **ALREADY EXISTS AND COMPATIBLE** | |
| `GRANT ALL ON profiles TO service_role` | **ALREADY EXISTS** | Safe to re-run |
| `GRANT SELECT, UPDATE ON profiles TO authenticated` | **ALREADY EXISTS** | Safe to re-run |
| `CREATE TABLE IF NOT EXISTS content_folders` | **ALREADY EXISTS AND COMPATIBLE** | Remote matches local definition |
| All content_folders indexes | **ALREADY EXISTS** | IF NOT EXISTS guards |
| `CREATE TABLE IF NOT EXISTS content_resources` | **ALREADY EXISTS BUT DIFFERENT** | Missing access_tier column (added by later migration) |
| All content_resources indexes | **ALREADY EXISTS** | IF NOT EXISTS guards (except the trigram index for access_tier which doesn't exist yet) |
| `CREATE OR REPLACE FUNCTION update_folder_path()` | **ALREADY EXISTS** | OR REPLACE is safe |
| Trigger `trigger_update_folder_path` | **ALREADY EXISTS** | DROP IF EXISTS + CREATE |
| All content_folders/content_resources RLS | **ALREADY EXISTS** | DROP IF EXISTS + CREATE |
| `INSERT INTO storage.buckets` | **ALREADY EXISTS** | ON CONFLICT DO NOTHING |
| All storage policies | **ALREADY EXISTS** | DROP IF EXISTS + CREATE |

### 3.2 `20240101_chat_system.sql`

| Statement | Classification | Notes |
|-----------|---------------|-------|
| `CREATE TABLE IF NOT EXISTS conversations` | **LEGACY — NOT REQUIRED FOR MVP** | Application does not use this system; admin chat reads from it but admin chat is being retired |
| `CREATE TABLE IF NOT EXISTS conversation_participants` | **LEGACY — NOT REQUIRED FOR MVP** | Part of old chat |
| `CREATE TABLE IF NOT EXISTS messages` | **LEGACY — NOT REQUIRED FOR MVP** | Part of old chat |
| `chat_create_conversation()` RPC | **LEGACY — NOT REQUIRED FOR MVP** | Not called by any active code path |
| `chat_send_message()` RPC | **LEGACY — NOT REQUIRED FOR MVP** | Not called by any active code path |
| All RLS for old chat | **LEGACY — NOT REQUIRED FOR MVP** | |
| `DROP FUNCTION IF EXISTS` pattern | **OBSOLETE** | Unique among migrations; not needed |

### 3.3 `20260128_announcements.sql`

| Statement | Classification | Notes |
|-----------|---------------|-------|
| `CREATE TABLE IF NOT EXISTS announcements` | **ALREADY EXISTS IN REMOTE** | Matches remote state |
| `CREATE TABLE IF NOT EXISTS announcement_reads` | **ALREADY EXISTS IN REMOTE** | Matches remote state |
| All RLS for announcements | **ALREADY EXISTS IN REMOTE** | Matches remote state |

### 3.4 `20260201_ai_doubt_engine.sql`

| Statement | Classification | Notes |
|-----------|---------------|-------|
| `SECURITY DEFINER ai_conversations` | **MISSING — SAFE TO CREATE** | Required by /api/ai/doubt |
| `SECURITY DEFINER ai_messages` | **MISSING — SAFE TO CREATE** | Required by /api/ai/doubt |
| RLS for ai_conversations/ai_messages | **MISSING — SAFE TO CREATE** | Required for data isolation |

### 3.5 `20260202_study_rooms.sql`

| Statement | Classification | Notes |
|-----------|---------------|-------|
| `CREATE TABLE IF NOT EXISTS study_rooms` | **ALREADY EXISTS — NEEDS VERIFICATION** | Remote has it with TEXT PK; verify column set matches |
| `study_room_presence` | **MISSING — SAFE TO CREATE** | Required for presence tracking |
| RLS for study_rooms/presence | **NEEDS UPDATE** | Remote RLS may differ from local definition |

### 3.6 `20260901_user_profiles.sql`

| Statement | Classification | Notes |
|-----------|---------------|-------|
| `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username` | **MISSING — SAFE TO CREATE** | Required by leaderboard, chat, display |
| `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url` | **MISSING — SAFE TO CREATE** | Required by leaderboard, chat |
| `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS daily_goal_minutes` | **MISSING — SAFE TO CREATE** | Required by dashboard timer |
| `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS timezone` | **MISSING — SAFE TO CREATE** | Required by stats streak calculation |
| `ALTER TABLE profiles ADD COLUMN updated_at` | **ALREADY EXISTS** | Present in base migration |
| DROP + CREATE RLS policies | **NEEDS UPDATE** | Adds `public_read_public_profile_fields` policy |
| CREATE UNIQUE INDEX on username | **MISSING — SAFE TO CREATE** | Enforces uniqueness |

### 3.7 `20260902_study_sessions.sql`

| Statement | Classification | Notes |
|-----------|---------------|-------|
| `CREATE TABLE IF NOT EXISTS study_sessions` | **MISSING — SAFE TO CREATE** | Critical — application depends on this |
| All indexes on study_sessions | **MISSING — SAFE TO CREATE** | Required for leaderboard/stats performance |
| RLS on study_sessions | **MISSING — SAFE TO CREATE** | Critical for data isolation |
| `get_user_daily_stats()` RPC | **MISSING — SAFE TO CREATE** | Used by leaderboard? Actually app queries study_sessions directly |
| `expire_subscriptions()` — NO, this is in 20260903 | | |

### 3.8 `20260903_subscriptions.sql`

| Statement | Classification | Notes |
|-----------|---------------|-------|
| `CREATE TABLE IF NOT EXISTS user_subscriptions` | **MISSING — SAFE TO CREATE** | Required by pricing, AI doubt, library |
| `has_active_subscription()` RPC | **MISSING — SAFE TO CREATE** | Used by /api/ai/doubt |
| `expire_subscriptions()` RPC | **MISSING — SAFE TO CREATE** | Cron-job candidate |

### 3.9 `20260904_global_chat.sql`

| Statement | Classification | Notes |
|-----------|---------------|-------|
| `CREATE TABLE IF NOT EXISTS chat_messages` | **MISSING — SAFE TO CREATE** | Required by /api/chat/messages |
| `CREATE TABLE IF NOT EXISTS moderation_logs` | **MISSING — SAFE TO CREATE** | |
| `CREATE TABLE IF NOT EXISTS muted_users` | **MISSING — SAFE TO CREATE** | Required by chat rate limit check |
| `CREATE TABLE IF NOT EXISTS banned_users` | **MISSING — SAFE TO CREATE** | Required by chat ban check |
| RLS on all chat tables | **MISSING — SAFE TO CREATE** | |
| Storage policies for chat_media | **MISSING — SAFE TO CREATE** | |

### 3.10 `20260905_leaderboard_badges.sql`

| Statement | Classification | Notes |
|-----------|---------------|-------|
| `ALTER TABLE content_resources ADD COLUMN IF NOT EXISTS access_tier` | **MISSING — SAFE TO CREATE** | Required by library page |
| DROP "public_read_published_resources" | **NEEDS CAREFUL HANDLING** | Must ensure replacement policy is correct |
| CREATE "public_read_published_resources_meta" | **NEEDS CREATION** | This is the replacement policy |
| `CREATE TABLE IF NOT EXISTS user_badges` | **MISSING — SAFE TO CREATE** | Required by session end |
| `CREATE TABLE IF NOT EXISTS badge_definitions` | **MISSING — SAFE TO CREATE** | Required for badge definitions |
| Seed data for badge_definitions | **MISSING — SAFE TO CREATE** | 7 badges |

### 3.11 `20260906_content_access_tiers.sql`

| Statement | Classification | Notes |
|-----------|---------------|-------|
| DO $$ block for access_tier | **MISSING — SAFE TO CREATE** | More robust than simple ALTER |
| DROP + CREATE refined read policies | **NEEDS CREATION** | free tier: public read free; premium: authenticated read free+premium |
| `get_folder_breadcrumbs()` RPC | **MISSING — SAFE TO CREATE** | Required by library page breadcrumbs |

---

## 4. CONFLICTS

### 4.1 CONFLICT 1: Profiles — Missing Columns

**Problem**: The remote `profiles` table only has `id`, `role`, `display_name`, `created_at`, `updated_at`. The application requires `username`, `avatar_url`, `daily_goal_minutes`, `timezone`.

**Impact**:
- Leaderboard fails (needs `username`, `avatar_url`)
- Dashboard fails (needs `daily_goal_minutes`, `timezone`)
- Chat displays wrong names (needs `username`)

**Resolution**:
1. Add `username` (TEXT, UNIQUE, nullable) — nullable because existing users won't have one
2. Add `avatar_url` (TEXT, nullable)
3. Add `daily_goal_minutes` (INT, default 120)
4. Add `timezone` (TEXT, default 'Asia/Kolkata')
5. Add `updated_at` trigger to auto-update on profile changes
6. Create UNIQUE index on `username`
7. Add `public_read_public_profile_fields` policy (USING true) — allows anon to read usernames for leaderboard display

**Risk**: LOW — All new columns are nullable or have defaults. Existing rows unaffected.

### 4.2 CONFLICT 2: Content Resources — Missing access_tier

**Problem**: Remote `content_resources` lacks the `access_tier` column. The library page filters by it.

**Impact**:
- Library page shows all content to all users (no free/premium gating)
- `isLocked` check always false for premium content

**Resolution**:
1. Add `access_tier` column with CHECK constraint (free/premium), default 'free'
2. Existing resources default to 'free' — no data loss
3. Replace "Public read published resources" policy with tier-aware policies:
   - `public_read_published_free` — anon reads only free content
   - `authenticated_read_own_premium` — authenticated users read free + own premium
   - `admin_full_resources` — admin CRUD all

**Risk**: LOW — Default 'free' means all existing content stays accessible.

### 4.3 CONFLICT 3: Leaderboard — TABLE vs VIEW

**Problem**: Remote has `leaderboard` as a TABLE (with data). `schema.sql` defines it as a VIEW over waitlist_users.

**Impact**:
- None on application — the application queries `study_sessions` directly for leaderboard data
- The remote TABLE contains stale/incorrect data structure
- If schema.sql migration ran, it would try to CREATE VIEW, conflicting with existing TABLE

**Resolution**:
1. **DO NOT drop or convert** the leaderboard table (as instructed)
2. **DO NOT run schema.sql** (it would conflict)
3. The application already uses `study_sessions` for leaderboard — no database changes needed
4. The leaderboard TABLE is **OBSOLETE** — it will be phased out when data migrates to study_sessions
5. Mark as legacy for potential cleanup in a future release

**Risk**: NONE — Application is already decoupled from this table.

### 4.4 CONFLICT 4: Dual Chat System — conversations/messages vs chat_messages

**Problem**: Two chat systems coexist:
- **Old system**: `conversations`, `conversation_participants`, `messages` tables + `chat_create_conversation()`/`chat_send_message()` RPCs
- **New system**: `chat_messages`, `moderation_logs`, `muted_users`, `banned_users` tables

The application's `/api/chat/messages` route uses `chat_messages` (new system).
The admin chat (`/admin/chat`) uses `conversations` (old system).

**Impact**:
- Admin chat references old system tables that may not exist in remote
- `/chat` page uses new system (correct)
- Two separate Supabase clients are used

**Resolution**:
1. **New system (chat_messages)**: Create all tables, policies, storage — application depends on this
2. **Old system (conversations)**: Mark as legacy. Admin chat must be reimplemented using new system or deprecated
3. **For MVP**: Both systems can coexist. The admin chat module (`/admin/chat`) will be broken until migrated to new system
4. **Do NOT drop old chat tables** — preserve any existing data

**Risk**: MEDIUM — Admin chat will be non-functional until migrated. User-facing chat works correctly.

---

## 5. LEGACY SYSTEMS

These systems exist in the codebase but should NOT be part of the initial MVP push. They can be cleaned up later.

| System | Tables | Code Location | Action |
|--------|--------|---------------|--------|
| **Waitlist** | waitlist_users, leaderboard (TABLE) | schema.sql, src/components/WaitlistForm.tsx | Keep table, keep WaitlistForm (it's a landing page CTA). Remove leaderboard TABLE data migration. |
| **Referral Leaderboard** | leaderboard TABLE | schema.sql (VIEW def) | Leave TABLE as-is. Application doesn't use it. Decommission in cleanup. |
| **Old Chat (conversations/messages)** | conversations, conversation_participants, messages | 20240101_chat_system.sql, src/modules/chat/admin/* | Keep tables. Admin chat broken until migrated. Keep for data preservation. |
| **Study Rooms** | study_rooms, study_room_presence | 20260202_study_rooms.sql, src/modules/virtual-library/features/rooms/* | Keep — fully functional with in-memory presence. Works without DB changes beyond basic table. |
| **Announcements** | announcements, announcement_reads | 20260128_announcements.sql, src/modules/announcements/* | Keep — already in remote, works. |
| **AI Doubt Engine** | ai_conversations, ai_messages | 20260201_ai_doubt_engine.sql, src/app/api/ai/doubt/route.ts | Part of MVP — needs DB tables. |
| **Schema.sql waitlist baseline** | waitlist_users, leaderboard VIEW | schema.sql | **DO NOT run this file** — it would conflict with existing tables. |

---

## 6. MVP SYSTEMS

These are the core features that must work for the MVP launch.

| System | Tables | Migration Files | App Routes |
|--------|--------|-----------------|------------|
| **Auth & Profiles** | profiles (with all columns) | 20260101, 20260901 | All routes (auth middleware) |
| **Content CMS** | content_folders, content_resources | 20260101, 20260905, 20260906 | /admin/content/*, /library |
| **Study Sessions & Timer** | study_sessions | 20260902 | /api/study/sessions, /api/study/stats, /dashboard |
| **User Subscriptions** | user_subscriptions | 20260903 | /api/subscriptions/*, /pricing |
| **Global Chat** | chat_messages, muted_users, banned_users, moderation_logs | 20260904 | /api/chat/messages, /chat |
| **Leaderboard** | (derived from study_sessions) | 20260905 (access_tier only) | /api/leaderboard, /leaderboard |
| **Badges** | user_badges, badge_definitions | 20260905 | /api/study/sessions/[id] |
| **AI Doubt Engine** | ai_conversations, ai_messages | 20260201 | /api/ai/doubt, /doubts |
| **Announcements** | announcements, announcement_reads | 20260128 | /admin/announcements |

---

## 7. EXACT DATABASE CHANGES REQUIRED

### 7.1 Change Set A: Extension — pgcrypto

| | |
|---|---|
| **Object** | Extension `pgcrypto` |
| **Current** | Not installed |
| **Desired** | Installed |
| **Change** | `CREATE EXTENSION IF NOT EXISTS pgcrypto;` |
| **Data-loss risk** | None |
| **Dependencies** | Required by gen_random_uuid() in multiple migrations |

### 7.2 Change Set B: Profiles — Add Columns

| | |
|---|---|
| **Object** | `profiles` table |
| **Current** | id, role, display_name, created_at, updated_at |
| **Desired** | + username (TEXT, UNIQUE, nullable), avatar_url (TEXT, nullable), daily_goal_minutes (INT, default 120), timezone (TEXT, default 'Asia/Kolkata'), full_name (TEXT, nullable) |
| **Change** | `ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;` (and 3 more) |
| **Data-loss risk** | None — all columns nullable/defaulted |
| **Dependencies** | Required by leaderboard, dashboard, chat display |

### 7.3 Change Set C: Profiles — Add Public Read Policy

| | |
|---|---|
| **Object** | RLS Policy on profiles |
| **Current** | Users read own, Users update own |
| **Desired** | + public_read_public_profile_fields (allows anon to read public columns) |
| **Change** | `CREATE POLICY public_read_public_profile_fields ON profiles FOR SELECT USING (true);` |
| **Data-loss risk** | None — read-only policy |
| **Dependencies** | Leaderboard, chat need to read other users' public profiles |

### 7.4 Change Set D: Profiles — Add updated_at Trigger

| | |
|---|---|
| **Object** | profiles.updated_at |
| **Current** | Manual update only |
| **Desired** | Auto-update on row modification |
| **Change** | Create trigger function + trigger on profiles BEFORE UPDATE |
| **Data-loss risk** | None |

### 7.5 Change Set E: Content Resources — Add access_tier

| | |
|---|---|
| **Object** | content_resources.access_tier |
| **Current** | Not present |
| **Desired** | access_tier TEXT NOT NULL DEFAULT 'free' CHECK (access_tier IN ('free', 'premium')) |
| **Change** | `ALTER TABLE content_resources ADD COLUMN IF NOT EXISTS access_tier TEXT NOT NULL DEFAULT 'free' CHECK (access_tier IN ('free', 'premium'));` |
| **Data-loss risk** | None — defaults to 'free' |
| **Dependencies** | Library page gating |

### 7.6 Change Set F: Content Resources — Replace Read Policies

| | |
|---|---|
| **Object** | RLS policies on content_resources |
| **Current** | Admin full, Public read published (all visibility) |
| **Desired** | Drop public_read_published, create: public_read_published_free (free only), authenticated_read_own_premium (free + active sub's premium), admin_full_resources |
| **Change** | DROP + CREATE 3 policies |
| **Data-loss risk** | None — policy change only |
| **Dependencies** | Requires user_subscriptions table for premium check |

### 7.7 Change Set G: Study Sessions Table

| | |
|---|---|
| **Object** | study_sessions table |
| **Current** | Does not exist |
| **Desired** | Full table with id, user_id, room_id, branch_id, subject_id, topic, started_at, ended_at, duration_seconds, validation_status (pending/valid/invalid/flagged), created_at |
| **Change** | CREATE TABLE with all columns, indexes, RLS |
| **Data-loss risk** | None — new table |
| **Dependencies** | Core to timer, stats, leaderboard |

### 7.8 Change Set H: User Subscriptions Table

| | |
|---|---|
| **Object** | user_subscriptions |
| **Current** | Does not exist |
| **Desired** | Full table with id, user_id, plan (monthly/weekly), status (active/cancelled/expired), provider, razorpay_order_id, razorpay_payment_id, started_at, expires_at, created_at, updated_at |
| **Change** | CREATE TABLE + indexes + RLS |
| **Data-loss risk** | None — new table |
| **Dependencies** | Razorpay integration, AI doubt premium check |

### 7.9 Change Set I: has_active_subscription() RPC

| | |
|---|---|
| **Object** | SECURITY DEFINER function |
| **Current** | Does not exist |
| **Desired** | Returns boolean for active non-expired subscription |
| **Change** | CREATE OR REPLACE FUNCTION |
| **Data-loss risk** | None |
| **Dependencies** | user_subscriptions table |

### 7.10 Change Set J: expire_subscriptions() RPC

| | |
|---|---|
| **Object** | SECURITY DEFINER function |
| **Current** | Does not exist |
| **Desired** | Bulk-expires overdue subscriptions |
| **Change** | CREATE OR REPLACE FUNCTION |
| **Data-loss risk** | None — updates status field only |
| **Dependencies** | user_subscriptions table |

### 7.11 Change Set K: get_user_daily_stats() RPC

| | |
|---|---|
| **Object** | SECURITY DEFINER function |
| **Current** | Does not exist |
| **Desired** | Returns daily study stats with streak for a user |
| **Change** | CREATE OR REPLACE FUNCTION |
| **Data-loss risk** | None |
| **Dependencies** | study_sessions table |

### 7.12 Change Set L: get_folder_breadcrumbs() RPC

| | |
|---|---|
| **Object** | SECURITY DEFINER function |
| **Current** | Does not exist |
| **Desired** | Returns breadcrumb path for a folder |
| **Change** | CREATE OR REPLACE FUNCTION |
| **Data-loss risk** | None |
| **Dependencies** | content_folders table |

### 7.13 Change Set M: Global Chat Tables

| | |
|---|---|
| **Object** | chat_messages, moderation_logs, muted_users, banned_users |
| **Current** | None exist |
| **Desired** | Full tables with RLS |
| **Change** | CREATE TABLE + indexes + RLS for all 4 |
| **Data-loss risk** | None — new tables |
| **Dependencies** | Chat feature, moderation |

### 7.14 Change Set N: Badges Tables

| | |
|---|---|
| **Object** | user_badges, badge_definitions |
| **Current** | None exist |
| **Desired** | Tables with seed data (7 badges) |
| **Change** | CREATE TABLE + seed INSERT |
| **Data-loss risk** | None — new tables |
| **Dependencies** | Study session end (awards badges) |

### 7.15 Change Set O: AI Doubt Engine Tables

| | |
|---|---|
| **Object** | ai_conversations, ai_messages |
| **Current** | None exist |
| **Desired** | Full tables with RLS |
| **Change** | CREATE TABLE + indexes + RLS |
| **Data-loss risk** | None — new tables |
| **Dependencies** | AI doubt engine |

### 7.16 Change Set P: Storage Policies for Chat Media

| | |
|---|---|
| **Object** | storage.objects policies |
| **Current** | Only eduniche-content bucket policies |
| **Desired** | Policies for chat-media bucket (or reuse eduniche-content) |
| **Change** | CREATE POLICY for chat media uploads |
| **Data-loss risk** | None |
| **Dependencies** | Chat image/video support |

---

## 8. MIGRATION STRATEGY

### Recommended: **Strategy C — New Baseline Migration + Feature Migrations**

### Rationale

The remote database has objects added through a combination of:
1. The original `schema.sql` (waitlist baseline)
2. Manual additions (profiles with extra columns, leaderboard as TABLE, announcements)
3. No migration history

Strategy A (modify existing migrations) would require:
- Editing files that may have been run in other environments
- Risking partial application in dev/staging
- Cannot recover if migration fails mid-way

Strategy B (new baseline migration) would:
- Need a single massive migration file
- Be hard to review and maintain
- Mix concerns

Strategy C (recommended) provides:
- One new baseline migration that captures current remote state
- All subsequent migrations run idempotently from that baseline
- Each feature is isolated in its own migration
- Safe to review, test, and roll back individual features

### Strategy C — Step-by-Step

```
Step 0: 00000000000000_baseline_remote_state.sql
        └─ Captures current remote state as baseline
        └─ NO TABLE CREATION — only records what exists
        └─ Marks schema.sql migrations as "already applied"

Step 1: 20260907_enable_extensions.sql
        └─ CREATE EXTENSION pgcrypto IF NOT EXISTS

Step 2: 20260908_add_profile_columns.sql
        └─ ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username, avatar_url, daily_goal_minutes, timezone
        └─ CREATE UNIQUE INDEX on username
        └─ CREATE POLICY public_read_public_profile_fields
        └─ CREATE TRIGGER for updated_at auto-update

Step 3: 20260909_content_access_tiers.sql
        └─ ALTER TABLE content_resources ADD COLUMN IF NOT EXISTS access_tier
        └─ DROP + CREATE tier-aware read policies
        └─ Backfill existing resources as 'free'

Step 4: 20260910_study_sessions.sql
        └─ CREATE TABLE study_sessions
        └─ CREATE INDEXes
        └─ RLS policies
        └─ RPC: get_user_daily_stats()

Step 5: 20260911_subscriptions.sql
        └─ CREATE TABLE user_subscriptions
        └─ RLS policies
        └─ RPC: has_active_subscription()
        └─ RPC: expire_subscriptions()

Step 6: 20260912_badges.sql
        └─ CREATE TABLE user_badges
        └─ CREATE TABLE badge_definitions
        └─ INSERT seed data

Step 7: 20260913_global_chat.sql
        └─ CREATE TABLE chat_messages
        └─ CREATE TABLE moderation_logs
        └─ CREATE TABLE muted_users
        └─ CREATE TABLE banned_users
        └─ RLS policies
        └─ Storage policies for chat media

Step 8: 20260914_ai_doubt_engine.sql
        └─ CREATE TABLE ai_conversations
        └─ CREATE TABLE ai_messages
        └─ RLS policies
        └─ Fix typo: "SCHEME" → "SCHEMA"

Step 9: 20260915_study_rooms_presence.sql
        └─ CREATE TABLE study_room_presence (if missing)
        └─ Verify study_rooms columns match

Step 10: 20260916_folder_breadcrumbs.sql
         └─ CREATE FUNCTION get_folder_breadcrumbs()

Step 11: 20260917_deprecate_old_chat.sql
         └─ Mark old chat tables as deprecated (comment/rename)
         └─ DO NOT drop — preserve data
```

### Why This Order

1. **Extensions first** — everything depends on pgcrypto
2. **Profiles columns** — RLS policies in later migrations reference profiles.role
3. **Access tiers** — Library page needs this; study_sessions creation may need profiles
4. **Study sessions** — Core feature, many things depend on it
5. **Subscriptions** — Required by access_tier policies, AI doubt engine, library
6. **Badges** — Depends on study_sessions
7. **Global chat** — Independent, but after profiles (for user display)
8. **AI doubt** — Depends on subscriptions (premium check)
9. **Study rooms presence** — Low priority, independent
10. **Breadcrumbs RPC** — Library helper
11. **Deprecation** — Last, doesn't affect functionality

---

## 9. APPLICATION CODE CHANGES

### 9.1 CRITICAL — Must Fix Before Launch

#### Fix 1: `src/app/library/page.tsx` — useSearchParams Suspense
**File**: `src/app/library/page.tsx`
**Issue**: `useSearchParams()` requires Suspense boundary in Next.js 16 App Router
**Fix Applied**: Already applied — wrapped in `<Suspense>` with `<LibraryLoading />` fallback
**Status**: ✅ FIXED

#### Fix 2: `src/app/api/study/stats/route.ts` — SQL Injection in Dead Code
**File**: `src/app/api/study/stats/route.ts`, line 29
**Issue**: Dead code contains SQL injection pattern: `"AND DATE(started_at AT TIME ZONE COALESCE((SELECT timezone FROM profiles WHERE id = '" + session.user.id + "'), 'Asia/Kolkata')) = CURRENT_DATE"`
**Actual code** (lines 44-60): Period filtering is done client-side in JavaScript, not in SQL. The dead code is unreachable but represents a security vulnerability pattern.
**Fix**: Remove the dead code block (lines 28-33 and the SQL injection string entirely). The `dateFilter` variable is defined but never used in the actual query.
**Status**: ⚠️ NEEDS FIX

```typescript
// BEFORE (remove lines 28-33):
const dateFilter = `AND DATE(started_at AT TIME ZONE COALESCE((SELECT timezone FROM profiles WHERE id = '${session.user.id}'), 'Asia/Kolkata')) = CURRENT_DATE`;

// The variable is never used in the query below it — dead code with SQL injection pattern
```

#### Fix 3: `src/app/api/chat/messages/route.ts` — Rate Limit Order
**File**: `src/app/api/chat/messages/route.ts`
**Issue**: Ban/mute check happens AFTER rate limiting. Should happen BEFORE to save cycles on banned/muted users.
**Fix**: Move ban/mute check before rate limit check.
**Status**: ⚠️ NEEDS FIX

```typescript
// Current order:
// 1. Auth check
// 2. Rate limit check ← should be step 3
// 3. Ban/mute check ← should be step 2

// Correct order:
// 1. Auth check
// 2. Ban/mute check (reject immediately)
// 3. Rate limit check (only check if not banned/muted)
// 4. Process message
```

### 9.2 IMPORTANT — Should Fix Before Launch

#### Fix 4: `src/modules/chat/admin/` — Old Chat System References
**Files**: All files in `src/modules/chat/admin/`
**Issue**: Admin chat references old `conversations`/`messages` tables which will not have data in the new system
**Options**:
- A) Reimplement admin chat to use `chat_messages` table
- B) Deprecate admin chat for MVP, show "coming soon"
- C) Keep as-is but document as broken until migrated
**Recommendation**: Option B for MVP — show "Admin chat management coming soon" placeholder
**Status**: ⚠️ NEEDS DECISION

#### Fix 5: `src/modules/virtual-library/hooks/use-study-session.ts` — Unused useEffect
**File**: `src/modules/virtual-library/hooks/use-study-session.ts`, lines 95-98
**Issue**: Empty useEffect — subscribes to `emit` but does nothing with it
```typescript
useEffect(() => {
  const unsub = (machineRef.current as unknown as { emit?: (e: { name: string }) => void })["emit"];
  return () => {};
}, []);
```
**Fix**: Remove or implement actual subscription logic
**Status**: ⚠️ LOW PRIORITY — dead code

#### Fix 6: `src/app/api/leaderboard/route.ts` — No Changes Needed
**File**: `src/app/api/leaderboard/route.ts`
**Status**: ✅ ALREADY CORRECT — Queries `study_sessions` directly, not the `leaderboard` table

#### Fix 7: `src/app/api/ai/doubt/route.ts` — Fallback for RPC Failure
**File**: `src/app/api/ai/doubt/route.ts`
**Issue**: Falls back to direct table query if `has_active_subscription()` RPC fails
**Status**: ✅ ACCEPTABLE — Graceful degradation is fine for MVP

### 9.3 NICE-TO-HAVE — Post-MVP

#### Fix 8: Dashboard Timer Validation
**File**: `src/app/dashboard/page.tsx` (StudyTimerDisplay component)
**Issue**: Client-side timer sends elapsed time to server. Server validates but there's no minimum study time validation (e.g., 1 minute minimum to count as a valid session).
**Recommendation**: Add minimum time check on server side in `sessions/[id]/route.ts` (already has 1s minimum — sufficient).

#### Fix 9: Error Handling Consistency
**Issue**: Some routes return `{ error: "..." }` while others return more structured errors. Standardize for frontend consumption.

---

## 10. SECURITY CHANGES

### 10.1 Security Fixes Inventory

| # | Fix | Severity | File | Status |
|---|-----|----------|------|--------|
| S-1 | Remove SQL injection dead code in stats/route.ts | HIGH | `src/app/api/study/stats/route.ts` | ⚠️ Needs fix |
| S-2 | Move ban/mute check before rate limit in chat/messages/route.ts | MEDIUM | `src/app/api/chat/messages/route.ts` | ⚠️ Needs fix |
| S-3 | Add `public_read_public_profile_fields` RLS policy on profiles | MEDIUM | Migration 20260908 | ⚠️ Needs migration |
| S-4 | Add access_tier column + replace content_resources read policies | MEDIUM | Migration 20260909 | ⚠️ Needs migration |
| S-5 | Add `username` UNIQUE constraint + validation | MEDIUM | Migration 20260908 | ⚠️ Needs migration |
| S-6 | Add `has_active_subscription()` SECURITY DEFINER with search_path | MEDIUM | Migration 20260911 | ⚠️ Needs migration |
| S-7 | Add `get_user_daily_stats()` SECURITY DEFINER with search_path | MEDIUM | Migration 20260910 | ⚠️ Needs migration |
| S-8 | Add `expire_subscriptions()` SECURITY DEFINER with search_path | MEDIUM | Migration 20260911 | ⚠️ Needs migration |
| S-9 | Fix typo "SCHEME" → "SCHEMA" in ai_doubt_engine migration | HIGH | `supabase/migrations/20260201_ai_doubt_engine.sql` | ⚠️ Needs migration |
| S-10 | All SECURITY DEFINER RPCs must set `search_path = public` | HIGH | All migration files | ⚠️ Needs audit |
| S-11 | Add `full_name` column to profiles (admin chat references it) | LOW | Migration 20260908 | ⚠️ Needs migration |
| S-12 | RLS on study_sessions must prevent cross-user reads | HIGH | Migration 20260910 | ⚠️ Needs verification |
| S-13 | RLS on chat_messages must prevent reading deleted messages | MEDIUM | Migration 20260913 | ⚠️ Needs migration |
| S-14 | HTML sanitization in chat/messages/route.ts is basic | LOW | `src/app/api/chat/messages/route.ts` | ⚠️ Consider DOMPurify |

### 10.2 Security DEFiner Pattern

Every SECURITY DEFINER function must include:
```sql
CREATE OR REPLACE FUNCTION function_name(...)
RETURNS ... AS $$
BEGIN
  ...
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;  -- CRITICAL: prevents schema hijacking
```

Current state:
- `increment_referral_count()` — likely missing `search_path = public`
- `get_user_daily_stats()` — needs `search_path = public` added
- `has_active_subscription()` — needs `search_path = public` added
- `expire_subscriptions()` — needs `search_path = public` added
- `get_folder_breadcrumbs()` — needs `search_path = public` added

### 10.3 RLS Policy Audit

| Table | Current Policies | Required Policies | Gap |
|-------|-----------------|-------------------|-----|
| profiles | read own, update own | + public read public fields | ADD |
| content_folders | admin full | OK | None |
| content_resources | admin full, public read published | + free-only public read, + authenticated premium read | REPLACE |
| study_sessions | None | users CRUD own, admin read all | ADD |
| user_subscriptions | None | users read own, admin full | ADD |
| chat_messages | None | public read non-deleted, users insert own, admin delete | ADD |
| muted_users | None | users read self, admin full | ADD |
| banned_users | None | users read self, admin full | ADD |
| moderation_logs | None | admin full, users read own | ADD |
| user_badges | None | users read all, admin full | ADD |
| badge_definitions | None | public read, admin full | ADD |
| ai_conversations | None | users CRUD own | ADD |
| ai_messages | None | users read own conversation's messages | ADD |

---

## 11. TESTING PLAN

### 11.1 Auth Flow

| Test | Steps | Expected |
|------|-------|----------|
| Sign up | Create account via `/login` | Profile created in `profiles` with role='student' |
| Sign in | Login with credentials | Session established, redirect to `/dashboard` |
| Session persistence | Refresh page | User remains logged in |
| Sign out | Click sign out | Session cleared, redirect to `/` |
| Admin sign-in | Login as admin user | Admin dashboard accessible, admin-only routes work |

### 11.2 Username & Profile

| Test | Steps | Expected |
|------|-------|----------|
| Profile read | GET `/api/profile` or check dashboard | Username, avatar_url, daily_goal_minutes displayed |
| Profile update | Update display name/username | Changes persist, uniqueness enforced |
| Public profile read | Another user views profile | Public fields visible (username, avatar_url) |
| Timezone handling | Set timezone, check streak calculation | Streak calculated in user's timezone |

### 11.3 Free/Premium Content

| Test | Steps | Expected |
|------|-------|----------|
| Free user sees free content | Browse library as free user | Free resources visible, premium locked |
| Free user sees premium | Try to access premium resource | Lock icon shown, redirect to `/pricing` |
| Premium user sees all | Browse library as premium subscriber | All resources visible, green checkmarks |
| Create order | Click "Upgrade" → select plan → create order | Razorpay order created |
| Verify payment | Complete Razorpay payment | Subscription activated, library unlocks |
| Subscription expiry | Wait past expiry date | Premium content locked again |
| Duplicate payment | Try to pay again with same Razorpay ID | "Already have active subscription" error |

### 11.4 Timer & Study Sessions

| Test | Steps | Expected |
|------|-------|----------|
| Start session | Click "Start Session" on dashboard | Session created with status='pending' |
| Timer counts | Let timer run for 60 seconds | Display shows 60 seconds |
| Pause/resume | Pause, switch tab (auto-pause), switch back (auto-resume) | Timer pauses/resumes correctly |
| End session | Click "End" | Session updated to status='valid', duration recorded |
| Min duration | End session after 0.5s | "Session too short" error |
| Max duration | End session after 25 hours | "Session too long" error |
| Tamper resistance | Send PATCH with manipulated duration | Server uses its own calculation (10% tolerance) |
| Cross-user | User A tries to end User B's session | "Session not found" error |
| Stats update | End session, check dashboard stats | Stats refresh with new session data |

### 11.5 Daily Stats & Streak

| Test | Steps | Expected |
|------|-------|----------|
| Today's stats | Check dashboard after a session today | Today's minutes shown correctly |
| Weekly stats | Select "Week" period | Correct week total |
| Monthly stats | Select "Month" period | Correct month total |
| Streak calculation | Study for 3 consecutive days | Streak shows 3 |
| Streak break | Skip a day, study next day | Streak resets to 1 |
| Timezone | Set timezone to different region | Streak calculated in that timezone |
| Goal progress | Set goal to 60 min, study 30 min | Progress shows 50% |

### 11.6 Leaderboard

| Test | Steps | Expected |
|------|-------|----------|
| View leaderboard | Navigate to `/leaderboard` | Top users shown by study time |
| Current user rank | User not in top 50 but has study time | Shown at bottom with "You" label |
| Empty state | No study sessions exist | Empty leaderboard |
| Sorting | Multiple users with different times | Correct descending order |

### 11.7 Badges

| Test | Steps | Expected |
|------|-------|----------|
| First session badge | Complete first study session | "first_session" badge awarded |
| Scholar badge | Reach 10 total minutes | "scholar" badge awarded |
| Dedicated badge | Reach 50 total minutes | "dedicated" badge awarded |
| Hundred Club | Reach 100 total minutes | "hundred_club" badge awarded |
| Deep Focus | Single session ≥ 5 hours | "deep_focus" badge awarded |
| No duplicate badges | End same session type twice | No duplicate badge entries |
| Badge display | Check profile/leaderboard | Badges visible |

### 11.8 Chat (Global)

| Test | Steps | Expected |
|------|-------|----------|
| Send message | Type and send message in `/chat` | Message appears in chat |
| Rate limit | Send 11 messages in 1 minute | 11th message returns 429 |
| Banned user | Admin bans user, user tries to chat | "You are banned" error |
| Muted user | Admin mutes user, user tries to chat | Message rejected |
| Admin delete | Admin deletes a message | Message removed from chat |
| HTML sanitization | Send `<script>alert('xss')</script>` | Rendered as text, not executed |
| Pagination | Load more messages | Older messages load correctly |

### 11.9 AI Doubt Engine

| Test | Steps | Expected |
|------|-------|----------|
| Free user access | Send doubt as free user | "Premium feature" error |
| Premium user access | Send doubt as premium user | AI response returned |
| Conversation history | Ask follow-up question | Context maintained |
| Rate limit | Send 21 doubts in 1 minute | 21st request returns 429 |
| Library context | Ask about specific topic | Relevant content referenced |

### 11.10 Razorpay Integration

| Test | Steps | Expected |
|------|-------|----------|
| Create order | POST to create-order with valid plan | Order ID returned |
| Invalid plan | POST with plan='invalid' | "Invalid plan" error |
| Duplicate active sub | Create order while already subscribed | "Already have active subscription" |
| Verify payment | POST to verify with valid signature | Subscription created |
| Invalid signature | POST with tampered signature | "Invalid payment signature" |
| Duplicate payment | Verify same payment ID twice | Returns existing subscription |

### 11.11 Webhook Verification

| Test | Steps | Expected |
|------|-------|----------|
| Valid webhook | Razorpay sends valid webhook | Processed, subscription updated |
| Invalid signature | Webhook with wrong signature | Rejected |
| Replay attack | Same webhook sent twice | Second request rejected (idempotency) |

### 11.12 Cross-User Data Isolation

| Test | Steps | Expected |
|------|-------|----------|
| Read other user's sessions | User A queries User B's sessions | Empty result or 403 |
| Read other user's subscriptions | User A queries User B's subscriptions | Empty result or 403 |
| Read other user's AI conversations | User A queries User B's AI data | Empty result |
| Read other user's badges | User A queries User B's badges | Visible (badges are public) |
| Modify other user's data | User A PATCHes User B's session | "Session not found" |

### 11.13 Storage

| Test | Steps | Expected |
|------|-------|----------|
| Admin upload | Admin uploads file | File stored, resource record created |
| Non-admin upload | Student tries to upload | Permission denied |
| Admin read | Admin views file | File accessible |
| Public read (published) | Anon user views published resource | Accessible via URL |
| Public read (draft) | Anon user views draft resource | Not accessible |

### 11.14 Admin Routes

| Test | Steps | Expected |
|------|-------|----------|
| Admin access | Admin visits `/admin` | Content manager loads |
| Non-admin access | Student visits `/admin` | Redirect to `/` |
| Admin login | Visit `/admin/login` | Admin auth form displayed |
| Content CRUD | Admin creates folder, uploads resource | Visible in library |
| Announcements | Admin creates announcement | Visible to target users |
| Announcement expiry | Announcement past expiry date | Not visible to users |

---

## 12. EXECUTION PLAN

### Phase 0: Pre-Flight (No Database Changes)

| Task | Owner | Time |
|------|-------|------|
| Review this plan with team | User | — |
| Get approval for Strategy C | User | — |
| Backup remote database | User | 5 min |
| Export remote schema snapshot | User | 5 min |

### Phase 1: Application Code Fixes (Before DB Migration)

| # | Task | File | Time |
|---|------|------|------|
| 1 | Remove SQL injection dead code | `src/app/api/study/stats/route.ts` | 5 min |
| 2 | Reorder ban/mute before rate limit | `src/app/api/chat/messages/route.ts` | 5 min |
| 3 | Verify library page fix | `src/app/library/page.tsx` | ✅ Done |
| 4 | Add `search_path = public` to all SECURITY DEFINER functions | Migration files | 15 min |
| 5 | Fix "SCHEME" typo | `20260201_ai_doubt_engine.sql` | 2 min |

### Phase 2: Baseline + Extensions (Safe, No Data Changes)

| # | Migration | Time | Risk |
|---|-----------|------|------|
| 1 | `00000000000000_baseline_remote_state.sql` | 2 min | None |
| 2 | `20260907_enable_extensions.sql` (pgcrypto) | 1 min | None |

### Phase 3: Core Schema Changes (Low Risk)

| # | Migration | Time | Risk |
|---|-----------|------|------|
| 3 | `20260908_add_profile_columns.sql` | 3 min | LOW |
| 4 | `20260909_content_access_tiers.sql` | 3 min | LOW |
| 5 | `20260910_study_sessions.sql` | 3 min | LOW |
| 6 | `20260911_subscriptions.sql` | 3 min | LOW |

### Phase 4: Feature Tables (Low Risk)

| # | Migration | Time | Risk |
|---|-----------|------|------|
| 7 | `20260912_badges.sql` | 3 min | LOW |
| 8 | `20260913_global_chat.sql` | 3 min | LOW |
| 9 | `20260914_ai_doubt_engine.sql` | 3 min | LOW |
| 10 | `20260915_study_rooms_presence.sql` | 2 min | LOW |

### Phase 5: RPCs & Final (Low Risk)

| # | Migration | Time | Risk |
|---|-----------|------|------|
| 11 | `20260916_folder_breadcrumbs.sql` | 2 min | LOW |
| 12 | `20260917_deprecate_old_chat.sql` | 2 min | LOW |

### Phase 6: Verification

| Task | Time |
|------|------|
| Run application code TypeScript check | 5 min |
| Deploy to staging environment | 10 min |
| Run Phase 11 testing plan | 60 min |
| Fix any issues found | — |
| Deploy to production | 10 min |

### Rollback Plan

If any migration fails:
1. Each migration uses `IF NOT EXISTS` / `DROP IF EXISTS` — safe to re-run
2. Individual migration failures don't affect previous steps
3. To rollback a specific step: the reverse SQL is documented per migration
4. Database backup from Phase 0 can be restored if catastrophic failure

### Time Estimate

| Phase | Duration |
|-------|----------|
| Application fixes | 15 min |
| Migration writing | 45 min |
| Migration execution | 25 min |
| Verification testing | 90 min |
| **Total** | **~3 hours** |

---

## APPENDIX A: What NOT to Touch

| Item | Reason |
|------|--------|
| `schema.sql` | Would conflict with existing remote tables |
| `supabase/bootstrap-admin.sql` | Still needed for admin setup |
| `waitlist_users` table | Contains user data |
| `leaderboard` TABLE | Contains data, marked legacy — don't drop |
| `conversations` / `messages` tables | Contain data, preserve for legacy |
| Existing RLS policies on profiles | Will be augmented, not replaced |

## APPENDIX B: Environment Variables Required

| Variable | Used In | Required |
|----------|---------|----------|
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | create-order route | Yes (Razorpay) |
| `RAZORPAY_KEY_SECRET` | create-order, verify routes | Yes (Razorpay) |
| `GROQ_API_KEY` | ai/doubt route | Yes (AI engine) |
| `NEXT_PUBLIC_SUPABASE_URL` | All Supabase clients | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser client | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side admin operations | Yes (server-only) |

## APPENDIX C: Key Application-Database Mapping

```
/auth flows ──────────────→ profiles (id, role, display_name)
/dashboard ───────────────→ study_sessions, profiles (daily_goal_minutes, timezone)
/study/sessions API ───────→ study_sessions
/study/stats API ─────────→ study_sessions, profiles
/leaderboard API ─────────→ study_sessions, profiles
/leaderboard page ────────→ /api/leaderboard
/library ─────────────────→ content_folders, content_resources (access_tier)
/chat ────────────────────→ chat_messages, muted_users, banned_users
/admin/chat ──────────────→ conversations, messages (OLD — broken)
/doubts ─────────────────→ ai_conversations, ai_messages
/pricing ─────────────────→ user_subscriptions
/admin/content ───────────→ content_folders, content_resources
/admin/announcements ─────→ announcements
```
