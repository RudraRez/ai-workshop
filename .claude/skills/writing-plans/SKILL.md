---
name: writing-plans
version: 1.0.0
category: planning
stack:
  - always
severity: soft
triggers:
  - "break this into tasks"
  - "plan the implementation"
  - "how should we approach"
  - "write a plan"
  - "task breakdown"
description: >
  Use when breaking work into tasks before execution. Produces implementation
  plans with exact file paths, clear ownership, and 2-5 minute task granularity.
  Tasks written at the right size: specific enough for a specialist agent to
  execute without clarification, small enough to commit atomically.
---

# Writing Plans

**A plan is only as good as its smallest task. Vague tasks produce vague code.**

---

## Task Granularity Rule

```
One task = one atomic commit.
If you can't write the commit message in one conventional commit line,
the task is too large — split it.

Too large:  "Build auth system"
Too small:  "Add the import statement"
Just right: "Auth API — POST /auth/login endpoint with JWT generation"
```

---

## Task Format

Every task in a plan must include:

```markdown
### Task {phase}.{seq} — {Title}

**Agent:** {who executes this}
**Depends on:** {task IDs or none}
**Log:** {logs/area/phase.seq-slug.md}
**Skills:** {comma-separated}
**Est. time:** {2-5 min typical, flag if > 10min}

**What to build:**
{2-4 sentences. Specific. File paths included.}

**Acceptance criteria:**
- [ ] {specific, verifiable outcome}
- [ ] {specific, verifiable outcome}
- [ ] Tests written and passing

**Known risks:**
- {anything that might block this task}
```

---

## Plan Structure

```markdown
# Implementation Plan — {Feature or Product Name}

## Overview
{1 paragraph — what will be built, in what order, by whom}

## Phases

### Phase 0 — Foundation
**Team:** Architect → Backend Dev
**Goal:** runnable project skeleton

Tasks:
- 0.1 Initialize pnpm monorepo + workspace config
- 0.2 NestJS API scaffold with health check endpoint
- 0.3 PostgreSQL TypeORM connection + base entity
- 0.4 Next.js App Router web app scaffold
- 0.5 Docker Compose for local dev (Postgres + Redis)

### Phase 1 — Auth
**Team:** Backend Dev → Frontend Dev (handoff after 1.2)
**Goal:** users can register, log in, stay logged in

Tasks:
- 1.1 User entity + migration
- 1.2 Auth API: register, login, refresh, me endpoints
- 1.3 Frontend: auth context + useAuthSession hook
- 1.4 Frontend: login page + register page
- 1.5 Frontend: protected route middleware

### Phase 2 — {Core Feature}
...
```

---

## What a Good Task Looks Like

```markdown
### Task 1.2 — Auth API: register, login, refresh, me endpoints

**Agent:** Backend Dev
**Depends on:** 1.1 (User entity)
**Log:** logs/backend/1.2-auth-api.md
**Skills:** workflow-ship-faster, backend-patterns, security-review, tdd-workflow

**What to build:**
Four endpoints in apps/api/src/auth/:
- POST /api/v1/auth/register — creates user, returns { user, token, refreshToken }
- POST /api/v1/auth/login — validates credentials, returns same shape
- POST /api/v1/auth/refresh — rotates refresh token, returns new pair
- GET  /api/v1/auth/me — returns authenticated user from token

JWT: 15min access token, 7d refresh token stored as bcrypt hash in users table.
Passport JWT strategy. Auth guard reusable for all future protected routes.

**Acceptance criteria:**
- [ ] All 4 endpoints return correct shapes per API contract
- [ ] Passwords hashed with bcrypt (cost 12)
- [ ] Refresh token rotation: old token invalidated on use
- [ ] 401 on invalid credentials, 409 on duplicate email
- [ ] Unit tests for AuthService: all paths covered
- [ ] Integration test for each endpoint

**Known risks:**
- Token invalidation requires a blacklist or short expiry — confirm approach
```

---

## Anti-Patterns in Plans

```
❌ — tasks too large
"Build the entire auth system" (1 task)

✅ — right size
"User entity + migration" (0.5 min)
"Auth service: password hashing + JWT generation" (2 min)
"Auth controller: register + login endpoints" (2 min)
"Auth controller: refresh + me endpoints" (1 min)
"Auth tests: all service methods" (3 min)
```

```
❌ — missing acceptance criteria
"Add pagination to users list"

✅ — specific acceptance criteria
"Add cursor-based pagination to GET /users
  - [ ] Accepts ?cursor= and ?limit= query params
  - [ ] limit defaults to 20, max 100
  - [ ] Returns { data, meta: { nextCursor, hasMore } }
  - [ ] Tests: first page, second page, last page, empty results"
```

---

## Self-Audit Block

```yaml
writing_plans_audit:
  skill: writing-plans
  tasks_are_atomic: true
  tasks_have_acceptance_criteria: true
  tasks_have_agent_assignments: true
  tasks_have_log_paths: true
  tasks_have_skill_assignments: true
  dependencies_explicit: true
  handoffs_identified: true
  overall: plan_ready | needs_revision
```
