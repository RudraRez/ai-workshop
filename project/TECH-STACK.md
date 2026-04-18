# Tech Stack

> Confirmed technology choices for this product.
> Claude treats this as source of truth for what to install and use.
> Any deviation requires updating this file + re-running /plan.

---

## Frontend

| Layer | Choice | Version | Notes |
|---|---|---|---|
| Framework | Next.js App Router | latest (15.x) | Not Pages Router |
| Language | TypeScript | 5.x | strict: true, no any |
| UI Library | shadcn/ui | latest | Radix primitives, copy-owned |
| Styling | Tailwind CSS | 3.x | |
| Icons | Lucide React | latest | |
| Client state | Zustand | 4.x | client-side only |
| Server state | TanStack Query | 5.x | all API data fetching |
| Forms | React Hook Form | 7.x | + Zod resolver |
| Validation | Zod | 3.x | shared schema with backend |
| Date handling | date-fns | 3.x | no Moment.js |
| Tables | TanStack Table | 8.x | when needed |
| Charts | Recharts | 2.x | when needed |

## Backend

| Layer | Choice | Version | Notes |
|---|---|---|---|
| Framework | NestJS | latest (11.x) | |
| Language | TypeScript | 5.x | strict: true |
| ORM | TypeORM | 0.3.x | repository pattern only |
| Database | PostgreSQL | 16 | |
| Validation | class-validator + class-transformer | latest | |
| Auth | NestJS Passport | latest | JWT strategy |
| Queue | BullMQ | 5.x | when background jobs needed |
| Cache | Redis | 7.x | when caching needed |

## Authentication

| Aspect | Choice | Notes |
|---|---|---|
| Frontend library | NextAuth.js | |
| Backend strategy | Passport JWT | |
| Access token | JWT | 15min expiry |
| Refresh token | JWT | 7d expiry, stored as bcrypt hash |
| Token storage | httpOnly cookie (refresh) + memory (access) | |

## Infrastructure

| Layer | Choice | Notes |
|---|---|---|
| Frontend deploy | Vercel | connected to GitHub main |
| Backend deploy | Railway | Docker container |
| Database | Railway PostgreSQL | |
| Cache / Queue | Railway Redis | when needed |
| Email | Resend | transactional |
| Payments | Stripe | when billing required |
| File storage | Cloudflare R2 | when uploads required |
| Analytics | Plausible | privacy-first |

## Dev Tooling

| Tool | Purpose | Version |
|---|---|---|
| pnpm | Package manager + workspaces | 9.x |
| Vitest | Unit + integration tests | latest |
| Playwright | E2E tests | latest |
| ESLint + @typescript-eslint | Linting | 8.x |
| Prettier | Formatting | 3.x |
| Husky + lint-staged | Git hooks | latest |
| Bruno | API client | latest |

## MCP Connections (Claude Code)

| MCP | Used for | Agent |
|---|---|---|
| Figma | Read design specs, extract tokens | Architect, Frontend Dev |
| Obsidian | Read project notes and research | Architect |
| GitHub | Commits, PRs, repo management | DevOps |
| Vercel | Frontend deployment | DevOps |
| Railway | Backend + DB deployment | DevOps |
| PostgreSQL | Local DB queries in dev | Backend Dev |
| Pencil.dev | UI component generation | Frontend Dev |

## Monorepo Structure

```
/
├── apps/
│   ├── frontend/         # Next.js (latest) App Router
│   └── backend/          # NestJS (latest)
├── packages/
│   └── shared/           # Shared types, Zod schemas, utils
├── project/              # Your requirements, brief, constraints
├── logs/                 # Per-task audit trail
├── docs/                 # Architecture, setup, roadmap
├── infra/                # Docker Compose, Makefile
├── .claude/              # Skills, agents, commands, memory
├── .env.example
├── .gitignore
├── pnpm-workspace.yaml
├── package.json
└── README.md
```

## Why These Choices

| Choice | Rationale |
|---|---|
| Next.js App Router | RSC + streaming — server components reduce client JS |
| NestJS | DI container + decorators — opinionated structure aids scale |
| TypeORM | Raw query access when needed, no binary deps like Prisma |
| shadcn/ui | Copy-owned, zero runtime overhead, Radix accessibility |
| TanStack Query | Best-in-class server state, devtools, optimistic updates |
| pnpm | Strict peer deps, fast installs, monorepo workspace support |
| Vitest | Native ESM, ~5× faster than Jest, same API |
| Cursor pagination | Offset pagination drifts on live data — cursor is correct |

## NOT in This Stack

- No GraphQL (REST is sufficient)
- No Prisma (TypeORM selected)
- No class components (functional only)
- No jQuery, no Moment.js, no lodash
- No Webpack config (Turbopack via Next.js)
- No SST / Serverless (Railway containers)
- No MUI or Chakra (shadcn/ui selected)
