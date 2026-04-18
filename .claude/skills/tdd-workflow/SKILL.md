---
name: tdd-workflow
version: 1.0.0
category: testing
stack:
  - always
severity: hard
triggers:
  - "writing logic"
  - "new function"
  - "implementing a service"
  - "before writing testable code"
  - "adding a feature"
description: >
  Use before writing any testable logic. Enforces RED-GREEN-REFACTOR:
  write the failing test first, confirm it fails, implement the minimum
  to pass, then refactor. Code written before tests will be deleted and
  rewritten. No exceptions.
---

# TDD Workflow

**Write the test first. Always. The test is the spec.**

---

## Why This Exists

Tests written after implementation are confirmations, not specifications.
They test what the code does, not what it should do. The failing test
written before implementation forces clarity about the requirement before
any implementation decisions are made.

---

## When To Use

- Before writing any function with logic (not trivial getters)
- Before implementing any API endpoint
- Before writing any React component with state or effects
- After fixing any bug (test that would have caught it)

## When NOT To Use

- Config files
- Type definitions with no logic
- Trivial pass-through functions (< 3 lines, no branching)

---

## The RED-GREEN-REFACTOR Cycle

```
RED:    Write the test. Run it. Confirm it FAILS.
        If it passes immediately → the test is wrong or trivial. Rewrite.

GREEN:  Write the MINIMUM code to make the test pass.
        No extra logic. No "while I'm here" additions.
        Ugly is fine. Minimal is required.

REFACTOR: Clean the implementation.
          Tests must still pass after every refactor step.
          Refactor and implement are separate commits.
```

**Hard rule: Code written before the failing test is deleted.**
No exceptions. No "I'll write the test after."

---

## Test Structure

```ts
// NestJS / Backend (Vitest)
describe('UsersService', () => {
  describe('findById', () => {
    it('should return user when id exists', async () => {
      // Arrange
      const mockUser = { id: '1', email: 'test@test.com' }
      mockRepo.findOneOrFail.mockResolvedValue(mockUser)

      // Act
      const result = await service.findById('1')

      // Assert
      expect(result).toEqual(mockUser)
    })

    it('should throw NotFoundException when id does not exist', async () => {
      mockRepo.findOneOrFail.mockRejectedValue(new EntityNotFoundError())

      await expect(service.findById('nonexistent'))
        .rejects.toThrow(NotFoundException)
    })
  })
})

// React / Frontend (Vitest + Testing Library)
describe('LoginForm', () => {
  it('should show error when email is invalid', async () => {
    render(<LoginForm />)
    await userEvent.type(screen.getByLabelText('Email'), 'not-an-email')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
    expect(screen.getByText(/invalid email/i)).toBeInTheDocument()
  })

  it('should call onSubmit with credentials when form is valid', async () => {
    const onSubmit = vi.fn()
    render(<LoginForm onSubmit={onSubmit} />)
    await userEvent.type(screen.getByLabelText('Email'), 'test@test.com')
    await userEvent.type(screen.getByLabelText('Password'), 'password123')
    await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
    expect(onSubmit).toHaveBeenCalledWith({ email: 'test@test.com', password: 'password123' })
  })
})
```

---

## What to Test

**Test behavior, not implementation.**

```ts
// ❌ — testing implementation detail
expect(service['_cache'].has('key')).toBe(true)

// ✅ — testing observable behavior
const result = await service.findById('key')
expect(result).toEqual(expectedUser)
```

**Every public method gets tests for:**
- Happy path (correct inputs, expected output)
- Edge cases (empty, null, zero, max values)
- Error cases (invalid input, dependency failures)
- Boundary conditions (exactly at limits)

---

## Coverage Requirements

Minimum overall: set in `project/CONSTRAINTS.md`

Critical paths requiring 100%:
- Auth flows (register, login, refresh, logout)
- Payment flows (charge, refund, webhook)
- Data deletion flows

---

## Anti-Patterns

```ts
// ❌ — test written after implementation
// (tests what code does, not what it should do)

// ❌ — mocking what you own
// Don't mock your own services in unit tests — test them
// Mock only external dependencies (DB, email, Stripe)

// ❌ — one big test per function
it('should handle all auth scenarios', ...)
// Instead: one test per scenario, descriptive names

// ❌ — testing multiple things in one assertion
expect(result).toEqual({ ...complexObject })
// Instead: assert the specific property you care about

// ❌ — no arrange/act/assert structure
// All tests must have clear sections, even if one line each
```

---

## Self-Audit Block

```yaml
tdd_audit:
  skill: tdd-workflow
  tests_written_before_code: true
  red_confirmed: true
  green_achieved_with_minimum_code: true
  refactor_done_separately: true
  all_tests_passing: true
  critical_paths_at_100: true
  overall_coverage_meets_threshold: true
  overall: pass | fail
```

---

## Composition Rules

```
REQUIRES:   workflow-ship-faster (tests are part of the execution loop)
SUGGESTS:   adversarial-review  (after implementation, before handoff)
CONFLICTS:  (none)
```
