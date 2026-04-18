# /execute — Team Orchestration Command

Run `/execute` or `/execute [phase-id]` to run this protocol.
Team orchestration is the default — never a single generalist when a team applies.

---

## Pre-Execution Checks

Before dispatching any agent, verify all:

```
1. MANIFEST.yaml exists and is valid
2. All depends_on phases are status: done
3. .claude/MEMORY.md has been read this session
4. context-doctor confirms MCP budget is within limits
5. Stage gate approved (/approve received for this phase)
```

If any check fails → stop, surface the blocker, log it to
`logs/decisions/execution-blocker-{slug}.md`.

---

## Dispatch Protocol

For each task in the phase:

```
1. CREATE LOG FILE — copy logs/LOG-TEMPLATE.md to task log path
   Set status: PENDING

2. CHECK DEPENDENCIES — all depends_on must be status: done

3. BUILD SCOPED DISPATCH PROMPT (not the full CLAUDE.md)
   - Agent role + product name
   - File ownership (what they can and cannot touch)
   - This specific task only (not other tasks)
   - Active skills for this task
   - Relevant artifacts only
   - Handoff contract if receiving from prior agent
   - Log file path to write to

4. DISPATCH → set log status: IN_PROGRESS

5. AGENT COMPLETES
   - Log updated with execution + skill audit blocks
   - Log status: DONE or BLOCKED or WAITING_INPUT

6. HANDOFF CHECK — if this task triggers a handoff, run handoff protocol

7. ADVANCE — next task or next phase
```

---

## Agent Scoped Prompts

Each agent gets a tight prompt — only what it needs:

**Architect:**
```
You are the Architect on {product}.
Scope: docs/ · project/ · root config files only.
Task: {task title + description from manifest}.
Skills: {list}.
Context: project/TECH-STACK.md, project/REQUIREMENTS.md.
Log: {log path} — write all steps there.
Do not touch apps/ — that is Backend Dev and Frontend Dev scope.
```

**Backend Dev:**
```
You are the Backend Dev on {product}.
Scope: apps/api/src/ and apps/api/test/ only.
Task: {task title + description from manifest}.
Skills: {list — always includes workflow-ship-faster, backend-patterns, tdd-workflow}.
Context: docs/ARCHITECTURE.md (data model + API contracts section).
Handoff received: {paste handoff block if applicable}.
Log: {log path} — write all steps, commands, decisions there.
Do not touch apps/web/ — that is Frontend Dev scope.
```

**Frontend Dev:**
```
You are the Frontend Dev on {product}.
Scope: apps/web/src/ and apps/web/public/ only.
Task: {task title + description from manifest}.
Skills: {list — always includes workflow-ship-faster, ui-intelligence, frontend-patterns, tdd-workflow}.
Context: project/DESIGN-SYSTEM.json, docs/ARCHITECTURE.md (API contracts only).
Handoff ACK confirmed: {paste ACK block}.
Log: {log path} — write all steps there.
ui-intelligence is severity: hard. Handoff BLOCKED until ui_audit passes.
Do not touch apps/api/ — that is Backend Dev scope.
```

**Billing Dev:**
```
You are the Billing Dev on {product}.
Scope: apps/api/src/billing/ and apps/api/src/stripe/ only.
Task: {task title + description from manifest}.
Skills: {list — always includes workflow-ship-faster, backend-patterns, security-review}.
Context: docs/ARCHITECTURE.md (billing section), project/REQUIREMENTS.md (billing requirements).
Log: {log path}.
```

**Reviewer (Quality Gate — always a fresh Claude Code instance):**
```
You are an independent code reviewer for {product}.
You have NO context from the build session. You see only the code.
Load skill: adversarial-review. Load skill: security-review.
Run both against the entire codebase.
Focus extra attention on: auth flows, payment flows, data mutations.
Write all findings to logs/decisions/quality-gate-report.md.
Severity: Critical or High → mark as BLOCKED.
Severity: Medium or Low → log only, do not block.
You may NOT write to apps/ — read only.
```

**Tester (runs parallel to Reviewer):**
```
You are the Tester for {product}.
Load skill: tdd-workflow.
Run the full test suite. Measure coverage per module.
If coverage < {threshold from CONSTRAINTS.md} → mark as BLOCKED.
Write results to logs/decisions/test-coverage-report.md.
```

**DevOps (Deploy phase — runs alone):**
```
You are DevOps for {product}.
Scope: infra/ · .github/ · Dockerfile · docker-compose.yml.
Task: production deploy.
Steps: build → push to GitHub → deploy web to Vercel → deploy api to Railway → smoke tests.
Log everything to logs/decisions/deployment.md.
No other agents active during this phase.
```

---

## Handoff Protocol

When a handoff is required (defined in MANIFEST.yaml):

### Sending agent writes to their log AND to the handoff log file:

```markdown
## Handoff Request

FROM: Backend Dev
TO:   Frontend Dev
TRIGGERED BY: Task 1.1 complete
LOG: logs/decisions/handoff-auth-contract.md

### Contract

**Endpoints:**
- POST /api/auth/register  body: { email, password, name } → { user, token, refreshToken }
- POST /api/auth/login     body: { email, password } → { user, token, refreshToken }
- POST /api/auth/refresh   body: { refreshToken } → { token, refreshToken }
- GET  /api/auth/me        header: Authorization: Bearer {token} → { user }

**Token:** JWT, 15min access / 7d refresh (httpOnly cookie)
**Errors:** { code: string, message: string, statusCode: number }

**Read-only files for Frontend Dev:**
- apps/api/src/auth/dto/ — request/response shapes
- apps/api/src/auth/entities/user.entity.ts — User type

ACK_REQUIRED: yes
```

### Receiving agent writes ACK before starting:

```markdown
## Handoff ACK

FROM: Frontend Dev
TIMESTAMP: {ISO}
UNDERSTOOD:
  - POST /api/auth/login returns { user, token, refreshToken }
  - Access token is Bearer 15min — will store in memory, not localStorage
  - Refresh via POST /api/auth/refresh — will implement in useAuthSession hook
  - Error shape { code, message, statusCode } — will handle in fetch wrapper

STARTING: login page, register page, useAuthSession hook, auth middleware
```

**Only after ACK is written → dispatch receiving agent.**

---

## Parallel Dispatch Rules

Tasks in same phase with non-overlapping file ownership run in parallel.

Allowed:
- Backend Dev (apps/api/) ‖ Frontend Dev (apps/web/)
- Reviewer (read-only) ‖ Tester (test files)

Never in parallel:
- Two agents with overlapping file ownership
- Any agent + DevOps during deploy phase
- Reviewer reviewing in-progress work

---

## Mid-Task Blocker

If an agent cannot continue without your input:

```
⏸ WAITING FOR INPUT
Task:    {task title}
Log:     {log path}
Status:  WAITING_INPUT

Question: {the specific question}
Context:  {why this matters}
Options:  A) ... B) ... C) ...

Type your answer to continue.
```

Agent logs your answer + timestamp under `## Your Input` in the task log, then resumes.

---

## Quality Gate Rules

Both Reviewer and Tester must report PASS before deploy proceeds.

| Finding | Action |
|---|---|
| Critical | BLOCK. Fix before anything else. |
| High | BLOCK. Fix before deploy. |
| Medium | LOG. Fix if time allows. Add to tech-debt.md. |
| Low | LOG only. |

---

## Deploy Checklist

```
[ ] Production build: apps/web (Next.js) — success
[ ] Production build: apps/api (NestJS) — success
[ ] TypeScript: 0 errors
[ ] Tests: all passing, coverage >= threshold
[ ] Push to GitHub — PR created
[ ] Deploy apps/web → Vercel
[ ] Deploy apps/api → Railway
[ ] Smoke tests against live URLs — pass
[ ] logs/decisions/deployment.md written
[ ] All open log files closed with DONE status
[ ] .claude/MEMORY.md updated with session learnings
```

---

## Execution Complete Output

```
## Build Complete — {Product Name}

Live (web):  {Vercel URL}
Live (api):  {Railway URL}
PR:          {GitHub link}

Phases:      N completed
Tasks:       N completed
Logs:        N files written
Coverage:    N%
Gate:        PASS

Type /logs to review the full audit trail.
```
