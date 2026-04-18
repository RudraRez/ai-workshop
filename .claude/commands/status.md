# /status — Project Status Command

Run `/status` at any time to get a full picture of where things stand.

---

## What to Output

```markdown
## Project Status — {Product Name}

**Current Stage:** {stage name and number}
**Active Phase:** {phase name} (if executing)
**Session start:** {ISO timestamp}

---

### Stage Gates

| Stage | Status | Approved |
|---|---|---|
| 1 — Intake | DONE / PENDING | {timestamp or —} |
| 2 — Plan | DONE / PENDING | {timestamp or —} |
| 3 — Foundation | DONE / IN_PROGRESS / PENDING | {timestamp or —} |
| 4 — Features | IN_PROGRESS / PENDING | {timestamp or —} |
| 5 — Quality Gate | PENDING | — |
| 6 — Ship | PENDING | — |

---

### Active Phase: {Phase Name}

| Task | Agent | Log | Status |
|---|---|---|---|
| 0.1 Initialize monorepo | Architect | logs/backend/0.1-monorepo.md | DONE |
| 0.2 Database schema | Backend Dev | logs/backend/0.2-schema.md | IN_PROGRESS |
| 0.3 API scaffold | Backend Dev | logs/backend/0.3-api-scaffold.md | PENDING |

---

### Blockers

{none / list any BLOCKED or WAITING_INPUT tasks}

---

### Log Summary

Total logs: N
Done: N | In Progress: N | Pending: N | Blocked: N | Waiting Input: N

---

### Memory

Last written: {date or "not yet written this session"}
Entries: N
```

---

## /logs Command

List all log files with status:

```markdown
## Log Files — {Product Name}

### logs/backend/
- [DONE]           0.1-monorepo.md
- [IN_PROGRESS]    0.2-schema.md
- [PENDING]        0.3-api-scaffold.md

### logs/frontend/
- [PENDING]        1.2-auth-ui.md

### logs/decisions/
- [DONE]           handoff-auth-contract.md
- [PENDING]        quality-gate-report.md

### logs/inputs/
- [DONE]           planning-gaps.md
- [DONE]           planning-session.md
```

---

## /memory Command

```markdown
## Agent Memory — {Product Name}

Entries: N
Last updated: {date}

Recent entries:
- [#N] {date} — {Category}: {Title}
- [#N-1] {date} — {Category}: {Title}

Type /memory write to capture current session learnings.
Type /memory read to display full MEMORY.md.
```
