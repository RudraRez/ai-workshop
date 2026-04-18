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

## 9. Product Surface — Three Tabs

The UI splits into three tabs that share one backend and one lesson-context state:

```
┌────────────────────────────────────────────────────────────────────────┐
│  Community app                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │  AI Tutor    │  │    Studio    │  │    Course    │                  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                  │
│         │                 │                 │                          │
│         │  lessonId (current lesson user is "Watching")                │
│         ▼                 ▼                 ▼                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │  Lesson context store (Zustand)                                  │  │
│  │   { lessonId, lessonTitle, courseId, lastSeenAt }                │  │
│  └───────────────────────────┬──────────────────────────────────────┘  │
└──────────────────────────────┼─────────────────────────────────────────┘
                               │
                               ▼ every call attaches lessonId
                 ┌─────────────────────────────┐
                 │   NestJS backend — /tutor   │
                 ├─────────────────────────────┤
                 │  Sessions + Messages (chat) │
                 │  Studio jobs (async)        │
                 │  Course proxy (read-only)   │
                 └─────────────────────────────┘
```

- **AI Tutor tab** → chat via REST + WebSocket (§ Streaming Flow below). Per-day usage counter shown (`12/20 left`) — driven by `tutor_settings.member_daily_message_cap`.
- **Studio tab** → generator workspace; produces assets anchored to a `lessonId`. Ten generators total; **Audio Overview + Flashcards** in MVP, rest roadmap.
- **Course tab** → lesson list + lesson viewer. Read-mostly; lesson content is owned by SKEP main platform and proxied/cached by this module.

### Studio Subsystem

```
POST /api/v1/tutor/studio/<generator>   (sync-ish if fast, async if slow)
      │
      ▼
┌──────────────────┐
│ StudioService    │  creates row in tutor_studio_jobs
└─────┬────────────┘
      │ enqueue
      ▼
┌──────────────────┐     BullMQ worker
│ Studio queue     │◀──────────────────────────────┐
│ (Redis, BullMQ)  │                               │
└─────┬────────────┘                               │
      │                                            │
      ▼                                            │
┌─────────────────────┐    ┌───────────────────┐   │
│ Audio worker        │───▶│ AiProvider (text) │   │
│  (script → TTS)     │    └───────────────────┘   │
│  ─ picks language   │    ┌───────────────────┐   │
│  ─ calls TTS        │───▶│ TtsProvider       │   │
│  ─ uploads to R2    │    └───────────────────┘   │
│  ─ writes row       │    ┌───────────────────┐   │
│                     │───▶│ ObjectStorage (R2)│   │
└─────────┬───────────┘    └───────────────────┘   │
          │                                        │
          ▼  emit tutor.studio.audio.generated ────┘
┌─────────────────────┐
│ Flashcards worker   │───▶ AiProvider (structured JSON output)
│  ─ prompts model    │
│  ─ validates schema │
│  ─ writes deck+cards│
└─────────┬───────────┘
          ▼  emit tutor.studio.flashcards.generated
```

**Design notes:**
- One polymorphic `tutor_studio_jobs` row tracks status for any generator. Type-specific output lives in its own table (`tutor_audio_overviews`, `tutor_flashcard_decks` + `tutor_flashcards`, etc.).
- Generators declared via a registry so adding the next generator means: new table + new worker + register enum value. No refactor of the orchestration layer.
- Audio uses BullMQ because TTS is slow (seconds–minutes). Flashcards can run inline or via queue — design says queue for uniformity and cancelability.
- Object storage: Cloudflare R2. Audio files keyed `tutor/<community_code>/audio/<job_id>.mp3`. Signed URLs with short TTL for playback.

### Multi-Language Audio

Supported languages (dropdown on Audio Overview generator):

| Code | Language |
|---|---|
| `en-IN` | English (India) — default |
| `hi-IN` | Hindi |
| `bn-IN` | Bengali |
| `gu-IN` | Gujarati |
| `kn-IN` | Kannada |
| `ml-IN` | Malayalam |
| `mr-IN` | Marathi |
| `pa-IN` | Punjabi |
| `ta-IN` | Tamil |
| `te-IN` | Telugu |

Pipeline: lesson text → AI generates a narration script in the target language → TTS provider renders audio → store MP3 + transcript in R2 + DB.

### Lesson Context

Every AI Tutor chat turn and every Studio generation attaches a `lessonId`. The backend persists `lessonId` + `lessonTitle` on the session (for chat) and on the studio job (for generators), so downstream analytics and resumability work.

The Course tab itself is a read proxy:

| Endpoint | Purpose | Source |
|---|---|---|
| `GET /api/v1/tutor/course/lessons` | List lessons | Cached mirror synced from SKEP main |
| `GET /api/v1/tutor/course/lessons/:id` | Lesson detail + content hash | Cached mirror |

Cache invalidation: on `platform.course.lesson.updated` event (subscribed).

### Quick-Action Chips

The AI Tutor tab exposes chip-style shortcuts (visible in screenshots: *Summarize this lesson*, *Generate Flashcards*, *Quiz me now*, *Show Mind Map*, *Explain concept*, *Quiz me*, *Flashcards*, *My progress*). Each chip is a **frontend affordance** — most translate to a prefilled prompt sent on the existing chat channel. Two are deep-links:

- *Generate Flashcards* / *Flashcards* → navigate to Studio → Flashcards with the current `lessonId`.
- Others not in MVP (Quiz, Mind Map, My progress) are rendered but disabled with a "coming soon" tooltip.

---

## 10. AI Tutor Chat Specifics

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

## 11. Open Architectural Decisions

Tracked here until resolved. Move to `logs/decisions/*.md` ADR once committed.

- [ ] **AI text provider:** Anthropic Claude | OpenAI | Azure OpenAI. Default: Anthropic Claude Opus 4.7 (Claude 4.7 is strongest available for reasoning + structured output).
- [ ] **TTS provider:** ElevenLabs | Azure Speech | Google Cloud TTS | AWS Polly. Must support all 9 Indian languages. Default proposal: Azure Speech (best Indian-language coverage + pricing).
- [ ] **SSR vs CSR split:** `/sessions`, `/sessions/[id]/transcript`, `/course/*`, `/studio` index SSR; `/sessions/[id]` (active chat) and `/studio/<generator>` CSR.
- [ ] **Transcript storage:** DB-only vs. R2 offload threshold (proposal: offload at >100KB).
- [ ] **Audio storage lifetime:** do audio overviews expire? Proposal: keep as long as the source lesson exists; delete on lesson deletion.
- [ ] **Prompt moderation:** classify user prompts before sending to AI? Which service?
- [ ] **Rate limiting:** `@nestjs/throttler` default (60/min per user per endpoint); `tutor:ask` WS has its own per-user/min cap (default 20/min). Studio generators have per-day caps from `tutor_settings`.
- [ ] **Session auto-end timeout:** idle for N minutes → auto-end + emit `tutor.session.ended`. Default 30min.
- [ ] **Usage counter semantics:** `12/20 left` visible in UI — is this per-day messages, per-day AI Tutor + Studio combined, or per-month? Proposal: per-day chat messages only, per role cap from settings.
- [ ] **Course lesson source:** direct DB view into SKEP main, or event-driven replication into local `tutor_lessons`? Proposal: event-driven replication on `platform.course.lesson.*` events.
