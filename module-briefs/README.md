# Module Briefs — SKEP 5-Module Hackathon

Each subfolder contains the three `project/*` files tailored for one team.
On Day 0, each team:

1. Clones this boilerplate repo.
2. Copies **their** subfolder's `BRIEF.md`, `REQUIREMENTS.md`, and
   `CONSTRAINTS.md` into `project/`, overwriting the generic templates.
3. Leaves `project/SKEP-INTEGRATION.md`, `project/SKEP-DELTA.md`,
   `project/CONVENTIONS.md`, and `project/TECH-STACK.md` alone — those apply
   to everyone.
4. Runs `claude` → `/plan` → reviews → `/approve` → `/execute`.

## Team assignments

| Team | Module | Folder | Port | Base path | Event prefix | Table prefix |
|---|---|---|---|---|---|---|
| Alpha | Chat (E2E encrypted) | `alpha-chat/` | 5091 | `/api/v1/chat` | `chat.*` | `chat_` |
| Bravo | Website Builder (AI-assisted) | `bravo-website/` | 5092 | `/api/v1/website` | `website.*` | `web_` |
| Charlie | Campaigns & Notifications | `charlie-campaigns/` | 5093 | `/api/v1/campaigns`, `/api/v1/notifications` | `campaign.*`, `notification.*` | `cmp_`, `notif_` |
| Delta | AI Tutor / Classroom | `delta-tutor/` | 5094 | `/api/v1/tutor` | `tutor.*` | `tutor_` |
| Echo | Forum | `echo-forum/` | 5095 | `/api/v1/forum` | `forum.*` | `forum_` |

## Files each team gets

- `BRIEF.md` — what you're building, for whom, why, what success looks like
- `REQUIREMENTS.md` — MoSCoW-formatted functional requirements for the MVP
- `CONSTRAINTS.md` — module-specific hard limits and scope locks

## Files that apply to all teams (already in `project/`)

| File | Purpose |
|---|---|
| `project/CONVENTIONS.md` | Generic Launchpad coding conventions |
| `project/TECH-STACK.md` | Locked SKEP tech stack |
| `project/SKEP-INTEGRATION.md` | The SKEP contract: auth, tenancy, events, API, WS |
| `project/SKEP-DELTA.md` | SKEP-specific constraint + convention additions |

## Precedence when rules conflict

Most specific wins:

1. Team's `project/CONSTRAINTS.md` (the file you copied in from your folder)
2. `project/SKEP-DELTA.md`
3. `project/SKEP-INTEGRATION.md`
4. `project/CONVENTIONS.md`
5. Generic skill defaults

## What's shared, what's yours

**Shared — do not rebuild:**
- JWT validation + auth guards + RBAC enforcement
- `community_code → schema_name` resolution
- Tenant-scoped query helper
- Redis event bus (publish + pattern-subscribe)
- LMS client (mock + http impls)
- Response envelope, request ID, health endpoints, error filter
- Community-onboarding webhook handler

All of the above live in `@skep/platform-core`, which `/execute` scaffolds
into `packages/platform-core/` during Phase 0 based on
`project/SKEP-INTEGRATION.md`.

**Yours — every team builds:**
- Domain model, schema, migrations
- Controllers, services, DTOs, validation
- WebSocket handlers (if the module needs real-time)
- Domain events (publishing)
- UI pages and components in `apps/web/app/modules/<your-module>/`
- Module-specific tests on top of the shared isolation test
</content>