---
name: adversarial-review
version: 1.0.0
category: security
stack:
  - always
severity: hard
triggers:
  - "before handoff"
  - "task complete"
  - "implementation done"
  - "about to commit"
  - "ready to review"
description: >
  Use before every agent handoff. Runs three adversarial lenses against the
  implementation — attacker, skeptical user, and production engineer.
  Catches what cooperative review misses. Critical and High findings block
  handoff until fixed.
---

# Adversarial Review

**The most dangerous reviewer is the one who wants you to succeed.**

---

## Why This Exists

Standard review is cooperative — the reviewer looks for problems while
wanting the code to be good. Adversarial review is different: the reviewer
actively tries to break, exploit, or misuse the implementation.

AI agents are especially prone to cooperative blind spots — they implement
what was asked and review what they implemented. This skill breaks that loop.

---

## When To Use

- Before every agent handoff
- Before every commit to main/production branches
- After implementing any auth, payments, data mutation, or file I/O
- When the implementation "feels right" — that feeling is the trigger

## When NOT To Use

- Pure read operations with no side effects
- Documentation files

---

## Lens 1 — The Attacker

```
Try to break this. Ask:

□ What happens if every input is malicious?
  - String: SQL injection, XSS, path traversal, command injection
  - Numeric: negative, zero, MAX_INT, NaN, Infinity
  - Object: prototype pollution, missing fields, extra fields

□ Can I bypass authentication?
  - Is every route protected at middleware level (not just frontend)?
  - Can I access admin endpoints by guessing the path?
  - Are JWT tokens validated on every request?

□ Can I access other users' data?
  - Does every query filter by authenticated user's ID?
  - Is userId from the JWT token or from the request body?
    (Body = attacker-controlled. Token = auth-controlled.)

□ Can I cause data loss?
  - Are destructive operations soft-delete first?
  - Are bulk operations scoped to prevent accidental full-table mutations?
  - Is there a confirmation step for irreversible actions?
```

---

## Lens 2 — The Skeptical User

```
Use this as if trying to accomplish something slightly off-spec. Ask:

□ What happens if I submit the form twice quickly?
  - Loading state that disables submit?
  - Backend idempotency key?

□ What happens if the network drops mid-request?
  - Error state shown (not white screen)?
  - UI not left in broken intermediate state?

□ What happens if I'm on slow connection?
  - Loading states shown immediately?
  - UI doesn't reflow/jump on content load?

□ What happens if the API returns unexpected data?
  - Null/undefined handled in UI (not crashes)?
  - Graceful error boundary?

□ What happens if I hit back after completing an action?
  - State consistent when navigating backward?
  - No ghost state from previous operations?
```

---

## Lens 3 — The Production Engineer

```
Run this at 10x expected load. Ask:

□ What queries does this run?
  - N+1 query hiding in a loop? (Any .find() inside a loop = N+1)
  - All frequent queries indexed?
  - Pagination cursor-based? (offset fails at scale)

□ What fails when a dependency is down?
  - DB slow → endpoint times out gracefully?
  - Email service down → operation still succeeds?
  - Background jobs retryable without side effects?

□ What leaks?
  - File handles, DB connections, event listeners cleaned up?
  - Memory leaks in useEffect dependency arrays?
  - API keys, passwords, or tokens in logs or error messages?

□ What breaks after 30 days?
  - JWTs expire and refresh correctly?
  - Cron jobs handle timezone/DST correctly?
  - Rate limits reset correctly?
```

---

## Severity Matrix

| Severity | Definition | Action |
|---|---|---|
| Critical | Data loss, auth bypass, exposed secrets, PII leak | BLOCK. Fix first. |
| High | Missing error states, data corruption possible, breaks at scale | BLOCK. Fix before handoff. |
| Medium | UX degradation, non-critical edge cases | LOG. Fix if time. |
| Low | Code style, minor inconsistency | LOG only. |

---

## Anti-Patterns (Before / After)

```ts
// ❌ — userId from request body (attacker-controlled)
async update(body: UpdateDto) {
  return this.service.update(body.userId, body)  // CRITICAL
}

// ✅ — userId from JWT token
async update(body: UpdateDto, @CurrentUser() user: User) {
  return this.service.update(user.id, body)
}
```

```ts
// ❌ — no idempotency on payment
await stripe.charges.create({ amount: dto.amount })

// ✅ — idempotency key
await stripe.charges.create(
  { amount: dto.amount },
  { idempotencyKey: `payment-${dto.orderId}-${dto.userId}` }
)
```

```tsx
// ❌ — crashes on null API response
const { data } = useFetch('/api/dashboard')
return <Grid stats={data.stats} />  // crashes if data is null

// ✅ — handles all states
const { data, error, isLoading } = useFetch('/api/dashboard')
if (isLoading) return <Skeleton />
if (error) return <ErrorState error={error} />
return <Grid stats={data.stats} />
```

---

## Self-Audit Block

```yaml
adversarial_audit:
  skill: adversarial-review
  scope: <what was reviewed>
  lenses_run:
    attacker: true
    skeptical_user: true
    production_engineer: true
  findings:
    critical: []
    high: []
    medium: []
    low: []
  critical_count: 0
  high_count: 0
  all_critical_fixed: true
  all_high_fixed: true
  overall: pass | fail
  blocked: false
```

---

## Composition Rules

```
REQUIRES:   (none)
SUGGESTS:   security-review (OWASP checklist for deeper security pass)
            tdd-workflow    (write tests for vulnerabilities found)
CONFLICTS:  (none)

Run BEFORE requesting-code-review — catch your own issues first.
```
