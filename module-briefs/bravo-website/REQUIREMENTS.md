# Requirements — SKEP Website Builder

## Must Have — MVP (ships in this build)

### Authentication & Users

- [ ] All admin endpoints under `/api/v1/website` require JWT + roles
      `OWNER` or `ADMIN`.
- [ ] Public-facing rendered site requires **no** authentication.
- [ ] Publish/unpublish actions require `OWNER` role.

### Core Feature: AI-Assisted Site Generation

- [ ] `POST /api/v1/website/ai/generate` accepts a text prompt and an
      optional template ID and returns a suggested page tree (JSON of blocks).
- [ ] The AI request uses the Anthropic API (or another LLM provider — any
      is fine for hackathon, team's choice; document it).
- [ ] The prompt is enriched server-side with the community's known
      metadata (name, upcoming events count, programs) so the output is
      grounded in real content.
- [ ] Rate limit: 10 generations per day per community (enforced via
      `LmsClient`).

### Core Feature: Block-Based Editor

- [ ] The editor supports these blocks in v1:
  - Hero (heading + subheading + image + CTA button)
  - Rich text
  - Image
  - Card grid (3 cards with title + text + link)
  - Events list (pulls from SKEP Meetup data)
  - Contact form (name + email + message)
  - CTA banner
- [ ] Block add / remove / reorder (drag-and-drop or up/down buttons).
- [ ] Inline content editing (click to edit text, upload image in place).
- [ ] Autosave every 3 seconds after the last keystroke.
- [ ] Undo / redo within a session.

### Core Feature: Publishing

- [ ] `POST /api/v1/website/sites/:id/publish` snapshots the current draft
      to a published version and makes it available at
      `<communitySubdomain>.skep.local` (or the configured public host).
- [ ] Each publish produces a new immutable version record.
- [ ] Unpublish returns a 404 for public visitors but keeps drafts intact.
- [ ] Published HTML is server-rendered (Next.js SSR) for fast LCP and SEO.

### Core Feature: Live Data Bindings

- [ ] The Events block queries the Meetup module for upcoming meetings
      of this community via the event bus (subscribe to `meetup.meeting.*`
      and cache the latest N events per community) OR via an internal
      HTTP call — team's choice. Document the choice.
- [ ] The Events block renders up to 5 upcoming meetings with date, title,
      and link.

### Data & Storage

- [ ] Tables per community schema: `web_sites`, `web_pages`,
      `web_page_versions`, `web_media`.
- [ ] A site has many pages; each page has many versions; only one version
      is marked `is_published=true` at a time.
- [ ] `web_media` holds references to uploaded images (bytes on R2).
- [ ] All rows UUID primary keys, timestamps, nullable `deleted_at`.

### API

- [ ] `GET /api/v1/website/sites` — list sites (usually 1 per community).
- [ ] `POST /api/v1/website/sites` — create the community's site shell.
- [ ] `GET /api/v1/website/sites/:id/pages` — list pages of a site.
- [ ] `POST /api/v1/website/sites/:id/pages` — create a page.
- [ ] `GET /api/v1/website/pages/:id` — get page draft.
- [ ] `PUT /api/v1/website/pages/:id` — update page draft (block tree).
- [ ] `POST /api/v1/website/pages/:id/publish` — publish current draft.
- [ ] `POST /api/v1/website/ai/generate` — AI-generate page tree from prompt.
- [ ] `POST /api/v1/website/media/upload-url` — pre-signed upload URL.
- [ ] Public rendering route in `apps/web` (not under `/api`): the user-facing
      site renders at `<subdomain>.host` using Next.js middleware to route.

### Domain Events (emitted to Redis bus)

- [ ] `website.page.created` — on new page
- [ ] `website.page.published` — on successful publish
- [ ] `website.site.updated` — on any change to site metadata

### UI / UX

- [ ] Admin dashboard under `apps/web/app/modules/website/` with:
  - Site overview (pages list, publish state)
  - Editor (block tree on left, canvas in middle, properties on right)
  - AI prompt bar with "Generate page" button
  - Publish button with preview URL
- [ ] Public-facing site rendered from the latest published version, with
      SKEP community branding (logo, primary color from community metadata).

### SEO

- [ ] Every published page renders a `<title>`, `<meta name="description">`,
      and OpenGraph tags derived from the Hero block's heading/subheading
      (or page-level overrides).
- [ ] The community subdomain hosts a valid `robots.txt` and `sitemap.xml`.

## Should Have — Include if time allows

- [ ] AI can generate variants of a single block ("make this hero more energetic").
- [ ] Version history UI with restore-to-version.
- [ ] Published-page analytics tile (just page views — integrate later).
- [ ] Custom primary color picker with WCAG contrast validation.

## Could Have — Future consideration, do not build now

- [ ] Custom domain (CNAME + SSL provisioning).
- [ ] Additional block types: pricing table, testimonials, FAQ.
- [ ] Multi-language / locale versions.
- [ ] A/B testing.
- [ ] Arbitrary custom HTML/CSS/JS block.
- [ ] Theme marketplace.

## Won't Have — Explicitly out of scope

- [ ] E-commerce checkout (use existing SKEP billing flows).
- [ ] User-submitted forum posts on the public site (Forum module handles that).
- [ ] WYSIWYG raw HTML editing (security risk, out of scope).
- [ ] Password-protected public pages.
- [ ] SSR caching layer (CDN edge cache) — infra future work.

## User Stories

- As a **community owner**, I want to describe my site in a sentence and
  get a draft, so that I avoid the blank-page problem.
- As a **community owner**, I want the events block to auto-update, so that
  I only update my schedule once (in Meetup).
- As a **visitor**, I want the page to load fast and look trustworthy, so
  that I enroll confidently.
- As a **community owner**, I want to publish with one click, so that I
  don't need a deploy pipeline.

## Non-Functional Requirements

### Performance

- Public page LCP: < 2.5s
- Editor autosave API response: < 300ms p95
- AI generation end-to-end: best-effort (LLM latency is variable) but must
  show loading state ≤ 100ms after click

### Security

- Public pages rendered server-side only. No user-supplied HTML injection.
- All block content is validated against a Zod schema before persistence.
- Pre-signed upload URLs expire in 15 minutes.
- Public renderer cannot query across community schemas.

### Accessibility

- Target: WCAG 2.1 AA for both editor and rendered sites.
- All templates pass color-contrast checks.
- Every image block requires alt text (form-level validation).

### Browser & Platform Support

- Editor: Chrome, Safari, Edge, Firefox (last 2 major versions), desktop only.
- Published sites: all of the above plus mobile responsive.

### Availability

- Acceptable downtime: n/a for hackathon.

## Acceptance Criteria

- [ ] All 7 items in `SKEP-INTEGRATION.md § Hackathon Definition of Done` pass.
- [ ] A community owner can: open the dashboard → describe their site →
      see a generated draft → edit one block → publish → visit the public
      URL and see the site in under 5 minutes total.
- [ ] The events block on a published page shows the latest upcoming
      meetings from the community's Meetup data.
- [ ] Three required domain events are observable on the Redis bus.
- [ ] A user in Community A cannot read or modify any page in Community B —
      verified by isolation test.
- [ ] Public page LCP measured in Lighthouse is under 2.5s on the demo page.
</content>