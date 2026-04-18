---
name: team-orchestration
version: 1.0.0
category: execution
stack:
  - always
severity: hard
triggers:
  - "starting a phase"
  - "dispatching agents"
  - "/execute"
  - "beginning implementation"
  - "phase requires multiple domains"
description: >
  Use before dispatching any agent team. Defines file ownership, parallel
  dispatch rules, handoff ACK protocol, and the hard rule that no phase
  runs as a single generalist when a specialist team applies. Non-compliance
  blocks the phase from starting.
---

# Team Orchestration

**A generalist working alone produces median output.
A specialist team with explicit ownership produces exceptional output.**

---

## Why This Exists

A single Claude Code session working through a full-stack feature accumulates
context debt. By phase 3 it's simultaneously managing DB migrations, React
components, API contracts, and deployment — doing none of them as well as
a focused specialist with a clean context window.

Team orchestration assigns each domain to a specialist with explicit file
ownership, a focused context window, and formal handoff contracts between
agents — not assumed shared knowledge.

---

## When To Use

Every execution phase. No exceptions.

## When NOT To Use

- Single-file hotfixes with no cross-domain impact
- Documentation-only tasks
- Config changes touching only one domain

---

## Phase → Team Mapping

| Phase | Team | Pattern |
|---|---|---|
| Foundation | Architect → Backend Dev | Sequential |
| Auth + Session | Backend Dev → Frontend Dev | Sequential + handoff |
| Core Features | Architect + Backend Dev + Frontend Dev | Mixed |
| Billing | Billing Dev + Backend Dev | Sequential |
| Quality Gate | Reviewer (fresh) ‖ Tester | Parallel |
| Deploy | DevOps only | Solo |

---

## File Ownership — Hard Rule

```
Architect:    docs/ · project/ · root config files
Backend Dev:  apps/api/src/ · apps/api/test/
Frontend Dev: apps/web/src/ · apps/web/public/
Billing Dev:  apps/api/src/billing/ · apps/api/src/stripe/
Tester:       *.test.ts · *.spec.ts (read all, write own domain)
DevOps:       infra/ · .github/ · Dockerfile · docker-compose.yml
Reviewer:     read-only everything — writes only to logs/
```

**An agent that needs to modify a file outside its ownership must:**
1. Stop
2. Write a handoff request
3. Wait for the owning agent to make the change

---

## Handoff Protocol

### Sending Agent Writes:

```markdown
FROM: Backend Dev
TO:   Frontend Dev
TRIGGERED BY: Task 1.1 complete
LOG: logs/decisions/handoff-{slug}.md

CONTRACT:
  POST /api/auth/login  body: { email, password } → { user, token, refreshToken }
  GET  /api/auth/me     header: Authorization: Bearer {token} → { user }
  Token: JWT 15min access / 7d refresh httpOnly cookie
  Errors: { code, message, statusCode }

READ-ONLY for Frontend Dev:
  apps/api/src/auth/dto/
  apps/api/src/auth/entities/user.entity.ts

ACK_REQUIRED: yes
```

### Receiving Agent Writes ACK Before Starting:

```markdown
FROM: Frontend Dev
ACK_TIMESTAMP: {ISO}
UNDERSTOOD:
  - Login returns { user, token, refreshToken }
  - Bearer token 15min — store in memory not localStorage
  - Refresh at POST /api/auth/refresh
  - Errors { code, message, statusCode } — handle in fetch wrapper
STARTING: login page, register page, useAuthSession hook
```

**Only after ACK is written → dispatch receiving agent.**

---

## Parallel Dispatch Rules

Tasks with non-overlapping ownership run in parallel:
- Backend Dev (apps/api/) ‖ Frontend Dev (apps/web/)
- Reviewer (read-only) ‖ Tester (test files)

Never in parallel:
- Agents with overlapping file ownership
- Any agent + DevOps during deploy

---

## Anti-Patterns (Before / After)

```
❌ — generalist across full stack
Agent: "I'll build auth" → writes apps/api/ then apps/web/ in same session
Result: inconsistent patterns, blurred responsibility

✅ — specialist team
Backend Dev: auth API → handoff contract
Frontend Dev: reads ACK → auth UI
Result: clean separation, explicit interface
```

```
❌ — implied handoff
Frontend Dev: "let me look at the backend code to figure out the API"
Result: fragile — refactors break frontend assumptions silently

✅ — explicit contract
Backend Dev writes handoff with exact endpoint shapes
Frontend Dev ACKs and builds against the contract
```

```
❌ — same session reviews own work
Builder reviews own implementation
Result: blind spots are preserved

✅ — fresh Reviewer instance
New Claude Code session, zero context from build
Result: genuine adversarial review
```

---

## Self-Audit Block

```yaml
team_orchestration_audit:
  skill: team-orchestration
  phase: <phase name>
  team: [<agents>]
  file_ownership_respected: true
  handoffs_logged: true
  handoff_acks_received: true
  parallel_dispatch_used: true | false | n/a
  reviewer_fresh_instance: true | n/a
  all_tasks_have_logs: true
  overall: pass | fail
  violations: []
```

---

## Composition Rules

```
REQUIRES:   workflow-ship-faster (runs inside each dispatched agent)
SUGGESTS:   context-doctor       (MCP budget check before dispatch)
            continuous-learning  (MEMORY.md after each phase)
CONFLICTS:  (none)

Load order: team-orchestration → dispatch agents → each agent loads workflow-ship-faster
```
