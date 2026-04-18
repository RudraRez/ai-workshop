# /plan — Planning Command

Run `/plan` in Claude Code to execute this sequence.

---

## Step 1 — Read All Inputs First

Read everything before generating a single line of plan:

```
project/BRIEF.md
project/REQUIREMENTS.md
project/CONVENTIONS.md
project/CONSTRAINTS.md
project/TECH-STACK.md
.claude/MEMORY.md
```

Plus any `.md`, `.pdf`, `.txt`, `.docx` files in `project/`.

If Figma link exists in BRIEF.md → read via Figma MCP.
If Obsidian MCP active → read relevant vault notes.

Do not start planning until all inputs are consumed.

---

## Step 2 — Gap Analysis

Produce this block after reading inputs:

```markdown
## Planning Gap Analysis

### Missing — Claude cannot plan without these
- [ ] {item} — needed to determine {what}

### Ambiguous — could be interpreted multiple ways
- [ ] {requirement} — interpretations: A) ... B) ...

### Assumptions — proceeding unless corrected
- [ ] {assumption} — if wrong, affects: {impact}

### Out-of-Scope Detected — mentioned but not in REQUIREMENTS.md
- [ ] {feature} — will not build
```

**Stop. Wait for your answers before proceeding.**
Log the Q&A to `logs/inputs/planning-gaps.md`.

---

## Step 3 — Write Planning Artifacts

### PLAN.md

```markdown
# Build Plan — {Product Name}

## Overview
{one paragraph — what will be built, in what order, by which teams}

## Phases

### Phase 0 — Foundation
**Team:** Architect → Backend Dev (sequential)
**Goal:** working monorepo, DB schema, base config
**Tasks:**
- 0.1 Initialize monorepo + config → logs/backend/0.1-monorepo.md
- 0.2 Database schema + migrations → logs/backend/0.2-schema.md
- 0.3 Base API scaffold + health check → logs/backend/0.3-api-scaffold.md

### Phase 1 — Auth & Session
**Team:** Backend Dev → Frontend Dev (sequential with handoff)
**Goal:** users can register, log in, stay logged in
**Handoff:** Backend Dev → Frontend Dev (auth API contract)
**Tasks:**
- 1.1 Auth API (register, login, refresh, me) → logs/backend/1.1-auth-api.md
- 1.2 Auth UI (login, register, session hook) → logs/frontend/1.2-auth-ui.md

### Phase 2 — {Core Feature Name}
**Team:** Architect + Backend Dev + Frontend Dev
**Goal:** {what ships}
**Tasks:**
- 2.1 ... → logs/backend/2.1-{slug}.md
- 2.2 ... → logs/frontend/2.2-{slug}.md

### Phase N — Quality Gate
**Team:** Reviewer (fresh instance) ‖ Tester (parallel)
**Goal:** all quality checks pass, no critical/high findings

### Phase N+1 — Ship
**Team:** DevOps only
**Goal:** live URL + PR merged
```

### MANIFEST.yaml

```yaml
product: {name}
version: 1.0.0
created: {ISO date}
stack:
  frontend: next.js-14-app-router
  backend: nestjs-10
  database: postgresql
  orm: typeorm

phases:
  - id: phase-0
    name: Foundation
    team: [architect, backend-dev]
    depends_on: []
    tasks:
      - id: "0.1"
        title: Initialize monorepo structure
        agent: architect
        log: logs/backend/0.1-monorepo.md
        skills: [workflow-ship-faster, git-workflow]
        status: pending
        depends_on: []

      - id: "0.2"
        title: Database schema + migrations
        agent: backend-dev
        log: logs/backend/0.2-schema.md
        skills: [workflow-ship-faster, backend-patterns, api-design]
        depends_on: ["0.1"]
        status: pending

  - id: phase-1
    name: Auth & Session
    team: [backend-dev, frontend-dev]
    depends_on: [phase-0]
    handoffs:
      - from: backend-dev
        to: frontend-dev
        trigger: after task "1.1"
        log: logs/decisions/handoff-auth-contract.md
    tasks:
      - id: "1.1"
        title: Auth API — register, login, refresh, me
        agent: backend-dev
        log: logs/backend/1.1-auth-api.md
        skills: [workflow-ship-faster, backend-patterns, security-review, tdd-workflow]
        depends_on: ["0.2"]
        status: pending

      - id: "1.2"
        title: Auth UI — login, register, session hook
        agent: frontend-dev
        log: logs/frontend/1.2-auth-ui.md
        skills: [workflow-ship-faster, ui-intelligence, frontend-patterns, tdd-workflow]
        depends_on: ["1.1"]
        status: pending
```

### ARCHITECTURE.md

Full technical document — not stubs. Sections:
- System ASCII diagram
- Data model + entity relationships
- API contract surface (all endpoints, method, path, auth, payload)
- Key technical decisions + rationale
- Security model
- Deployment topology

### DESIGN-SYSTEM.json

If Figma connected: extract from Figma frames.
If no Figma: generate from BRIEF.md + ui-intelligence defaults.

Must include `ui_intelligence_audit` block — if any check fails,
revise the tokens before proceeding.

```json
{
  "colors": {
    "primary": "#...",
    "background": "#...",
    "foreground": "#...",
    "muted": "#...",
    "destructive": "#...",
    "border": "#..."
  },
  "typography": { "fontFamily": "Inter", "baseSize": "16px" },
  "spacing": { "unit": 4 },
  "radius": { "sm": "4px", "md": "6px", "lg": "8px" },
  "shadows": { "default": "shadow-sm", "elevated": "shadow-md" },
  "ui_intelligence_audit": {
    "no_gradient_backgrounds": true,
    "no_glassmorphism": true,
    "border_radius_within_limits": true,
    "no_gradient_ctas": true,
    "overall": "pass"
  }
}
```

---

## Step 4 — Present for Approval

```
## Plan Ready — {Product Name}

Phases:      N
Tasks:       N
Agent teams: [list]
Handoffs:    N

Type /approve to begin execution or /revise [feedback] to adjust.
```

Stop. Do not execute until you type `/approve`.

---

## Step 5 — Log the Session

Write `logs/inputs/planning-session.md`:
- All questions asked + your answers
- All assumptions confirmed
- Final artifacts created (list with paths)
- Your approval timestamp
