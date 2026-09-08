# PadhaiShuru — Security Documentation

## Authentication

Supabase Auth with:
- Email/password with confirmation
- Google OAuth
- Session management via httpOnly cookies (SSR) + localStorage (client)

## Authorization

Role-based via `profiles.role`:
- `user` — standard authenticated user
- `editor` — content management
- `admin` — user management, content, announcements
- `super_admin` — full access

## Row Level Security

All tables have RLS enabled. Policies enforce:
- Users can only access their own data (attempts, bookmarks, sessions, messages)
- Public content is readable by everyone (PYQs, formulas, papers)
- Admin/editor roles have elevated write access to content tables
- Payment/subscription tables are write-only for service_role

## Rate Limiting

Distributed rate limiting via `rate_limit_buckets` table + `rate_limit_check()` RPC.
Fail-open on RPC errors to avoid blocking all traffic.

## Payment Security

- Razorpay handles card data (PCI compliant)
- Webhook signature verification (`RAZORPAY_WEBHOOK_SECRET`)
- Idempotent webhook processing (`claim_webhook_event` RPC)
- Order amount validation server-side

## Webhook Security

Razorpay webhooks verify `X-Razorpay-Signature` header.
Webhook events stored in `razorpay_webhook_events` table (service_role only).
Idempotent: same event ID processed once.

## Data Protection

- TLS 1.3 for all connections
- RLS on all tables
- PII minimized in public views
- No secrets in client bundles
