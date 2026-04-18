---
name: systematic-debugging
version: 1.0.0
category: meta
stack:
  - always
severity: soft
triggers:
  - "bug"
  - "error"
  - "not working"
  - "failing"
  - "unexpected behavior"
  - "debugging"
description: >
  Use when debugging any issue. Enforces a 4-phase root-cause process:
  observe, hypothesize, isolate, fix+verify. Prevents guess-and-check
  thrashing and the "fix" that moves the bug elsewhere. Systematic
  debugging is faster than random attempts after the third failed guess.
---

# Systematic Debugging

**Guess-and-check is slower than process after the third failed attempt.**

---

## The 4 Phases

### Phase 1 — Observe (do not touch code yet)

```
1. Read the full error message — not just the first line
2. Find the stack trace — trace to the original throw, not the surface
3. Reproduce the bug reliably — if you can't reproduce it, you can't fix it
4. Note: when does it happen? When does it NOT happen?
5. Check git log — did this work before? What changed?
```

**Do not write any code in Phase 1. Observation only.**

---

### Phase 2 — Hypothesize

```
1. Form ONE specific hypothesis: "The bug is caused by X because Y"
2. Write it down before testing it
3. Determine what evidence would prove or disprove it
4. If you have 3+ hypotheses, rank by likelihood and test in order
```

**A hypothesis is not "something might be wrong with auth."
A hypothesis is "the JWT token is being parsed before the refresh
middleware runs, causing expired tokens to fail before they can be renewed."**

---

### Phase 3 — Isolate

```
1. Add a single targeted log/breakpoint at the hypothesis point
2. Run — does the evidence match the hypothesis?

   YES → proceed to Phase 4 (fix)
   NO  → return to Phase 2 with new information (do NOT add more logs)

3. Never add multiple logs at once — you won't know which revealed the bug
4. Remove debug logs before committing
```

**Stop signals — if any of these occur, return to Phase 1:**
- Third fix attempt in a row that didn't work
- The bug moved to a different location (you fixed a symptom)
- You're not sure what the code is doing anymore
- The fix "feels right" but you can't explain why

---

### Phase 4 — Fix + Verify

```
1. Write the test that would have caught this bug (RED first)
2. Fix the root cause (not the symptom)
3. Run the test — it should now pass (GREEN)
4. Run the full test suite — nothing else broke
5. Remove all debug logs
6. Log the bug + fix to MEMORY.md under Mistake+Fix category
```

---

## Common Bug Patterns

### Async / Promise Issues
```ts
// ❌ — missing await (returns Promise, not value)
const user = getUser(id)  // returns Promise<User>
console.log(user.email)   // undefined

// ✅
const user = await getUser(id)
```

### TypeORM N+1
```ts
// ❌ — N+1 (1 query for list + 1 per user for posts)
const users = await this.userRepo.find()
for (const user of users) {
  user.posts = await this.postRepo.findBy({ userId: user.id })
}

// ✅ — single query with join
const users = await this.userRepo
  .createQueryBuilder('user')
  .leftJoinAndSelect('user.posts', 'post')
  .getMany()
```

### React Stale Closure
```tsx
// ❌ — count is always 0 in the interval
useEffect(() => {
  const id = setInterval(() => {
    console.log(count)  // stale closure
  }, 1000)
  return () => clearInterval(id)
}, [])  // missing count dependency

// ✅
useEffect(() => {
  const id = setInterval(() => console.log(count), 1000)
  return () => clearInterval(id)
}, [count])
```

### TypeScript `undefined` Not Handled
```ts
// ❌ — crashes if user is undefined
const user = users.find(u => u.id === id)
return user.email  // TypeError if not found

// ✅
const user = users.find(u => u.id === id)
if (!user) throw new NotFoundException(`User ${id} not found`)
return user.email
```

---

## Self-Audit Block

```yaml
debugging_audit:
  skill: systematic-debugging
  bug_description: <one sentence>
  phases_completed:
    observe: true
    hypothesize: true
    isolate: true
    fix_and_verify: true
  root_cause_identified: true
  fix_addresses_root_cause: true
  regression_test_written: true
  debug_logs_removed: true
  memory_md_updated: true
  overall: resolved | unresolved
```

---

## Composition Rules

```
REQUIRES:   (none)
SUGGESTS:   tdd-workflow       (write the regression test)
            build-error-resolver (if the bug is a build/type error)
CONFLICTS:  (none)
```
