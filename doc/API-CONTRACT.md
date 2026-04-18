# API Contract

> The REST + WebSocket surface this module exposes.
> Every change here requires updating the Zod schemas in
> `packages/shared/` so FE and BE stay in lockstep.
> This file is the **handoff document** from Architect → Backend Dev → Frontend Dev.

**Module:** SKEP **AI Tutor** — port `5094`, base path `/api/v1/tutor`, WS namespace `/tutor`.

**Status:** DRAFT — envelope frozen by SKEP platform contract; AI Tutor feature endpoints below.

---

## 0. Base

| Attribute | Value |
|---|---|
| Base URL (dev) | `http://localhost:${MODULE_PORT}` |
| Base URL (prod) | `https://<module>.skep.internal` |
| Versioned prefix | `/api/v1/<module-path>` |
| Content type | `application/json; charset=utf-8` |
| Auth scheme | `Authorization: Bearer <JWT>` — JWT issued by main SKEP platform |
| CORS | Origins from `CORS_ORIGINS` env var |
| Rate limiting | 60 req/min per user per endpoint unless overridden |

---

## 1. Response Envelope — Universal Shape

### Success

```http
HTTP/1.1 200 OK
Content-Type: application/json
x-request-id: 7f1e2b4a-...

{
  "success": true,
  "data": { ... },
  "meta": {
    "requestId": "7f1e2b4a-...",
    "timestamp": "2026-04-18T10:15:00.000Z"
  }
}
```

### Error

```http
HTTP/1.1 403 Forbidden
Content-Type: application/json
x-request-id: 7f1e2b4a-...

{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "Role ADMIN required",
    "details": { "requiredRoles": ["ADMIN"], "userRoles": ["MEMBER"] }
  },
  "meta": {
    "requestId": "7f1e2b4a-...",
    "timestamp": "2026-04-18T10:15:00.000Z"
  }
}
```

### List with Pagination (cursor-only, never offset)

```json
{
  "success": true,
  "data": {
    "items": [ ... ],
    "nextCursor": "opaque-string-or-null"
  },
  "meta": { "requestId": "...", "timestamp": "..." }
}
```

---

## 2. Status Code Matrix

| Situation | Code | Error code | Notes |
|---|---|---|---|
| OK (GET/PUT/PATCH) | 200 | — | |
| Created | 201 | — | Body includes created entity |
| Soft-deleted | 204 | — | No body |
| Invalid body | 400 | `BAD_REQUEST` or `VALIDATION_FAILED` | `details.errors` array from class-validator |
| Missing/invalid JWT | 401 | `UNAUTHORIZED` | Never reveal why |
| Community not enabled | 401 | `COMMUNITY_NOT_ENABLED` | Registry check failed |
| Role insufficient | 403 | `FORBIDDEN` | |
| Resource missing (or not visible to tenant) | 404 | `NOT_FOUND` | |
| Idempotency/uniqueness conflict | 409 | `CONFLICT` | |
| Rate limit exceeded | 429 | `RATE_LIMITED` | `Retry-After` header |
| Unhandled | 500 | `INTERNAL_ERROR` | Stack traces never leak to client |

---

## 3. Standard Headers

### Request

| Header | Required | Notes |
|---|---|---|
| `Authorization` | Yes* | `Bearer <JWT>`. *Optional on `@Public()` routes only. |
| `x-request-id` | No | UUID. Echoed back in response. Generated if absent. |
| `Idempotency-Key` | No | Required on POST for money/notification actions (per-endpoint). |

### Response

| Header | Notes |
|---|---|
| `x-request-id` | Matches request (or generated). |
| `Retry-After` | On 429. |

---

## 4. Authentication — JWT Shape (inbound from main SKEP)

```json
{
  "sub": "5acd233e-1425-48d7-8ad9-0a0eea09d57a",
  "platform_user_id": "USR61220651",
  "keycloak_user_id": "5acd233e-1425-48d7-8ad9-0a0eea09d57a",
  "community_code": "COM96179941",
  "org_id": "be2064fc-9d31-47a9-9e08-646d1fd57f1d",
  "roles": ["OWNER"],
  "type": "COMMUNITY",
  "iss": "skep-api",
  "iat": 1771253333,
  "exp": 1771256933
}
```

Validation rules and failure codes are defined in `project/SKEP-INTEGRATION.md §Authentication`.

---

## 5. Platform Endpoints (present in every SKEP module)

### `GET /health`

Liveness probe. **Public.** No auth.

```
200  { "success": true, "data": { "status": "ok" }, "meta": { ... } }
```

### `GET /ready`

Readiness probe. Checks DB + Redis connectivity. **Public.**

```
200  { "success": true, "data": { "db": "ok", "redis": "ok" }, "meta": { ... } }
503  { "success": false, "error": { "code": "NOT_READY", "details": { "db": "fail" } }, "meta": { ... } }
```

### `POST /platform/webhooks/community-onboarded`

Called by main SKEP to provision this module for a new community. **HMAC-authenticated** (not JWT).

**Headers**
```
x-skep-signature: <HMAC-SHA256 of body using ONBOARDING_WEBHOOK_SECRET>
```

**Body**
```json
{
  "communityCode": "COM96179941",
  "orgId": "be2064fc-9d31-47a9-9e08-646d1fd57f1d",
  "displayName": "Acme Community",
  "timestamp": "2026-04-18T10:00:00.000Z"
}
```

**Behavior** (from `SKEP-INTEGRATION.md §Onboarding Webhook`):
1. Verify HMAC (timing-safe).
2. Reject if `|now - timestamp| > 5 min`.
3. Idempotent on duplicate delivery.
4. Insert into `public.schema_registry`.
5. `CREATE SCHEMA IF NOT EXISTS "<schema_name>"`.
6. Run migrations in new schema.
7. Publish `platform.community.onboarded` event.

**Responses**
```
200  onboarded or already-onboarded
400  { error.code: "BAD_REQUEST" }  malformed body
401  { error.code: "UNAUTHORIZED" } bad signature or stale timestamp
500  { error.code: "INTERNAL_ERROR" }
```

---

## 6. AI Tutor Endpoints

### 6.1 `GET /api/v1/tutor/me`

Returns the authenticated user derived from the JWT + registry lookup.

- **Roles:** any authenticated
- **200 body:**
  ```json
  {
    "userId": "5acd...",
    "platformUserId": "USR61220651",
    "communityCode": "COM96179941",
    "orgId": "be20...",
    "roles": ["OWNER"]
  }
  ```

### 6.1a `GET /api/v1/tutor/me/usage`

Drives the `12/20 left` badge in the AI Tutor header. Full schema in §6.8.

### 6.2 Sessions

#### `POST /api/v1/tutor/sessions` — Start a session

- **Roles:** `OWNER`, `ADMIN`, `MEMBER`
- **Body** (`CreateSessionDto`):
  ```json
  {
    "topic": "Claude Code — agents",
    "context": "I am stuck on how tools are invoked",
    "lessonId": "lesson-uuid"
  }
  ```
  `lessonId` is **optional** (sessions can be free-form), but the product surface generally attaches the current `lessonId` so chat is lesson-aware.
- **201 body:** full `Session` (see schema in §9.2)
- **Side effects:** LMS limit check → insert `tutor_sessions` → LMS usage report → emit `tutor.session.started`
- **Errors:** `TUTOR_SESSION_QUOTA_EXCEEDED` (403), `VALIDATION_FAILED` (400)

#### `GET /api/v1/tutor/sessions` — List sessions

- **Roles:** `OWNER`, `ADMIN`, `MEMBER`
- **Query:**
  | Param | Type | Default | Notes |
  |---|---|---|---|
  | `cursor` | string | — | Opaque; from previous response |
  | `limit` | int | 20 | Max 50 |
  | `status` | string | — | `active` \| `ended` |
  | `createdBy` | UUID | caller's user id (MEMBER), any (ADMIN/OWNER) | |
- **200 body:** `{ items: Session[], nextCursor: string | null }`
- **RBAC:** `MEMBER` only sees sessions they own. `ADMIN` / `OWNER` see community-wide.

#### `GET /api/v1/tutor/sessions/:id` — Read one

- **Roles:** `OWNER`, `ADMIN`, or session owner (MEMBER)
- **200 body:** `Session`
- **404 code:** `TUTOR_SESSION_NOT_FOUND`

#### `PATCH /api/v1/tutor/sessions/:id` — Update (e.g. end session, rename)

- **Roles:** `OWNER`, `ADMIN`, or session owner
- **Body** (`UpdateSessionDto` — all optional):
  ```json
  { "topic": "string", "status": "ended" }
  ```
- **200 body:** updated `Session`
- **Side effects:** if transitioning to `ended`, emit `tutor.session.ended` and queue transcript generation.

#### `DELETE /api/v1/tutor/sessions/:id` — Soft-delete

- **Roles:** `OWNER`, `ADMIN`, or session owner
- **204** no body
- **Side effects:** `UPDATE ... SET deleted_at = NOW()`, emit `tutor.session.deleted`

### 6.3 Messages

#### `POST /api/v1/tutor/sessions/:id/messages` — Send a prompt (REST fallback)

> Preferred path is WebSocket `tutor:ask` (§7). REST exists for non-WS clients and testing.

- **Roles:** `OWNER`, `ADMIN`, or session owner
- **Body** (`SendMessageDto`):
  ```json
  { "prompt": "What is a limit?" }
  ```
- **Headers:** `Idempotency-Key: <UUID>` required (prevents duplicate AI calls on retries).
- **201 body:** `{ userMessage: Message, answer: Message }` (blocks until AI completes)
- **Side effects:** insert user `tutor_messages` row → emit `tutor.message.sent` → stream AI completion → insert assistant row → LMS usage report → emit `tutor.message.answered`
- **Errors:** `TUTOR_MESSAGE_QUOTA_EXCEEDED` (403), `TUTOR_SESSION_ENDED` (409)

#### `GET /api/v1/tutor/sessions/:id/messages` — Thread history (paginated)

- **Roles:** `OWNER`, `ADMIN`, or session owner
- **Query:** `cursor`, `limit` (max 100, default 50)
- **200 body:** `{ items: Message[], nextCursor: string | null }` — ordered by `createdAt DESC`

### 6.4 Transcripts

#### `GET /api/v1/tutor/sessions/:id/transcript`

- **Roles:** `OWNER`, `ADMIN`, or session owner
- **200 body:**
  ```json
  {
    "sessionId": "...",
    "generatedAt": "2026-04-18T10:00:00.000Z",
    "messageCount": 24,
    "tokenCount": 3187,
    "content": "User: What is a limit?\nTutor: A limit is..."
  }
  ```
- **404 code:** `TUTOR_TRANSCRIPT_NOT_READY` if session is still `active`.

### 6.5 Settings

#### `GET /api/v1/tutor/settings`

- **Roles:** `OWNER`, `ADMIN` (MEMBER → 403)
- **200 body:**
  ```json
  {
    "defaultModel": "claude-opus-4-7",
    "systemPrompt": "You are a patient tutor...",
    "maxTokensPerAnswer": 2048,
    "memberDailyMessageCap": 50,
    "moderationEnabled": true
  }
  ```

#### `PUT /api/v1/tutor/settings`

- **Roles:** `OWNER`, `ADMIN`
- **Body:** full `Settings` object (class-validator)
- **200 body:** updated `Settings`
- **Side effects:** emit `tutor.settings.updated`

---

### 6.6 Course Tab (read-only proxy)

Lesson content is owned by SKEP main platform. This module keeps a local mirror (populated from `platform.course.lesson.*` events) to serve the Course tab without cross-module HTTP calls.

#### `GET /api/v1/tutor/course/lessons` — List lessons (current community)

- **Roles:** `OWNER`, `ADMIN`, `MEMBER`
- **Query:** `cursor?`, `limit?` (max 50, default 20), `courseId?`
- **200 body:** `{ items: Lesson[], nextCursor: string | null }`

#### `GET /api/v1/tutor/course/lessons/:id` — Lesson detail

- **Roles:** `OWNER`, `ADMIN`, `MEMBER`
- **200 body:** `Lesson` with `contentHash` (clients compare to refresh the lesson context client-side when content drifts).

`Lesson` shape:

```json
{
  "id": "lesson-uuid",
  "courseId": "course-uuid",
  "title": "Claude Code: Build Your First AI Agent",
  "summary": "...",
  "contentHash": "sha256-...",
  "durationSec": 1800,
  "createdAt": "...",
  "updatedAt": "..."
}
```

### 6.7 Studio Tab — Generators

All Studio endpoints accept a `lessonId` in the body. They return a **job** object which is either already `completed` (for synchronous-enough generators) or `pending|running` (caller polls or subscribes to events).

#### Common `StudioJob` shape

```json
{
  "id": "job-uuid",
  "type": "audio-overview" | "flashcards",
  "lessonId": "lesson-uuid",
  "status": "pending" | "running" | "completed" | "failed",
  "progress": 0.42,
  "input": { "...": "generator-specific" },
  "outputRef": "audio-overview-id-or-deck-id-or-null",
  "error": { "code": "...", "message": "..." } | null,
  "createdAt": "...",
  "updatedAt": "...",
  "completedAt": "..." | null
}
```

#### `POST /api/v1/tutor/studio/audio-overviews` — Request audio

- **Roles:** `OWNER`, `ADMIN`, `MEMBER`
- **Headers:** `Idempotency-Key: <UUID>` required.
- **Body** (`CreateAudioOverviewDto`):
  ```json
  {
    "lessonId": "lesson-uuid",
    "language": "hi-IN",              // one of en-IN, hi-IN, bn-IN, gu-IN, kn-IN, ml-IN, mr-IN, pa-IN, ta-IN, te-IN
    "voiceStyle": "narrator"           // optional; narrator | conversational | friendly
  }
  ```
- **202 body:** `StudioJob` with `status: "pending"` (async — TTS takes seconds to minutes).
- **Errors:** `TUTOR_STUDIO_LANGUAGE_UNSUPPORTED` (400), `TUTOR_STUDIO_QUOTA_EXCEEDED` (403), `TUTOR_LESSON_NOT_FOUND` (404).
- **Side effects:** insert `tutor_studio_jobs` row → enqueue BullMQ job → emit `tutor.studio.audio.requested`.

#### `GET /api/v1/tutor/studio/audio-overviews` — List

- **Roles:** `OWNER`, `ADMIN`, `MEMBER` (MEMBER sees only own)
- **Query:** `cursor?`, `limit?`, `lessonId?`, `language?`, `status?`
- **200 body:** `{ items: AudioOverview[], nextCursor: string | null }`

#### `GET /api/v1/tutor/studio/audio-overviews/:id` — Get one

- **Roles:** `OWNER`, `ADMIN`, or job owner
- **200 body:** `AudioOverview` including signed playback URL:
  ```json
  {
    "id": "...",
    "jobId": "...",
    "lessonId": "...",
    "language": "hi-IN",
    "audioUrl": "https://r2.signed.example/...?exp=...",
    "audioUrlExpiresAt": "2026-04-18T11:00:00.000Z",
    "transcript": "...",
    "durationSec": 312,
    "voiceStyle": "narrator",
    "createdAt": "..."
  }
  ```

#### `POST /api/v1/tutor/studio/flashcards` — Generate deck

- **Roles:** `OWNER`, `ADMIN`, `MEMBER`
- **Headers:** `Idempotency-Key: <UUID>` required.
- **Body** (`CreateFlashcardDeckDto`):
  ```json
  {
    "lessonId": "lesson-uuid",
    "count": 15,                      // 5–50, default 10
    "difficulty": "mixed",            // easy | medium | hard | mixed
    "tags": ["claude", "agents"]      // optional
  }
  ```
- **202 body:** `StudioJob` (usually completes within 10–30s; clients can poll or subscribe).
- **Errors:** `TUTOR_STUDIO_QUOTA_EXCEEDED` (403), `TUTOR_LESSON_NOT_FOUND` (404), `VALIDATION_FAILED` (400).

#### `GET /api/v1/tutor/studio/flashcards` — List decks

- **Roles:** `OWNER`, `ADMIN`, `MEMBER` (MEMBER sees only own)
- **Query:** `cursor?`, `limit?`, `lessonId?`, `status?`
- **200 body:** `{ items: FlashcardDeck[], nextCursor: string | null }`

#### `GET /api/v1/tutor/studio/flashcards/:id` — Get deck + cards

- **Roles:** `OWNER`, `ADMIN`, or deck owner
- **200 body:**
  ```json
  {
    "id": "deck-uuid",
    "jobId": "...",
    "lessonId": "...",
    "title": "Claude Code: Agents — 15 flashcards",
    "difficulty": "mixed",
    "cardCount": 15,
    "cards": [
      { "id": "...", "front": "What is an agent?", "back": "A ...", "hint": null, "tags": ["agents"] }
    ],
    "createdAt": "..."
  }
  ```

#### `DELETE /api/v1/tutor/studio/<kind>/:id` — Soft-delete

- **Roles:** `OWNER`, `ADMIN`, or owner
- **204** no body
- **Side effects:** `UPDATE ... SET deleted_at = NOW()`, emit `tutor.studio.<kind>.deleted`. Audio files in R2 are retained for 30 days (scheduled purge).

#### Roadmap generators — NOT implemented this build

The following Studio generators are listed for completeness but are **not** exposed as endpoints in this build. Calling them returns `501 NOT_IMPLEMENTED` with error code `TUTOR_GENERATOR_NOT_AVAILABLE`.

| Planned path | Generator | Status |
|---|---|---|
| `POST /api/v1/tutor/studio/slide-decks` | Slide Deck (BETA) | Roadmap |
| `POST /api/v1/tutor/studio/video-overviews` | Video Overview | Roadmap |
| `POST /api/v1/tutor/studio/mind-maps` | Mind Map | Roadmap |
| `POST /api/v1/tutor/studio/reports` | Reports | Roadmap |
| `POST /api/v1/tutor/studio/quizzes` | Quiz | Roadmap |
| `POST /api/v1/tutor/studio/infographics` | Infographic (BETA) | Roadmap |
| `POST /api/v1/tutor/studio/data-tables` | Data Table | Roadmap |
| `POST /api/v1/tutor/studio/notes` | Add Note | Roadmap |

### 6.8 Usage Counter

#### `GET /api/v1/tutor/me/usage`

Drives the `12/20 left` badge visible in the AI Tutor tab header.

- **Roles:** any authenticated
- **200 body:**
  ```json
  {
    "windowStartsAt": "2026-04-18T00:00:00.000Z",
    "windowEndsAt":   "2026-04-19T00:00:00.000Z",
    "tutorMessages":    { "used": 8,  "limit": 20 },
    "studioAudio":      { "used": 1,  "limit": 5 },
    "studioFlashcards": { "used": 2,  "limit": 10 }
  }
  ```

---

## 6.9 Resource Template (for any future resource)

> Reference shape — follow this for any new AI Tutor resource we add later.

### `GET /api/v1/tutor/<resource>` — List

- Query: `cursor?`, `limit?` (max 50, default 20), resource filters.
- 200 body: `{ items: Resource[], nextCursor: string | null }`

### `POST /api/v1/tutor/<resource>` — Create

- Body: `Create<Resource>Dto`
- 201 body: created resource
- Side effects: `LmsClient.checkLimits()` → write → `LmsClient.reportUsage()` → emit `tutor.<resource>.created`

### `PATCH /api/v1/tutor/<resource>/:id` — Partial update

- Body: `Update<Resource>Dto`
- 200 body: updated resource
- Side effect: emit `tutor.<resource>.updated`

### `DELETE /api/v1/tutor/<resource>/:id` — Soft-delete

- 204 no body
- Side effect: emit `tutor.<resource>.deleted`

---

## 7. WebSocket Contract — `/tutor` namespace

### Handshake

```
WS URL:     wss://tutor.skep.internal/tutor   (dev: ws://localhost:5094/tutor)
Auth:       handshake.auth.token = "<JWT>"  OR  Authorization: Bearer <JWT>
On invalid: disconnect immediately (no reason leak)
On valid:   socket.data.user = AuthenticatedUser;
            auto-join community:<communityCode>
```

### Rooms

| Room | Join rule |
|---|---|
| `community:<code>` | Auto on connect. |
| `community:<code>:session:<id>` | On `tutor:ask` for first time in a session — server joins you. |

Clients never emit raw room names; server decides membership from payload + JWT.

### Client → Server

#### `tutor:ask`

```ts
// payload
{
  requestId: string;       // client-generated UUID, echoed in ack + completion event
  sessionId: string;       // must belong to caller (or caller must be ADMIN/OWNER)
  prompt: string;          // max 8000 chars; class-validator enforces
}

// Socket.IO ack (immediate)
{
  success: true,
  data: { accepted: true, userMessageId: "..." },
  requestId: string,
}
// or
{
  success: false,
  error: { code: "TUTOR_SESSION_ENDED" | "TUTOR_MESSAGE_QUOTA_EXCEEDED" | ..., message: string },
  requestId: string,
}
```

Rate limit: **20 `tutor:ask` per user per minute** (default — override in settings).

### Server → Client

#### `tutor:token` — streaming token

```ts
{
  eventId: string,
  eventType: "tutor:token",
  communityCode: string,
  sessionId: string,
  requestId: string,        // matches the tutor:ask that started this stream
  token: string,            // single model token (text fragment)
  index: number,            // monotonic per stream
  occurredAt: string
}
```

#### `tutor:answer` — completed answer

```ts
{
  eventId: string,
  eventType: "tutor:answer",
  communityCode: string,
  sessionId: string,
  requestId: string,
  message: { id, role: "assistant", body, tokenCount, createdAt },
  occurredAt: string
}
```

#### `tutor:session` — session state change

```ts
{
  eventId: string,
  eventType: "tutor:session",
  communityCode: string,
  sessionId: string,
  status: "active" | "ended",
  occurredAt: string
}
```

### Error semantics on the socket

- Domain errors (quota exceeded, session ended) are returned via Socket.IO **ack**, not a separate event.
- Platform errors (invalid JWT, community suspended) disconnect the socket with no payload — client surface "please reconnect / re-login".

---

## 8. Error Code Registry

See `SKEP-DELTA.md §Error Code Naming`. Module-prefixed codes live here:

| Code | HTTP | When |
|---|---|---|
| `UNAUTHORIZED` | 401 | No/invalid JWT, bad issuer, expired |
| `FORBIDDEN` | 403 | Role check failed |
| `COMMUNITY_NOT_ENABLED` | 401 | `community_code` not active in registry |
| `NOT_FOUND` | 404 | Resource missing |
| `CONFLICT` | 409 | Uniqueness / idempotency conflict |
| `VALIDATION_FAILED` | 400 | DTO validation errors |
| `BAD_REQUEST` | 400 | Malformed payload |
| `RATE_LIMITED` | 429 | Throttler triggered |
| `INTERNAL_ERROR` | 500 | Unhandled exception |
| `TUTOR_SESSION_NOT_FOUND` | 404 | Session id not found in this community, or soft-deleted. |
| `TUTOR_MESSAGE_NOT_FOUND` | 404 | |
| `TUTOR_TRANSCRIPT_NOT_READY` | 404 | Session still `active`. |
| `TUTOR_SESSION_ENDED` | 409 | Write attempted on ended session. |
| `TUTOR_SESSION_QUOTA_EXCEEDED` | 403 | Community / user exceeded session quota. |
| `TUTOR_MESSAGE_QUOTA_EXCEEDED` | 403 | Daily message cap hit. |
| `TUTOR_AI_PROVIDER_UNAVAILABLE` | 502 | Upstream AI call failed after retries. |
| `TUTOR_MODERATION_BLOCKED` | 403 | Prompt blocked by moderation layer. |
| `TUTOR_LESSON_NOT_FOUND` | 404 | `lessonId` not in local mirror. |
| `TUTOR_STUDIO_JOB_NOT_FOUND` | 404 | Job id missing or belongs to another community. |
| `TUTOR_STUDIO_QUOTA_EXCEEDED` | 403 | Per-day studio generation cap hit. |
| `TUTOR_STUDIO_LANGUAGE_UNSUPPORTED` | 400 | Audio language code not in supported set. |
| `TUTOR_STUDIO_TTS_UNAVAILABLE` | 502 | TTS provider failed after retries. |
| `TUTOR_GENERATOR_NOT_AVAILABLE` | 501 | Roadmap generator (slide-decks, quizzes, etc.) not in this build. |

---

## 9. Shared Zod Schemas

Lives in `packages/shared/src/schemas/`. Imported by both apps.

```ts
// packages/shared/src/schemas/envelope.ts
import { z } from 'zod';

export const metaSchema = z.object({
  requestId: z.string().uuid(),
  timestamp: z.string().datetime(),
});

export const successEnvelope = <T extends z.ZodTypeAny>(data: T) =>
  z.object({ success: z.literal(true), data, meta: metaSchema });

export const errorEnvelope = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.unknown()).optional(),
  }),
  meta: metaSchema,
});

export const cursorPage = <T extends z.ZodTypeAny>(item: T) =>
  z.object({ items: z.array(item), nextCursor: z.string().nullable() });
```

### 9.1 Shared AI Tutor schemas

```
packages/shared/src/schemas/
├── envelope.ts
├── auth.ts                      # AuthenticatedUser
├── session.ts                   # SessionSchema, CreateSessionSchema, UpdateSessionSchema
├── message.ts                   # MessageSchema, SendMessageSchema
├── transcript.ts
├── settings.ts
├── lesson.ts                    # LessonSchema
├── usage.ts                     # UsageCounterSchema
└── studio/
    ├── job.ts                   # StudioJobSchema
    ├── audio-overview.ts        # AudioOverviewSchema, CreateAudioOverviewSchema, LanguageEnum
    └── flashcards.ts            # FlashcardDeckSchema, FlashcardSchema, CreateFlashcardDeckSchema
```

### 9.2 `Session`

```ts
export const sessionSchema = z.object({
  id: z.string().uuid(),
  topic: z.string().min(1).max(200),
  context: z.string().max(2000).nullable(),
  status: z.enum(['active', 'ended']),
  createdBy: z.string().uuid(),
  messageCount: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  endedAt: z.string().datetime().nullable(),
});

export const createSessionSchema = sessionSchema.pick({ topic: true, context: true })
  .partial({ context: true });

export const updateSessionSchema = z.object({
  topic: z.string().min(1).max(200).optional(),
  status: z.enum(['active', 'ended']).optional(),
});
```

### 9.3 `Message`

```ts
export const messageSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string().uuid(),
  role: z.enum(['user', 'assistant']),
  body: z.string(),
  tokenCount: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
});

export const sendMessageSchema = z.object({
  prompt: z.string().min(1).max(8000),
});
```

### 9.4 `Transcript`

```ts
export const transcriptSchema = z.object({
  sessionId: z.string().uuid(),
  generatedAt: z.string().datetime(),
  messageCount: z.number().int().nonnegative(),
  tokenCount: z.number().int().nonnegative(),
  content: z.string(),
});
```

### 9.5 `Settings`

```ts
export const settingsSchema = z.object({
  defaultModel: z.string(),
  systemPrompt: z.string().max(10000),
  maxTokensPerAnswer: z.number().int().min(128).max(8192),
  memberDailyMessageCap: z.number().int().min(0).max(10000),
  memberDailyAudioCap: z.number().int().min(0).max(1000).default(5),
  memberDailyFlashcardsCap: z.number().int().min(0).max(1000).default(10),
  moderationEnabled: z.boolean(),
});
```

### 9.6 `Lesson` (Course tab)

```ts
export const lessonSchema = z.object({
  id: z.string().uuid(),
  courseId: z.string().uuid(),
  title: z.string().max(300),
  summary: z.string().max(2000).nullable(),
  contentHash: z.string(),
  durationSec: z.number().int().nonnegative(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
```

### 9.7 Studio schemas

```ts
export const studioLanguageEnum = z.enum([
  'en-IN', 'hi-IN', 'bn-IN', 'gu-IN', 'kn-IN',
  'ml-IN', 'mr-IN', 'pa-IN', 'ta-IN', 'te-IN',
]);

export const studioJobSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['audio-overview', 'flashcards']),
  lessonId: z.string().uuid(),
  status: z.enum(['pending', 'running', 'completed', 'failed']),
  progress: z.number().min(0).max(1),
  input: z.record(z.unknown()),
  outputRef: z.string().uuid().nullable(),
  error: z.object({ code: z.string(), message: z.string() }).nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
});

export const audioOverviewSchema = z.object({
  id: z.string().uuid(),
  jobId: z.string().uuid(),
  lessonId: z.string().uuid(),
  language: studioLanguageEnum,
  audioUrl: z.string().url(),                 // signed, short-lived
  audioUrlExpiresAt: z.string().datetime(),
  transcript: z.string(),
  durationSec: z.number().int().nonnegative(),
  voiceStyle: z.enum(['narrator', 'conversational', 'friendly']),
  createdAt: z.string().datetime(),
});

export const createAudioOverviewSchema = z.object({
  lessonId: z.string().uuid(),
  language: studioLanguageEnum,
  voiceStyle: z.enum(['narrator', 'conversational', 'friendly']).default('narrator'),
});

export const flashcardSchema = z.object({
  id: z.string().uuid(),
  front: z.string().max(500),
  back: z.string().max(2000),
  hint: z.string().max(500).nullable(),
  tags: z.array(z.string()).max(10),
});

export const flashcardDeckSchema = z.object({
  id: z.string().uuid(),
  jobId: z.string().uuid(),
  lessonId: z.string().uuid(),
  title: z.string().max(300),
  difficulty: z.enum(['easy', 'medium', 'hard', 'mixed']),
  cardCount: z.number().int().nonnegative(),
  cards: z.array(flashcardSchema),
  createdAt: z.string().datetime(),
});

export const createFlashcardDeckSchema = z.object({
  lessonId: z.string().uuid(),
  count: z.number().int().min(5).max(50).default(10),
  difficulty: z.enum(['easy', 'medium', 'hard', 'mixed']).default('mixed'),
  tags: z.array(z.string()).max(10).optional(),
});
```

### 9.8 `UsageCounter`

```ts
export const usageBucketSchema = z.object({
  used: z.number().int().nonnegative(),
  limit: z.number().int().nonnegative(),
});

export const usageCounterSchema = z.object({
  windowStartsAt: z.string().datetime(),
  windowEndsAt: z.string().datetime(),
  tutorMessages:    usageBucketSchema,
  studioAudio:      usageBucketSchema,
  studioFlashcards: usageBucketSchema,
});
```

---

## 10. Versioning Policy

- Path-versioned: `/api/v1/...`.
- Breaking change → `/api/v2/...`; `v1` kept running until all clients migrate.
- Additive changes (new optional fields, new endpoints) ship inside the current major.
- Every breaking change logged in `logs/decisions/api-v<N>-breaking.md`.

---

## 11. Contract Tests (must exist before `/review` gate)

- Schema round-trip: every response is re-parsed by its shared Zod schema in tests.
- Auth negatives: missing, malformed, expired, wrong-issuer, wrong-community → expected codes.
- RBAC matrix: for each endpoint, each role → expected code (200 / 403).
- Tenant isolation: create in `COM_A`, read from `COM_B` → 404.
- Cursor pagination: drift test — insert rows mid-iteration, cursor remains stable.
