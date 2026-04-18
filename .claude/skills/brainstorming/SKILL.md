---
name: brainstorming
version: 1.0.0
category: planning
stack:
  - always
severity: soft
triggers:
  - "requirements are unclear"
  - "not sure what to build"
  - "help me think through"
  - "explore options"
  - "before planning"
  - "early stage"
description: >
  Use when requirements are ambiguous or incomplete. Runs a structured
  Socratic refinement before any planning begins. Asks the right questions,
  explores alternatives, surfaces constraints, and produces a validated
  understanding that /plan can build on. Never skip this when you're unsure.
---

# Brainstorming

**The best code is code that solves the right problem. Spend time on the problem first.**

---

## When To Use

- Requirements in project/ are sparse or contradictory
- The user says "I want to build X" without specifics
- Multiple valid interpretations exist for a requirement
- The scope feels too large for a single build cycle
- You're not sure if what's being asked is the right thing to build

## When NOT To Use

- Requirements are fully specified in project/ files
- This is a follow-up task with clear scope
- You're extending an existing, well-understood feature

---

## The Refinement Process

### Phase 1 — Understand the Goal (not the solution)

Ask about outcomes, not features:
```
- What problem does this solve for the user?
- What does success look like 6 months after launch?
- Who specifically has this problem? How do they solve it today?
- What's the cost of NOT solving it?
```

**Do not ask about technology choices in Phase 1.**

### Phase 2 — Explore the Problem Space

Surface what's not being said:
```
- What are the edge cases that would break this?
- What happens when it goes wrong?
- Who else is affected besides the primary user?
- What assumptions are you making that might not be true?
- What's explicitly NOT in scope?
```

### Phase 3 — Propose Options (not a single answer)

Always present 2-3 approaches with honest trade-offs:
```
Option A: {description}
  Pro: {what it solves well}
  Con: {what it sacrifices}
  Best when: {context}

Option B: {description}
  Pro: ...
  Con: ...
  Best when: ...
```

Never recommend before presenting options. Let the trade-offs speak.

### Phase 4 — Validate Understanding

Before ending brainstorming, confirm:
```
"Here's what I understand we're building:
  [1-paragraph summary of the validated concept]

Key constraints confirmed:
  - [list]

Explicitly out of scope:
  - [list]

Is this correct? Any corrections before I start planning?"
```

---

## Questions That Unlock Requirements

**On scope:**
- "What's the smallest version of this that would be useful?"
- "Which feature, if cut, would make this pointless?"
- "What are you willing to cut to ship faster?"

**On users:**
- "Walk me through a specific user completing their goal. What do they do first?"
- "What would make a user stop using this?"

**On tech:**
- "Does this need to work offline?"
- "How many concurrent users in the first month? In year 1?"
- "What existing systems does this need to integrate with?"

**On quality:**
- "What's acceptable downtime?"
- "What data loss is acceptable in a failure scenario?"
- "Who needs to be able to maintain this after you?"

---

## Self-Audit Block

```yaml
brainstorming_audit:
  skill: brainstorming
  goal_understood_before_solution: true
  multiple_options_presented: true
  trade_offs_explicit: true
  scope_exclusions_confirmed: true
  understanding_validated_with_user: true
  ready_for_planning: true
```

---

## Composition Rules

```
REQUIRES:   (none — runs before everything)
SUGGESTS:   writing-plans (once brainstorming is complete)
CONFLICTS:  (none)

Load order: brainstorming → writing-plans → /plan → /execute
```
