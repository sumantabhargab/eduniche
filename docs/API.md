# PadhaiShuru — API Documentation

Base URL: `https://padhaishuru.com/api`
Response shape: `{ success: true, data, error: null }` or `{ success: false, data: null, error: { code, message } }`

## Authentication

All authenticated endpoints require a Supabase session cookie or `Authorization: Bearer <token>` header.
Admin endpoints additionally require `profiles.role IN ('admin', 'super_admin')`.

## Rate Limits

| Endpoint category | Limit |
|---|---|
| AI doubt (free) | 10 req/min |
| AI doubt (premium) | 20 req/min |
| Chat messages | 30 msg/min |
| Write operations | 20 req/min |
| Public reads | No hard limit (monitored) |

## Endpoints

### PYQ Library

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/pyq/branches` | No | List branches |
| GET | `/api/pyq/branches/[branch]/subjects` | No | Subjects in branch |
| GET | `/api/pyq/questions` | No | Questions with filters |
| GET | `/api/pyq/questions/[id]` | No | Single question |
| POST | `/api/pyq/attempts` | Yes | Submit attempt |
| GET | `/api/pyq/bookmarks` | Yes | List bookmarks |
| POST | `/api/pyq/bookmarks` | Yes | Add bookmark |
| DELETE | `/api/pyq/bookmarks` | Yes | Remove bookmark |
| GET | `/api/pyq/mistakes` | Yes | Mistake bank |
| GET | `/api/pyq/analytics` | Yes | User analytics |
| GET | `/api/pyq/search` | No | Search questions |

### AI Doubt

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/ai/doubt` | Premium | Premium AI doubt |
| POST | `/api/ai/doubt/free` | Yes | Free-tier AI doubt |
| GET | `/api/ai/doubt/free` | Yes | Check free usage |

### Study Tracker

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/study/sessions` | Yes | Start session |
| PATCH | `/api/study/sessions/[id]` | Yes | Heartbeat / end |
| GET | `/api/study/stats` | Yes | Get stats |
| POST | `/api/study/goal` | Yes | Update daily goal |

### Subscriptions

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/subscriptions/create-order` | Yes | Create Razorpay order |
| POST | `/api/subscriptions/verify` | Yes | Verify payment |
| POST | `/api/webhooks/razorpay` | No (webhook secret) | Razorpay webhook |

### Chat

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/chat/messages` | Yes | Get messages |
| POST | `/api/chat/messages` | Yes (premium) | Send message |

### Admin

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/users` | Admin | List users |
| PUT | `/api/admin/users/[id]/plan` | Admin | Update user plan |
| POST | `/api/admin/content/*` | Admin | Content CRUD |
