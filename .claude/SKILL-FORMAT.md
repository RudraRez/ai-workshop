# Skill Format Specification

> Every skill in this library follows this format.
> Skills are enforced — not suggested. A skill that can be quietly ignored
> is a README. Use `severity: hard` to make it block handoff.

---

## Frontmatter (required)

```yaml
---
name: skill-name-with-hyphens
version: 1.0.0
category: planning | execution | testing | ui | backend | security | git | meta
stack:
  - always                  # every project
  - next.js                 # only when Next.js is in stack
  - nestjs
  - express
  - react-native
severity: hard | soft       # hard = blocks handoff. soft = warning only.
triggers:
  - "specific phrase that causes this skill to load"
  - "another trigger"
description: >
  Start with "Use when". Max 3 sentences. Describes the triggering condition
  and what the agent must do. No weasel words ("try to", "consider", "might").
---
```

---

## Body Sections (in this order)

### # Skill Name
One-line principle. The core idea tattooed on the agent's brain.

### ## Why This Exists
The failure mode this skill prevents. Name the enemy explicitly.

### ## When To Use
Trigger flowchart if non-obvious. Bullet list of explicit triggers.

### ## When NOT To Use
At least 3 explicit exclusions. Saves the agent loading a skill that doesn't apply.

### ## The Rules / Core Pattern
The methodology. Written for an agent executing it — not a human reading docs.
Imperatives only: "Do X", "Never Y", "Always Z".

### ## Anti-Patterns (Before / After)
Real code comparisons. Minimum 3 pairs. Always ❌ and ✅.

```tsx
// ❌ BANNED — reason
<example of wrong code>

// ✅ CORRECT
<example of right code>
```

### ## Self-Audit Block
YAML the agent emits in its deliverable. Copy-pasteable.
`overall: fail` + `severity: hard` = `blocked: true` = handoff blocked.

```yaml
skill_audit:
  skill: skill-name
  checks:
    check_one: true | false
    check_two: true | false
  overall: pass | fail
  violations: []
  blocked: false
```

### ## Stack Variants (if applicable)
How rules change per stack. Only include stacks declared in frontmatter.

### ## Composition Rules
```
REQUIRES:   skill-a (must load before this)
SUGGESTS:   skill-b (load alongside this)
CONFLICTS:  skill-c (don't load both)
```

---

## Writing Rules

- Every code block has a language tag
- No weasel words: "try to", "consider", "might want to", "could"
- Rules use imperatives: "Do X", "Never Y", "Always Z"
- Anti-patterns use ❌ and ✅ — scannable at a glance
- Self-audit YAML is copy-pasteable — no prose inside the block
- `severity: hard` → the word BLOCKED appears in output when audit fails
