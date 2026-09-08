# PadhaiShuru — Database Documentation

## Overview

Supabase (PostgreSQL) with Row Level Security (RLS) on all tables.
Migrations live in `supabase/migrations/` and are applied in timestamp order.

## Migration Order (Critical)

Migrations must be applied in chronological order. Do NOT reorder.

| File | Description |
|---|---|
| `20260830000001_add_plan_column.sql` | Add plan column to profiles |
| `20260830000000_content_cms_reset.sql` | Content CMS reset |
| `20260831000001_atomic_subscription_idempotency.sql` | activate_subscription RPC |
| `20260831000002_webhook_event_idempotency.sql` | claim_webhook_event RPC |
| `20260831000003_free_tier_features.sql` | doubt_usage table (MVP) |
| `20260903000000_subscriptions.sql` | user_subscriptions table |
| `20260906000000_content_access_tiers.sql` | content_resources access_tier |
| `20261201000000_mvp_schema.sql` | Core MVP tables |
| `20261201000001_pyq_rls.sql` | PYQ RLS policies |
| `20270101000000_security_rls_fixes.sql` | Security RLS fixes |
| `20270107000000_padhaishuru_complete_schema.sql` | Complete unified schema |
| `20270201000000_consolidated_phase1_fixes.sql` | Phase 1 fixes (NEW) |

## Core Tables

### profiles
User profiles extended from auth.users.
- `id` (UUID, PK → auth.users.id)
- `username`, `display_name`, `avatar_url`, `bio`
- `plan` CHECK ('free', 'weekly_premium', 'monthly_premium')
- `role` CHECK ('user', 'editor', 'admin', 'super_admin')
- `created_at`, `updated_at`

### pyq_questions
GATE previous year questions.
- `id` (UUID, PK)
- `branch_code`, `subject_id`, `topic_id`
- `question_text`, `options` (JSONB), `correct_answer`
- `explanation`, `marks`, `difficulty`
- `quality_tier` CHECK ('A', 'B', 'C')
- `answer_verified` BOOLEAN
- RLS: anon reads verified A/B only; premium reads all

### user_subscriptions
User subscription records.
- `id` (UUID, PK)
- `user_id` (UUID → profiles.id)
- `plan` CHECK ('free', 'weekly', 'monthly', 'weekly_premium', 'monthly_premium')
- `status` CHECK ('active', 'pending', 'expired', 'cancelled', 'failed')
- `razorpay_payment_id` (unique)
- `started_at`, `expires_at`, `cancelled_at`
- `amount_paid_paise`, `currency`

### study_sessions
Study timer sessions.
- `id` (UUID, PK)
- `user_id` (UUID → profiles.id)
- `started_at`, `ended_at` (TIMESTAMPTZ, server-set)
- `duration_seconds` INTEGER (computed server-side)
- `validation_status` CHECK ('pending', 'validated', 'flagged', 'rejected')
- `created_at`

## RLS Summary

All user-owned tables have:
- `USING (auth.uid() = user_id)` for SELECT/UPDATE/DELETE
- `WITH CHECK (auth.uid() = user_id)` for INSERT/UPDATE
- Admin policies for tables requiring management access

Public content (PYQs, formulas, papers) is readable by anon.
