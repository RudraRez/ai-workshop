# Product Brief — SKEP Website Builder

## Product Name

SKEP Website Builder

## One-Line Description

An AI-assisted, block-based website builder that lets every SKEP community
publish a branded public-facing site — landing page, program catalog, events,
resources — in minutes, without leaving SKEP.

## The Problem

When a SKEP community wants a public website — to showcase programs, sell
courses, list upcoming meetups, recruit new members — they currently need
to spin up WordPress, Webflow, or Squarespace separately. That means:

- Paying for and maintaining a second platform.
- Manually re-entering content that already lives in SKEP (meetings,
  members, programs).
- Publishing a site that's disconnected from enrollment flows.
- Designing from scratch every time, when most community sites look
  structurally identical (hero, about, programs, events, CTA).

## The Solution

A first-party site builder where:

1. A community owner picks a starting template or describes their site
   in natural language to the AI.
2. The AI generates a multi-page site with sensible defaults pre-filled
   from the community's SKEP data (name, logo, programs, upcoming events).
3. The owner edits inline with a block-based editor (hero, text, image,
   card grid, events list, form, CTA).
4. Publish lives at `<community-subdomain>.skep.in` immediately. Custom
   domain is a post-MVP feature.
5. Site content refreshes automatically when underlying SKEP data changes
   (e.g., an events block auto-updates when new meetings are scheduled).

## Target Users

### Primary User

Community owners who need a public web presence but are not web developers
and do not want to become them. Running a cohort-based course, a local
chapter, or a professional network.

### Secondary User

Community members landing on the public site — prospective enrollees,
event attendees, curious visitors. They interact with the built site via
a browser.

## Goals for This Build

1. **An owner can go from zero to published site in under 5 minutes** using
   the AI-assist flow.
2. **Generated pages use live SKEP data** — at least the "upcoming events"
   block auto-updates from SKEP's meeting data (read via internal API or
   event bus, not duplicated).
3. **Tenant isolation** — each community's site lives at its own
   subdomain and cannot read or write another community's site data.
4. **Publish produces a real, servable URL** that renders within 2 seconds LCP.
5. **Three domain events published**: `website.page.created`,
   `website.page.published`, `website.site.updated`.

## What This Is NOT

- **Not a full general-purpose website builder** (no e-commerce, no custom
  JavaScript blocks, no Squarespace parity).
- **Not a CMS for authoring arbitrary content** — structured blocks only.
- **Not a theme marketplace.** A fixed set of 3–5 templates in v1.
- **Not a custom-domain host** in v1 (post-MVP).
- **Not an A/B testing platform.** One version of each page, live.
- **Not an SEO audit tool.** We do basic correctness (title, meta, OG tags)
  and stop there.

## Competitive Context

### Alternatives users use today

- WordPress (self-hosted or .com)
- Webflow
- Squarespace
- Wix
- Carrd / Framer

### Why users will choose this instead

- Zero extra cost; built into their SKEP plan.
- Content pre-filled from SKEP data; no copy-paste.
- Enrollment buttons link directly to the SKEP flow; no integration plumbing.
- AI accelerates the blank-page problem.
- Lives behind their SKEP auth for admin; public site is, well, public.

## Timeline

- MVP target date: **Hackathon T+72h**
- Key milestones:
  - T+6h: Migrations applied, auth smoke-tested
  - T+18h: AI generate-from-prompt flow produces a page tree
  - T+36h: Block editor saves and renders a page
  - T+54h: Publish produces a live URL at a test subdomain
  - T+72h: Demo

## Business Model

Bundled with existing SKEP tiers. Limits per tier (number of published
pages, AI generations per month, custom CSS/JS allowed or not) enforced
via `LmsClient.checkLimits`.

---

## Figma

Figma: *(to be provided — placeholder references acceptable)*

## Obsidian / Notes

N/A.

## Reference Products

- **Framer** — block editor UX bar
- **Carrd** — one-page site simplicity target
- **Webflow** — component model inspiration (not matching complexity)
- **Notion pages** — block interaction feel
</content>