---
name: git-workflow
version: 1.0.0
category: git
stack:
  - always
severity: soft
triggers:
  - "commit"
  - "push"
  - "branch"
  - "PR"
  - "pull request"
  - "merge"
description: >
  Use before every commit and PR. Enforces conventional commits, branch
  naming, atomic commits, and the rule that nothing goes to main directly.
  The git history is the project's permanent audit trail — make it readable.
---

# Git Workflow

**The git log is a changelog. Write it for the person who reads it at 2am
when something is broken in production.**

---

## Branch Naming

```
feat/short-slug        → new feature
fix/short-slug         → bug fix
chore/short-slug       → maintenance, deps, config
refactor/short-slug    → no behavior change
test/short-slug        → test coverage

Examples:
  feat/user-auth
  fix/dashboard-null-stats
  chore/upgrade-typeorm
  refactor/pagination-cursor
```

Always branch from main. Never commit to main directly.

---

## Commit Message Format

```
<type>(<scope>): <short description>

Types:
  feat      New feature or user-visible behavior change
  fix       Bug fix
  chore     Deps, config, tooling (no production code change)
  refactor  Structural improvement, behavior unchanged
  test      Adding or fixing tests
  docs      Documentation only
  perf      Performance improvement
  ci        CI/CD pipeline changes

Scope: the module or domain affected (auth, users, dashboard, api, ui)

Short description: imperative mood, lowercase, no period
  ✅ "add JWT refresh token rotation"
  ❌ "Added JWT refresh token rotation."
  ❌ "adds jwt refresh"

Examples:
  feat(auth): add JWT refresh token rotation
  fix(dashboard): handle null stats on first load
  chore(deps): upgrade TypeORM to 0.3.20
  test(users): add edge case for duplicate email
  refactor(pagination): switch from offset to cursor
  docs(readme): add setup instructions for Railway
```

---

## Atomic Commit Rules

One commit = one logical unit of work.

```
✅ Atomic:
  feat(auth): add register endpoint
  feat(auth): add login endpoint
  feat(auth): add JWT refresh logic
  test(auth): add auth endpoint tests

❌ Not atomic:
  feat: add auth, fix dashboard bug, upgrade deps, refactor users
```

Never batch unrelated changes. Even if they're small.
Reviewers and `git blame` users will thank you.

---

## PR Rules

```
PR title = commit message format (it becomes the squash commit)
PR description: what changed, why, how to test

Before pushing:
  [ ] tsc — zero errors
  [ ] All tests passing
  [ ] No console.log or debug statements
  [ ] No TODO/FIXME without a log entry reference
  [ ] .env changes reflected in .env.example

Merge strategy: Squash and merge (one clean commit per PR)
```

---

## .gitignore Essentials

```
.env
.env.local
.env.production
node_modules/
dist/
.next/
coverage/
*.log
.DS_Store
```

Never commit `.env`. Always keep `.env.example` up to date.

---

## Self-Audit Block

```yaml
git_audit:
  skill: git-workflow
  branch_from_main: true
  no_direct_main_commits: true
  commit_message_conventional: true
  commit_is_atomic: true
  no_env_files_committed: true
  env_example_updated: true
  overall: pass | fail
```
