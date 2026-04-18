# Constraints

> Hard limits Claude must never violate regardless of what seems faster or easier.
> These are non-negotiable. If a constraint conflicts with a skill rule,
> the more restrictive one wins.
> To change a constraint, update this file and re-run /plan.

---

## Scope Constraints

### MVP Definition
<!--
One paragraph. What exactly will be built in this build cycle.
Claude uses this to reject scope creep during execution.
Anything not mentioned here is out of scope.
-->

### Explicitly Out of Scope
<!--
Claude will not implement these even if asked mid-build.
To add something, update this file and re-run /plan.
-->
- [ ]
- [ ]
- [ ]

---

## Technical Constraints

### Stack Locks
<!-- Taken from TECH-STACK.md. Fill in after running the project-starter wizard. -->
| Layer | Choice | Version | Locked? |
|---|---|---|---|
| Language | <!-- from TECH-STACK.md --> | | Yes |
| Backend | <!-- from TECH-STACK.md --> | | Yes |
| Frontend | <!-- from TECH-STACK.md --> | | Yes |
| Database | <!-- from TECH-STACK.md --> | | Yes |
| ORM / Data | <!-- from TECH-STACK.md --> | | Yes |
| Test runner | <!-- from TECH-STACK.md --> | | Yes |

### Performance Constraints
| Metric | Target | On miss |
|---|---|---|
| Page load LCP | < 2.5s | Block ship |
| API p95 response | < 300ms | Log warning |
| DB query time | < 100ms | Log warning |

### Security Constraints
- No secrets in code — always env vars
- No hardcoded user IDs — always from auth context
- No raw SQL — always ORM or parameterized queries
- All endpoints behind auth guard unless explicitly marked public
- Rate limiting on all public endpoints
- Password hashing: bcrypt (cost >= 12) or argon2

### Dependency Constraints
<!-- Libraries that cannot be added without explicit approval -->
- No dependencies with known critical CVEs
- No dependencies > 500KB unpacked without logged justification

---

## Quality Gate Thresholds

Claude runs these checks before every deploy. All must pass.

| Check | Threshold | On fail |
|---|---|---|
| Compilation / type errors | 0 | Block ship |
| Lint errors | 0 | Block ship |
| Test coverage — overall | > 60% | Block ship |
| Test coverage — auth flows | 100% | Block ship |
| Test coverage — payment flows | 100% | Block ship |
| Test coverage — data deletion | 100% | Block ship |
| Security scan (OWASP) | 0 critical, 0 high | Block ship |
| Production build | Successful | Block ship |

---

## Timeline Constraints

- MVP deadline: <!-- date or "none" -->
- Hard external deadline: <!-- date, event, or "none" -->

---

## Things Claude Must ALWAYS Do

- Create the log file BEFORE starting any task
- Ask before adding any new external dependency
- Wait for `/approve` at every stage gate
- Run `adversarial-review` before every agent handoff
- Write to `MEMORY.md` at session end
- Run `security-review` before any auth, payment, or data mutation code
- Emit skill self-audit YAML in every deliverable

## Things Claude Must NEVER Do

- Start a task without creating the log file first
- Advance past a stage gate without `/approve`
- Add a library not in `TECH-STACK.md` without asking first
- Hardcode any value that should be an env var
- Commit directly to `main`
- Ship with failing tests
- Return entity/model objects directly from API (always use response DTOs)
- Store passwords in plaintext
- Log sensitive data (tokens, passwords, PII)
