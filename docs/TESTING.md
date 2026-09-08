# PadhaiShuru — Testing Documentation

## Test Structure

```
tests/
├── unit/
│   ├── entitlements.test.ts
│   ├── plans.test.ts
│   ├── rate-limit.test.ts
│   └── response.test.ts
├── integration/
│   ├── auth-flow.test.ts
│   ├── pyq-attempts.test.ts
│   ├── study-timer.test.ts
│   └── ai-doubt.test.ts
└── e2e/
    └── padhaishuru.spec.ts
```

## Running Tests

```bash
# Unit tests
npx vitest run

# Watch mode
npx vitest

# Integration tests (requires Supabase local)
npx vitest run tests/integration/

# E2E tests (requires deployed app)
npx playwright test
```

## Coverage Requirements

- Entitlement logic: 100%
- Plan config: 100%
- Response formatter: 100%
- API auth guards: 90%+

## Manual Testing Checklist

- [ ] Signup with Google
- [ ] Signup with email
- [ ] Login/logout
- [ ] Protected routes redirect to login
- [ ] PYQ filtering works
- [ ] Attempt submission records user_id correctly
- [ ] Premium gating works on AI doubts
- [ ] Payment flow (test mode Razorpay)
- [ ] Webhook receives and activates subscription
- [ ] Study timer starts/pauses/ends
- [ ] Leaderboard shows data
- [ ] Admin can manage users
- [ ] Admin can manage content
