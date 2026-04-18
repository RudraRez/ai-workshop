# Architecture

> How this build is structured, how requests flow, and what the boundaries are.
> Source of truth for system design. If code diverges from this, fix the code
> or update this file — never let them drift silently.

**Module:** SKEP **AI Tutor** — port `5094`, base path `/api/v1/tutor`, table prefix `tutor_`, WS namespace `/tutor`.

**Status:** DRAFT — scaffold. Tighten once BRIEF + REQUIREMENTS are filled.

---

## 1. System Context

```
┌──────────────────────────────────────────────────────────────────────┐
│                        SKEP Main Platform                            │
│   (Keycloak IdP · JWT issuer · Community lifecycle · Java LMS)       │
└───────┬──────────────────────────────────────────┬───────────────────┘
        │ JWT (signed with SKEP_JWT_SECRET)        │ Onboarding webhook
        │                                          │  (+ HMAC signature)
        ▼                                          ▼
┌───────────────────────┐                 ┌────────────────────────┐
│  Next.js Frontend     │  HTTPS / WSS    │   NestJS Backend       │
│  (apps/frontend)      │◄───────────────▶│   (apps/backend)       │
│  Vercel               │   JSON envelope │   Railway container    │
└───────────────────────┘                 └──────┬─────────────────┘
                                                 │
                                     ┌───────────┼────────────┐
                                     ▼           ▼            ▼
                              ┌────────────┐ ┌───────┐ ┌────────────┐
                              │ PostgreSQL │ │ Redis │ │ LMS Client │
                              │ schema/    │ │ events│ │ (mock|http)│
                              │ community  │ │  +    │ └────────────┘
                              │            │ │ cache │
                              └────────────┘ └───────┘
```

**Trust boundaries:**
- FE → BE: validated at every request by `JwtAuthGuard`.
- BE ↔ SKEP main: only through JWT validation (inbound) and webhook
  (inbound) — never outbound HTTP to another SKEP module.
- BE ↔ other modules: only via Redis event bus.

---

## 2. Repository Layout

```
/
├── apps/
│   ├── frontend/              # Next.js App Router (latest)
│   │   └── src/
│   │       ├── app/           # Routes (route groups below)
│   │       ├── components/    # shadcn/ui + feature components
│   │       ├── lib/           # API client, Zod schemas, utils
│   │       └── hooks/         # Query hooks (TanStack Query)
│   └── backend/               # NestJS (latest)
│       └── src/
│           ├── main.ts
│           ├── app.module.ts
│           └── modules/<feature>/   # Feature modules (SKEP-DELTA shape)
├── packages/
│   ├── platform-core/         # @skep/platform-core (shared auth/tenancy)
│   └── shared/                # Cross-app Zod schemas + types
├── project/                   # Product inputs (brief, reqs, constraints)
├── doc/                       # Design artifacts (this folder)
├── docs/                      # Long-form guides (setup, lifecycle)
├── logs/                      # Per-task audit trail
├── infra/                     # docker-compose, Dockerfile, Makefile
└── .claude/                   # Skills, agents, commands, memory
```

---

## 3. Frontend Architecture

**Framework:** Next.js 15 App Router (React Server Components by default).

### Route Groups

```
src/app/
├── (public)/          # No auth required
│   ├── login/
│   └── page.tsx       # Marketing / redirect to dashboard
├── (authed)/          # Wrapped in AuthGuard layout
│   ├── layout.tsx     # Sidebar + topbar + TanStack Query provider
│   ├── dashboard/
│   └── <feature>/
└── api/               # NextAuth + any BFF routes
```

### State Boundaries

| State kind | Lives in | Example |
|---|---|---|
| Server data | TanStack Query | List of chat rooms, user profile |
| URL state | `searchParams` / dynamic segments | Filters, pagination cursor |
| Ephemeral UI | `useState` | Open/closed modals |
| Cross-view UI | Zustand store | Theme, sidebar collapse |
| Auth | NextAuth session + httpOnly refresh cookie | `useSession()` |

**Rule:** Server data never goes into Zustand. URL state never goes into TanStack Query cache keys as the sole key (always include server-relevant params explicitly).

### Data Fetching

- **Server Components** use `fetch()` with the JWT forwarded from the
  cookie; results stream to the client.
- **Client Components** use `useQuery` / `useMutation` from TanStack
  Query via hooks in `src/hooks/`. No direct `fetch` calls in
  components.
- **Mutations** call the backend, invalidate affected query keys, and
  surface toasts on failure. Optimistic updates only where UX demands
  it (chat send, vote) — never for money or destructive actions.

### Form + Validation

- `react-hook-form` + `zodResolver`.
- Zod schemas live in `packages/shared/` and are imported by **both**
  frontend and backend. One source of truth for shape.

See [frontend/README.md](./frontend/README.md) for conventions and patterns.

---

## 4. Backend Architecture

**Framework:** NestJS 11. Module structure follows `project/SKEP-DELTA.md`.

### Layer Flow (per request)

```
HTTP Request
   │
   ├─▶ RequestIdInterceptor            (assigns requestId to ALS)
   ├─▶ JwtAuthGuard                    (validates token, attaches AuthenticatedUser)
   ├─▶ RolesGuard                      (checks @Roles([...]) intersection)
   ├─▶ Controller                      (thin: parse DTO, delegate)
   │       │
   │       └─▶ Service                 (business logic)
   │              │
   │              ├─▶ TenantQueryService  (SET search_path + query)
   │              ├─▶ EventBusService     (publish domain events)
   │              └─▶ LmsClient           (check limits / report usage)
   │
   ├─▶ ResponseEnvelopeInterceptor     (wraps in { success, data, meta })
   └─▶ HttpExceptionFilter             (wraps errors in standard envelope)
```

All globally wired by `PlatformCoreModule.forRoot({ moduleName, tablePrefix, migrations, eventTypes })`.

### Module Shape

Every feature module follows `SKEP-DELTA.md §Module Layout`:

```
modules/<feature>/
├── <feature>.module.ts
├── controllers/<feature>.controller.ts
├── services/<feature>.service.ts
├── gateway/<feature>.gateway.ts     # Optional
├── dto/
│   ├── create-<feature>.dto.ts
│   ├── update-<feature>.dto.ts
│   └── <feature>-response.dto.ts
└── migrations/NNN_*.sql
```

### Tenancy

- **Every** tenant query goes through `TenantQueryService.forSchema(name).query(...)`.
- Schema name is validated against `public.schema_registry` and
  regex-checked (`^[a-z0-9_]{1,63}$`) before interpolation.
- `SET search_path TO "<schema>", public` runs on every checkout,
  reset on release. No leakage between requests.
- Cross-schema joins: **never**. If a requirement suggests one, it's wrong.

### WebSocket Layer (when needed)

- Namespace per module (`/chat`, `/tutor`, `/forum`).
- `WsJwtGuard` validates token on handshake, attaches user to `socket.data`.
- Every socket auto-joins `community:<communityCode>` on connect.
- Event names: `<module>:<action>` (C→S), `<module>:<noun>` (S→C).

See [backend/README.md](./backend/README.md) for module conventions.

---

## 5. Cross-Cutting Concerns

### Authentication

- **FE:** NextAuth.js holds the session; refresh token in httpOnly cookie, access token in memory.
- **BE:** Passport JWT strategy validates `SKEP_JWT_SECRET` signed tokens, `iss === "skep-api"`, `type === "COMMUNITY"`, and active `community_code` in registry.
- This module **never issues JWTs**. Only validates.

### Request ID Propagation

```
FE generates/accepts  →  sends x-request-id header
BE reads/generates    →  stores in AsyncLocalStorage
All log lines         →  include requestId
All emitted events    →  correlationId = requestId
```

### Response Envelope

All responses: `{ success, data|error, meta: { requestId, timestamp } }`.
See `API-CONTRACT.md` for exact shapes.

### Event Bus

- Redis pub/sub on `skep:events:<communityCode>`.
- Subscribers use `PSUBSCRIBE skep:events:*`.
- Events idempotent. Heavy work offloaded to BullMQ queues.

### Observability

- `Logger` from `@nestjs/common`, class-scoped.
- Never log: JWT, secrets, passwords, full email/phone, request bodies with PII.
- Always log: action, entity id, `communityCode`, `userId`, outcome.

### Secret Management

- All secrets in env vars. `.env.example` is source of truth for required vars.
- App refuses to start if required vars missing (validated in `main.ts` via a config schema).

---

## 6. Performance Budgets

| Surface | Budget | Block on miss? |
|---|---|---|
| FE page LCP | < 2.5s | Yes |
| API p95 latency | < 300ms | Warn |
| DB query p95 | < 100ms | Warn |
| WebSocket message fan-out | < 200ms server-side | Warn |

Measured via synthetic tests during `/review` gate. Failures block `/approve` on Stage 5.

---

## 7. Quality Gates (from CONSTRAINTS.md)

| Check | Threshold |
|---|---|
| TS compile errors | 0 |
| Lint errors | 0 |
| Overall coverage | > 60% |
| Auth flow coverage | 100% |
| Payment flow coverage | 100% |
| Tenant isolation test | 0 leaks |
| RBAC test | All role matrices pass |
| OWASP scan | 0 critical, 0 high |

---

## 8. Deployment Topology

```
GitHub main ─┬─▶ Vercel  (apps/frontend)   — preview per PR
             └─▶ Railway (apps/backend)    — Docker container
                 └─▶ Railway Postgres (schema-per-community)
                 └─▶ Railway Redis (pub/sub + BullMQ)
```

- PRs open preview environments on both providers.
- Only `main` deploys to production.
- Migrations run as a Railway release command, not inside the app container startup.

---

## 9. AI Tutor Specifics

### AI Provider Boundary

```
MessagesService ──▶ AiProvider (interface)
                      │
                      ├── AnthropicAdapter
                      ├── OpenAiAdapter
                      └── AzureOpenAiAdapter
```

- `AiProvider.stream(prompt, opts): AsyncIterable<Token>` — one seam, pluggable backend.
- Adapter picked at bootstrap from `AI_PROVIDER` env var.
- Retries (exponential backoff, 3 tries), 30s hard timeout, token counting in the adapter.
- Usage reported via `LmsClient.reportUsage({ metric: 'tokens.consumed', value: N })` on each completion.

### Streaming Flow (chat turn)

```
Client              WebSocket             MessagesService       AiProvider
  │  tutor:ask         ───▶                                          
  │                           write user msg to tutor_messages        
  │                           emit  tutor.message.sent (event bus)    
  │                           start stream                   ───▶     
  │                                                            token  
  │  tutor:token      ◀───    forward each token                      
  │                                                            token  
  │  tutor:token      ◀───                                            
  │                           persist completion to tutor_messages   
  │                           emit  tutor.message.answered            
  │  tutor:answer     ◀───                                            
```

### Transcript

- Generated on session end (explicit end, or idle-timeout sweep job).
- Stored in `tutor_transcripts` as a single row with formatted text + metadata
  (message count, token total, duration).
- Open decision: for very long transcripts, offload to object storage (R2)
  and keep only a reference row.

---

## 10. Open Architectural Decisions

Tracked here until resolved. Move to `logs/decisions/*.md` ADR once committed.

- [ ] **AI provider:** Anthropic Claude | OpenAI | Azure OpenAI. Default for hackathon: Anthropic Claude Opus 4.7.
- [ ] **SSR vs CSR split:** `/sessions` + `/sessions/[id]/transcript` SSR; `/sessions/[id]` (active chat) CSR.
- [ ] **Transcript storage:** DB-only vs. R2 offload threshold.
- [ ] **Prompt moderation:** classify user prompts before sending to AI? Which service?
- [ ] **Rate limiting:** `@nestjs/throttler` default (60/min per user per endpoint); `tutor:ask` WebSocket has its own per-user/min cap (default 20/min).
- [ ] **Session auto-end timeout:** idle for N minutes → auto-end session + emit `tutor.session.ended`. Default 30min.
