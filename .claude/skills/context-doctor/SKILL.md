---
name: context-doctor
version: 1.0.0
category: meta
stack:
  - always
severity: soft
triggers:
  - "context is getting long"
  - "large codebase"
  - "many files open"
  - "session has been going a while"
  - "running low on context"
description: >
  Use when session exceeds 45 minutes or when starting on a large codebase.
  Diagnoses context health, enforces the MCP budget rule, promotes range
  reads over full-file reads, and triggers compaction before silent
  degradation begins. A full context window doesn't crash — it quietly
  gets dumber.
---

# Context Doctor

**A full context window doesn't crash — it quietly gets dumber. That's worse.**

---

## Why This Exists

When Claude Code's context window approaches capacity it doesn't error.
It silently begins forgetting earlier content. The agent continues working,
appears functional, but operates on a truncated view. The bugs it introduces
are subtle. The decisions it makes contradict earlier ones it can no longer see.

200k tokens sounds large. It isn't once you factor in:
- Large files read in full
- Long conversation history
- MCP tool responses (each consumes tokens)
- Multiple agent configs loaded
- Test output printed in full

The MCP budget rule: at 80+ tools active, effective context shrinks from 200k to ~70k.

---

## When To Use

```
Session > 45 minutes? ─────────────────► CHECK CONTEXT HEALTH
Reading a file > 300 lines? ───────────► USE RANGE READS
> 8 MCP tools active for one agent? ──► AUDIT MCP BUDGET
Re-deriving something you already did? ► COMPACT NOW
MEMORY.md > 200 lines? ────────────────► SUMMARIZE TO DECISIONS.md
```

---

## MCP Budget Rules

**Hard limits:**
- < 10 tools per agent
- < 80 tools total active across all agents

**Per-agent budget:**
```
Architect:    filesystem · Figma · Obsidian          (3 tools)
Backend Dev:  filesystem · Postgres MCP              (2 tools)
Frontend Dev: filesystem · Pencil MCP                (2 tools)
Billing Dev:  filesystem                             (1 tool)
Tester:       filesystem                             (1 tool)
DevOps:       filesystem · GitHub · Vercel · Railway (4 tools)
Reviewer:     filesystem                             (1 tool)
```

Never load all MCPs for all agents simultaneously.

---

## File Reading Discipline

```
Rule: Never read a full file when you only need part of it.

Before: Read entire users.service.ts (600 lines) to find one method
After:  Read lines 45-80 using view_range

Pattern for unknown file:
1. Read first 50 lines (imports + class declaration)
2. Search for the specific function name
3. Read ±20 lines around the match

Config files < 100 lines: read in full
Config files > 100 lines: search for the specific key
```

---

## Compaction Triggers

Compact when ANY of these are true:
- Read > 10 files this session
- Seen > 5 full test output blocks
- Had the same concept explained > 2 times
- Session produced > 3 complete implementations

**How to compact:**
1. Write any pending decisions to MEMORY.md
2. Run Claude Code's `/compact`
3. Re-read MEMORY.md after compaction to restore context

---

## Self-Audit Block

```yaml
context_audit:
  skill: context-doctor
  mcp_tools_active: 0
  mcp_budget_ok: true
  session_duration_minutes: 0
  files_read_this_session: 0
  large_files_used_range_reads: true
  compaction_recommended: false
  memory_md_lines: 0
```

---

## Composition Rules

```
REQUIRES:   (none)
SUGGESTS:   continuous-learning (write MEMORY.md before compacting)
CONFLICTS:  (none)

Run BEFORE loading continuous-learning if session is long.
```
