---
name: frontend-patterns
version: 1.0.0
category: frontend
stack:
  - next.js
  - react
severity: soft
triggers:
  - "Next.js"
  - "React component"
  - "page"
  - "hook"
  - "frontend"
  - "client component"
  - "server component"
description: >
  Use before writing any Next.js App Router or React code. Enforces
  component structure, hook patterns, server vs client component decisions,
  data fetching conventions, and form handling. Load after ui-intelligence —
  this skill covers structure and patterns, ui-intelligence covers visual rules.
---

# Frontend Patterns

**Server components by default. Client components by exception. Hooks for logic.**

---

## App Router — Server vs Client Decision

```
Is this component interactive? (onClick, onChange, useState, useEffect)
  YES → 'use client'
  NO  → Server Component (default — no directive needed)

Does this component use browser APIs? (window, document, localStorage)
  YES → 'use client'
  NO  → Server Component

Does this component fetch data?
  YES + no interactivity → Server Component (fetch directly, no useEffect)
  YES + interactive      → 'use client' + TanStack Query (useQuery)
```

---

## Server Component Pattern

```tsx
// No 'use client' directive — rendered on server
// Fetch data directly — no useEffect, no useState

// app/users/page.tsx
export default async function UsersPage() {
  const users = await getUsers()  // direct async call

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Users</h1>
      <UserList users={users} />
    </div>
  )
}

// Pass data down to client components as props
// Client components handle interaction
```

---

## Client Component Pattern

```tsx
'use client'

// State at the top
// Handlers before return
// JSX at the bottom

import { useState } from 'react'
import { useCreateUser } from '@/hooks/use-create-user'

interface UserFormProps {
  onSuccess: (user: User) => void
}

export function UserForm({ onSuccess }: UserFormProps) {
  // Hooks (context → state → refs → queries → derived)
  const { mutate: createUser, isPending } = useCreateUser()

  // Handlers (always prefixed with 'handle')
  function handleSubmit(data: CreateUserFormData) {
    createUser(data, { onSuccess })
  }

  // JSX
  return (
    <Form onSubmit={handleSubmit}>
      {/* ... */}
      <Button type="submit" disabled={isPending}>
        {isPending ? 'Creating...' : 'Create User'}
      </Button>
    </Form>
  )
}
```

---

## Custom Hook Pattern

```ts
// Extract any logic > 10 lines from a component into a hook
// Hook name: use{Noun} or use{Verb}{Noun}
// One hook = one concern

// hooks/use-auth-session.ts
export function useAuthSession() {
  const { data: session, isLoading } = useQuery({
    queryKey: ['session'],
    queryFn: getSession,
    staleTime: 5 * 60 * 1000,  // 5 minutes
  })

  const isAuthenticated = !!session?.user
  const user = session?.user ?? null

  return { session, isLoading, isAuthenticated, user }
}

// hooks/use-create-user.ts
export function useCreateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateUserDto) => api.post('/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}
```

---

## Data Fetching — TanStack Query Rules

```ts
// Query keys are arrays — always start with entity name
queryKey: ['users']
queryKey: ['users', id]
queryKey: ['users', { status: 'active' }]

// Stale times
// Static/reference data: Infinity
// User data: 5 * 60 * 1000 (5 min)
// Real-time data: 0 (always fresh)
// Default: 60 * 1000 (1 min)

// Never fetch in useEffect — use useQuery
// ❌
useEffect(() => {
  fetch('/api/users').then(r => r.json()).then(setUsers)
}, [])

// ✅
const { data: users } = useQuery({
  queryKey: ['users'],
  queryFn: () => api.get('/users'),
})
```

---

## Form Pattern (React Hook Form + Zod)

```tsx
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

export function LoginForm() {
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  function handleSubmit(data: LoginFormData) {
    // data is validated and typed
  }

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          {...form.register('email')}
          aria-describedby="email-error"
        />
        {form.formState.errors.email && (
          <p id="email-error" className="text-sm text-destructive">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>
      <Button type="submit" disabled={form.formState.isSubmitting} className="w-full">
        {form.formState.isSubmitting ? 'Signing in...' : 'Sign in'}
      </Button>
    </form>
  )
}
```

---

## Error Boundary Pattern

```tsx
// Every page that fetches data needs an error boundary
// Use loading.tsx + error.tsx in App Router

// app/users/loading.tsx
export default function UsersLoading() {
  return <UserListSkeleton />
}

// app/users/error.tsx
'use client'
export default function UsersError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-8">
      <p className="text-sm text-muted-foreground">Something went wrong</p>
      <Button variant="outline" size="sm" onClick={reset}>Try again</Button>
    </div>
  )
}
```

---

## `cn()` Usage

```ts
// Always use cn() from lib/utils for conditional classNames
import { cn } from '@/lib/utils'

// ✅
<div className={cn(
  "base-classes",
  isActive && "active-classes",
  variant === 'destructive' && "destructive-classes",
  className  // always accept and pass through className prop
)}>

// ❌ — string concatenation
<div className={`base-classes ${isActive ? 'active' : ''}`}>
```

---

## Self-Audit Block

```yaml
frontend_audit:
  skill: frontend-patterns
  server_components_used_by_default: true
  client_directive_only_when_needed: true
  data_fetching_uses_tanstack_query: true
  no_fetch_in_useeffect: true
  forms_use_rhf_and_zod: true
  hooks_extracted_for_logic: true
  cn_used_for_classnames: true
  error_boundaries_present: true
  loading_states_present: true
  overall: pass | fail
```

---

## Composition Rules

```
REQUIRES:   ui-intelligence (load ui-intelligence BEFORE this skill)
SUGGESTS:   tdd-workflow    (test components with Testing Library)
CONFLICTS:  (none)
```
