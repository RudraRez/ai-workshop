# Architecture

> Written by Architect agent during Stage 3 — Foundation.
> Updated as the system evolves. This is the living technical reference.

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client (Browser)                        │
│                    Next.js 14 App Router                        │
│              Server Components + Client Components              │
│                     TanStack Query + Zustand                    │
└──────────────────────────────┬──────────────────────────────────┘
                               │ HTTPS / REST
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                      API (NestJS 10)                            │
│              Passport JWT Auth Guard on all routes              │
│           Controllers → Services → Repositories                 │
│                      BullMQ workers                             │
└────────┬─────────────────────┬───────────────────────┬──────────┘
         │                     │                       │
    ┌────▼────┐          ┌─────▼─────┐         ┌──────▼──────┐
    │PostgreSQL│          │  Redis    │         │ File Storage │
    │TypeORM   │          │BullMQ +   │         │ R2 / S3     │
    │         │          │  Cache    │         │             │
    └─────────┘          └───────────┘         └─────────────┘
```

---

## Data Model

> Written during planning. Updated when schema changes.

```
Fill in your entities here during /plan.

Example:

User
  id: uuid PK
  email: string UNIQUE
  passwordHash: string
  refreshTokenHash: string | null
  role: enum (user, admin)
  createdAt: timestamp
  updatedAt: timestamp
  deletedAt: timestamp | null (soft delete)
```

---

## API Contract Surface

> All endpoints. Written before implementation. Used as handoff to Frontend Dev.
> Format: METHOD /path — Auth — Request — Response

```
Fill in your endpoints here during /plan.

Example:

POST   /api/v1/auth/register   — public        — { email, password, name } → { user, token, refreshToken }
POST   /api/v1/auth/login      — public        — { email, password } → { user, token, refreshToken }
POST   /api/v1/auth/refresh    — public        — { refreshToken } → { token, refreshToken }
POST   /api/v1/auth/logout     — Bearer token  — {} → 204
GET    /api/v1/auth/me         — Bearer token  — — → { user }
```

---

## Key Technical Decisions

> Written during planning. Extended during build.

| Decision | Choice | Alternatives Considered | Rationale |
|---|---|---|---|
| Auth strategy | JWT + refresh rotation | Session cookies, Clerk | Control over token lifecycle |
| Pagination | Cursor-based | Offset | Offset drifts on live data |
| Soft deletes | TypeORM @DeleteDateColumn | Hard delete | Data recovery, audit trail |

---

## Security Model

- All routes protected by `JwtAuthGuard` at controller level unless marked `@Public()`
- `@CurrentUser()` decorator injects user from validated JWT — never from request body
- `ValidationPipe` with `whitelist: true` strips unknown properties globally
- `Helmet` sets security headers on all responses
- Rate limiting: 100 req/15min per IP globally, 10 req/min on auth endpoints
- Passwords: bcrypt, cost factor 12
- Refresh tokens: stored as bcrypt hash, rotated on every use

---

## Deployment Topology

```
GitHub (main branch)
    │
    ├── Vercel ──────────── apps/web/ (Next.js)
    │                       Environment: NEXT_PUBLIC_API_URL
    │
    └── Railway ─────────── apps/api/ (NestJS Docker)
                            Environment: DATABASE_URL, REDIS_URL, JWT_SECRET, ...
                            PostgreSQL instance (Railway managed)
                            Redis instance (Railway managed)
```

---

## Environment Variables

See `.env.example` for the complete list with descriptions.

Critical vars:
- `DATABASE_URL` — PostgreSQL connection string
- `REDIS_URL` — Redis connection string  
- `JWT_ACCESS_SECRET` — min 32 chars, random
- `JWT_REFRESH_SECRET` — min 32 chars, random, different from access
- `NEXTAUTH_SECRET` — min 32 chars, random
- `NEXTAUTH_URL` — full URL of the web app
- `NEXT_PUBLIC_API_URL` — full URL of the API
