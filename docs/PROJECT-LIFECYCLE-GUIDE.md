# Project Lifecycle Guide

> Complete walkthrough: from zero to production, handling change requests,
> and maintaining a living project. Covers any stack — not just TypeScript.

---

## Table of Contents

1. [Before You Start](#1-before-you-start)
2. [Phase 0 — Generate Your Stack Config](#2-phase-0--generate-your-stack-config)
3. [Phase 1 — Set Up the Repo](#3-phase-1--set-up-the-repo)
4. [Phase 2 — Write Your Requirements](#4-phase-2--write-your-requirements)
   - [How to Write BRIEF.md](#how-to-write-briefmd)
   - [How to Write REQUIREMENTS.md](#how-to-write-requirementsmd)
   - [How to Write CONSTRAINTS.md](#how-to-write-constraintsmd)
   - [How to Write CONVENTIONS.md](#how-to-write-conventionsmd)
   - [How to Write TECH-STACK.md](#how-to-write-tech-stackmd)
   - [Common Mistakes in Requirements](#common-mistakes-in-requirements)
5. [Phase 3 — Plan with Claude](#5-phase-3--plan-with-claude)
6. [Phase 4 — Build](#6-phase-4--build)
7. [Phase 5 — Quality Gate & Ship](#7-phase-5--quality-gate--ship)
8. [Handling Change Requests (CRs)](#8-handling-change-requests-crs)
   - [CR During Active Build](#cr-during-active-build)
   - [CR After Ship (Post-MVP)](#cr-after-ship-post-mvp)
   - [CR Workflow Diagram](#cr-workflow-diagram)
   - [CR Document Template](#cr-document-template)
9. [Day-to-Day Development After Ship](#9-day-to-day-development-after-ship)
10. [Troubleshooting](#10-troubleshooting)
11. [Quick Reference](#11-quick-reference)

---

## 1. Before You Start

### Prerequisites

| What | Why | Install |
|---|---|---|
| Claude Code CLI | The build engine | `npm install -g @anthropic-ai/claude-code` |
| Anthropic API key | Powers Claude | Set `ANTHROPIC_API_KEY` in env |
| Docker Desktop | Local database + services | [docker.com](https://docker.com) |
| Git | Version control | Already installed on most systems |
| Your language runtime | Depends on your stack | Node 20+ / Python 3.12+ / Java 21+ / Go 1.22+ / etc. |

### Time Investment

| Phase | Your time | Claude's time |
|---|---|---|
| Stack config (wizard) | 5 min | — |
| Repo setup | 10 min | — |
| Writing requirements | 30–60 min | — |
| Planning | 10 min (answering Qs) | 15–30 min |
| Building | Approving gates | Hours (autonomous) |
| Quality gate | Review findings | 15–30 min |
| Ship | Final approve | 5–10 min |

**Total your time: ~1–2 hours. Total project delivery: same day for MVPs.**

---

## 2. Phase 0 — Generate Your Stack Config

### Open the Project Starter Wizard

```bash
open project-starter.html
# Or double-click the file in Finder / Explorer
```

### Walk Through 7 Steps

| Step | What you pick | Example |
|---|---|---|
| 1. Project Info | Name, description, type | "InvoiceHub", "Invoice management for freelancers", Web App |
| 2. Language | Primary language | Java, TypeScript, Python, Go, etc. |
| 3. Backend | Framework | Spring Boot, FastAPI, NestJS, Gin, etc. |
| 4. Frontend | Framework | Next.js, React+Vite, Thymeleaf, HTMX, etc. |
| 5. Database | Data store | PostgreSQL, MySQL, MongoDB, etc. |
| 6. Features | Multi-select | Auth, Payments, Email, Docker, CI/CD |
| 7. Deploy | Target | Vercel, Railway, AWS, self-hosted |

### What Gets Generated

Click **"Generate Everything"** — the wizard produces:

```
project/TECH-STACK.md           — Your stack choices, ORM, test framework auto-selected
project/BRIEF.md                — Pre-filled with project name + description
.claude/CLAUDE.md               — Brain file adapted to your stack
.claude/SKILL-FORMAT.md         — How to create new skills
DIRECTORY-STRUCTURE.md          — Recommended folder layout
.claude/skills/
  ├── workflow-ship-faster/     — Execution loop (all stacks)
  ├── team-orchestration/       — Agent ownership for your stack
  ├── tdd-workflow/             — Test examples in YOUR language
  ├── adversarial-review/       — 3-lens security review
  ├── security-review/          — OWASP + framework-specific checklist
  ├── backend-patterns/         — Patterns for YOUR framework (Spring Boot, FastAPI, etc.)
  ├── frontend-patterns/        — Patterns for YOUR UI framework
  ├── ui-intelligence/          — Visual quality rules adapted to your template engine
  ├── api-design/               — REST conventions
  ├── git-workflow/             — Commit format, branch rules
  ├── continuous-learning/      — Cross-session memory
  ├── context-doctor/           — Context health
  ├── brainstorming/            — Requirements refinement
  ├── writing-plans/            — Task breakdown
  ├── writing-skills/           — Skill authoring format
  ├── build-error-resolver/     — Build failure resolution
  └── systematic-debugging/     — 4-phase debugging process
```

### Download

Click **"Download All as ZIP"** — you'll get `{project-name}-boilerplate.zip`.

---

## 3. Phase 1 — Set Up the Repo

### Option A: Fresh Project (Most Common)

```bash
# 1. Clone the boilerplate
git clone <boilerplate-repo-url> my-project
cd my-project

# 2. Unzip the generated config over the boilerplate
#    This overwrites .claude/ and project/ with your stack-specific versions
unzip ~/Downloads/my-project-boilerplate.zip -o

# 3. Install dependencies (varies by language)
pnpm install          # Node.js / TypeScript / JavaScript
pip install -r requirements.txt  # Python
./gradlew build       # Java / Kotlin
go mod download       # Go
cargo build           # Rust
bundle install        # Ruby
composer install      # PHP

# 4. Set up environment
cp .env.example .env
# Edit .env — fill in required values (DB credentials, API keys, etc.)

# 5. Start local infrastructure
docker compose -f infra/docker-compose.yml up -d

# 6. Initialize git
git add -A
git commit -m "chore: initial project setup with Launchpad boilerplate"
```

### Option B: Adding to Existing Project

```bash
cd existing-project

# Copy just the .claude/ directory and project/ templates
cp -r /path/to/boilerplate/.claude ./
cp -r /path/to/boilerplate/project ./
cp -r /path/to/boilerplate/logs ./

# Then unzip wizard output over it
unzip ~/Downloads/config.zip -o

# Fill in project/ files (next phase)
```

### Verify Setup

```bash
# Open Claude Code
claude

# Claude should read .claude/CLAUDE.md automatically
# Type /status — it should show "No active plan. Run /plan to begin."
```

---

## 4. Phase 2 — Write Your Requirements

This is **your job** — and it's the most important 30–60 minutes of the project.
Claude builds exactly what these files describe. Vague input = vague output.

### How to Write BRIEF.md

**Location:** `project/BRIEF.md`

This is the "why" document. Claude reads it first to understand your product.

#### The Good Way

```markdown
## Product Name
InvoiceHub

## One-Line Description
Invoice management for freelance designers who currently use
spreadsheets and lose track of unpaid invoices.

## The Problem
Freelance designers (solo, no accountant) create invoices in Google Docs,
track payments in spreadsheets, and regularly miss follow-ups on overdue
invoices. Average revenue leakage is $2,000–5,000/year per freelancer
due to forgotten invoices.

## The Solution
A simple web app where freelancers create invoices from templates, send
them via email with one click, and get automatic reminders when invoices
are overdue. Core mechanic: reduce time from "work done" to "invoice sent"
from 30 minutes to 2 minutes.

## Target Users
### Primary User
Solo freelance designers with 5–30 active clients. Tech-comfortable but
not developers. Currently using Google Docs + Sheets. Pain: hate admin
work, forget to follow up, lose money.

## Goals for This Build
1. A freelancer can create and send an invoice in under 2 minutes
2. Overdue invoices trigger automatic email reminders
3. Dashboard shows total outstanding, total paid, total overdue at a glance

## What This Is NOT
- Not an accounting tool (no P&L, no tax calculation)
- Not a payment processor (links to external payment, no Stripe checkout)
- Not multi-user/team (solo freelancer only for MVP)
```

#### The Bad Way (Don't Do This)

```markdown
## Product Name
InvoiceApp

## The Problem
People need to send invoices.

## The Solution
An app that does invoices.

## Goals
1. It works
2. It looks good
```

**Why this fails:** Claude has no target user, no constraints, no success
criteria. It will build a generic CRUD app that solves no one's actual problem.

---

### How to Write REQUIREMENTS.md

**Location:** `project/REQUIREMENTS.md`

This is the "what" document. Use **MoSCoW prioritization**.

#### Rules for Good Requirements

1. **Be specific, not vague**
   - Bad: "Users can log in"
   - Good: "Users authenticate with email + password. JWT access token (15min expiry), refresh token (7-day, rotation on use, stored as httpOnly cookie). Password hashed with bcrypt cost 12."

2. **Include edge cases**
   - "What happens when a user tries to create a duplicate invoice number?"
   - "What happens when the email service is down?"

3. **State the acceptance criteria**
   - "Invoice PDF renders correctly in Chrome, Safari, Firefox"
   - "Overdue reminder sends at 9am in the user's timezone"

4. **Use checkboxes** — Claude checks them off as it builds

#### Example: Well-Written Requirements

```markdown
## Must Have — MVP

### Authentication & Users
- [ ] Email + password registration with email verification link
- [ ] Login with JWT (15min access, 7-day refresh, httpOnly cookie)
- [ ] Password reset via email link (expires in 15 minutes)
- [ ] User profile: name, email, business name, business address, logo upload
- [ ] Logout invalidates refresh token

### Invoices (Core Feature)
- [ ] Create invoice: client name, line items (description, qty, rate), tax %, notes
- [ ] Auto-generate invoice number: INV-{YYYY}-{sequential 4-digit}
- [ ] Invoice statuses: Draft → Sent → Viewed → Paid → Overdue
- [ ] Edit draft invoices (cannot edit after Sent)
- [ ] Duplicate an existing invoice as a new draft
- [ ] Delete draft invoices (soft delete, recoverable for 30 days)
- [ ] Invoice PDF generation with business branding (name, address, logo)

### Payments & Reminders
- [ ] Mark invoice as Paid (manual — no payment processing in MVP)
- [ ] Automatic overdue detection: status changes to Overdue after due date
- [ ] Email reminder: 1 day before due, on due date, 3 days after, 7 days after
- [ ] User can disable reminders per invoice

### Dashboard
- [ ] Summary cards: Total Outstanding, Total Paid (this month), Total Overdue
- [ ] Invoice list with search (client name, invoice number) and filter (status)
- [ ] Sort by: date created, due date, amount, status

### API
- [ ] REST API with /api/v1/ prefix
- [ ] All endpoints return consistent error shape: { code, message, statusCode }
- [ ] Cursor-based pagination on list endpoints

## Should Have
- [ ] Dark mode toggle
- [ ] Export invoices as CSV
- [ ] Client address book (save client details for reuse)

## Could Have (Future)
- [ ] Stripe payment links embedded in invoice email
- [ ] Recurring invoices (monthly auto-generate)
- [ ] Multi-currency support

## Won't Have (Explicitly Out of Scope)
- [ ] Team/multi-user accounts
- [ ] Tax calculation or accounting features
- [ ] Mobile native app (responsive web only)
- [ ] In-app payment processing

## Non-Functional Requirements
### Performance
- Page load LCP: < 2.5s
- API p95 response time: < 300ms
- Concurrent users at launch: ~100

### Security
- Authentication: JWT with refresh rotation
- Encrypted at rest: user passwords, business data
- Compliance: GDPR (EU users possible)

### Accessibility
- WCAG 2.1 AA

## Acceptance Criteria
- [ ] Freelancer can go from "new account" to "invoice sent" in under 5 minutes
- [ ] Dashboard loads in under 2 seconds with 100 invoices
- [ ] Overdue reminders send within 1 minute of scheduled time
- [ ] PDF invoice renders correctly in Chrome, Safari, Firefox
- [ ] All critical flows have 100% test coverage
```

---

### How to Write CONSTRAINTS.md

**Location:** `project/CONSTRAINTS.md`

This is the "boundaries" document. Hard rules Claude cannot break.

#### Key Sections to Fill

```markdown
## Scope Constraints
### MVP Definition
A one-paragraph summary of exactly what ships. Claude uses this
to reject scope creep during execution.

### Explicitly Out of Scope
Items Claude will refuse to build even if asked mid-session.

## Technical Constraints
### Stack Locks
Taken from TECH-STACK.md. Table of locked choices + versions.

### Performance Constraints
| Metric | Target | On miss |
|---|---|---|
| Page load LCP | < 2.5s | Block ship |
| API p95 | < 300ms | Log warning |

### Security Constraints
- No secrets in code
- All endpoints behind auth guard
- Bcrypt cost >= 12
- Rate limiting on public endpoints

## Quality Gate Thresholds
| Check | Threshold | On fail |
|---|---|---|
| Type errors | 0 | Block ship |
| Lint errors | 0 | Block ship |
| Test coverage overall | > 60% | Block ship |
| Test coverage auth flows | 100% | Block ship |
| Security scan (OWASP) | 0 critical/high | Block ship |

## Things Claude Must ALWAYS Do
- Create log file BEFORE starting any task
- Wait for /approve at every stage gate
- Run adversarial-review before every handoff

## Things Claude Must NEVER Do
- Add a library not in TECH-STACK.md without asking
- Commit directly to main
- Ship with failing tests
- Return entities directly from API (use DTOs)
```

---

### How to Write CONVENTIONS.md

**Location:** `project/CONVENTIONS.md`

Naming rules, code style, patterns. Varies by language:

| Language | Example conventions |
|---|---|
| **Java** | PascalCase classes, camelCase methods, `src/main/java/com/...` package structure, `@RequiredArgsConstructor` for DI, records for DTOs |
| **Python** | snake_case functions, PascalCase classes, `src/{domain}/` structure, Pydantic for validation |
| **Go** | Exported = PascalCase, unexported = camelCase, `internal/` for private packages, error wrapping with `fmt.Errorf` |
| **TypeScript** | camelCase vars, PascalCase components, kebab-case files, strict mode, no `any` |
| **Ruby** | snake_case everything, service objects for logic, skinny controllers |
| **PHP** | PSR-12, `App\\` namespace, FormRequest for validation |

Tip: If you're unsure, leave it minimal. Claude will follow your stack's conventions by default. Only write rules where you deviate from the standard.

---

### How to Write TECH-STACK.md

**Location:** `project/TECH-STACK.md`

**The wizard generates this for you.** Review it and adjust:
- Version numbers for pinned dependencies
- Add specific libraries you want (e.g., "Use date-fns, not Moment.js")
- Add explicit exclusions under "NOT in This Stack"

---

### Common Mistakes in Requirements

| Mistake | Why it fails | Fix |
|---|---|---|
| "Users can manage their account" | What does "manage" mean? | List exact operations: view, edit name, change password, delete, upload avatar |
| No acceptance criteria | Claude doesn't know when it's done | Add testable criteria for every Must Have |
| Missing edge cases | Claude builds the happy path only | Add: "What happens when X fails?" for every operation |
| No prioritization | Everything is built as equal | Use MoSCoW — Must/Should/Could/Won't |
| Requirements in chat, not files | Lost when session ends | Always write to `project/` files |
| Mixing requirements with solutions | Constrains implementation | Say "user can filter by status" not "add a dropdown with filter options" |
| No non-functional requirements | No performance/security targets | Always include: performance, security, accessibility sections |

---

## 5. Phase 3 — Plan with Claude

### Start the Planning Session

```bash
claude
```

```
/plan
```

### What Happens

1. **Claude reads everything** in `project/` — BRIEF, REQUIREMENTS, CONSTRAINTS, CONVENTIONS, TECH-STACK
2. **Gap analysis** — Claude identifies what's missing or ambiguous
3. **Clarifying questions** — Claude asks you specific questions. Answer them.
4. **Claude generates:**
   - `PLAN.md` — phased implementation plan
   - `MANIFEST.yaml` — every task with owner, files, dependencies
   - `ARCHITECTURE.md` — system diagram, data model, API contracts

### How to Answer Claude's Questions

Claude will ask things like:

> "The requirements say 'automatic overdue reminders' but don't specify
> the retry policy. If an email fails to send, should it retry? How many
> times? What's the backoff?"

**Good answer:** "Retry 3 times with exponential backoff (1min, 5min, 30min). After 3 failures, log to admin dashboard but don't retry further."

**Bad answer:** "Whatever you think is best." (Claude doesn't know your business constraints.)

### Review and Approve

```
# Read the plan
/status

# If satisfied:
/approve

# If you want changes:
/revise "The auth phase should use OAuth instead of email+password"
```

**Never approve a plan you haven't read.** This is your last checkpoint before building starts.

---

## 6. Phase 4 — Build

```
/execute
```

### What Happens Phase by Phase

```
Phase 0: Foundation
  ├── Architect generates scaffold, DB schema, base config
  └── Backend Dev sets up project structure, migrations
       Gate: /approve

Phase 1: Authentication
  ├── Backend Dev builds auth API
  ├── Writes handoff contract (endpoint shapes, token strategy)
  ├── Frontend Dev ACKs contract
  └── Frontend Dev builds auth UI
       Gate: /approve

Phase 2: Core Features
  ├── Architect breaks features into tasks
  ├── Backend Dev + Frontend Dev work in parallel (non-overlapping files)
  └── Handoff contracts at every cross-domain boundary
       Gate: /approve

Phase 3: Billing (if payments selected)
  ├── Billing Dev + Backend Dev
  └── Stripe integration
       Gate: /approve

Phase 4: Quality Gate
  ├── Fresh Reviewer (adversarial review — no build context)
  ├── Tester (coverage verification)
  └── Both run in parallel
       Gate: /approve

Phase 5: Ship
  └── DevOps deploys to target + creates PR
       Done.
```

### Commands During Build

| Command | Use when |
|---|---|
| `/status` | Check current phase, task, any blockers |
| `/logs` | See all task log files and their status |
| `/approve` | Advance past a stage gate |
| `/revise [feedback]` | Request changes before approving |

### When Claude Pauses

Claude stops and asks you when:
- A requirement is ambiguous and could go two ways
- A new dependency is needed that's not in TECH-STACK.md
- A constraint conflict is found (e.g., performance target impossible with chosen approach)
- A phase gate is reached

**You'll see:**
```
WAITING FOR INPUT

Question: The invoice PDF generation requires a library.
Option A: puppeteer (headless Chrome, large, precise rendering)
Option B: pdfkit (lightweight, good enough for invoices)
Recommendation: Option B — fits the "no deps > 500KB" constraint.

Please confirm or choose.
```

---

## 7. Phase 5 — Quality Gate & Ship

### Trigger Quality Gate

```
/review
```

A **fresh** Reviewer instance (zero context from the build) runs:
- Adversarial review (attacker lens, skeptical user lens, production engineer lens)
- OWASP security checklist
- Test coverage verification against CONSTRAINTS.md thresholds

### Review Findings

Claude reports findings by severity:

| Severity | Action required |
|---|---|
| Critical | Must fix before ship. Auth bypass, data leak, etc. |
| High | Must fix before ship. Missing error states, crash scenarios |
| Medium | Should fix. UX issues, minor edge cases |
| Low | Nice to fix. Code style, minor inconsistency |

### Ship

```
/approve    # After all Critical + High findings are fixed
```

DevOps agent:
- Runs production build
- Deploys to your target (Vercel, Railway, AWS, etc.)
- Creates GitHub PR with full summary
- Closes all task logs

---

## 8. Handling Change Requests (CRs)

Change requests are inevitable. The system handles them without chaos.

### CR During Active Build

**When it happens:** You're in Phase 2 (features) and realize a requirement needs to change.

**Process:**

```
Step 1: STOP the current phase
  /revise "Pausing — incoming CR"

Step 2: Update the source files
  Edit project/REQUIREMENTS.md  — change or add the requirement
  Edit project/CONSTRAINTS.md   — if scope/limits change
  Edit project/BRIEF.md         — if product direction changes

Step 3: Document the CR
  Create: project/CR-001-{slug}.md (see template below)

Step 4: Re-plan from current state
  /plan    — Claude re-reads everything, generates updated plan
  /approve — approve the new plan
  /execute — resume building
```

**Key rule:** Never tell Claude about changes in chat. Always update the files.
Chat is ephemeral. Files are permanent. Claude re-reads files every time.

---

### CR After Ship (Post-MVP)

**When it happens:** The product shipped. A new feature request, bug report,
or business pivot comes in.

**Process:**

```
Step 1: Create the CR document
  project/CR-{NNN}-{slug}.md

Step 2: Update affected project/ files
  REQUIREMENTS.md  — add new requirements under "Must Have" or new section
  CONSTRAINTS.md   — if new constraints apply
  BRIEF.md         — if "What This Is NOT" list changes
  TECH-STACK.md    — if new tech needed

Step 3: Open Claude Code
  claude

Step 4: Plan the CR
  /plan

  Claude reads:
  - All project/ files (including the CR doc)
  - .claude/MEMORY.md (learnings from first build)
  - Existing codebase (it's already built)

  Claude generates an INCREMENTAL plan — not a rebuild.
  It knows what exists and plans only the delta.

Step 5: Build the CR
  /approve
  /execute
  /review
  /approve   → ship
```

---

### CR Workflow Diagram

```
                     ┌───────────────────┐
                     │  Change Request    │
                     │  (feature, bug,    │
                     │   pivot, feedback) │
                     └─────────┬─────────┘
                               │
                    ┌──────────▼──────────┐
                    │  Is it during an    │
                    │  active build?      │
                    └──────────┬──────────┘
                        │              │
                       YES             NO
                        │              │
              ┌─────────▼─────┐  ┌─────▼──────────┐
              │ /revise       │  │ Create CR doc   │
              │ Update files  │  │ Update files    │
              │ /plan (replan)│  │ Open claude     │
              │ /approve      │  │ /plan           │
              │ /execute      │  │ /approve        │
              └───────────────┘  │ /execute        │
                                 │ /review         │
                                 │ /approve → ship │
                                 └─────────────────┘
```

---

### CR Categories

| Category | What changes | Example |
|---|---|---|
| **Feature Addition** | New requirements added | "Add recurring invoices" |
| **Feature Modification** | Existing requirement changed | "Change reminder frequency from 3 to 5 emails" |
| **Bug Fix** | Something doesn't work as specified | "Overdue status not triggering for invoices due on weekends" |
| **Scope Reduction** | Remove a requirement | "Drop CSV export from MVP, move to Should Have" |
| **Tech Change** | Stack or approach change | "Switch from SendGrid to Resend for email" |
| **Business Pivot** | Product direction change | "Target agencies instead of solo freelancers" |
| **Performance CR** | Non-functional requirement change | "Dashboard must handle 10,000 invoices, not 100" |
| **Security CR** | Security requirement added | "Add 2FA for login" |

---

### CR Document Template

Create this file for every CR: `project/CR-{NNN}-{slug}.md`

```markdown
# CR-001: Add Recurring Invoices

## Metadata
- **Date:** 2026-04-14
- **Requested by:** Product / Client / Internal
- **Priority:** Must Have / Should Have / Could Have
- **Affects phases:** Phase 2 (Core Features)
- **Estimated impact:** Medium (new feature, no existing code changed)

## What Changed
Freelancers want to set up invoices that automatically generate on a
monthly or weekly schedule. This was previously in "Could Have" and is
now moved to "Must Have" for the next release.

## Requirements Added

### Recurring Invoice Setup
- [ ] User can mark an invoice as "Recurring" with frequency: weekly, monthly, quarterly
- [ ] Recurring invoices auto-generate on the scheduled date
- [ ] Generated invoices start in "Draft" status (user must review before sending)
- [ ] User can set an end date or "indefinite" for the recurrence
- [ ] User can pause/resume a recurring schedule

### Background Jobs
- [ ] Cron job runs daily at 00:00 UTC to generate due recurring invoices
- [ ] Failed generation retries 3x with exponential backoff
- [ ] Admin dashboard shows failed generations

## Requirements Modified
- Dashboard: add "Recurring" filter to invoice list
- Invoice model: add `recurring_config` JSON column

## Requirements Removed
- (none)

## Files Likely Affected
- `apps/api/src/invoices/` — new recurring module
- `apps/api/src/jobs/` — new cron job
- `apps/web/src/app/invoices/` — UI for recurring setup
- `project/REQUIREMENTS.md` — updated
- `docs/ARCHITECTURE.md` — updated data model

## Acceptance Criteria
- [ ] User can create a monthly recurring invoice
- [ ] Invoice auto-generates on the 1st of each month
- [ ] User can pause and resume recurring schedule
- [ ] Failed generation shows in admin view
- [ ] Existing non-recurring invoices are unaffected

## Risks
- Background job infrastructure (BullMQ / cron) may not be set up yet
- Timezone handling for scheduled generation
```

---

### Multiple CRs: How to Prioritize

When multiple CRs land at once:

```markdown
## CR Backlog (in project/CR-BACKLOG.md)

| CR | Title | Priority | Impact | Status |
|---|---|---|---|---|
| CR-001 | Recurring invoices | Must Have | Medium | Planned |
| CR-002 | Multi-currency | Could Have | High | Deferred |
| CR-003 | Fix weekend overdue bug | Must Have | Low | In Progress |
| CR-004 | Team accounts | Won't Have (MVP) | Very High | Rejected |
```

**Process:**
1. Create individual CR docs for each
2. Add to CR-BACKLOG.md with priority
3. Run `/plan` — Claude reads all CRs and prioritizes based on your ranking
4. Claude may suggest batching related CRs into a single phase

---

## 9. Day-to-Day Development After Ship

### Adding a Feature

```bash
# 1. Create CR doc
echo "# CR-005: Client Portal" > project/CR-005-client-portal.md
# Fill in the template

# 2. Update REQUIREMENTS.md with new Must Haves

# 3. Open Claude Code
claude

# 4. Plan + Build
/plan
/approve
/execute
/review
/approve
```

### Fixing a Bug

```bash
# 1. Open Claude Code
claude

# 2. Describe the bug — Claude uses systematic-debugging skill
"The overdue reminder emails are sending at midnight UTC instead of
9am in the user's timezone. Here's the log output: [paste]"

# Claude will:
# - Use systematic-debugging (observe, hypothesize, isolate, fix+verify)
# - Use tdd-workflow (write a failing test first, then fix)
# - Use adversarial-review (verify fix doesn't break other things)
# - Commit with: fix(invoices): use user timezone for reminder scheduling
```

### Refactoring

```bash
# 1. Open Claude Code
claude

# 2. Describe what needs refactoring
"The invoice service is 400 lines. Split it into invoice-crud.service
and invoice-reminder.service following backend-patterns."

# Claude loads:
# - workflow-ship-faster (read first, plan, implement, verify)
# - backend-patterns (your framework's patterns)
# - tdd-workflow (tests stay green throughout)
```

### Updating Dependencies

```bash
# 1. Update TECH-STACK.md with new versions
# 2. Open Claude Code
claude

"Update all dependencies to match TECH-STACK.md. Run tests after each
major update to catch breakage early."
```

---

## 10. Troubleshooting

### "Claude built the wrong thing"

**Cause:** Requirements were ambiguous or missing.
**Fix:** Update `project/` files with specific requirements. Run `/plan` again.

### "Claude is stuck in a loop"

**Cause:** Build error it can't resolve, or conflicting constraints.
**Fix:** Check `/logs` for the stuck task. Read the log file. Either fix the blocker manually or `/revise` with guidance.

### "Claude added a library I didn't want"

**Cause:** Not listed in CONSTRAINTS.md "Dependency Constraints".
**Fix:** Add explicit exclusions: "No puppeteer", "No Moment.js", etc. Claude asks before adding anything not in TECH-STACK.md.

### "Quality gate keeps failing"

**Cause:** Coverage thresholds or security checks not met.
**Fix:** Check `/logs` for specific failures. Either fix the code or adjust thresholds in CONSTRAINTS.md if they were too strict.

### "Session is getting slow / incoherent"

**Cause:** Context window exhaustion (session > 45 min or > 10 large files).
**Fix:** Claude loads `context-doctor` skill automatically. If it doesn't:
```
"Load context-doctor and diagnose context health"
```

### "I need to change the stack mid-project"

**Cause:** Tech choice isn't working out.
**Fix:**
1. Update TECH-STACK.md with new choice
2. Update CONSTRAINTS.md Stack Locks table
3. Re-run the wizard for new skills (backend-patterns, frontend-patterns, etc.)
4. Drop in new skill files
5. `/plan` — Claude creates a migration plan

---

## 11. Quick Reference

### Commands

| Command | Phase | What it does |
|---|---|---|
| `/plan` | Planning | Read inputs, ask questions, generate plan |
| `/approve` | Any gate | Advance to next phase |
| `/revise [text]` | Any gate | Request changes before approving |
| `/execute` | Building | Run current phase with agent teams |
| `/execute phase-2` | Building | Run a specific phase |
| `/status` | Any time | Current state, phase, blockers |
| `/logs` | Any time | All task logs with status |
| `/review` | Quality | Trigger adversarial review + testing |
| `/memory` | Any time | Read/write cross-session learnings |

### File Map

```
project/
  BRIEF.md           — WHY (product vision, users, goals)
  REQUIREMENTS.md    — WHAT (MoSCoW requirements, acceptance criteria)
  CONSTRAINTS.md     — BOUNDARIES (hard limits, quality gates)
  CONVENTIONS.md     — HOW (naming, style, patterns)
  TECH-STACK.md      — WITH WHAT (languages, frameworks, tools)
  CR-{NNN}-*.md      — CHANGES (change request documents)
  CR-BACKLOG.md      — CHANGE PRIORITY (if multiple CRs)

.claude/
  CLAUDE.md          — Brain file (Claude reads first every session)
  MEMORY.md          — Cross-session learnings (grows over time)
  skills/            — 17 enforced skills (generated by wizard)
  commands/          — /plan, /execute, /status, /review, /handoff
  agents/            — Specialist agent definitions

logs/
  backend/           — Per-task backend logs
  frontend/          — Per-task frontend logs
  decisions/         — Architecture decisions, handoffs
  inputs/            — Your answers to Claude's questions

docs/
  ARCHITECTURE.md    — Generated during /plan
  SETUP.md           — Dev environment setup
```

### The Golden Rules

1. **Never describe requirements in chat** — always in `project/` files
2. **Never approve a plan you haven't read** — `/plan` then read PLAN.md
3. **Always create the CR doc before implementing a change** — `project/CR-*.md`
4. **Never skip the quality gate** — `/review` catches what you won't
5. **Keep MEMORY.md alive** — it makes every session smarter than the last

---

*This guide covers the full lifecycle. For stack-specific setup instructions,
see `docs/SETUP.md`. For the autonomous development philosophy, see
`docs/guides/autonomous-development-guide.md`.*
