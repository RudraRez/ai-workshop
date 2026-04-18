# Implementation Plan

> Phase-by-phase build plan.
> Each phase = a coherent slice of user value. Phases are gated by `/approve`.
> Tasks inside a phase are 2–5 minutes of focused specialist work.

**Module:** SKEP **AI Tutor** — port `5094`, base path `/api/v1/tutor`, table prefix `tutor_`.

**Status:** DRAFT — Phases 0, 1, 2, 3 fully specified. Phase 4 (WebSocket streaming) specified. Phase 5/6 gate-level.

---

## 0. Prerequisites (block the whole plan until resolved)

- [x] **Module identity confirmed:** AI Tutor (port 5094, prefix `tutor_`).
- [ ] `project/BRIEF.md` filled with product name, problem, target users, goals.
- [ ] `project/REQUIREMENTS.md` filled with MoSCoW features (current assumed scope: sessions, messages, transcripts, settings — see `doc/MANIFEST.yaml`).
- [ ] `project/CONSTRAINTS.md` MVP definition + explicit out-of-scope.
- [ ] **AI text provider selected** (Anthropic Claude default). Blocks 2.5, 4.3, 5.*.
- [ ] **TTS provider selected** (Azure Speech default — best Indian-language coverage). Blocks 5.6.
- [ ] **Object storage** (Cloudflare R2) bucket provisioned + signing keys. Blocks 5.*.
- [ ] Figma link present (or "no Figma — design inline" stated).
- [ ] `.env.example` filled for both apps (see `doc/backend/` and `doc/frontend/`).

If any non-optional item is unchecked, that phase halts. Update `project/` and rerun `/plan`.

---

## Legend

- 🟦 Backend Dev   🟩 Frontend Dev   🟪 Architect   🟨 DevOps   🟥 Tester   ⚪ Reviewer
- **Size:** XS (<5m) · S (5–15m) · M (15–45m) · L (45m+)
- **Gate:** `/approve` required to advance phases (not individual tasks).

---

## Phase 0 — Foundation

**Goal:** Monorepo scaffold compiles, both apps start, DB + Redis reachable, platform-core skeleton exists.

**Team pattern:** Sequential. Architect → Backend Dev → DevOps.

| # | Task | Owner | Size | Paths |
|---|---|---|---|---|
| 0.1 | Create `pnpm-workspace.yaml` + root `package.json` with workspace protocol | 🟪 | S | `/pnpm-workspace.yaml`, `/package.json` |
| 0.2 | Scaffold `packages/shared/` (Zod schemas, shared types, envelope helpers) | 🟪 | S | `packages/shared/` |
| 0.3 | Scaffold `packages/platform-core/` with NestJS module skeleton + all exports stubbed | 🟦 | M | `packages/platform-core/src/` |
| 0.4 | Implement `JwtStrategy` + `JwtAuthGuard` + `RolesGuard` + decorators | 🟦 | M | `packages/platform-core/src/auth/` |
| 0.5 | Implement `SchemaManagerService` + `TenantQueryService` (regex check, search_path swap, registry lookup, cache) | 🟦 | L | `packages/platform-core/src/tenancy/` |
| 0.6 | Implement `EventBusService` (Redis pub/sub, envelope, correlationId propagation) | 🟦 | M | `packages/platform-core/src/events/` |
| 0.7 | Implement `LmsClient` interface + `MockLmsClient` + `HttpLmsClient` stub | 🟦 | S | `packages/platform-core/src/lms/` |
| 0.8 | Implement `HttpExceptionFilter` + `ResponseEnvelopeInterceptor` + `RequestIdInterceptor` | 🟦 | M | `packages/platform-core/src/http/` |
| 0.9 | Implement `HealthController` (`/health`, `/ready`) | 🟦 | S | `packages/platform-core/src/health/` |
| 0.10 | Implement `OnboardingController` + `OnboardingService` with HMAC verification + replay protection | 🟦 | M | `packages/platform-core/src/onboarding/` |
| 0.11 | Wire `PlatformCoreModule.forRoot({...})` in `apps/backend/src/app.module.ts` | 🟦 | S | `apps/backend/src/app.module.ts` |
| 0.12 | Create `.env.example` for backend with every required var | 🟦 | XS | `apps/backend/.env.example` |
| 0.13 | Create `.env.example` for frontend | 🟩 | XS | `apps/frontend/.env.example` |
| 0.14 | `infra/docker-compose.yml` — Postgres 16 + Redis 7 for local dev | 🟨 | S | `infra/docker-compose.yml` |
| 0.15 | `Makefile` — `dev`, `db:migrate`, `db:seed`, `test`, `lint` targets | 🟨 | S | `Makefile` |
| 0.16 | Seed script: 5 sample communities in `schema_registry` + migrations applied per schema | 🟦 | M | `infra/seed/` |
| 0.17 | Tests: platform-core JWT guard (valid / expired / wrong-issuer) | 🟥 | M | `packages/platform-core/test/` |
| 0.18 | Tests: tenant isolation (`COM_A` cannot read `COM_B`) | 🟥 | M | `packages/platform-core/test/` |

**Exit criteria (Phase 0):**
- `make dev` starts both apps, both log `ready`.
- `curl http://localhost:${MODULE_PORT}/health` → `200 { data: { status: "ok" } }`.
- `curl http://localhost:${MODULE_PORT}/ready` → `200 { data: { db: "ok", redis: "ok" } }`.
- Seed script creates 5 schemas visible via `\dn` in psql.
- Tenant isolation test passes.

**Gate:** `/approve phase-0` → proceed to Phase 1.

---

## Phase 1 — Authentication Integration

**Goal:** Frontend can log the user in via SKEP main platform, call a protected backend endpoint, receive the expected envelope.

**Team pattern:** Parallel with contract handoff.

### 1A. Backend (🟦)

| # | Task | Size | Paths |
|---|---|---|---|
| 1.1 | Implement a protected `GET /api/v1/tutor/me` endpoint returning `AuthenticatedUser` | S | `apps/backend/src/modules/me/` |
| 1.2 | `@Public()` smoke route `GET /api/v1/tutor/ping` | XS | same |
| 1.3 | RBAC matrix test: each role → expected status on `/me` | M | `apps/backend/test/` |

### 1B. Frontend (🟩)

| # | Task | Size | Paths |
|---|---|---|---|
| 1.4 | NextAuth.js config — SKEP credentials provider (forwards JWT) | M | `apps/frontend/src/app/api/auth/[...nextauth]/` |
| 1.5 | `AuthGuard` layout for `(authed)` route group | S | `apps/frontend/src/app/(authed)/layout.tsx` |
| 1.6 | `lib/api-client.ts` — typed fetcher that attaches JWT + parses envelope with Zod | M | `apps/frontend/src/lib/` |
| 1.7 | TanStack Query provider mounted at authed layout | XS | same layout |
| 1.8 | `useCurrentUser()` hook → calls `/me` | S | `apps/frontend/src/hooks/` |
| 1.9 | `/login` page (email+password form → NextAuth signIn) | M | `apps/frontend/src/app/(public)/login/` |
| 1.10 | `/dashboard` page renders `useCurrentUser()` data | S | `apps/frontend/src/app/(authed)/dashboard/` |

**Contract handoff:** Backend writes `logs/decisions/handoff-auth-contract.md` with the exact `/me` response shape; Frontend ACKs before 1.6.

**Exit criteria (Phase 1):**
- Manual: log in on FE, see user email + role + community on dashboard.
- Automated: RBAC matrix passes; FE e2e (Playwright) login → dashboard → logout.

**Gate:** `/approve phase-1`.

---

## Phase 2 — Sessions + Messages (REST baseline)

**Goal:** End-to-end tutor session: create session → send prompt (REST fallback) → persist user message → call AI provider → persist answer → return. Events published on every state change.

**Team pattern:** Mixed parallel with contract handoff.

### 2A. Backend (🟦)

| # | Task | Size | Paths |
|---|---|---|---|
| 2.1 | Migration `001_init_tutor_sessions.sql` | S | `apps/backend/src/modules/sessions/migrations/` |
| 2.2 | `SessionsService` + `SessionsController` (POST/GET/GET:id/PATCH/DELETE) | M | `apps/backend/src/modules/sessions/` |
| 2.3 | Event emission: `tutor.session.started`, `.ended`, `.deleted` | S | same |
| 2.4 | LMS integration: `checkLimits('session.create')` + `reportUsage('sessions.started')` | S | same |
| 2.5 | AI provider adapter interface + `AnthropicAdapter` (streaming, retries, timeout) | M | `apps/backend/src/modules/messages/services/ai-provider.service.ts` |
| 2.6 | Migration `001_init_tutor_messages.sql` | S | `apps/backend/src/modules/messages/migrations/` |
| 2.7 | `MessagesService` + `MessagesController` (POST with Idempotency-Key, GET list) | L | `apps/backend/src/modules/messages/` |
| 2.8 | Event emission: `tutor.message.sent`, `tutor.message.answered` | S | same |
| 2.9 | `tutor_sessions.message_count` increment on each message | XS | same |
| 2.10 | Unit tests: services mock `TenantQueryService`, `EventBusService`, use `MockLmsClient` | M | `apps/backend/test/` |
| 2.11 | Integration tests: tenant isolation + RBAC matrix on both resources | M | `apps/backend/test/` |

### 2B. Frontend (🟩)

| # | Task | Size | Paths |
|---|---|---|---|
| 2.12 | Shared Zod schemas: `session.ts`, `message.ts` in `packages/shared/` | S | `packages/shared/src/schemas/` |
| 2.13 | Hooks: `useSessions`, `useSession`, `useCreateSession`, `useEndSession`, `useDeleteSession` | M | `apps/frontend/src/hooks/` |
| 2.14 | `/sessions` list page with cursor pagination + status filter | M | `apps/frontend/src/app/(authed)/sessions/page.tsx` |
| 2.15 | `/sessions/new` form (topic + context) with RHF + zodResolver | S | `apps/frontend/src/app/(authed)/sessions/new/page.tsx` |
| 2.16 | `/sessions/[id]` page SSR shell + CSR thread component (REST mode first) | L | `apps/frontend/src/app/(authed)/sessions/[id]/` |
| 2.17 | `MessageInput` with optimistic user message + submit via REST | M | `apps/frontend/src/components/tutor/` |
| 2.18 | E2E: create → ask → receive answer → end session | M | `apps/frontend/tests/` |

**Contract handoff:** `logs/decisions/handoff-sessions-contract.md` before 2.12.

**Exit criteria:**
- Full REST CRUD on sessions + messages works end-to-end.
- Redis shows all 5 expected events for a created+chatted+ended session.
- Tenant isolation test passes for both tables.
- Playwright journey green.

**Gate:** `/approve phase-2`.

---

## Phase 3 — Transcripts + Settings

**Goal:** OWNER/ADMIN can configure tutor behavior; sessions produce transcripts on end.

### 3A. Backend (🟦)

| # | Task | Size | Paths |
|---|---|---|---|
| 3.1 | Migration `001_init_tutor_transcripts.sql` (+ singleton `tutor_settings`) | S | `apps/backend/src/modules/{transcripts,settings}/migrations/` |
| 3.2 | `TranscriptsService`: generate on `tutor.session.ended` subscription | M | `apps/backend/src/modules/transcripts/` |
| 3.3 | `GET /api/v1/tutor/sessions/:id/transcript` | S | same |
| 3.4 | `SettingsService` + `SettingsController` (GET/PUT) | M | `apps/backend/src/modules/settings/` |
| 3.5 | Settings are consulted by `MessagesService` (model, cap, system prompt) | S | `apps/backend/src/modules/messages/` |
| 3.6 | Event: `tutor.settings.updated` | XS | settings module |
| 3.7 | Tests: transcript generation idempotency; settings RBAC (MEMBER → 403) | M | `apps/backend/test/` |

### 3B. Frontend (🟩)

| # | Task | Size | Paths |
|---|---|---|---|
| 3.8 | `/sessions/[id]/transcript` page with server-side fetch | S | `apps/frontend/src/app/(authed)/sessions/[id]/transcript/` |
| 3.9 | `/settings` page (OWNER/ADMIN only) — form + submit | M | `apps/frontend/src/app/(authed)/settings/` |
| 3.10 | Hide `/settings` nav item for MEMBER role | XS | sidebar component |

**Exit criteria:** transcript generated within 5s of session end; settings changes reflected on next message send.

**Gate:** `/approve phase-3`.

---

## Phase 4 — WebSocket Streaming (`/tutor` namespace)

**Goal:** Replace Phase 2's REST message submission with live-streaming WebSocket — users see tokens arrive character-by-character.

| # | Task | Owner | Size |
|---|---|---|---|
| 4.1 | `TutorGateway` with `WsJwtGuard` + handshake auth; auto-join `community:<code>` | 🟦 | M |
| 4.2 | `tutor:ask` handler: validate session access, insert user message, emit `tutor.message.sent`, start AI stream | 🟦 | L |
| 4.3 | Token fan-out via Redis pub/sub so horizontal scale works | 🟦 | M |
| 4.4 | Emit `tutor:token` per token, `tutor:answer` on completion, `tutor:session` on state change | 🟦 | S |
| 4.5 | Per-user WS rate limit: 20 `tutor:ask`/min | 🟦 | S |
| 4.6 | FE: `lib/socket.ts` singleton + `useTutorSocket(sessionId)` hook | 🟩 | M |
| 4.7 | FE: `/sessions/[id]` switches from REST to WS for new messages | 🟩 | M |
| 4.8 | FE: token-stream animation (cursor + appending text) | 🟩 | S |
| 4.9 | Reconnect flow: re-auth + re-fetch last N messages on reconnect | 🟩 | M |
| 4.10 | Load test: 500 concurrent sockets in one community | 🟥 | M |
| 4.11 | E2E update: ask via UI, assert tokens streaming, assert final answer matches REST counterpart | 🟥 | M |

**Exit criteria:** under load, first token < 500ms after `tutor:ask`; full answer matches non-streamed version; reconnect works transparently.

**Gate:** `/approve phase-4`.

---

## Phase 4.5 — Course Lesson Mirror

**Goal:** Populate `tutor_lessons` from SKEP main's `platform.course.lesson.*` events so every AI Tutor chat turn and every Studio job has a local, hash-verified lesson to anchor on.

**Team pattern:** Backend solo + Tester.

| # | Task | Owner | Size | Paths |
|---|---|---|---|---|
| 4.5.1 | Migration `001_init_tutor_lessons.sql` (table from `doc/DATA-MODEL.md §5.5`) | 🟦 | S | `apps/backend/src/modules/course/migrations/` |
| 4.5.2 | `CourseMirrorService`: subscribe to `platform.course.lesson.created|updated|deleted`, idempotent upsert into `tutor_lessons` | 🟦 | M | `apps/backend/src/modules/course/` |
| 4.5.3 | `CourseController`: `GET /course/lessons`, `GET /course/lessons/:id` (read-only from mirror) | 🟦 | S | same |
| 4.5.4 | Bootstrap sweep on module start — if mirror is empty for a community, request full sync from main (one-time `platform.course.sync.requested` event) | 🟦 | S | same |
| 4.5.5 | Tests: replay 3 lesson events → expected rows; duplicate delivery → idempotent | 🟥 | M | `apps/backend/test/` |

**Exit criteria:** `GET /course/lessons` returns the seeded lesson list; event replay is idempotent.

**Gate:** `/approve phase-4.5`.

---

## Phase 5 — Studio: Audio Overview + Flashcards

**Goal:** Ship Studio tab with **only two generators** — Audio Overview (9 Indian languages + English) and Flashcards. Remaining 8 generators return `501 TUTOR_GENERATOR_NOT_AVAILABLE`.

**Team pattern:** Mixed parallel. Backend foundations first, then two workers in parallel, Frontend follows.

### 5A. Foundations (🟦)

| # | Task | Size | Paths |
|---|---|---|---|
| 5.1 | Migration `001_init_tutor_studio_jobs.sql` (§5.6) | S | `apps/backend/src/modules/studio/migrations/` |
| 5.2 | Migration `002_add_studio_caps_to_tutor_settings.sql` (§5.10) | XS | `apps/backend/src/modules/settings/migrations/` |
| 5.3 | Migration `003_init_tutor_usage_daily.sql` (§5.9) | S | `apps/backend/src/modules/studio/migrations/` |
| 5.4 | `StudioService.submitJob(type, input, idempotencyKey)` — inserts job, enqueues BullMQ | M | `apps/backend/src/modules/studio/` |
| 5.5 | `StudioController`: common list/get/delete routes + type-scoped POST routes | M | same |
| 5.6 | TTS provider adapter interface + `AzureSpeechAdapter` (all 10 languages) + stub adapter for tests | M | `apps/backend/src/modules/studio/tts/` |
| 5.7 | Object storage client (`R2Client`) — upload, presign (short TTL) | S | `apps/backend/src/modules/studio/storage/` |
| 5.8 | `UsageService` — increment + read per-day counters; caps from `tutor_settings` | M | `apps/backend/src/modules/usage/` |
| 5.9 | `GET /me/usage` endpoint driving the `12/20 left` badge | S | `apps/backend/src/modules/me/` |

### 5B. Audio Overview worker (🟦)

| # | Task | Size | Paths |
|---|---|---|---|
| 5.10 | Migration `001_init_tutor_audio_overviews.sql` (§5.7) | S | `apps/backend/src/modules/studio/audio/migrations/` |
| 5.11 | `AudioOverviewWorker`: pull job → generate script via AI (language-localized) → TTS → upload to R2 → insert row | L | `apps/backend/src/modules/studio/audio/` |
| 5.12 | Events: emit `tutor.studio.audio.requested` / `.generated` / `.failed` | S | same |
| 5.13 | `POST /studio/audio-overviews`, `GET /studio/audio-overviews`, `GET /studio/audio-overviews/:id` (signed URL) | M | same |
| 5.14 | Tests: stub TTS adapter, assert job lifecycle + event sequence + signed URL shape | M | `apps/backend/test/` |

### 5C. Flashcards worker (🟦)

| # | Task | Size | Paths |
|---|---|---|---|
| 5.15 | Migration `001_init_tutor_flashcard_decks.sql` + `002_init_tutor_flashcards.sql` (§5.8) | S | `apps/backend/src/modules/studio/flashcards/migrations/` |
| 5.16 | `FlashcardsWorker`: prompt AI with lesson content + count/difficulty → parse JSON → validate with Zod → insert deck + cards in one transaction | L | `apps/backend/src/modules/studio/flashcards/` |
| 5.17 | Events: emit `tutor.studio.flashcards.requested` / `.generated` / `.failed` | S | same |
| 5.18 | `POST /studio/flashcards`, `GET /studio/flashcards`, `GET /studio/flashcards/:id` | M | same |
| 5.19 | Tests: deterministic AI stub returns valid JSON deck; schema-violating response → `failed` + event | M | `apps/backend/test/` |

### 5D. Roadmap-generator stub (🟦)

| # | Task | Size | Paths |
|---|---|---|---|
| 5.20 | `RoadmapController` catches the 8 roadmap paths and returns `501 TUTOR_GENERATOR_NOT_AVAILABLE` with `generator` name in details | S | `apps/backend/src/modules/studio/` |

### 5E. Frontend (🟩)

| # | Task | Size | Paths |
|---|---|---|---|
| 5.21 | Shared schemas: `lesson.ts`, `usage.ts`, `studio/{job,audio-overview,flashcards}.ts` | S | `packages/shared/src/schemas/` |
| 5.22 | `LessonContext` provider (Zustand) — current lessonId/lessonTitle, rehydrates from URL | S | `apps/frontend/src/lib/lesson-context.ts` |
| 5.23 | `UsageBadge` — polls `/me/usage`, renders `12/20 left` | S | `apps/frontend/src/components/tutor/` |
| 5.24 | Three-tab shell (AI Tutor / Studio / Course) with router-aware tab state | M | `apps/frontend/src/app/(authed)/` |
| 5.25 | Course tab: lesson list + detail view (read from `/course/lessons`) | M | `apps/frontend/src/app/(authed)/course/` |
| 5.26 | AI Tutor tab: quick-action chips wired (Summarize, Generate Flashcards, Explain concept); roadmap chips render disabled with tooltip | M | `apps/frontend/src/components/tutor/quick-actions.tsx` |
| 5.27 | Studio tab: generator grid (10 cards, 2 enabled, 8 disabled w/ "Coming soon") matching screenshot | M | `apps/frontend/src/app/(authed)/studio/page.tsx` |
| 5.28 | Studio → Audio Overview page: language dropdown (10 options) + voice style + submit + job polling + audio player | L | `apps/frontend/src/app/(authed)/studio/audio-overviews/` |
| 5.29 | Studio → Flashcards page: count + difficulty + submit + deck viewer (swipeable card UI) | L | `apps/frontend/src/app/(authed)/studio/flashcards/` |
| 5.30 | `useStudioJob(jobId)` hook — polls every 2s until `completed|failed`, falls back to WS signal if available | M | `apps/frontend/src/hooks/` |
| 5.31 | E2E: from Course → open lesson → Studio → generate audio in Hindi → playback available | M | `apps/frontend/tests/` |
| 5.32 | E2E: from AI Tutor quick-action "Generate Flashcards" → lands on Studio flashcards with prefilled lessonId → submit → deck visible | M | `apps/frontend/tests/` |

**Exit criteria:**
- Audio generation completes within 90s for an average lesson; MP3 plays in browser via signed URL.
- Flashcards generation completes within 30s; deck of N cards rendered.
- Usage counter increments on each generation; refuses when cap hit (`TUTOR_STUDIO_QUOTA_EXCEEDED`).
- All 8 roadmap paths return `501 TUTOR_GENERATOR_NOT_AVAILABLE`.
- Events visible on Redis for the 8 Studio event types.

**Gate:** `/approve phase-5`.

---

## Phase 6 — Quality Gate (parallel, fresh instances)

**Team pattern:** Reviewer (fresh) ∥ Tester ∥ security-review skill.

| # | Task | Owner |
|---|---|---|
| 6.1 | Adversarial review of all Phase 2–5 diffs | ⚪ |
| 6.2 | OWASP checklist run (auth, injection, IDOR, CSRF, rate limiting, signed URL scope) | ⚪ |
| 6.3 | Coverage report: overall > 60%, auth = 100%, tenant isolation test present | 🟥 |
| 6.4 | Perf smoke: API p95 < 300ms, DB p95 < 100ms, FE LCP < 2.5s | 🟥 |
| 6.5 | Audio generation smoke across all 10 languages (one lesson, render + play each) | 🟥 |
| 6.6 | Accessibility scan: WCAG 2.1 AA on every authed page (including audio player + deck viewer) | 🟩 + 🟥 |
| 6.7 | DoD checklist (7 items from SKEP-INTEGRATION §Hackathon DoD) | ⚪ |

**Exit criteria:** All gate thresholds from `CONSTRAINTS.md §Quality Gate Thresholds` met.

**Gate:** `/approve phase-6`.

---

## Phase 7 — Ship

**Team pattern:** DevOps solo.

| # | Task | Owner |
|---|---|---|
| 7.1 | Railway backend: environment set (incl. R2 + TTS provider keys), Dockerfile builds, migrations release command wired | 🟨 |
| 7.2 | Vercel frontend: env vars set, preview deploys green | 🟨 |
| 7.3 | GitHub Actions: lint + test + typecheck on PR; deploy on main | 🟨 |
| 7.4 | Production smoke: `/health` + `/ready` green on prod; FE login flow + one Studio audio generation green | 🟨 |
| 7.5 | Close all logs; update `MEMORY.md`; tag release | 🟨 |

**Gate:** `/approve phase-7` — production live.

---

## Cross-Phase Work

These run alongside the phases above, not as their own phase:

- **Docs:** update `doc/API-CONTRACT.md` + `doc/DATA-MODEL.md` + `doc/EVENT-CATALOG.md` whenever a task changes them.
- **Memory:** write at session end (decisions, surprises, pitfalls).
- **Logs:** every task gets `logs/<area>/<phase>.<seq>-<slug>.md` **before** starting.

---

## Risk Register

| Risk | Likelihood | Mitigation |
|---|---|---|
| Cross-schema leak | Low if `TenantQueryService` is the only path | Mandatory isolation test, code review rejects raw `pool.query` |
| JWT-issue drift (this module starts issuing) | Low — explicit ban | Lint rule: ban `jwt.sign` in module code |
| Real LMS flaky during hackathon | Medium | `LMS_MODE=mock` default — never block on HTTP LMS |
| Event floods (Redis) | Medium if hot rooms | Offload heavy subscribers to BullMQ queue |
| Migration drift across 5 seeded schemas | Medium | `SchemaManagerService` sweep on boot + CI check |

---

## Open Plan Questions

- [ ] AI text provider: Anthropic Claude (default), OpenAI, or Azure OpenAI? Blocks 2.5 & 4.2 & Phase 5.
- [ ] TTS provider: Azure Speech (default — best Indian-language coverage), ElevenLabs, AWS Polly, or Google Cloud TTS? Blocks 5.6.
- [ ] Object storage: Cloudflare R2 (default per `TECH-STACK.md`). Bucket + keys provisioned before Phase 5.
- [ ] Per-day caps defaults — proposal: messages 20, audio 5, flashcards 10 for MEMBER.
- [ ] Transcript storage threshold — always DB, or offload > 100KB to R2?
- [ ] Audio retention: keep as long as source lesson exists (proposal), or expire after N days?
- [ ] Content moderation on user prompts — on/off, which provider?
- [ ] Roadmap-generator fallback UX: tooltip "Coming soon", or waitlist capture? Proposal: tooltip only in MVP.
- [ ] Session idle-end sweep job: BullMQ repeatable job? Proposal: every 5 min, end sessions idle > 30 min.
- [ ] Course tab content source: direct DB view into SKEP main vs. event-driven replication. Proposal: event replication (Phase 4.5).
