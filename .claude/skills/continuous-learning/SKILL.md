---
name: continuous-learning
version: 1.0.0
category: meta
stack:
  - always
severity: soft
triggers:
  - "session start"
  - "starting work"
  - "session end"
  - "task complete"
  - "wrapping up"
description: >
  Use at the START and END of every session. Loads prior decisions and
  patterns from MEMORY.md at start. Extracts and writes new learnings
  at end. Makes every subsequent session smarter than the last.
---

# Continuous Learning

**An agent that doesn't remember what worked is an agent that repeats mistakes.**

---

## Why This Exists

Claude Code's context window starts fresh every session. Every decision,
every pattern discovered, every bug fixed — gone. Without explicit memory,
the agent re-derives the same conclusions from scratch and makes the same
early mistakes in new contexts.

`MEMORY.md` is a structured append-only knowledge file that travels with the
project, making institutional knowledge explicit and persistent.

---

## Session Start Protocol

```
1. Read .claude/MEMORY.md — full file, do not skim
2. Read .claude/DECISIONS.md if it exists
3. Identify the 3 most relevant prior entries for today's work
4. Check if any prior pattern directly applies to the current task
5. Begin work
```

If MEMORY.md does not exist:
```
Create .claude/MEMORY.md with the template header.
State: "No prior memory found — starting fresh. MEMORY.md initialized."
```

---

## Session End Protocol

```
1. Review what was built or changed this session
2. Extract: decisions made, patterns used, mistakes caught, solutions found
3. Format each as a LEARNING entry (see format)
4. Append to MEMORY.md — never overwrite
5. Annotate any superseded entries: [SUPERSEDED by #N - date]
6. Commit alongside the work: "chore: update agent memory"
```

---

## MEMORY.md Format

```markdown
# Agent Memory
<!-- append-only · never delete · annotate superseded entries -->

## [#1] 2025-01-15 — Decision: Auth Strategy
Used NextAuth.js JWT. Considered Clerk but cost was a concern for early
stage. Session: 7 days sliding. Refresh: rotation enabled.
Files: apps/web/src/lib/auth.ts, apps/api/src/auth/

## [#2] 2025-01-15 — Pattern: Database Pagination
Cursor-based for all list endpoints. Offset causes drift on live data.
Cursor field: createdAt + id composite.
Helper: apps/api/src/common/pagination.ts

## [#3] 2025-01-16 — Mistake+Fix: TypeORM N+1
Was loading user.posts in a loop. Fixed with QueryBuilder + leftJoinAndSelect.
Rule: never access a relation inside a loop. Always join or eager-load.
File: apps/api/src/users/users.service.ts line 84
```

---

## Learning Categories

| Category | Use for |
|---|---|
| `Decision` | Architectural or tech choices made (and why) |
| `Pattern` | A reusable implementation pattern discovered |
| `Mistake+Fix` | A bug or wrong approach, and the correct solution |
| `Constraint` | A hard limit discovered (API rate limit, column max, etc.) |
| `Preference` | How this codebase prefers things done |
| `Warning` | A footgun to avoid in this specific project |
| `Performance` | A measured optimization or bottleneck found |

---

## What Qualifies as a Learning

Write an entry when:
- A decision was made between two reasonable alternatives
- An approach was tried and abandoned (capture why)
- A bug took > 15 minutes to find
- A third-party API behaved unexpectedly
- A type error revealed a missing interface
- A test revealed a missed edge case

Do NOT write for:
- Trivial implementation details (variable names)
- One-off debugging steps not reusable elsewhere
- Things already in official docs

---

## Self-Audit Block

```yaml
learning_audit:
  skill: continuous-learning
  session_type: start | end | task-complete
  memory_loaded: true | false
  entries_read: 0
  entries_written: 0
  relevant_patterns_applied: []
  learnings_captured: []
  memory_committed: true | false
```

---

## Composition Rules

```
REQUIRES:   (none)
SUGGESTS:   context-doctor (compact before loading MEMORY.md in long sessions)
CONFLICTS:  (none)
```
