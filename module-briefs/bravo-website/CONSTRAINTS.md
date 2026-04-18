# Constraints — SKEP Website Builder

> Extends `project/CONSTRAINTS.md` and `project/SKEP-DELTA.md`.
> Where this conflicts with either, this file wins.

---

## Scope Constraints

### MVP Definition

A community `OWNER` can: create a site, generate initial page structure
with AI from a prompt, edit blocks inline, publish, and have the public
site render at a subdomain within 5 minutes. Events block pulls live data
from the Meetup module. Tenant isolation is absolute.

### Explicitly Out of Scope

- [ ] Custom domains with SSL
- [ ] Arbitrary HTML/CSS/JS block
- [ ] E-commerce
- [ ] Multi-language sites
- [ ] Password-protected public pages
- [ ] A/B testing or feature flags on public pages
- [ ] Pricing / testimonials / FAQ blocks (add post-MVP)
- [ ] Theme marketplace
- [ ] SSR edge cache

---

## Technical Constraints

### Website-Specific Technical Locks

| Decision | Choice | Rationale |
|---|---|---|
| Block tree storage | JSON column (`jsonb` in Postgres) | Flexible, fast reads, Zod-validated on write |
| Block schema validation | Zod | Shared with frontend via `packages/shared` |
| LLM provider | Anthropic API (Claude 3.5 Sonnet or newer) | Team may swap; document in TECH-STACK |
| Public routing | Next.js middleware reading `host` header | No reverse-proxy rewrite games |
| Public rendering | Server-rendered (SSR) Next.js | SEO + LCP; no client-rendered home page |
| Media storage | Cloudflare R2 pre-signed upload | Stack standard |
| Draft autosave | Debounced on client, single-row PUT | No version created per save — versions only on publish |

### Libraries That Require Approval

- No headless CMS (Strapi, Sanity, Contentful) — re-implements tenancy.
- No block editor library that bundles its own state engine unless small
  (<100KB gzip) and well-maintained.
- `@dnd-kit/core` (~20KB) pre-approved for drag-and-drop.
- `zod` already in stack.

### Performance Constraints

| Metric | Target | On miss |
|---|---|---|
| Public page LCP | < 2.5s on 4G | Block ship |
| Editor autosave PUT | < 300ms p95 | Log warning |
| AI generate (end-to-end) | show loading ≤ 100ms; response target 20s p95 | Log warning |
| Page list load | < 400ms p95 | Log warning |
| Block render in editor | < 50ms per block change | Log warning |

### Rate Limits

- AI generations: 10 per day per community (enforced via `LmsClient`).
- Publish actions: 60 per hour per site (prevents pathological retry loops).
- Media uploads: 50 per day per community (enforced via `LmsClient`).

---

## Security Constraints (Website-Specific)

- All block content must pass a Zod schema check before persistence.
  No raw HTML allowed in text blocks — parse rich text as Markdown or
  a structured tree (choose one, document it).
- Public renderer must never execute user-supplied JavaScript.
- `<script>`, `<iframe>`, `<object>`, and `<embed>` tags are rejected by the
  content validator.
- `href` and `src` attributes on anchor and image blocks are validated to
  be `http://`, `https://`, or same-origin relative paths only. No `javascript:`.
- Public pages set a strict Content-Security-Policy header:
  `default-src 'self'; img-src 'self' https: data:; script-src 'self';
  style-src 'self' 'unsafe-inline';`
- Pre-signed R2 upload URLs expire in 15 minutes, are scoped to a single
  content-type + max-size, and include the community_code in the key.
- The AI endpoint does not echo user prompts back in error messages (avoids
  reflective information leaks).

---

## Subdomain Routing

- Development hostname pattern: `<community>.skep.local` resolved via
  `/etc/hosts` entries for test communities, or a wildcard DNS record if
  using `*.lvh.me` / `*.nip.io`.
- Next.js middleware intercepts requests, extracts the subdomain,
  resolves it to a community_code via `schema_registry.metadata.subdomain`
  (or a dedicated `subdomain` column if teams prefer — document in their ERD).
- If subdomain doesn't match any community or site is unpublished: 404.

---

## Things Claude Must ALWAYS Do (Website-Specific)

- Validate every incoming block tree with Zod before persistence.
- Strip or reject any raw HTML in text content.
- Store drafts and published versions as distinct rows — never overwrite
  a published version.
- Render public pages server-side only.
- Set cache-control headers appropriately: published HTML can be cached
  briefly (60s) at the public route; admin routes are `no-store`.
- Include CSP header on every public response.
- When the Events block is rendered, treat the upstream data (from Meetup)
  as potentially stale; cache for at most 60s.

## Things Claude Must NEVER Do (Website-Specific)

- Never accept a `communityCode` or `siteId` from the request body for
  admin endpoints — always from the JWT + URL params.
- Never render user content with `dangerouslySetInnerHTML` without passing
  it through DOMPurify (and prefer a structured block model that avoids
  HTML entirely).
- Never persist LLM output without validating it against the block schema.
- Never expose draft pages at a public URL. Drafts are admin-only previews.
- Never allow upload of file types outside the allowed list
  (`image/jpeg`, `image/png`, `image/webp`, `image/svg+xml`). SVG requires
  special sanitization if allowed — if you cannot sanitize, disallow SVG.

---

## Quality Gate Thresholds (Website-Specific)

| Check | Threshold | On fail |
|---|---|---|
| Lighthouse performance on published page | > 85 | Log warning |
| Lighthouse accessibility on published page | > 90 | Block ship |
| CSP header present on every public response | 100% | Block ship |
| XSS test on block content | 0 executions | Block ship |
| Cross-community isolation test | 0 leaks | Block ship |
| LLM output schema validation test | 100% pass or graceful fail | Block ship |
</content>