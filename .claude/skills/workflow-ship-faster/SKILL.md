---
name: workflow-ship-faster
version: 1.0.0
category: execution
stack:
  - always
severity: hard
triggers:
  - "starting a task"
  - "let's build"
  - "implement"
  - "write the code"
  - "beginning implementation"
description: >
  Use before any implementation task. Defines the execution loop that
  keeps agents shipping without drifting: read first, plan in text,
  one unit of work at a time, verify before claiming done, commit
  atomically. Prevents the most common failure — writing code that works
  in isolation but breaks the system.
---

# Workflow: Ship Faster

**Faster shipping comes from never having to undo. Not from moving faster.**

---

## Why This Exists

AI agents write code quickly. That speed is wasted when code has to be
redone because of wrong assumptions, missing error handling, or tests
that reveal design problems after the fact.

This skill defines the execution loop that prevents these failure modes.
It is intentionally conservative. Conservative code ships. Clever code doesn't.

---

## When To Use

Every implementation task. No exceptions.

## When NOT To Use

- Pure documentation tasks
- Config file edits (read, edit, verify — no full loop needed)
- Exploratory investigation where no code is being committed

---

## The Execution Loop

```
For each task:

  1. READ FIRST — never write without reading
     └─ Read every file you'll touch (range reads on large files)
     └─ Read the existing test file if it exists
     └─ Read related files to understand conventions

  2. PLAN IN TEXT — state your approach before writing code
     └─ "I will: create X, modify Y at line Z, add W to the interface"
     └─ If the plan surprises you, stop and check assumptions
     └─ If uncertain about anything, ask before writing

  3. WRITE TESTS FIRST (if logic is involved)
     └─ Write the test that proves the feature works
     └─ Run it — confirm it FAILS (RED)
     └─ Now write the implementation

  4. IMPLEMENT — one file at a time, not all at once
     └─ Complete one file fully before opening the next
     └─ Touching 5+ files? Task is too large — split it

  5. VERIFY — run tests, don't assume they pass
     └─ Tests must be GREEN before advancing
     └─ Failing tests are not "fix later" — fix now

  6. COMMIT — atomic, conventional, immediately
     └─ One logical unit per commit
     └─ Format: feat(scope): description
     └─ Never batch unrelated changes

  7. UPDATE LOG — set task status, write summary
```

---

## The Anti-Drift Rules

**Rule 1 — Scope Lock.** Implement EXACTLY what the task specifies.
Adjacent things that "should" also be fixed → add a TODO in the log and keep moving.

**Rule 2 — No Speculative Code.** Do not implement functionality that wasn't asked for.
YAGNI. Always.

**Rule 3 — No Refactoring During Implementation.** See code that needs refactoring?
Log it to MEMORY.md as a future task. Do not refactor now.

**Rule 4 — TypeScript Strict.** No `any`. No `as unknown as X`. No `@ts-ignore`.
Hard type is hard — fix the design.

**Rule 5 — One Import Check.** Before adding a new library:
- Does this already exist under a different name?
- Is there a lighter native alternative?
- Is the bundle impact acceptable?

---

## Anti-Patterns (Before / After)

```ts
// ❌ — writing before reading (assumption failure)
// Result: duplicate service, conflicting module, wasted time

// ✅ — read first
// list apps/api/src/users/ → confirm what exists
// read users.service.ts lines 1-50 → understand patterns
// then write
```

```ts
// ❌ — speculative code
export class UserService {
  async findById(id: string) { ... }       // asked for
  async findByEmail(email: string) { ... } // not asked for
  async searchUsers(query: string) { ... } // not asked for
}

// ✅ — exactly what was asked
export class UserService {
  async findById(id: string): Promise<User> {
    return this.repo.findOneOrFail({ where: { id } })
  }
}
```

```ts
// ❌ — proceeding with failing tests
// "3 failing, I'll fix later"

// ✅ — stop and fix
// Fix the 3 failures, confirm all green, then advance
```

---

## Commit Message Format

```
feat(scope): short description
fix(scope): what was broken and what fixed it
chore(scope): maintenance, deps, config
refactor(scope): behavior unchanged, structure improved
test(scope): adding or fixing tests
docs(scope): documentation only

Examples:
  feat(auth): add JWT refresh token rotation
  fix(dashboard): handle null stats on first load
  test(users): add edge case for duplicate email
```

---

## Self-Audit Block

```yaml
execution_audit:
  skill: workflow-ship-faster
  task: <description>
  read_before_write: true
  plan_stated_before_code: true
  tests_written_first: true
  tests_passing: true
  scope_locked: true
  no_speculative_code: true
  committed_atomically: true
  commit_conventional: true
  log_updated: true
  overall: pass | fail
```

---

## Composition Rules

```
REQUIRES:   (entry point — nothing required before this)
SUGGESTS:   tdd-workflow        (test methodology)
            adversarial-review  (review before handoff)
            continuous-learning (capture patterns at session end)
CONFLICTS:  (none)
```
