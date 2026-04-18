# [{AREA}] {PHASE}.{SEQ} — {Task Title}

**Status:** PENDING
**Stage:** {stage name}
**Phase:** {phase name and number}
**Agent:** {architect | backend-dev | frontend-dev | billing-dev | tester | reviewer | devops}
**Skills active:** {comma-separated list of loaded skills}
**Started:** —
**Completed:** —

---

## Approach

> Written AFTER stage gate approval and BEFORE touching any files.
> This section is the contract — if execution deviates from it, note why.

### What will be built
-

### Why this approach (over alternatives considered)
-

### Files that will be created or modified
| File | Action | Reason |
|---|---|---|
| `{path}` | create / modify | {reason} |

### Dependencies on prior tasks
- Requires: {task IDs and what they produce}

### Assumptions made
-

### Risks identified
-

---

## Your Input

> Filled only when Claude needs a decision mid-task.
> Claude stops, writes here, sets status WAITING_INPUT, surfaces to you in chat.

*(no input required for this task)*

<!--
If input was needed:

**Question asked:**
> {exact question Claude asked}

**Context:**
> {why this decision matters, what it affects}

**Options considered:**
> A) {option} — Pro: {x} Con: {y}
> B) {option} — Pro: {x} Con: {y}

**Your answer:**
> {your exact answer}

**Timestamp:** {ISO 8601}

**Impact on approach:**
-
-->

---

## Execution

> Written live as work progresses. Claude updates this in real time.

**Status:** IN_PROGRESS — {ISO timestamp}

### Steps taken

1.

### Files created / modified

-

### Commands run

```bash

```

### Tests written

```
describe: {suite name}
  it: {test name} — {PASS | FAIL}
  it: {test name} — {PASS | FAIL}
```

### Errors encountered and fixes applied

-

### Mid-task decisions made

-

---

## Skill Audit

> Auto-appended on task completion. One block per active skill.
> overall: fail means this task is BLOCKED until fixed.

```yaml
# workflow-ship-faster
execution_audit:
  read_before_write: true
  plan_stated_before_code: true
  tests_written_first: true
  tests_passing: true
  scope_locked: true
  no_speculative_code: true
  committed_atomically: true
  commit_conventional: true
  log_updated: true
  overall: pass
```

<!-- Paste additional skill audit blocks here as needed -->

---

## Summary

> Written when the task closes.

**Status:** DONE — {ISO timestamp}

**Built vs. planned:**
- Planned: {what approach said would be built}
- Actual: {what was actually built}

**Deviations and why:**
- {deviation} — reason: {why}

**What the next task needs to know:**
-

**Tech debt incurred (if any):**
<!-- Add to logs/decisions/tech-debt.md if significant -->
-

**Gate status:** APPROVED | BLOCKED | WAITING_INPUT
