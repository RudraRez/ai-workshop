# /review — Quality Gate Command

Run `/review` to trigger an independent quality gate on the current codebase.
Always dispatches a fresh Reviewer instance — no context from the build session.

---

## What This Does

1. Dispatches a fresh Claude Code session (Reviewer) with read-only access
2. Reviewer loads `skills/adversarial-review` and `skills/security-review`
3. Reviewer loads `skills/tdd-workflow` to verify test discipline
4. Simultaneously dispatches Tester to run the test suite
5. Both write findings to `logs/decisions/`
6. Results surfaced with PASS / BLOCKED verdict

---

## Reviewer Checklist (adversarial — 3 lenses)

### Lens 1: Attacker
- [ ] Every endpoint behind auth guard (not just frontend guards)
- [ ] userId always from JWT token, never from request body
- [ ] All inputs validated via DTO + class-validator
- [ ] No SQL injection surface (ORM used everywhere)
- [ ] No secrets in code, logs, or error responses
- [ ] Rate limiting on all public endpoints
- [ ] CORS configured correctly (not wildcard in production)

### Lens 2: Skeptical User
- [ ] Form double-submission handled (loading state + idempotency)
- [ ] All error states shown in UI (not just happy path)
- [ ] Network failure handled gracefully (not white screen)
- [ ] Null/undefined API responses handled in components
- [ ] Back navigation doesn't leave broken state

### Lens 3: Production Engineer
- [ ] No N+1 queries (no .find() inside loops)
- [ ] Pagination is cursor-based (not offset)
- [ ] All frequent queries indexed
- [ ] File handles / DB connections / event listeners cleaned up
- [ ] No memory leaks in useEffect (deps array correct)
- [ ] Background jobs are idempotent (safe to retry)
- [ ] JWT expiry + refresh handled correctly

---

## Test Coverage Report

Tester runs in parallel with Reviewer:

```markdown
## Test Coverage Report

### Coverage by Module

| Module | Statements | Branches | Functions | Lines |
|---|---|---|---|---|
| auth | 94% | 88% | 100% | 93% |
| users | 71% | 65% | 80% | 70% |
| ... | | | | |

### Overall: N%
### Threshold: N% (from project/CONSTRAINTS.md)
### Status: PASS / BLOCKED

### Critical Paths (must be 100%)
- [ ] Auth flows: N%
- [ ] Payment flows: N%
- [ ] Data deletion flows: N%
```

---

## Quality Gate Report

Written to `logs/decisions/quality-gate-report.md`:

```markdown
## Quality Gate Report

**Reviewed at:** {ISO timestamp}
**Reviewer:** fresh instance (no build context)
**Codebase:** {commit SHA}

### Findings

#### Critical (0) — blocks ship
(none)

#### High (0) — blocks ship
(none)

#### Medium (N) — logged, does not block
- {file:line} — {description} — {fix suggestion}

#### Low (N) — logged only
- {file:line} — {description}

### Verdict: PASS / BLOCKED

{If BLOCKED: list exactly what must be fixed before /execute can proceed to deploy}
```

---

## After Review

If PASS on both Reviewer and Tester:
```
Quality gate PASSED. Type /approve to proceed to deploy phase.
```

If BLOCKED:
```
⛔ QUALITY GATE BLOCKED

Critical/High findings must be fixed:
- {finding 1}
- {finding 2}

Dispatch Backend Dev / Frontend Dev to fix.
Re-run /review after fixes. Do not deploy until PASS.
```
