# SKEP Integration Contract

> This file is read by `/plan` alongside BRIEF, REQUIREMENTS, CONSTRAINTS, and CONVENTIONS.
> It is the authoritative spec for how any SKEP module plugs into the main SKEP platform.
> Every rule here is non-negotiable. Constraints in this file override defaults elsewhere.
> To change any rule, update this file and re-run `/plan`.

---

## What This Module Is

This build is **one module** in the SKEP community SaaS platform. The main SKEP
platform already exists and owns user identity, billing, and community lifecycle.
This module is a **separate microservice** that trusts the main platform for
authentication and reports usage back to it.

The module runs at its own port, with its own database schema-per-community
isolation, and communicates with other SKEP modules through a shared Redis event
bus — never through direct HTTP calls.

---

## Authentication — Validate, Never Issue

The main SKEP platform issues JWTs through Keycloak. **This module must never
issue JWTs.** It validates them and extracts claims.

### JWT Payload Shape (from main SKEP)

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

### Validation Rules

| Check | Action on fail |
|---|---|
| Signature valid against `SKEP_JWT_SECRET` | 401 UNAUTHORIZED |
| `iss === "skep-api"` | 401 UNAUTHORIZED |
| Not expired | 401 UNAUTHORIZED |
| `type === "COMMUNITY"` | 401 UNAUTHORIZED |
| `community_code` present and active in `schema_registry` | 401 `COMMUNITY_NOT_ENABLED` |
| Required role in `roles` (per endpoint) | 403 FORBIDDEN |

### What the JWT Validator Produces

An `AuthenticatedUser` object attached to every request:

```typescript
interface AuthenticatedUser {
  userId: string;           // from sub
  keycloakUserId: string;   // from keycloak_user_id
  platformUserId: string;   // from platform_user_id
  communityCode: string;    // from community_code
  orgId: string;            // from org_id
  roles: string[];          // from roles
  schemaName: string;       // resolved from community_code
}
```

---

## Multi-Tenancy — Schema Per Community

Each SKEP community has its own PostgreSQL schema. Data never crosses between
schemas.

### Schema Registry

One shared table lives in the `public` schema:

```sql
CREATE TABLE public.schema_registry (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_code VARCHAR(50) NOT NULL UNIQUE,
  org_id         UUID NOT NULL,
  schema_name    VARCHAR(63) NOT NULL,
  display_name   VARCHAR(255),
  status         VARCHAR(20) NOT NULL DEFAULT 'active',
  metadata       JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

`schema_name` is derived from `community_code`: lowercased, alphanumeric +
underscore only, truncated to 63 chars (Postgres identifier limit).
Example: `COM96179941` → `com96179941`.

### Tenant Query Rules

- **Every query that touches tenant data MUST `SET search_path TO "<schema>", public` first.**
- `search_path` is set on the connection for the duration of the query and
  reset on release. No leakage between requests.
- The schema name must be validated against `schema_registry` before use.
- The schema name must match the regex `^[a-z0-9_]{1,63}$` before string
  interpolation (belt-and-braces against SQL injection via schema name).
- **No cross-schema joins. Ever.** If a requirement needs data from another
  community, push back — the requirement is wrong.

### Onboarding Webhook

When the main SKEP platform enables this module for a community, it POSTs to:

```
POST /platform/webhooks/community-onboarded
Headers: x-skep-signature: <HMAC-SHA256 of body using ONBOARDING_WEBHOOK_SECRET>
Body: { communityCode, orgId, displayName?, timestamp }
```

On receipt, the module must:

1. Verify the HMAC signature (timing-safe compare).
2. Reject if `|now - timestamp| > 5 minutes` (replay protection).
3. Be idempotent on duplicate delivery.
4. Insert into `public.schema_registry`.
5. `CREATE SCHEMA IF NOT EXISTS "<schema_name>"`.
6. Run all of this module's migrations inside the new schema.
7. Publish a `platform.community.onboarded` event to the event bus.

---

## Role-Based Access Control

Roles come from the JWT. Never look them up elsewhere. Never hardcode role
string comparisons scattered through controllers.

### Canonical Roles

| Role | Typical capabilities |
|---|---|
| `OWNER` | Full admin of the community, billing control |
| `ADMIN` | Configuration, moderation, user management |
| `MODERATOR` | Content moderation within the module |
| `MEMBER` | Standard authenticated user |
| `GUEST` | Read-only, limited features |

### Enforcement

Every controller endpoint declares allowed roles via a `@Roles([...])`
decorator. A request with no role intersection gets **403 FORBIDDEN** — no
silent degradation. A missing token gets **401 UNAUTHORIZED** at the guard
layer before the decorator runs.

---

## Inter-Module Communication — Event Bus Only

Modules must not call each other's REST endpoints. All cross-module
communication goes through a shared Redis event bus.

### Channel Naming

```
skep:events:<community_code>
```

### Event Envelope

```json
{
  "eventId": "uuid-v4",
  "eventType": "<module>.<entity>.<action>",
  "communityCode": "COM96179941",
  "actorUserId": "uuid-or-null",
  "occurredAt": "2026-04-18T10:15:00Z",
  "payload": { /* module-specific */ },
  "correlationId": "uuid-from-request-id"
}
```

### Event Type Naming

- All lowercase, dot-separated: `<module>.<entity>.<action>`.
- Examples: `chat.message.sent`, `forum.post.upvoted`, `tutor.session.ended`.
- Patterns use `*` for wildcards: `chat.*` matches any chat event.

### Subscription Rules

- Subscribers use Redis `PSUBSCRIBE` with `skep:events:*`.
- Pattern matching on `eventType` happens in the subscriber process.
- Handlers must be idempotent — events may be delivered more than once.
- Handlers must not throw back into the subscriber loop — catch and log.
- Heavy work must be offloaded to a queue; handlers stay under 100ms.

### The Campaigns Rule

The Campaigns & Notifications module is the **only** module that sends
push/email/SMS on behalf of the platform. Every other module emits domain
events describing what happened; Campaigns subscribes and decides what to
send. Do not send notifications directly from any other module.

---

## Shared Infrastructure

### Environment Variables (identical across all SKEP modules)

```
SKEP_JWT_SECRET=<shared with main SKEP>
SKEP_JWT_ISSUER=skep-api
DATABASE_URL=postgres://...
DATABASE_POOL_SIZE=20
REDIS_URL=redis://...
LMS_MODE=mock        # 'mock' for dev, 'http' for real Java LMS
LMS_BASE_URL=
ONBOARDING_WEBHOOK_SECRET=<shared with main SKEP>
MODULE_NAME=<chat|website|campaigns|tutor|forum>
MODULE_PORT=<per-module>
LOG_LEVEL=debug
CORS_ORIGINS=http://localhost:3000
```

### Module Port Assignments

| Module | Port |
|---|---|
| Chat | 5091 |
| Website Builder | 5092 |
| Campaigns & Notifications | 5093 |
| AI Tutor | 5094 |
| Forum | 5095 |

### LMS Client

A `LmsClient` interface exists with two implementations:

- `MockLmsClient` — in-memory, always allows, used in dev and tests.
- `HttpLmsClient` — calls the Java LMS over HTTP.

Selection is by `LMS_MODE` env var. Every module reports usage and checks
limits through this interface. **Do not block on the real LMS during the
hackathon.** Always default to `LMS_MODE=mock` locally.

### Logging

- Every request gets a `requestId` (from `x-request-id` header if valid UUID,
  else generated). The response sets `x-request-id` to the same value.
- `requestId` propagates into every log line via `AsyncLocalStorage`.
- `requestId` flows into every event envelope as `correlationId`.
- Never log JWTs, secrets, passwords, or full email/phone values.

---

## Response Envelope

Every HTTP response uses this envelope. Deviations break cross-module clients.

### Success

```json
{
  "success": true,
  "data": { /* payload */ },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-04-18T10:15:00.000Z"
  }
}
```

### Error

```json
{
  "success": false,
  "error": {
    "code": "MODULE_ERROR_CODE",
    "message": "Human-readable message",
    "details": { /* optional */ }
  },
  "meta": {
    "requestId": "uuid",
    "timestamp": "2026-04-18T10:15:00.000Z"
  }
}
```

### Error Codes

- `SCREAMING_SNAKE_CASE`.
- Prefixed with the module name: `CHAT_*`, `FORUM_*`, `TUTOR_*`.
- Shared codes (no prefix): `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`,
  `BAD_REQUEST`, `CONFLICT`, `INTERNAL_ERROR`, `COMMUNITY_NOT_ENABLED`.

---

## Database Conventions

### Table Prefixes (prevent name collisions across modules in the same schema)

| Module | Prefix | Example |
|---|---|---|
| Chat | `chat_` | `chat_rooms`, `chat_messages` |
| Website Builder | `web_` | `web_sites`, `web_pages` |
| Campaigns | `cmp_` / `notif_` | `cmp_campaigns`, `notif_deliveries` |
| AI Tutor | `tutor_` | `tutor_sessions`, `tutor_transcripts` |
| Forum | `forum_` | `forum_posts`, `forum_replies` |

### Column Conventions

Every table:

- Primary key: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`.
- Timestamps: `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`,
  `updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`.
- Soft delete: `deleted_at TIMESTAMPTZ` nullable. **Never hard-delete.**
- Foreign keys stay within the same schema.
- Index creation includes `WHERE deleted_at IS NULL` for active-row indexes.

---

## REST Conventions

### Base Paths

| Module | Base Path |
|---|---|
| Chat | `/api/v1/chat` |
| Website Builder | `/api/v1/website` |
| Campaigns & Notifications | `/api/v1/campaigns`, `/api/v1/notifications` |
| AI Tutor | `/api/v1/tutor` |
| Forum | `/api/v1/forum` |

### Methods and Status Codes

| Action | Method | Success status |
|---|---|---|
| List | GET | 200 |
| Read | GET | 200 |
| Create | POST | 201 |
| Full update | PUT | 200 |
| Partial update | PATCH | 200 |
| Soft-delete | DELETE | 204 (no body) |

### Pagination

Cursor-based only. Never offset. Response includes:

```json
{
  "items": [...],
  "nextCursor": "opaque-string-or-null"
}
```

---

## WebSocket Conventions

### Namespaces (one per module that needs real-time)

| Module | Namespace |
|---|---|
| Chat | `/chat` |
| AI Tutor | `/tutor` |
| Forum | `/forum` |

### Auth

JWT passed in `handshake.auth.token` or `Authorization: Bearer <token>` header.
A WebSocket guard validates the token on connection and attaches
`AuthenticatedUser` to `socket.data.user`. Invalid tokens disconnect the
socket immediately.

### Rooms

Every socket joins `community:<communityCode>` on connect. Module-specific
rooms use further scoping: `community:<code>:room:<id>` for chat rooms,
`community:<code>:forum:post:<id>` for forum post threads.

### Event Name Format

- Client → Server: `<module>:<action>` (e.g. `chat:send`, `forum:upvote`).
- Server → Client: `<module>:<noun>` (e.g. `chat:message`, `forum:reply`).

---

## The `@skep/platform-core` Package

A shared internal package implementing all of the above. During Phase 0 of
`/execute`, Claude Code must scaffold this package in `packages/platform-core/`
with the following exports:

| Export | Kind | Purpose |
|---|---|---|
| `PlatformCoreModule` | NestJS module | Root module, imported via `forRoot(opts)` |
| `JwtStrategy` | Passport strategy | Validates SKEP JWTs |
| `JwtAuthGuard` | Guard | Protects HTTP routes |
| `WsJwtGuard` | Guard | Protects Socket.IO handshakes |
| `RolesGuard` | Guard | Enforces `@Roles([...])` |
| `@Public()`, `@Roles()`, `@CurrentUser()`, `@TenantSchema()` | Decorators | Controller ergonomics |
| `SchemaManagerService` | Service | Resolves community_code → schema, caches, creates on onboarding |
| `TenantQueryService` | Service | `forSchema(name).query(sql, params)` — the only sanctioned way to query tenant data |
| `EventBusService` | Service | `publish(event)`, `subscribe(pattern, handler)` |
| `LmsClient` + `MockLmsClient` + `HttpLmsClient` | Interface + impls | Usage/limits against Java LMS |
| `HttpExceptionFilter` | Filter | Standardizes error envelope |
| `RequestIdInterceptor` | Interceptor | Request ID assignment + AsyncLocalStorage |
| `ResponseEnvelopeInterceptor` | Interceptor | Wraps responses in standard envelope |
| `HealthController` | Controller | `/health` and `/ready` |
| `OnboardingController` + `OnboardingService` | Controller + service | Handles community-onboarded webhook |
| `createTestJwt(opts)` | Test helper | Mints tokens for local tests |

When this package exists and is imported via `PlatformCoreModule.forRoot({
moduleName, tablePrefix, migrations, eventTypes })`, a module only writes its
domain code — controllers, services, DTOs, migrations, and WebSocket handlers.
Everything else is already wired.

---

## Hackathon Definition of Done

A module passes judging if all seven are true:

1. **Auth works.** Invalid JWT → 401. Expired JWT → 401. Wrong role → 403.
2. **Tenant isolation works.** User in `COM_A` cannot read `COM_B` data.
3. **RBAC works.** Two distinct roles produce different responses on the same endpoint.
4. **At least 3 domain events published** to the Redis bus.
5. **REST + WebSocket conventions followed.** Automated lint clean.
6. **Migrations apply to all 5 seeded community schemas** without manual intervention.
7. **Happy-path user journey demoable in the UI.**

---

## Anti-Patterns (instant deductions)

- Copy-pasting JWT parsing into the module instead of using `@skep/platform-core`.
- Querying another community's schema, even "just to test."
- Hardcoding role strings scattered through controllers — always `@Roles([...])`.
- Calling another module's REST API — emit events instead.
- Blocking on the real Java LMS — use the mock.
- Issuing JWTs from this module.
- Sending notifications from any module other than Campaigns.
- Committing secrets.
- Hard-deleting tenant data.
</content>