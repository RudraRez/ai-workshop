# Planning Session Log

> Written by Claude during /plan.
> Records the full intake conversation — gaps found, questions asked, your answers.

---

**Session started:** {ISO timestamp}
**Status:** PENDING | IN_PROGRESS | COMPLETE

---

## Inputs Consumed

| File | Status |
|---|---|
| project/BRIEF.md | READ |
| project/REQUIREMENTS.md | READ |
| project/CONVENTIONS.md | READ |
| project/CONSTRAINTS.md | READ |
| project/TECH-STACK.md | READ |
| .claude/MEMORY.md | READ — {N} prior entries |
| {any BRD/PRD files in project/} | READ |
| Figma: {URL if present} | READ via Figma MCP |

---

## Gap Analysis

### Missing Information
<!-- Questions Claude asked that needed answers before planning could proceed -->

**Q1:** {exact question}
**Your answer:** {your exact answer}
**Impact:** {how this changed the plan}

**Q2:** {exact question}
**Your answer:** {your exact answer}
**Impact:** {how this changed the plan}

### Assumptions Made
<!-- Things Claude assumed without asking — listed here so you can correct them -->

| Assumption | If wrong, affects |
|---|---|
| {assumption} | {what it changes} |

### Scope Exclusions Confirmed
<!-- Features mentioned in inputs but confirmed out of scope -->

- {feature} — reason: not in REQUIREMENTS.md Must Have list

---

## Planning Decisions

### Tech Stack Confirmed
{Summary of stack decisions from TECH-STACK.md}

### Phase Structure
{Why the plan was broken into these specific phases — rationale}

### Design System Source
{From Figma MCP / Generated from BRIEF.md description}

---

## Artifacts Generated

| Artifact | Path | Status |
|---|---|---|
| Build plan | docs/PLAN.md (or project/PLAN.md) | CREATED |
| Manifest | project/MANIFEST.yaml | CREATED |
| Architecture | docs/ARCHITECTURE.md | CREATED |
| Design system | project/DESIGN-SYSTEM.json | CREATED |

---

## Your Approval

**Approved at:** {ISO timestamp}
**Feedback given:** {any /revise feedback, or "none — approved as is"}
**Revision count:** 0

---

**Planning complete. Type /execute to begin Phase 0.**
