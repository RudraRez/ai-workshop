.PHONY: dev dev-infra stop setup test lint build logs clean help

# ═══════════════════════════════════════════════════════════════════════════════
# Launchpad Boilerplate — Stack-Agnostic Makefile
# ═══════════════════════════════════════════════════════════════════════════════
#
# This Makefile provides infrastructure commands that work for any stack.
# Claude Code Phase 0 adds stack-specific targets (dev-api, dev-web, db-migrate,
# etc.) to this file based on your project/TECH-STACK.md.
#
# Run `make help` to see all available commands.
# ═══════════════════════════════════════════════════════════════════════════════

# ── Infrastructure (works for all stacks) ────────────────────────────────────

dev-infra: ## Start Docker services (Postgres + Redis)
	@docker compose -f infra/docker-compose.yml up -d
	@echo "Waiting for Postgres..."
	@until docker exec launchpad_postgres pg_isready -U postgres > /dev/null 2>&1; do sleep 1; done
	@echo "Postgres ready."

stop: ## Stop all Docker services
	@docker compose -f infra/docker-compose.yml down

logs: ## Tail Docker service logs
	@docker compose -f infra/docker-compose.yml logs -f

# ── Setup ────────────────────────────────────────────────────────────────────

setup: ## First-time setup: copy env, start infra
	@test -f .env || cp .env.example .env
	@echo "Created .env from .env.example — fill in required values."
	@$(MAKE) dev-infra
	@echo ""
	@echo "Setup complete. Next steps:"
	@echo "  1. Edit .env with your values"
	@echo "  2. Run: claude"
	@echo "  3. Type: /plan"

# ── Placeholder targets (replaced by Phase 0) ───────────────────────────────
# Claude Code Phase 0 (Foundation) replaces these with real commands
# based on your chosen stack. These exist so `make dev` etc. don't fail
# before scaffolding.

dev: dev-infra ## Start everything (replaced by Phase 0)
	@echo "App not scaffolded yet. Run 'claude' then '/execute' to scaffold."

test: ## Run tests (replaced by Phase 0)
	@echo "App not scaffolded yet. Run 'claude' then '/execute' to scaffold."

lint: ## Run linter (replaced by Phase 0)
	@echo "App not scaffolded yet. Run 'claude' then '/execute' to scaffold."

build: ## Production build (replaced by Phase 0)
	@echo "App not scaffolded yet. Run 'claude' then '/execute' to scaffold."

clean: ## Remove build artifacts
	@echo "Cleaning build artifacts..."
	@find . -name "node_modules" -type d -prune -exec rm -rf {} + 2>/dev/null || true
	@find . -name "dist" -type d -prune -exec rm -rf {} + 2>/dev/null || true
	@find . -name ".next" -type d -prune -exec rm -rf {} + 2>/dev/null || true
	@find . -name "target" -type d -prune -exec rm -rf {} + 2>/dev/null || true
	@find . -name "build" -type d -prune -exec rm -rf {} + 2>/dev/null || true
	@find . -name "__pycache__" -type d -prune -exec rm -rf {} + 2>/dev/null || true
	@find . -name ".venv" -type d -prune -exec rm -rf {} + 2>/dev/null || true
	@find . -name "coverage" -type d -prune -exec rm -rf {} + 2>/dev/null || true
	@echo "Done."

# ── Help ─────────────────────────────────────────────────────────────────────

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help

# ═══════════════════════════════════════════════════════════════════════════════
# Phase 0 inserts stack-specific targets below this line.
# Do not remove this comment — it marks the insertion point.
# ═══════════════════════════════════════════════════════════════════════════════
