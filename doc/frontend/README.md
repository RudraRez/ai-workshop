# Frontend — AI Tutor Module

> Next.js 15 App Router. shadcn/ui + Tailwind. TanStack Query for server
> state. NextAuth for session. React Hook Form + Zod for forms. WebSocket
> client for live tutor streaming.
> Owned by the **Frontend Dev** agent. See `doc/ARCHITECTURE.md` and
> `doc/API-CONTRACT.md`.

---

## 1. App Identity

| Attribute | Value |
|---|---|
| Framework | Next.js 15 (App Router — **not** Pages Router) |
| Dev port | 3000 |
| Backend base URL | `NEXT_PUBLIC_API_BASE_URL` (default `http://localhost:5094`) |
| WebSocket URL | `NEXT_PUBLIC_WS_URL` (default `ws://localhost:5094/tutor`) |
| Auth | NextAuth.js (forwards SKEP-issued JWT) |

---

## 2. Directory Layout

```
apps/frontend/src/
├── app/
│   ├── layout.tsx                        # Root HTML, theme, fonts
│   ├── globals.css
│   ├── api/auth/[...nextauth]/route.ts   # NextAuth handler
│   ├── (public)/
│   │   ├── layout.tsx                    # Unauth layout
│   │   ├── page.tsx                      # Marketing / redirect
│   │   └── login/page.tsx
│   └── (authed)/
│       ├── layout.tsx                    # AuthGuard + sidebar + QueryProvider
│       ├── sessions/
│       │   ├── page.tsx                  # List
│       │   ├── new/page.tsx              # Create
│       │   └── [id]/
│       │       ├── page.tsx              # Chat with AI (SSR shell + CSR room)
│       │       └── transcript/page.tsx
│       └── settings/page.tsx             # OWNER | ADMIN only
├── components/
│   ├── ui/                               # shadcn/ui primitives (copy-owned)
│   ├── auth/auth-guard.tsx
│   ├── layout/{sidebar,topbar}.tsx
│   └── tutor/
│       ├── session-card.tsx
│       ├── chat-thread.tsx               # message list w/ streaming
│       ├── message-input.tsx
│       └── token-stream.tsx              # animated cursor while streaming
├── hooks/
│   ├── use-current-user.ts
│   ├── use-sessions.ts
│   ├── use-session.ts
│   ├── use-messages.ts
│   └── use-tutor-socket.ts               # wraps Socket.IO client
├── lib/
│   ├── api-client.ts                     # typed fetcher + Zod envelope parsing
│   ├── query-keys.ts                     # centralized TanStack Query key factory
│   ├── socket.ts                         # Socket.IO singleton factory
│   ├── auth.ts                           # NextAuth config
│   └── utils.ts                          # cn(), formatters
└── providers/
    └── query-provider.tsx                # QueryClient + devtools in dev
```

---

## 3. Route Groups

| Group | Purpose | Guard |
|---|---|---|
| `(public)` | Login, marketing | None |
| `(authed)` | All authenticated surfaces | `AuthGuard` in the layout — redirects to `/login` if no session |

### Routes

| Path | SSR/CSR | Roles | Calls |
|---|---|---|---|
| `/login` | SSR shell, CSR form | — | `signIn()` (NextAuth credentials) |
| `/` | SSR | — | Redirects authed → `/sessions`, else `/login` |
| `/sessions` | SSR list + CSR pagination | OWNER, ADMIN, MEMBER | `GET /api/v1/tutor/sessions` |
| `/sessions/new` | CSR form | OWNER, ADMIN, MEMBER | `POST /api/v1/tutor/sessions` |
| `/sessions/[id]` | SSR shell, CSR chat + WS | OWNER, ADMIN, MEMBER | `GET /api/v1/tutor/sessions/:id`, WS `/tutor` |
| `/sessions/[id]/transcript` | SSR | OWNER, ADMIN, MEMBER | `GET /api/v1/tutor/sessions/:id/transcript` |
| `/settings` | SSR form, CSR submit | OWNER, ADMIN | `GET/PUT /api/v1/tutor/settings` |

Role enforcement happens **on the backend**. Frontend hides controls that would 403 — never relies on client-side checks as a security boundary.

---

## 4. Typed API Client

```ts
// lib/api-client.ts
import { successEnvelope, errorEnvelope } from '@skep/shared/schemas/envelope';
import { getServerSession } from 'next-auth';
import { z } from 'zod';

export async function apiFetch<T extends z.ZodTypeAny>(
  path: string,
  schema: T,
  init: RequestInit = {},
): Promise<z.infer<T>> {
  const session = await getServerSession(authOptions);
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      ...(session?.accessToken ? { authorization: `Bearer ${session.accessToken}` } : {}),
      ...init.headers,
    },
  });

  const body = await res.json();

  if (!res.ok) {
    const err = errorEnvelope.parse(body);
    throw new ApiError(err.error.code, err.error.message, res.status, err.error.details);
  }

  return successEnvelope(schema).parse(body).data;
}
```

Every API call goes through `apiFetch` so:
- JWT is always attached.
- Response is always parsed with Zod (catches shape drift immediately).
- Errors are typed and carry the backend error code.

---

## 5. Query Key Strategy

```ts
// lib/query-keys.ts
export const keys = {
  me: () => ['me'] as const,
  sessions: {
    all: () => ['sessions'] as const,
    list: (filters: SessionListFilters) => ['sessions', 'list', filters] as const,
    detail: (id: string) => ['sessions', 'detail', id] as const,
    messages: (id: string) => ['sessions', id, 'messages'] as const,
    transcript: (id: string) => ['sessions', id, 'transcript'] as const,
  },
  settings: () => ['settings'] as const,
};
```

All invalidation goes through `keys.*`. Never inline a raw key array in a component.

---

## 6. Hook Canonical Shape

```ts
// hooks/use-sessions.ts
export function useSessions(filters: SessionListFilters) {
  return useQuery({
    queryKey: keys.sessions.list(filters),
    queryFn: () => apiFetch(`/api/v1/tutor/sessions?${qs(filters)}`, sessionListSchema),
    staleTime: 30_000,
  });
}

export function useCreateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateSessionDto) =>
      apiFetch('/api/v1/tutor/sessions', sessionSchema, {
        method: 'POST',
        body: JSON.stringify(dto),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: keys.sessions.all() }),
  });
}
```

---

## 7. WebSocket Client (Tutor Streaming)

```ts
// hooks/use-tutor-socket.ts
export function useTutorSocket(sessionId: string) {
  const { data: session } = useSession();
  const [state, setState] = useState<TutorState>({ messages: [], streaming: null });

  useEffect(() => {
    if (!session?.accessToken) return;
    const socket = getSocket(session.accessToken);  // lib/socket.ts singleton
    socket.on('tutor:token', ({ sessionId: sid, token }) => {
      if (sid !== sessionId) return;
      setState(s => ({ ...s, streaming: (s.streaming ?? '') + token }));
    });
    socket.on('tutor:answer', ({ sessionId: sid, message }) => {
      if (sid !== sessionId) return;
      setState(s => ({ messages: [...s.messages, message], streaming: null }));
    });
    return () => { socket.off('tutor:token'); socket.off('tutor:answer'); };
  }, [session?.accessToken, sessionId]);

  const ask = useCallback((prompt: string) => {
    getSocket(session!.accessToken).emit('tutor:ask', {
      sessionId, prompt, requestId: crypto.randomUUID(),
    });
  }, [sessionId, session?.accessToken]);

  return { ...state, ask };
}
```

Design notes:
- One Socket.IO connection per tab (singleton).
- Auth via `handshake.auth.token` on initial connect.
- Server sends `tutor:token` repeatedly (streaming) then `tutor:answer` (final).
- Optimistic user message insertion happens in the component before `ask()` emits.

---

## 8. Forms — React Hook Form + Zod

```tsx
const form = useForm<z.infer<typeof createSessionSchema>>({
  resolver: zodResolver(createSessionSchema),
  defaultValues: { topic: '' },
});

const mutation = useCreateSession();

const onSubmit = form.handleSubmit(async (values) => {
  try {
    const session = await mutation.mutateAsync(values);
    router.push(`/sessions/${session.id}`);
  } catch (err) {
    if (err instanceof ApiError) {
      toast.error(err.message);
    }
  }
});
```

Shared schemas live in `packages/shared/`. **Never** redefine a schema in the frontend — import it.

---

## 9. UI Rules (hard — from `skills/ui-intelligence`)

| No | Yes |
|---|---|
| Gradient backgrounds | Solid, tokenized background colors |
| Glassmorphism / heavy blur | Flat surfaces with clear borders |
| Gradient call-to-action buttons | Solid-color CTAs with explicit hover/active states |
| Border radius exceeding design tokens | Use `--radius-*` tokens from `DESIGN-SYSTEM.json` |
| Decorative floating elements | Function-first layouts |
| Emoji as iconography | `lucide-react` icons only |
| Fake dashboard charts with placeholder data | Real data, or explicit empty state |
| `text-gray-*` without theme mapping | `text-muted-foreground` / theme tokens |
| Animation on scroll as a default | Motion only where it aids comprehension |
| Over-nested cards (cards inside cards) | Flat hierarchy |
| Magic numbers in spacing | Tailwind scale + `--spacing-*` |
| Inconsistent density | One density per surface |

The `ui-intelligence` self-audit is a **hard gate** — handoff blocks until all twelve pass.

---

## 10. Accessibility

- Target: WCAG 2.1 AA (from `REQUIREMENTS.md` template default).
- All interactive elements keyboard-operable; visible focus ring mandatory.
- Every form field has a `<label>`; error messages referenced via `aria-describedby`.
- Radix primitives (via shadcn/ui) handle most roles/ARIA — **don't** override their markup without reading the primitive's docs.
- Color contrast checked at every component build.

---

## 11. Config & Env

```
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<random 32+ chars>
NEXT_PUBLIC_API_BASE_URL=http://localhost:5094
NEXT_PUBLIC_WS_URL=ws://localhost:5094/tutor
```

- Anything prefixed with `NEXT_PUBLIC_` is **shipped to the browser** — never put a secret there.
- `NEXTAUTH_SECRET` is server-only and required in prod.

---

## 12. Testing

- **Component:** Vitest + React Testing Library. Co-located `*.test.tsx`.
- **E2E:** Playwright. Golden path: login → create session → ask → receive streamed answer → view transcript.
- **Contract:** every hook asserts response shape via its imported shared Zod schema — drift between FE and BE fails a test, not production.
- **A11y:** `axe-playwright` scan on every authed page during E2E.

Run: `pnpm --filter frontend test` and `pnpm --filter frontend e2e`.

---

## 13. Performance

| Metric | Budget |
|---|---|
| LCP | < 2.5s |
| TTI | < 3.5s |
| Route JS (uncompressed) | < 180KB per route |
| Largest client component | < 40KB |

Lean on Server Components for lists/static surfaces. Interactive surfaces (`/sessions/[id]`) are client components but kept tight.

---

## 14. Common Pitfalls to Avoid

| Don't | Do instead |
|---|---|
| Direct `fetch()` in a component | `apiFetch` via a hook |
| Raw `['sessions', id]` query keys | `keys.sessions.detail(id)` |
| `any` in hooks or components | Parse with Zod — get an inferred type |
| Client-side role gating as security | Server enforces; FE hides UI for UX |
| One socket per component mount | Singleton in `lib/socket.ts` |
| Storing server data in Zustand | TanStack Query owns server state |
| Over-optimistic updates on destructive actions | Wait for 200, then invalidate |
| Passing JWT via `NEXT_PUBLIC_*` | Never. JWT lives server-side and in httpOnly cookies. |

---

## 15. Definition of Done (per-task)

- [ ] TypeScript: zero errors.
- [ ] Component tests + hook tests pass.
- [ ] A11y: axe scan clean on the page.
- [ ] `ui-intelligence` self-audit: `overall: pass`.
- [ ] Playwright smoke green for golden path.
- [ ] Log file moved to `DONE`.
- [ ] Conventional commit.
