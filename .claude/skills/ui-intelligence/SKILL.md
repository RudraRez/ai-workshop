---
name: ui-intelligence
version: 1.0.0
category: ui
stack:
  - next.js
  - react
  - react-native
  - vite
severity: hard
triggers:
  - "building a component"
  - "writing a page"
  - "creating a layout"
  - "before any JSX"
  - "styling"
  - "UI"
  - "frontend"
  - "design system"
description: >
  Use before writing ANY frontend component, page, or layout.
  Enforces human-grade visual quality by banning 12 AI-default anti-patterns
  that make interfaces look machine-generated. Handoff is BLOCKED until
  self-audit passes. No exceptions, no case-by-case reasoning.
---

# UI Intelligence

**The interface you ship is a trust signal. AI-default UI destroys that trust
before a user reads a single word.**

---

## Why This Exists

Every AI code generator converges on the same visual patterns: gradient heroes,
glassmorphism cards, oversized rounded corners, purple-to-blue CTAs, floating
stat grids with colored accent borders, icon-badge overload. Trained eyes
identify "AI-generated UI" within 200ms. Users associate it with low-effort,
untrustworthy products.

This skill enforces intentional UI. Not a style — **intentionality**.
Every visual decision must serve the content, not signal effort.

---

## When To Use

```
Writing any JSX/TSX? ──────────────────► LOAD THIS SKILL FIRST
Modifying className? ──────────────────► LOAD THIS SKILL FIRST
Generating design tokens? ─────────────► LOAD THIS SKILL FIRST
```

## When NOT To Use

- Backend-only code (controllers, services, repositories)
- CLI tools with no visual output
- Tests (unless rendering components — then load this)

---

## The 12 Banned Patterns

Hard bans. No exceptions. If you find yourself reasoning about why
an exception is justified — that reasoning is the violation.

### BAN 1 — Gradient Backgrounds on Layout Regions
`bg-gradient-to-*` on sections, heroes, sidebars, cards, or any structural element.

```tsx
// ❌
<section className="bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">

// ✅
<section className="bg-background border-b">
<section className="bg-muted/40">
```

### BAN 2 — Glassmorphism
`backdrop-blur-*` + semi-transparent background on any interactive or layout element.

```tsx
// ❌
<div className="backdrop-blur-md bg-white/10 border border-white/20 rounded-2xl">

// ✅
<div className="bg-card border rounded-lg shadow-sm">
```

### BAN 3 — Oversized Border Radius on Layout Elements
`rounded-2xl`, `rounded-3xl`, `rounded-[24px]` on containers, cards, inputs.

Rules:
- Inputs: `rounded` (4px) max
- Buttons: `rounded-md` (6px) max
- Cards/modals: `rounded-lg` (8px) max
- `rounded-full`: avatars, status dots, and pills ONLY

```tsx
// ❌
<div className="rounded-3xl"><input className="rounded-xl"/></div>

// ✅
<div className="rounded-lg border"><input className="rounded-md"/></div>
```

### BAN 4 — Gradient CTAs
Primary buttons with `from-purple-500 to-blue-500` or any gradient.

```tsx
// ❌
<button className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-full">

// ✅
<button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md">
```

### BAN 5 — Floating Stat Cards as Primary Layout
Grid of 3-4 cards each with a large number, colored icon badge, and accent border.

```tsx
// ❌
<div className="grid grid-cols-4 gap-4">
  {stats.map(s => <div className="rounded-2xl border-l-4 border-blue-500 shadow-lg">)}
</div>

// ✅
<div className="flex items-baseline gap-8 py-4 border-b">
  {stats.map(s => (
    <div key={s.label}>
      <div className="text-2xl font-semibold tabular-nums">{s.value}</div>
      <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
    </div>
  ))}
</div>
```

### BAN 6 — Icon + Colored Badge Overload
Every list item or section header gets a colored icon in a colored rounded square.

```tsx
// ❌
<div className="p-2 rounded-lg bg-violet-100">
  <Icon className="w-5 h-5 text-violet-600"/>
</div>

// ✅
<Icon className="w-4 h-4 text-muted-foreground shrink-0"/>
```

### BAN 7 — Decorative Micro-Labels Everywhere
`text-xs uppercase tracking-widest` labels above every section that restate the heading.

```tsx
// ❌
<p className="text-xs uppercase tracking-widest text-muted-foreground">Features</p>
<h2 className="text-3xl font-bold">Everything you need</h2>

// ✅
<h2 className="text-2xl font-semibold">Everything you need</h2>
```

### BAN 8 — Hero Glow / Blob Effects
Absolutely positioned blobs with `blur-3xl` as hero background decoration.

```tsx
// ❌
<div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/30 blur-3xl"/>

// ✅ — hero uses real product content
<div className="mt-8 rounded-lg border overflow-hidden shadow-md">
  {/* Actual screenshot or live demo */}
</div>
```

### BAN 9 — Icon-Only Sidebar (Default State)
Collapsed icon-only sidebar as the *default* navigation state.

```tsx
// ❌ — default is icon-only, no labels
<nav className="w-16 flex flex-col gap-2 p-2">
  {items.map(item => <button><item.icon/></button>)}
</nav>

// ✅ — labeled by default
<nav className="w-56 flex flex-col gap-1 p-3">
  {items.map(item => (
    <NavLink className="flex items-center gap-3 px-3 py-2 rounded-md text-sm">
      <item.icon className="w-4 h-4 shrink-0"/>
      {item.label}
    </NavLink>
  ))}
</nav>
```

### BAN 10 — Shadow Stacking
`shadow-lg` or heavier on more than one element in the same view.

Rules:
- Default card: `shadow-sm`
- Modal/dropdown: `shadow-lg` — the ONLY elevated element in view
- `shadow-xl` / `shadow-2xl`: reserved for FABs and tooltips that genuinely float

### BAN 11 — Decorative Colored Accent Borders
`border-l-4 border-blue-500` where the color encodes no semantic information.

Accent borders are permitted ONLY for semantic states:
- `border-destructive` = error
- `border-warning` = warning
- `border-primary` = selected/active

If the color is aesthetic → remove the border, use background shade instead.

### BAN 12 — Decorative Absolute DOM Nodes
`absolute` positioned `<div>` elements whose only purpose is visual decoration.

Background texture → CSS `background-image` with SVG data URIs.
Never additional DOM nodes for decoration.

---

## Positive Defaults

| Instead of... | Use... |
|---|---|
| Gradient section bg | `bg-muted/40` or `bg-background` with `border-b` |
| Floating stat cards | Inline stat row, typographic hierarchy |
| Glassmorphism | `bg-card border shadow-sm` |
| Colored icon badge | Icon same color as text, `text-muted-foreground` |
| `rounded-2xl` container | `rounded-lg` max |
| Gradient button | `bg-primary text-primary-foreground` |
| Decorative micro-label | Remove it — trust the heading |
| Hero blobs | Real product screenshot or live component |
| Icon-only sidebar | Labeled nav, `w-56` |
| `shadow-xl` on cards | `shadow-sm` — elevate only modals |
| Decorative accent border | Remove — use bg shade for hierarchy |
| Decorative `<div>` | CSS background-image |

---

## Typography System

```tsx
// h1: text-3xl font-bold tracking-tight        (page titles)
// h2: text-2xl font-semibold                   (section titles)
// h3: text-lg font-semibold                    (subsection titles)
// h4: text-base font-medium                    (card titles)
// body: text-sm (app) or text-base (marketing)
// caption: text-xs text-muted-foreground

// ❌ — arbitrary scale
<h1 className="text-5xl font-black tracking-tighter leading-none">
<p className="text-[15px] font-[450]">

// ✅ — system scale
<h1 className="text-3xl font-bold tracking-tight">
<p className="text-sm text-muted-foreground leading-relaxed">
```

---

## shadcn/ui Rules (when in stack)

- Use shadcn primitives directly — never re-implement what shadcn provides
- Never override shadcn's border-radius
- `cn()` from `lib/utils` for conditional classNames — no string concatenation
- Design tokens in `globals.css` CSS variables — never hardcode hex
- Always test dark mode with `dark:` prefix

---

## Self-Audit Block

Emit this in every component's deliverable. `overall: fail` blocks handoff.

```yaml
ui_audit:
  skill: ui-intelligence
  component: <ComponentName>
  file: <path/to/component.tsx>
  checks:
    no_gradient_backgrounds: true
    no_glassmorphism: true
    border_radius_within_limits: true
    no_gradient_ctas: true
    no_floating_stat_cards: true
    no_icon_badge_overload: true
    no_decorative_microlabels: true
    no_hero_glow_blobs: true
    sidebar_has_text_labels: true
    shadow_not_stacked: true
    accent_borders_semantic: true
    no_decorative_dom_nodes: true
    typography_uses_system_scale: true
  overall: pass | fail
  violations: []
  blocked: false
```

If `blocked: true`:
```
⛔ UI COMPLIANCE BLOCKED — <ComponentName>
Violations:
- [list each with file:line]
Fixing before handoff...
```

---

## Composition Rules

```
REQUIRES:   (self-contained)
SUGGESTS:   frontend-patterns  (Next.js/React conventions)
CONFLICTS:  (none)

Always load BEFORE frontend-patterns.
```
