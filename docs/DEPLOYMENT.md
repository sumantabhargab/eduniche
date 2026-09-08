# PadhaiShuru — Deployment Documentation

## Prerequisites

- Node.js 18+
- Supabase project
- Razorpay account (test + production)
- Vercel account (recommended)

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service key (server-only) |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Yes | Razorpay key ID |
| `RAZORPAY_KEY_SECRET` | Yes | Razorpay secret (server-only) |
| `RAZORPAY_WEBHOOK_SECRET` | Yes | Razorpay webhook secret |
| `GROQ_API_KEY` | Yes | Groq API key (server-only) |
| `NEXT_PUBLIC_APP_URL` | Yes | Canonical app URL |

## Vercel Deployment

1. Push to GitHub
2. Import into Vercel
3. Set all environment variables
4. Deploy

### Post-Deploy

1. Run migrations: `supabase db push` or apply manually via SQL Editor
2. Create admin user: set `profiles.role = 'super_admin'` for your user
3. Verify webhook endpoint: POST to `/api/webhooks/razorpay`
4. Check rate-limit RPC exists: `SELECT rate_limit_check(...)`

## Database Migrations

```bash
# Apply all pending migrations
npx supabase db push

# Or apply one by one via SQL Editor in Supabase dashboard
```

### Migration Order

Always apply migrations in timestamp order. Do NOT skip or reorder.

## Monitoring

- Vercel Analytics for performance
- Supabase Dashboard for database metrics
- Razorpay Dashboard for payment monitoring
