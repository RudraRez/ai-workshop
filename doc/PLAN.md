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
- [ ] **AI provider selected** (Anthropic Claude default). Blocks 2.5, 4.3.
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

## Phase 5 — Quality Gate (parallel, fresh instances)

**Team pattern:** Reviewer (fresh) ∥ Tester ∥ security-review skill.

| # | Task | Owner |
|---|---|---|
| 5.1 | Adversarial review of all Phase 2–4 diffs | ⚪ |
| 5.2 | OWASP checklist run (auth, injection, IDOR, CSRF, rate limiting) | ⚪ |
| 5.3 | Coverage report: overall > 60%, auth = 100%, tenant isolation test present | 🟥 |
| 5.4 | Perf smoke: API p95 < 300ms, DB p95 < 100ms, FE LCP < 2.5s | 🟥 |
| 5.5 | Accessibility scan: WCAG 2.1 AA on every authed page | 🟩 + 🟥 |
| 5.6 | DoD checklist (7 items from SKEP-INTEGRATION §Hackathon DoD) | ⚪ |

**Exit criteria:** All gate thresholds from `CONSTRAINTS.md §Quality Gate Thresholds` met.

**Gate:** `/approve phase-5`.

---

## Phase 6 — Ship

**Team pattern:** DevOps solo.

| # | Task | Owner |
|---|---|---|
| 6.1 | Railway backend: environment set, Dockerfile builds, migrations release command wired | 🟨 |
| 6.2 | Vercel frontend: env vars set, preview deploys green | 🟨 |
| 6.3 | GitHub Actions: lint + test + typecheck on PR; deploy on main | 🟨 |
| 6.4 | Production smoke: `/health` + `/ready` green on prod; FE login flow green | 🟨 |
| 6.5 | Close all logs; update `MEMORY.md`; tag release | 🟨 |

**Gate:** `/approve phase-6` — production live.

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

- [ ] AI provider: Anthropic Claude (default), OpenAI, or Azure OpenAI? Blocks 2.5 & 4.2.
- [ ] Transcript storage threshold — always DB, or offload > 100KB to R2?
- [ ] Per-user daily message cap default (proposal: 50/day for MEMBER).
- [ ] Content moderation on user prompts — on/off, which provider?
- [ ] Multimodal inputs (image uploads) in scope for MVP? If yes, add `tutor_attachments` table + R2 presigned flow to Phase 2.
- [ ] Session idle-end sweep job: BullMQ repeatable job? Proposal: every 5 min, end sessions idle > 30 min.
