# Launchpad Boilerplate

> A stack-agnostic, Claude Code-powered project starter. Pick your language,
> pick your framework, run `/plan`, approve, run `/execute`. Claude Code builds
> with specialist agent teams, logs every task, and waits for your approval
> at every stage gate.

---

## What This Is

A production-ready project boilerplate where **Claude Code is the build engine**.
No orchestration UI, no external service — just Claude Code, 17 enforced skills,
and a structured workflow that ships products with a full audit trail.

**Any stack.** TypeScript, Java, Python, Go, Rust, C#, Ruby, PHP, Kotlin, Swift, Elixir.

---

## How It Works

### 1. Generate your stack config (5 min)

```bash
open project-starter.html
```

Interactive wizard: pick language, backend framework, frontend framework,
database, features, deploy target. Downloads a ZIP with:

- `.claude/CLAUDE.md` — brain file adapted to your stack
- `project/TECH-STACK.md` — your choices
- `project/BRIEF.md` — pre-filled with project name
- 17 skill files — all adapted to your language (Spring Boot patterns for Java,
  FastAPI patterns for Python, JUnit tests for Java, pytest for Python, etc.)

### 2. Set up the repo (10 min)

```bash
git clone <this-repo-url> my-project
cd my-project
unzip ~/Downloads/<project>-boilerplate.zip -o
cp .env.example .env     # fill in required values
make dev-infra           # start Postgres + Redis
```

### 3. Fill in your requirements (30 min — your job)

```
project/BRIEF.md          ← what you're building and why
project/REQUIREMENTS.md   ← MoSCoW requirements, specific
project/CONVENTIONS.md    ← code style, naming rules
project/CONSTRAINTS.md    ← hard limits, quality gates
```

### 4. Plan and build with Claude Code

```bash
claude                    # open Claude Code
```

```
/plan          → Claude reads everything, asks questions, writes the plan
/approve       → green-light the plan
/execute       → Claude scaffolds your app + builds features phase by phase
/status        → check progress
/approve       → advance at each stage gate
/review        → quality gate (adversarial review + test coverage)
/approve       → ship
```

---

## How the Build Works

Claude orchestrates **specialist agent teams** — never a single generalist:

| Phase | Team | What ships |
|---|---|---|
| 0 — Foundation | Architect → Backend Dev | App scaffold, DB schema, base config |
| 1 — Auth | Backend Dev → Frontend Dev | Auth API + Auth UI with formal handoff |
| 2 — Core features | Architect + Backend Dev + Frontend Dev | Feature implementation |
| 3 — Billing | Billing Dev + Backend Dev | Payment integration (if selected) |
| 4 — Quality gate | Reviewer (fresh) ‖ Tester | Adversarial review + test coverage |
| 5 — Ship | DevOps only | Deploy + GitHub PR |

Every task gets its own log file **before** work starts. Claude stops and
asks you when it needs a decision.

---

## Supported Stacks

| Language | Backend Frameworks | Frontend Options |
|---|---|---|
| TypeScript | NestJS, Express, Fastify, Hono | Next.js, React+Vite, Remix, Svelte, Vue, Angular |
| JavaScript | Express, Fastify, Hono | Next.js, React+Vite, Vue, Svelte |
| Java | Spring Boot, Quarkus, Micronaut | Next.js, React, Thymeleaf, Angular, HTMX, Vaadin |
| Python | FastAPI, Django, Flask | Next.js, HTMX, Django Templates |
| Go | Gin, Echo, Chi, Fiber | Next.js, React, HTMX, Templ |
| Rust | Axum, Actix Web, Rocket | Next.js, Leptos, Yew |
| C# | ASP.NET Core, Minimal API | Blazor, Next.js, Angular |
| Ruby | Rails, Sinatra | Hotwire, Next.js |
| PHP | Laravel, Symfony | Livewire, Inertia, Next.js |
| Kotlin | Spring Boot, Ktor | Next.js, Thymeleaf |
| Swift | Vapor | SwiftUI, Next.js |
| Elixir | Phoenix | LiveView, Next.js |

---

## Skills (17 enforced)

| Skill | Severity | Adapts to stack? |
|---|---|---|
| `workflow-ship-faster` | hard | No — universal |
| `team-orchestration` | hard | Yes — agent ownership |
| `adversarial-review` | hard | No — universal |
| `tdd-workflow` | hard | Yes — test examples per language |
| `ui-intelligence` | hard | Yes — JSX vs templates |
| `security-review` | hard | Yes — framework checklist |
| `backend-patterns` | soft | Yes — full rewrite per framework |
| `frontend-patterns` | soft | Yes — per UI framework |
| `api-design` | soft | No — REST universal |
| `git-workflow` | soft | No — universal |
| `continuous-learning` | soft | No — universal |
| `context-doctor` | soft | No — universal |
| `brainstorming` | soft | No — universal |
| `writing-plans` | soft | No — universal |
| `writing-skills` | soft | No — universal |
| `build-error-resolver` | soft | No — universal |
| `systematic-debugging` | soft | No — universal |

---

## Directory Structure

```
.claude/
  CLAUDE.md             ← master brain — read every session
  MEMORY.md             ← cross-session learning
  SKILL-FORMAT.md       ← how to create new skills
  commands/             ← /plan, /execute, /status, /review
  skills/               ← 17 skill files (generated by wizard)
  agents/               ← specialist agent definitions
project/
  BRIEF.md              ← fill this first
  REQUIREMENTS.md       ← MoSCoW requirements
  CONVENTIONS.md        ← code style rules
  CONSTRAINTS.md        ← hard limits, quality gates
  TECH-STACK.md         ← confirmed tech choices
apps/
  (empty)               ← Claude scaffolds here during Phase 0
packages/
  (empty)               ← shared code (if monorepo)
docs/
  SETUP.md              ← setup guide
  PROJECT-LIFECYCLE-GUIDE.md  ← full lifecycle + CR handling
  ARCHITECTURE.md       ← generated during /plan
logs/
  backend/              ← per-task backend logs
  frontend/             ← per-task frontend logs
  decisions/            ← architecture decisions, handoffs
  inputs/               ← your answers to Claude's questions
infra/
  docker-compose.yml    ← Postgres + Redis
Makefile                ← dev, test, build (populated by Phase 0)
project-starter.html    ← interactive stack config wizard
.env.example            ← env vars (expanded by Phase 0)
```

---

## Requirements

- Docker Desktop
- Claude Code CLI (`npm install -g @anthropic-ai/claude-code`)
- Anthropic API key
- Your language runtime (Node 20+ / Java 21+ / Python 3.12+ / Go 1.22+ / etc.)

See `docs/SETUP.md` for detailed setup. See `docs/PROJECT-LIFECYCLE-GUIDE.md`
for requirements writing, change requests, and day-to-day development.
