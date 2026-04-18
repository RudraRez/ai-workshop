# Setup Guide

---

## Prerequisites

| What | Why |
|---|---|
| Docker Desktop | Local Postgres + Redis |
| Claude Code CLI | The build engine — `npm install -g @anthropic-ai/claude-code` |
| Anthropic API key | Set `ANTHROPIC_API_KEY` in your shell |
| Your language runtime | See `project/TECH-STACK.md` for required version |

---

## 1. Clone and Configure

```bash
git clone <repo-url>
cd <repo>
```

---

## 2. Generate Stack Config (if starting fresh)

```bash
open project-starter.html
```

Walk through the wizard, download the ZIP, unzip over this repo:

```bash
unzip ~/Downloads/<project>-boilerplate.zip -o
```

This drops in your stack-specific `.claude/CLAUDE.md`, `project/TECH-STACK.md`,
and all 17 skills adapted to your language and framework.

---

## 3. Environment Variables

```bash
cp .env.example .env
```

Edit `.env` — fill in required values. The app refuses to start if
required variables are missing.

---

## 4. Start Infrastructure

```bash
make dev-infra
```

This starts PostgreSQL + Redis via Docker Compose.

---

## 5. Scaffold with Claude Code

```bash
claude
```

In Claude Code:

```
/plan       — Claude reads project/ files, asks questions, generates plan
/approve    — approve the plan
/execute    — Phase 0 scaffolds your app (installs deps, creates structure,
              runs migrations, sets up linting/testing)
```

After Phase 0, your `apps/` directory will contain the scaffolded application
with your chosen framework, and the Makefile will have real `dev`, `test`,
`lint`, `build` commands.

---

## 6. Verify Setup

```bash
make dev     # Start the app
make test    # Run tests
```

---

## 7. Continue Building

```
/execute     — Claude builds features phase by phase
/status      — Check progress
/logs        — See task logs
/approve     — Advance at each gate
```

---

## Resuming on a Fresh Machine

```bash
git clone <repo-url>
cd <repo>
cp .env.example .env   # fill in values

# Install deps (command depends on your stack — check Makefile)
make setup

# Open Claude Code
claude
/status   # see where the build left off
```

Claude reads `.claude/MEMORY.md` — full context restored.

---

## Common Commands

```bash
make help       # Show all available commands
make dev        # Start everything
make dev-infra  # Start Docker services only
make stop       # Stop Docker services
make test       # Run all tests
make lint       # Run linter
make build      # Production build
make clean      # Remove build artifacts
make logs       # Tail Docker logs
```

---

## For detailed lifecycle guide

See `docs/PROJECT-LIFECYCLE-GUIDE.md` — covers requirements writing,
change requests, and day-to-day development.
