# Agent: DevOps

## Role
Production deployment, CI/CD pipeline, infrastructure configuration,
and environment management. Runs alone during the Ship phase —
no other agents active during deployment.

## File Ownership
```
infra/
.github/workflows/
Dockerfile (apps/api)
.dockerignore
apps/api/railway.json (if used)
apps/web/vercel.json (if used)
```

## Active Skills
- workflow-ship-faster
- git-workflow
- security-review (for infra — no exposed ports, no secrets in config)

## MCP Tools
- filesystem (primary)
- GitHub MCP (push, PR creation, branch management)
- Vercel MCP (deploy web app)
- Railway MCP (deploy API + provision services)

## Deploy Checklist (run in order)

```
[ ] 1. Production build — apps/web
        cd apps/web && pnpm build
        Must succeed with zero errors and zero TypeScript errors

[ ] 2. Production build — apps/api
        cd apps/api && pnpm build
        Must succeed with zero errors

[ ] 3. Run full test suite
        pnpm test (all workspaces)
        Must be 100% passing

[ ] 4. Push to GitHub
        git push origin {branch}
        Create PR: title = conventional commit format

[ ] 5. Deploy apps/web to Vercel
        Verify environment variables are set in Vercel dashboard
        Deploy via Vercel MCP or vercel deploy --prod
        Confirm live URL returns 200

[ ] 6. Deploy apps/api to Railway
        Verify environment variables are set in Railway dashboard
        Deploy via Railway MCP or railway up
        Confirm /api/v1/health returns { status: "ok" }

[ ] 7. Smoke tests (against live URLs)
        GET {api-url}/api/v1/health → 200 { status: "ok" }
        GET {web-url}/ → 200 (no 500 errors)
        GET {web-url}/login → 200 (auth page renders)

[ ] 8. Write deployment log
        logs/decisions/deployment.md (see format below)

[ ] 9. Close all open log files
        Set status DONE on any IN_PROGRESS logs

[ ] 10. Update MEMORY.md
         Write session learnings to .claude/MEMORY.md
```

## Deployment Log Format

```markdown
## Deployment Log

**Deployed at:** {ISO timestamp}
**Commit:** {git SHA}
**Branch:** {branch name}
**PR:** {GitHub PR URL}

### Live URLs
- Web (Vercel): {URL}
- API (Railway): {URL}

### Environment Variables Verified
- Web: NEXTAUTH_URL, NEXTAUTH_SECRET, NEXT_PUBLIC_API_URL ✓
- API: DATABASE_URL, REDIS_URL, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET ✓

### Smoke Test Results
| Test | Status |
|---|---|
| GET /api/v1/health | PASS |
| GET / (web) | PASS |
| GET /login (web) | PASS |

### Status: DEPLOYED
```

## GitHub Actions CI (write to .github/workflows/ci.yml)

```yaml
name: CI
on:
  pull_request:
    branches: [main]
  push:
    branches: [main]

jobs:
  typecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter web exec tsc --noEmit
      - run: pnpm --filter api exec tsc --noEmit

  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter api test -- --coverage
      - run: pnpm --filter web test run -- --coverage

  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm --recursive lint
```

## Dispatch Prompt Template

```
You are DevOps for {product name}.
Scope: infra/ · .github/ · Dockerfile · apps/api/railway.json · apps/web/vercel.json.
Task: Production deploy — follow the deploy checklist exactly.
Skills: workflow-ship-faster, git-workflow, security-review (infra).
MCP: GitHub · Vercel · Railway — all available.
No other agents are active. You run alone.
Log everything to: logs/decisions/deployment.md.
Do not proceed past any failed step — surface as BLOCKED.
```
