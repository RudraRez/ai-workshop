# Autonomous Development with Claude Code
## A Comprehensive Guide for Existing Projects

> This guide covers how to retrofit an existing codebase for autonomous
> Claude Code development — including doc structure, skill design,
> developer-specific configuration, tooling, and the mental model shift
> required to make it work.

---

## Table of Contents

1. [The Mental Model Shift](#1-the-mental-model-shift)
2. [Onboarding an Existing Project](#2-onboarding-an-existing-project)
3. [The Document Hierarchy](#3-the-document-hierarchy)
4. [CLAUDE.md — The Single Most Important File](#4-claudemd--the-single-most-important-file)
5. [Skill Design for Your Team](#5-skill-design-for-your-team)
6. [Developer-Specific Configuration](#6-developer-specific-configuration)
7. [The Logging System](#7-the-logging-system)
8. [Essential Tooling Ecosystem](#8-essential-tooling-ecosystem)
9. [MCP Connections That Matter](#9-mcp-connections-that-matter)
10. [Context Management at Scale](#10-context-management-at-scale)
11. [Team Workflows](#11-team-workflows)
12. [Common Failure Modes](#12-common-failure-modes)
13. [Checklist: Is Your Project Ready?](#13-checklist-is-your-project-ready)

---

## 1. The Mental Model Shift

### From: "Claude helps me code"
### To: "Claude is a team member who reads the project docs"

The single biggest failure mode when using Claude Code on an existing project
is treating it like a smart autocomplete. You describe what you want in chat,
Claude does something, you correct it, you describe again. This produces median
output and exhausts your context window within an hour.

**The correct model:**

Claude Code is a new engineer joining your team. Before they write a line of
code, they need to read:
- What the project is and why it exists
- How the codebase is structured
- What the coding conventions are
- What they are and are not allowed to do
- What's already been decided and why
- What's currently broken or in progress

The difference between a productive Claude Code session and a frustrating one
is almost entirely determined by the quality of documentation Claude reads
at session start — not by the quality of your prompts.

**The investment:** 2–4 hours of documentation work upfront.
**The return:** Sessions where Claude works autonomously for 2–3 hours
without needing correction.

---

## 2. Onboarding an Existing Project

### Step 1: Audit What Exists

Before writing any docs, understand what's already there:

```bash
# In your project root, open Claude Code and ask:
claude

# Then type:
"Read the codebase structure and give me a gap analysis of what
documentation would be needed for you to work autonomously on this project.
What do you not know that you need to know?"
```

Claude will surface its blind spots. These become your documentation list.

### Step 2: The Minimum Viable Setup

You do not need to do everything at once. The minimum set that enables
autonomous work is:

```
.claude/
  CLAUDE.md          ← what this project is, how to work in it
  MEMORY.md          ← empty, Claude fills as it works
  skills/
    workflow-ship-faster/SKILL.md    ← always load this first
    continuous-learning/SKILL.md     ← session memory

project/ (or docs/ — wherever makes sense for your project)
  CODEBASE.md        ← folder structure + what lives where
  CONVENTIONS.md     ← naming, style, patterns already in use
  DECISIONS.md       ← key architectural decisions already made
```

Add the full stack (skills, agents, logs) incrementally as you need them.

### Step 3: The Codebase Archaeology Session

Run this once at the start. Takes 1–2 hours with Claude:

```
"I'm going to walk you through this codebase. After each area I explain,
I want you to write a section of CODEBASE.md that captures what you learned.
Let's start with the folder structure."
```

Walk Claude through:
1. Folder structure and what each area owns
2. How data flows through the system (request → response path)
3. The 3 most complex parts of the codebase
4. Current known issues and tech debt
5. What's been tried and abandoned (and why)

The resulting CODEBASE.md is worth more than any amount of inline comments.

### Step 4: Capture Existing Decisions

The most valuable documentation you can write is decisions that were already
made — especially ones where the alternative seems obvious but is wrong for
this project.

```markdown
# DECISIONS.md

## [#1] 2024-08-15 — Database: PostgreSQL over MongoDB
Used Postgres despite the document-heavy data model. Rationale: team expertise,
ACID guarantees for billing, TypeORM maturity. MongoDB was seriously evaluated
but rejected because of transaction complexity for order processing.
**Do not re-open this decision.**

## [#2] 2024-09-01 — Auth: Custom JWT over Auth0
Auth0 was used in v1 and removed in v2. Reasons: cost at scale, inability to
customize token claims, vendor lock-in risk. Current: Passport JWT with rotation.
**Auth0 must not be suggested again.**
```

Without this, Claude will re-suggest Auth0 on every auth-related task.

---

## 3. The Document Hierarchy

Not all docs are equal. Claude reads them with this priority:

```
Priority 1 (always read first):
  .claude/CLAUDE.md          — the master file, read every session

Priority 2 (read when relevant):
  project/CONVENTIONS.md     — before writing any code
  project/CONSTRAINTS.md     — before making any decision
  project/DECISIONS.md       — before suggesting architecture

Priority 3 (read per task):
  .claude/skills/{skill}/    — loaded before specific task types
  logs/decisions/            — context for the specific area being changed

Priority 4 (reference when needed):
  docs/ARCHITECTURE.md       — system diagrams, data models
  docs/SETUP.md              — how to run the project
  project/CODEBASE.md        — folder structure guide
```

### What Goes Where

| Document | Location | Updated by | Read when |
|---|---|---|---|
| Project identity + workflow | `.claude/CLAUDE.md` | You | Every session |
| Codebase map | `project/CODEBASE.md` | You + Claude | Before any task |
| Code conventions | `project/CONVENTIONS.md` | You | Before writing code |
| Hard limits | `project/CONSTRAINTS.md` | You | Before any decision |
| Architecture decisions | `project/DECISIONS.md` | Claude + you | Before suggesting changes |
| Tech stack | `project/TECH-STACK.md` | You | Before suggesting new deps |
| Cross-session memory | `.claude/MEMORY.md` | Claude only | Every session start |
| Task logs | `logs/{area}/{task}.md` | Claude | Per task |
| Skill rules | `.claude/skills/{name}/SKILL.md` | You | Per task type |

### The Update Rule

Documents in `project/` are **authored by you** and treated as ground truth.
Claude does not overwrite them — it reads them and asks if something needs updating.

Documents in `logs/` and `.claude/MEMORY.md` are **written by Claude**.
You can read them but should not edit them manually (edit via `/memory` command).

---

## 4. CLAUDE.md — The Single Most Important File

This is the one file Claude Code reads at the start of every session.
It must be dense, specific, and current. If it's vague, sessions will be vague.

### Required Sections

```markdown
# CLAUDE.md — {Project Name}

## What This Is
{2–3 sentences. Product name, what it does, who uses it.}

## What You Are
{The role Claude plays. Not "assistant" — an actual role.}
"You are a senior backend engineer on {project}. You know this codebase deeply.
You do not suggest libraries or patterns without checking what's already used."

## Critical Rules (read before doing anything)
- Never use `any` in TypeScript
- Never run DB migrations in production without explicit approval
- Never change the auth flow without flagging it as a security decision
- Always check DECISIONS.md before suggesting architectural changes
- {3–5 project-specific hard rules}

## How This Codebase Works
{Map of the key folders and their purpose. Not exhaustive — the 20%
that explains 80% of where things live.}

## Active Skills
{Table of skills and when to load them — same format as boilerplate}

## Current State of the Project
{What phase is the project in? What's in progress? What's broken?
This is the most valuable section for giving Claude orientation.}

## Definition of Done
{Your specific definition — tests, lint, types, log entry?}
```

### What NOT to Put in CLAUDE.md

- Entire API documentation (link to it, don't paste it)
- Database schemas (link to the migration files)
- Generic best practices Claude already knows
- Things that belong in CONVENTIONS.md

CLAUDE.md should be readable in under 3 minutes. If it takes longer,
Claude will lose key details in the middle.

### Keeping It Current

Add a maintenance rule: any time a significant decision is made that would
affect how Claude Code should work, update CLAUDE.md before ending the session.

---

## 5. Skill Design for Your Team

Skills are the most powerful lever for autonomous development. A well-written
skill changes how Claude behaves across every session without any prompting.

### Skills for an Existing Project — Different Priorities

For a new project, you design skills around what should be built.
For an existing project, you design skills around what must not break.

**Priority 1: Capture your existing patterns as skills**

```markdown
# skills/existing-patterns/SKILL.md
---
name: existing-patterns
severity: hard
triggers:
  - "new service"
  - "new module"
  - "new component"
description: >
  Use before creating any new module, service, or component. Enforces the
  patterns already established in this codebase — not generic best practices.
---

## The Patterns Already in This Codebase

### Service Layer
All services extend BaseService from src/common/base.service.ts.
Never create a service that doesn't extend BaseService.
[Read src/users/users.service.ts for the canonical example]

### Error Handling
All errors go through AppException from src/common/exceptions/app.exception.ts.
Never throw raw Error or HttpException directly.
[Read src/auth/auth.service.ts line 45 for the canonical example]
```

**Priority 2: Skills that protect production**

```markdown
# skills/production-safety/SKILL.md
---
name: production-safety
severity: hard
triggers:
  - "migration"
  - "schema change"
  - "environment variable"
  - "deploy"
  - "production"
description: >
  Use before any database migration, schema change, or production deployment.
  These require explicit human approval — Claude never executes them autonomously.
---

## What Requires Human Approval
- Any TypeORM migration: generate but never run automatically
- Any environment variable addition: add to .env.example and flag
- Any change to auth middleware or JWT configuration
- Any change to payment webhook handlers
- Any bulk data operation (UPDATE without WHERE clause)
```

**Priority 3: Skills that encode your team's taste**

```markdown
# skills/code-taste/SKILL.md
---
name: code-taste
severity: soft
triggers:
  - "before writing code"
  - "implementation"
description: >
  Encodes this team's aesthetic preferences — not rules, but defaults.
  When in doubt between two valid approaches, use what this skill says.
---

## This Team's Preferences
- Explicit over clever: long variable names over short ones
- Flat over nested: early returns, not deeply nested conditionals
- Boring over sophisticated: proven patterns over cutting-edge approaches
- Comments explain why, not what
- If it takes more than 2 reads to understand, rewrite it
```

### How Many Skills Is Right?

**Too few (< 3):** Claude relies on general knowledge, misses project specifics
**Just right (5–10):** Targeted rules that actually change behavior
**Too many (> 15):** Context budget consumed by skill loading, diminishing returns

For an existing project, start with 5:
1. `existing-patterns` — enforce what's already there
2. `production-safety` — protect live systems
3. `workflow-ship-faster` — execution discipline
4. `continuous-learning` — memory between sessions
5. One domain-specific skill for your project's core feature

### Skills Per Developer Role

Different roles need different skills loaded. Configure this in CLAUDE.md:

```markdown
## Skills by Task Type

| Task | Skills to Load |
|---|---|
| Backend feature | workflow-ship-faster · existing-patterns · backend-patterns |
| Frontend feature | workflow-ship-faster · ui-intelligence · existing-patterns |
| Bug fix | workflow-ship-faster · systematic-debugging · existing-patterns |
| Database work | workflow-ship-faster · production-safety · existing-patterns |
| Code review | adversarial-review · security-review |
| Refactoring | workflow-ship-faster · existing-patterns · adversarial-review |
```

### The Skill Audit Cycle

Review skills every 2 weeks:
- Did any skill fail to prevent a problem it should have caught? Strengthen it.
- Did any skill produce unnecessarily rigid output? Relax it.
- Did the team establish a new pattern worth capturing? Write a skill for it.
- Did a skill become irrelevant? Remove it — dead skills consume context.

---

## 6. Developer-Specific Configuration

### The Problem

Different developers have different working styles, knowledge levels, and
task focus areas. A senior engineer working on the auth system needs different
defaults than a junior engineer doing UI work.

### Solution: Role-Based CLAUDE.md Overlays

The main `.claude/CLAUDE.md` covers the project universally.
Role-specific overlays extend it:

```
.claude/
  CLAUDE.md                    ← everyone reads this
  roles/
    senior-backend.md          ← senior backend engineers
    frontend.md                ← frontend developers
    junior.md                  ← junior devs (extra guardrails)
    qa.md                      ← QA / testing focused sessions
```

**Example: junior.md overlay**

```markdown
# Junior Developer Overlay

Read CLAUDE.md first. This overlay adds extra guardrails.

## Additional Rules for Junior Sessions

### Before Making Any Change
Always read the existing implementation of similar functionality first.
Never be the first person to try a pattern in this codebase.
If in doubt about an approach, write it in the approach section of the log
and ask for confirmation before implementing.

### What Requires Senior Review
- Any change to src/auth/
- Any new TypeORM entity
- Any change to the CI/CD pipeline
- Any new environment variable

### Banned Operations (no exceptions)
- No production database queries
- No changes to package.json without asking
- No changes to docker-compose.yml
```

**Example: senior-backend.md overlay**

```markdown
# Senior Backend Overlay

Read CLAUDE.md first. This overlay grants expanded permissions.

## Expanded Permissions
- May generate (but not run) migrations autonomously
- May add new environment variables with documentation
- May refactor existing services when improvement is clear

## Additional Responsibilities
- After any structural change, update DECISIONS.md with rationale
- Flag any pattern introduced that differs from existing patterns
- Run adversarial-review before every PR
```

### Developer Knowledge Capture in MEMORY.md

When a developer works on a specific area, their learnings should go into
MEMORY.md under their name or their area:

```markdown
## [#12] 2025-01-20 — Warning: Payment Webhooks (Auth Team)
Stripe webhooks arrive out of order. The payment.succeeded event can arrive
before checkout.session.completed. The current handler (billing.service.ts line
234) handles this with a status machine — don't simplify it.
Author: Backend Dev session
```

This means the next developer (or next session) inherits that knowledge.

### Per-Developer Skill Customization

Some skills apply to everyone. Some should be per-developer:

```markdown
# .claude/skills/dev-overrides/SKILL.md
---
name: dev-overrides
severity: soft
description: >
  Developer-specific skill overrides. Load AFTER all other skills.
  Takes precedence over generic skill defaults.
---

## If Working in the Payments Module
- Load: skills/stripe-patterns
- Load: skills/production-safety (severity: hard)
- Ignore: skills/ui-intelligence (no UI in payments module)

## If Working on Public API
- Load: skills/api-versioning
- Load: skills/backwards-compatibility
- Extra rule: No breaking changes to v1 endpoints
```

---

## 7. The Logging System

### Why Logs Matter for Existing Projects

On a greenfield project, logs are a nice-to-have. On an existing project,
they are essential — because you're changing something that already works,
and you need to know exactly what changed and why when something breaks at 2am.

### Adapting the Log Format for Existing Code

The log format from the boilerplate works, but add one critical section
for existing codebases:

```markdown
## Impact Assessment
> What does this change affect beyond the immediate task?

### Downstream dependencies
- {file} imports from {changed file} — verified no breaking change
- {service} calls {changed endpoint} — contract preserved

### Database impact
- Migration required: yes / no
- Data migration required: yes / no
- Rollback plan: {describe}

### API contract impact
- External callers affected: yes / no
- If yes: {describe what changes and how consumers are notified}
```

### Log Naming for Existing Projects

Adapt naming to reflect the existing work type:

```
logs/
  features/         ← new feature development
    2025-01-20-add-team-invites.md
  bugs/             ← bug fixes
    2025-01-21-fix-pagination-drift.md
  refactors/        ← refactoring work
    2025-01-22-extract-auth-middleware.md
  migrations/       ← database changes
    2025-01-23-add-user-avatar-column.md
  decisions/        ← architectural decisions
    auth-strategy.md
    tech-debt.md
    handoff-auth-refactor.md
```

### The Decision Log — Most Valuable Artifact

Every significant decision made during Claude Code sessions should land here.
This prevents the most common problem: Claude re-litigating already-settled decisions.

```markdown
# logs/decisions/auth-strategy.md

## Decision: JWT Rotation Strategy

**Date:** 2025-01-15
**Context:** Session working on auth refresh endpoint

### What was decided
Refresh tokens rotate on every use. Old token invalidated immediately.
Race condition window: 5 seconds grace period for in-flight requests.

### Why (over alternatives)
- Option A (no rotation): stolen tokens live until expiry — REJECTED
- Option B (sliding window): too complex for current scale — DEFERRED
- Option C (rotation + grace) — CHOSEN

### DO NOT
- Remove the grace period without understanding the race condition
- Switch to stateless refresh without a blacklist strategy
```

---

## 8. Essential Tooling Ecosystem

### The Tools That Actually Change Outcomes

Not all tools are equal. Some fundamentally change what Claude can do.
Some are noise. Here's what matters, why, and exactly how to install each one.

---

### claude-mem — Automatic Session Memory (Most Impactful Tool)

**Repo:** https://github.com/thedotmack/claude-mem
**What it is:** A Claude Code **plugin** (not an MCP) that automatically
captures everything Claude does during a session, compresses it with AI,
and injects relevant context back into future sessions. Zero manual effort.

**The problem it solves:**

Without claude-mem, every Claude Code session starts completely blank.
Claude has zero memory of the auth bug you debugged yesterday, the
architectural decision you made last week, or the pattern you established
last month. You spend the first 10–15 minutes of every session re-explaining
context that was already established.

With claude-mem running, when you open a new session on the same project
Claude already knows what happened in previous sessions — the files touched,
decisions made, bugs fixed — compressed and injected automatically.

**How it actually works (important — this is not an MCP):**

claude-mem runs via 5 lifecycle hooks wired into Claude Code:

```
SessionStart     → queries SQLite DB, injects compressed context of recent work
UserPromptSubmit → logs your prompt
PostToolUse      → captures each tool call, sends to background worker (8ms avg)
                   Worker compresses raw output into ~500-token structured observation
                   using Claude Agent SDK (async — doesn't block the session)
Stop/SessionEnd  → generates session-level summary:
                   { request, investigated, learned, completed, next_steps }
```

The background worker runs at `http://localhost:37777` and handles all
AI compression asynchronously. If your session crashes mid-task, nothing
is lost — every observation up to the last tool call is already stored.

**Key capabilities:**

- **Automatic operation** — zero prompting required, runs silently in background
- **SQLite storage** at `~/.claude-mem/claude-mem.db` — survives across projects
- **Natural language search** via `mem-search` skill — query your project history
- **Web viewer** at `http://localhost:37777` — real-time observation stream
- **Semantic search** via ChromaDB — finds relevant past context, not just recent
- **Session summaries** — high-level map of what happened without loading every observation
- **28 languages supported**
- **Folder context files** — auto-generates CLAUDE.md summaries per project folder
- **Endless Mode (beta)** — compresses tool outputs in real-time for extended sessions

**Installation — critical: do NOT use npm install:**

```bash
# Inside a Claude Code session, run these two commands:
/plugin marketplace add thedotmack/claude-mem
/plugin install claude-mem

# Then restart Claude Code
# Context from previous sessions will appear automatically on next start
```

> **Why not `npm install -g claude-mem`?**
> That installs the SDK library only. It does NOT register the lifecycle
> hooks or start the background worker. Always use the `/plugin` commands above.

**Verify it's working:**

```bash
# Open the web viewer — if you see observations appearing after tool calls, it's working
open http://localhost:37777

# Check worker status
cd ~/.claude/plugins/marketplaces/thedotmack && npm run worker:status
```

**Configuration** at `~/.claude-mem/settings.json` (auto-created):

```json
{
  "model": "claude-sonnet-4-5",
  "workerPort": 37777,
  "dataDir": "~/.claude-mem",
  "logLevel": "info",
  "contextInjection": {
    "enabled": true,
    "maxObservations": 50,
    "semanticInject": false
  }
}
```

**How it relates to MEMORY.md:**

claude-mem and MEMORY.md serve different purposes and complement each other:

| | claude-mem | MEMORY.md |
|---|---|---|
| **Written by** | Automatically by the plugin | Claude at session end (manual) |
| **What it captures** | Everything — every tool call, observation, session summary | Curated decisions, patterns, warnings |
| **Granularity** | Fine-grained — every file read, every edit | Coarse — key learnings only |
| **Search** | Natural language via mem-search skill | grep / manual read |
| **Scope** | Global (all projects in SQLite DB) | Per-project (committed to repo) |
| **Token cost** | ~500 tokens per observation injected | Reads entire file at session start |
| **Best for** | "What did I do yesterday?" | "What did we decide about auth?" |

**Use them together:** claude-mem for automatic capture, MEMORY.md for the
important decisions you want Claude to explicitly prioritise.

**Practical workflow with claude-mem:**

```
Session 1: Debug the pagination bug, fix it, session ends
  → claude-mem captures: which files were read, what was changed, the fix

Session 2 (next day): Open Claude Code on same project
  → claude-mem injects: "Yesterday: investigated pagination drift in
    users.service.ts line 234. Fixed by switching from offset to cursor.
    Key file: src/common/pagination.ts"
  → Claude already knows this. You start from where you left off.
```

**Query past work with mem-search:**

```
"What have we done on the auth module?"
"When did we last touch the billing service?"
"What was the fix for the N+1 query?"
```

Claude searches the observation database and returns relevant context without
burning tokens loading every historical session.

---

### Context7 — Accurate Library Documentation

**What it does:** Pulls current, version-specific documentation for any library
directly into Claude's context. Instead of Claude using training data (which
may be wrong for your specific version), it reads the actual live docs.

**Why it matters:** Your project uses specific library versions. Claude's
training data has generic knowledge that may contradict what your version supports.
Context7 eliminates version mismatch errors entirely.

**Setup in `~/.claude/settings.json`:**
```json
{
  "mcpServers": {
    "context7": {
      "command": "npx",
      "args": ["-y", "@upstash/context7-mcp@latest"]
    }
  }
}
```

**Add to CLAUDE.md:**
```markdown
## Library Documentation
When working with any library, load current docs via Context7 before
implementing. This is mandatory, not optional.

Libraries to always check before implementing:
- TypeORM 0.3.x (migration API changed significantly from 0.2)
- NextAuth.js 4.x (many breaking changes from 3.x)
- NestJS 10 (lifecycle hooks changed from 9)
```

---

### Sequential Thinking MCP — For Complex Problems

**What it does:** Forces Claude through an explicit, visible reasoning chain
before producing output. Prevents the "confident and wrong" failure mode on
hard problems.

**When to use:**
- Bugs that have survived 2+ fix attempts
- Architectural decisions affecting 3+ existing systems
- Performance investigations with multiple interacting factors
- Any security-sensitive implementation

**Setup:**
```json
{
  "mcpServers": {
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    }
  }
}
```

---

### GitHub MCP — PR History as Context

**What it does:** Lets Claude read PR descriptions, review comments, and commit
history. The richest source of "why was this done" in any existing project.

**Why it matters:** The most important context isn't in the code — it's in
the PR that introduced that code. GitHub MCP makes this accessible.

**Add to CLAUDE.md:**
```markdown
## Using GitHub Context
Before refactoring any significant piece of code:
1. Check git log for when it was introduced
2. Find the PR via GitHub MCP
3. Read the PR description and review comments
4. This often contains rationale that isn't in the code itself

Never refactor code without understanding why it was written that way.
```

---

### Postgres MCP — Query Verification

**What it does:** Lets Claude run read-only queries against your development
database to verify data shapes, check index usage, and validate assumptions.

**Critical safety rule** (add to CLAUDE.md):
```markdown
## Database MCP Rules
- READ-ONLY only: SELECT, EXPLAIN, \d tablename
- Never INSERT, UPDATE, DELETE, DROP, CREATE via MCP
- Never connect to production — development DB only
- Always EXPLAIN ANALYZE before implementing a new query
- Query > 100ms in dev = not acceptable in prod
```

---

### Sentry MCP — Real Bug Context

**What it does:** Pulls actual production errors into Claude's context.
Instead of debugging from a description, Claude debugs from real stack
traces with real frequency data.

**How to use:**
```
"There's a bug in checkout. Pull the last 10 Sentry errors for
the checkout.session_completed webhook and debug from those."
```

---

### Filesystem MCP — Use It for Archaeology

Most developers have Filesystem MCP but use it only for reading and writing files.
The bigger value is codebase exploration before writing anything.

**Add to CLAUDE.md:**
```markdown
## How to Explore This Codebase
Before implementing any feature, read:
1. The most similar existing feature (not just the destination file)
2. The tests for that similar feature (understanding intent)
3. The migration history for the affected table (understanding evolution)

Use Filesystem to find these — don't guess.
```

---

## 9. MCP Connections That Matter

### The Budget Rule (Non-Negotiable)

**< 10 MCPs active per session. < 80 tools total.**

Above 80 tools, Claude's effective context window shrinks from 200k to ~70k.
You lose 65% of working memory by over-connecting.

Note: claude-mem is a plugin, not an MCP — it doesn't count against this budget.

### Recommended Configuration by Task Type

```json
// .claude/mcp-profiles.json (reference doc — not read automatically by Claude)
{
  "backend-feature": {
    "always-active": ["filesystem"],
    "load-for-task": ["postgres-dev", "context7", "github"],
    "approximate-tool-count": 20
  },
  "frontend-feature": {
    "always-active": ["filesystem"],
    "load-for-task": ["context7", "figma"],
    "approximate-tool-count": 15
  },
  "debugging": {
    "always-active": ["filesystem"],
    "load-for-task": ["postgres-dev", "sentry", "github", "sequential-thinking"],
    "approximate-tool-count": 25
  },
  "code-review": {
    "always-active": ["filesystem"],
    "load-for-task": ["github"],
    "approximate-tool-count": 10
  }
}
```

---

## 10. Context Management at Scale

### The Degradation Problem

Context degradation is the #1 cause of Claude Code going wrong on existing
projects. You work for 90 minutes, and now Claude is making decisions that
contradict things it knew at the start. It hasn't failed — it's simply forgotten.

**claude-mem partially solves this** across sessions (previous session knowledge
is injected automatically). But within a long session, context still fills up.

### Warning Signs

- Claude suggests something you already discussed and rejected
- Claude asks a question you answered 20 minutes ago
- Claude introduces a pattern inconsistent with existing code
- Code quality visibly degrades mid-session
- Claude stops referencing skill rules it was following earlier

### Prevention

**Add to CLAUDE.md:**
```markdown
## Context Health Rules

### Compact triggers (run /compact when any is true)
- Session running > 60 minutes
- Read > 8 large files (> 200 lines each)
- 3+ back-and-forth correction cycles
- Notice inconsistency with earlier decisions

### Before compacting
1. Write pending learnings to .claude/MEMORY.md
2. Update current task log status
3. Run /compact
4. Re-read CLAUDE.md and MEMORY.md after compaction
5. claude-mem will re-inject recent session context automatically

### Range-read discipline
- Files < 100 lines: read in full
- Files 100–500 lines: read the relevant section only
- Files > 500 lines: always use range reads
```

---

## 11. Team Workflows

### Session Handoffs Between Developers

Before ending any session another developer will continue:

```markdown
# logs/handoffs/2025-01-20-auth-refactor.md

## Session Handoff

**From:** Debraj
**Date:** 2025-01-20T18:00:00Z

### Accomplished
- JWT refresh rotation in auth.service.ts
- Redis token blacklist (src/cache/token-blacklist.service.ts)
- Tests: happy path, expired token, blacklisted token

### In Progress — resume, don't restart
- Integration test for grace period race condition
- File: apps/api/src/auth/auth.service.spec.ts line 234

### Decisions Made
- Grace period: 5 seconds (not 30 — see DECISIONS.md)
- Redis TTL: 15 minutes (matches access token expiry)

### Watch Out For
- Blacklist check happens before token decode — order matters

### claude-mem Note
All observations from this session are in the DB.
New session will auto-inject this context on SessionStart.
```

### The Weekly Pattern Capture

Once a week:

```
"Review .claude/MEMORY.md and the logs from this week.
Extract any patterns worth turning into permanent skills.
Write the skill file for the most valuable pattern found."
```

This is how your skill library grows from real work.

### Code Review with Claude

```markdown
# .claude/skills/code-review/SKILL.md
---
name: code-review
severity: soft
triggers:
  - "review this"
  - "PR review"
  - "before merging"
---

## 3-Pass Review Process

### Pass 1: Correctness
Does it do what the PR says? Edge cases? Errors? Types?

### Pass 2: Security (load adversarial-review)
Malicious inputs? Auth in right place? Sensitive data protected?

### Pass 3: Consistency
Matches existing patterns? Matches CONVENTIONS.md?
Will a new developer understand this without context?

## Output Format
CRITICAL (must fix): ...
HIGH (should fix): ...
MEDIUM (consider): ...
LOW (optional): ...
POSITIVE (well done): ...
```

---

## 12. Common Failure Modes

### Failure Mode 1: The Confident Wrong Answer

**Symptom:** Claude implements something completely and confidently, and it's
subtly wrong in a way that takes 30 minutes to debug.

**Root cause:** Training data for this library version is outdated or generic.

**Fix:** Mandatory Context7 for any non-trivial library implementation.
Add to CLAUDE.md: "Verify against actual docs via Context7, not training data."

---

### Failure Mode 2: The Scope Creep Refactor

**Symptom:** Claude fixes a bug AND refactors surrounding code, breaking 3 things.

**Root cause:** No scope lock in place.

**Fix:** Add to workflow-ship-faster skill:
```
Fix the bug. Do not refactor adjacent code. Log refactoring opportunities
to tech-debt.md and keep moving. "While I'm here" is not a valid reason.
```

---

### Failure Mode 3: The Pattern Drift

**Symptom:** After 2 weeks of Claude Code work, the codebase has 3 ways of
doing the same thing.

**Root cause:** No `existing-patterns` skill.

**Fix:** Write `existing-patterns` immediately. Reference real files, real line
numbers, real examples from the codebase — not generic rules.

---

### Failure Mode 4: The Decision Amnesia

**Symptom:** Claude recommends Auth0. You say no. Next week, Claude recommends
Auth0 again. (claude-mem helps with this but only across sessions on the same
machine — DECISIONS.md is the team-wide, version-controlled fix.)

**Fix:** Every significant "no" into DECISIONS.md: what, why, "DO NOT RE-OPEN."

---

### Failure Mode 5: Invisible Context Loss

**Symptom:** Output quality degrades gradually mid-session.

**Root cause:** Context overflow, happening silently.

**Fix:** 60-minute timer. When it fires: write MEMORY.md, update task log,
/compact, reorient. claude-mem re-injects recent context automatically after
compaction.

---

### Failure Mode 6: claude-mem Not Actually Running

**Symptom:** Sessions still start from blank despite installing claude-mem.

**Root cause:** Installed via `npm install -g` instead of `/plugin` commands,
or the background worker is down.

**Fix:**
```bash
# Verify installation
open http://localhost:37777
# If no web viewer → worker is not running

# Check worker status
cd ~/.claude/plugins/marketplaces/thedotmack && npm run worker:status

# Restart worker if needed
npm run worker:restart

# Reinstall correctly if needed (inside Claude Code session):
/plugin marketplace add thedotmack/claude-mem
/plugin install claude-mem
```

---

## 13. Checklist: Is Your Project Ready?

### Minimum Viable Setup
- [ ] `.claude/CLAUDE.md` — project identity, critical rules, skill table
- [ ] `.claude/MEMORY.md` — exists (even if empty)
- [ ] `project/CONVENTIONS.md` — naming, style, existing patterns
- [ ] `project/DECISIONS.md` — key decisions already made
- [ ] `skills/workflow-ship-faster/SKILL.md`
- [ ] `skills/existing-patterns/SKILL.md` — your codebase's patterns
- [ ] `skills/continuous-learning/SKILL.md`
- [ ] **claude-mem installed** via `/plugin` commands (not npm)

### Full Autonomous Setup
- [ ] All minimum viable items above
- [ ] `project/CODEBASE.md` — folder map with file ownership
- [ ] `project/CONSTRAINTS.md` — hard limits, what requires approval
- [ ] `project/TECH-STACK.md` — confirmed tech with version numbers
- [ ] `skills/production-safety/SKILL.md`
- [ ] `skills/adversarial-review/SKILL.md`
- [ ] `logs/` directory with per-task logging
- [ ] `logs/decisions/tech-debt.md` — existing debt catalogued

### Tooling
- [ ] claude-mem plugin installed and worker running (verify at localhost:37777)
- [ ] Context7 MCP connected
- [ ] Filesystem MCP connected
- [ ] GitHub MCP connected
- [ ] Database MCP connected (read-only, dev only)
- [ ] Sequential thinking MCP (for hard debugging)
- [ ] MCP budget: < 50 tools active (claude-mem doesn't count)

### Team Practices
- [ ] Handoff log format established and used
- [ ] Weekly pattern capture session scheduled
- [ ] MEMORY.md written at session end
- [ ] DECISIONS.md updated when a significant "no" is said
- [ ] /compact triggered at 60 minutes or on degradation signs
- [ ] claude-mem web viewer checked weekly (localhost:37777)

---

## Quick Reference: Session Start Ritual

Every Claude Code session on an existing project:

```
1. Open Claude Code — claude-mem auto-injects prior session context
   → CLAUDE.md auto-read

2. Type: "What do you know about this project from previous sessions?
   Summarise the 3 most relevant things for today's task: [task description]"
   → Tests that claude-mem is injecting correctly

3. Load MCPs for today's task type (see mcp-profiles.json)

4. "Load skill: [relevant skill]. What constraints apply to this task?"

5. Describe the task

6. Claude creates the log file, writes the approach → you review

7. Claude works. You review at stage gates.

8. Before ending: "Write session learnings to MEMORY.md"
   → claude-mem has already captured the observations automatically
```

The combination of claude-mem (automatic observation capture) + MEMORY.md
(curated key decisions) + DECISIONS.md (version-controlled team knowledge)
eliminates the blank-slate problem completely.

---

## Tool Summary

| Tool | Type | Install | What It Solves |
|---|---|---|---|
| **claude-mem** | Claude Code Plugin | `/plugin install` inside Claude Code | Session memory — automatic context across sessions |
| **Context7** | MCP | `~/.claude/settings.json` | Version-accurate library docs |
| **Sequential Thinking** | MCP | `~/.claude/settings.json` | Complex reasoning without confident wrong answers |
| **GitHub MCP** | MCP | `~/.claude/settings.json` | PR history — "why was this written this way" |
| **Postgres MCP** | MCP | `~/.claude/settings.json` | Query verification against real dev data |
| **Sentry MCP** | MCP | `~/.claude/settings.json` | Real production errors instead of descriptions |
| **Filesystem MCP** | MCP | `~/.claude/settings.json` (often default) | File read/write + codebase exploration |

---

*Last updated: April 2026*
*Applies to: Claude Code, Claude 4.x, MCP protocol v1*
*claude-mem version referenced: latest (https://github.com/thedotmack/claude-mem)*
