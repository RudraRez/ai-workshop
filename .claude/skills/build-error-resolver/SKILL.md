---
name: build-error-resolver
version: 1.0.0
category: meta
stack:
  - always
severity: soft
triggers:
  - "build error"
  - "TypeScript error"
  - "compilation failed"
  - "type error"
  - "cannot find module"
  - "type is not assignable"
description: >
  Use on build failures, TypeScript errors, and compilation issues.
  Provides a structured resolution flow: read the full error, find the
  root type, fix at the source — never suppress with any/ts-ignore.
  Self-healing pattern that leaves the codebase in better shape than before.
---

# Build Error Resolver

**Never suppress a type error. Fix the type. The error is a symptom — find the disease.**

---

## TypeScript Error Resolution Flow

```
1. READ THE FULL ERROR — not just the first line
   tsc outputs the chain. The last item is the root cause.

2. FIND THE ROOT TYPE
   Follow the error chain backward:
   Component uses → Hook returns → Service returns → Type definition
   The fix is at the root, not at the consumer.

3. FIX AT THE SOURCE
   - Missing property → add it to the interface
   - Wrong type → fix the actual type, not the cast
   - Null not handled → add the null check where the value is produced

4. NEVER USE:
   - `any`
   - `as unknown as X`
   - `@ts-ignore`
   - `// @ts-expect-error` (unless testing error behavior)
   These are not fixes. They are deferrals that compound.

5. VERIFY
   Run tsc — zero errors
   Run affected tests — all passing
```

---

## Common TypeScript Errors

### "Property does not exist on type"
```ts
// Error: Property 'refreshToken' does not exist on type 'AuthResponse'

// ❌ — cast to silence
const token = (response as any).refreshToken

// ✅ — add to the type
interface AuthResponse {
  user: User
  token: string
  refreshToken: string  // add the missing property
}
```

### "Type 'X | undefined' is not assignable to type 'X'"
```ts
// Error: Type 'User | undefined' is not assignable to type 'User'

// ❌ — non-null assertion (lie to the compiler)
const user = users.find(u => u.id === id)!

// ✅ — handle the undefined case
const user = users.find(u => u.id === id)
if (!user) throw new NotFoundException(`User ${id} not found`)
return user  // now User, not User | undefined
```

### "Argument of type 'X' is not assignable to parameter of type 'Y'"
```ts
// Error: Argument of type 'string' is not assignable to parameter of type 'UUID'

// ❌ — cast
createUser(id as UUID)

// ✅ — validate and convert at the boundary
const uuid = validateUUID(id)  // throws if invalid
createUser(uuid)
```

### "Cannot find module" / "Module not found"
```bash
# Check in order:
1. Is the package installed? → check package.json
2. Is the import path correct? → check for typos, case sensitivity
3. Is there a barrel export missing? → check index.ts
4. Is tsconfig.paths configured? → check tsconfig.json paths
5. Does the type package exist? → npm install @types/package
```

---

## NestJS-Specific Build Errors

```ts
// "Nest can't resolve dependencies of the XService"
// Missing provider in module imports array
@Module({
  imports: [TypeOrmModule.forFeature([UserEntity])],  // check this
  providers: [UsersService],                           // check this
  exports: [UsersService],
})

// "Cannot read property of undefined" at startup
// Circular dependency — use forwardRef()
constructor(
  @Inject(forwardRef(() => PostsService))
  private postsService: PostsService
) {}
```

---

## Next.js Build Errors

```ts
// "You're importing a component that needs X. That only works in a Client Component"
// Add 'use client' at the top, or move the client logic to a child component

// "Hydration failed because the initial UI does not match"
// Server-rendered HTML ≠ client-rendered HTML
// Common cause: Date.now(), Math.random(), window checks without typeof window guard
if (typeof window !== 'undefined') { /* client-only */ }

// "Dynamic server usage: headers/cookies"  
// You're calling headers() or cookies() in a component without export const dynamic = 'force-dynamic'
export const dynamic = 'force-dynamic'
```

---

## Self-Audit Block

```yaml
build_error_audit:
  skill: build-error-resolver
  error_type: typescript | module | nestjs | nextjs | other
  root_cause_found: true
  fixed_at_source: true
  no_any_used: true
  no_ts_ignore_used: true
  tsc_clean: true
  tests_passing: true
  overall: resolved | unresolved
```

---

## Composition Rules

```
REQUIRES:   (none)
SUGGESTS:   systematic-debugging (if build error reveals a logic bug)
            tdd-workflow         (write test for the edge case found)
CONFLICTS:  (none)
```
