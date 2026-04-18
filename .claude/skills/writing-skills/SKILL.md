---
name: writing-skills
version: 1.0.0
category: meta
stack:
  - always
severity: soft
triggers:
  - "create a new skill"
  - "write a skill"
  - "add a skill"
  - "skill for"
description: >
  Use when creating a new skill for this project. Enforces the skill format
  spec so new skills are consistent, triggerable, and enforceable. A skill
  that isn't loaded automatically is a README nobody reads.
---

# Writing Skills

**A skill that can be quietly ignored is not a skill. It's a README.**

---

## Skill Format (required structure)

```markdown
---
name: skill-name-with-hyphens
version: 1.0.0
category: planning | execution | testing | ui | backend | security | git | meta
stack:
  - always | next.js | nestjs | express | react-native
severity: hard | soft
triggers:
  - "specific phrase that should trigger this skill"
  - "another trigger phrase"
description: >
  Start with "Use when". Max 3 sentences. Describes the triggering
  condition and what the skill enforces. No weasel words.
---

# Skill Name

**One-line principle. The thing tattooed on the agent's brain.**

---

## Why This Exists
The enemy this skill defeats. Named explicitly.

## When To Use
Trigger flowchart if non-obvious. Bullet list of explicit trigger signals.

## When NOT To Use
At least 3 explicit exclusions.

## The Rules / Core Pattern
The methodology. Written for an agent that will execute it, not a human reading docs.
Imperatives: "Do X", "Never Y", "Always Z". No weasel words.

## Anti-Patterns (Before / After)
Minimum 3 before/after code pairs with ❌ and ✅.

## Self-Audit Block
YAML block the agent emits in its deliverable. Copy-pasteable.
If severity: hard → overall: fail means blocked: true.

## Composition Rules
REQUIRES / SUGGESTS / CONFLICTS with other skills.
```

---

## Description Writing Rules

```
✅ Good: "Use when writing ANY frontend component. Enforces 12 banned patterns."
❌ Bad:  "For frontend development guidelines"
❌ Bad:  "I can help you with UI patterns"
❌ Bad:  "Use when tests use setTimeout/sleep" (too technology-specific for general skill)

Start with "Use when".
Describe the problem, not the solution.
No first person.
No "might", "consider", "try to".
```

---

## Severity Choice

```
hard → handoff is BLOCKED until self-audit passes
  Use for: ui-intelligence, security-review, adversarial-review
  These produce code that ships with the product — quality is non-negotiable

soft → warning logged, work continues
  Use for: git-workflow, brainstorming, context-doctor
  These improve process but blocking on them would be counterproductive
```

---

## Self-Audit Block

```yaml
writing_skills_audit:
  skill: writing-skills
  frontmatter_complete: true
  description_starts_with_use_when: true
  triggers_are_specific: true
  rules_use_imperatives: true
  anti_patterns_have_before_after_code: true
  self_audit_block_is_yaml: true
  composition_rules_present: true
  overall: ready | needs_revision
```
