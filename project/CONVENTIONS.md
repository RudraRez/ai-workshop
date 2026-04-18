# Conventions

> How code is written in this repo.
> Claude follows these exactly.
> If a convention conflicts with a hard-severity skill rule, the skill wins.
> If a convention is not listed here, Claude uses the skill default.

---

## Naming Conventions

<!-- Fill in based on your language/framework. Examples for common stacks: -->

<!--
### TypeScript / JavaScript
| Type | Convention | Example |
|---|---|---|
| Files | kebab-case | `user-service.ts` |
| Components | PascalCase | `UserCard.tsx` |
| Variables | camelCase | `currentUser` |
| Constants | SCREAMING_SNAKE | `JWT_EXPIRY` |
| Booleans | is/has/can prefix | `isLoading` |
| Handlers | handle prefix | `handleSubmit` |

### Java / Kotlin
| Type | Convention | Example |
|---|---|---|
| Classes | PascalCase | `UserService.java` |
| Methods | camelCase | `findById()` |
| Constants | SCREAMING_SNAKE | `MAX_RETRIES` |
| Packages | lowercase | `com.example.users` |

### Python
| Type | Convention | Example |
|---|---|---|
| Files | snake_case | `user_service.py` |
| Functions | snake_case | `find_by_id()` |
| Classes | PascalCase | `UserService` |
| Constants | SCREAMING_SNAKE | `MAX_RETRIES` |

### Go
| Type | Convention | Example |
|---|---|---|
| Exported | PascalCase | `FindByID()` |
| Unexported | camelCase | `parseToken()` |
| Files | snake_case | `user_handler.go` |
| Packages | lowercase, short | `auth`, `users` |
-->

---

## Code Style Rules

<!-- Add language-specific rules. Examples: -->

<!--
- Strict mode: on (TypeScript)
- No `any` / type suppression (TypeScript)
- Explicit return types on exported functions
- async/await over .then() chains
- No raw SQL — ORM only
-->

---

## Import Order

<!-- Define import ordering for your language. Example: -->

<!--
1. Standard library / framework
2. External packages
3. Internal absolute imports
4. Relative imports
5. Type-only imports (last)
-->

---

## Error Handling

- Never swallow errors silently
- User-facing errors: plain English, no stack traces
- API errors: consistent shape `{ code, message, statusCode }`
- Log all errors with context
- Unrecoverable startup errors: fail fast and loud

---

## Comments

- Comments explain **why**, not **what**
- `// TODO:` must reference a log file or issue
- No commented-out code — delete it (git has history)

---

## Environment Variables

- Every env var documented in `.env.example`
- Validated at startup — app refuses to start if required vars missing
- Never access env vars directly in business logic — use a config module

---

## Project-Specific Conventions

<!-- Add anything specific to this product not covered above -->

-
