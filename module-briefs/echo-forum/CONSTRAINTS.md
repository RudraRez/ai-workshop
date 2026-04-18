# Constraints — SKEP Forum

> Extends `project/CONSTRAINTS.md` and `project/SKEP-DELTA.md`.
> Where this conflicts with either, this file wins.

---

## Scope Constraints

### MVP Definition

Members can post, reply, upvote, tag, and search within their community's
forum. Moderators can pin, lock, and hide. Hot / New / Top feeds work.
Mentions and replies emit events consumed by Campaigns for notifications.
Tenant isolation is absolute.

### Explicitly Out of Scope

- [ ] Reputation / karma
- [ ] Accepted-answer semantics
- [ ] Public (unauthenticated) read access
- [ ] Polls inside posts
- [ ] Multi-community aggregated feeds
- [ ] Nesting beyond 2 levels
- [ ] Post scheduling
- [ ] Server-side thread summaries (future Tutor integration)

---

## Technical Constraints

### Forum-Specific Technical Locks

| Decision | Choice | Rationale |
|---|---|---|
| Text format | Markdown only | No raw HTML; simpler sanitization |
| Markdown renderer | `remark` + `rehype-sanitize` on server | Shared output for SSR + tests |
| Search | Postgres `tsvector` with GIN index | No external search engine; scales fine for MVP |
| Vote integrity | Unique constraint on `(user_id, target_type, target_id)` | Prevents double-votes at DB level |
| Hot algorithm | `(upvote_count) / (hours_since_created + 2)^1.5` | Simple, well-known, predictable |
| Pagination | Cursor on `(score, id)` for Hot; `(created_at, id)` for New | No offset pagination |
| Reply depth | Max 2 levels; level-3+ flattens to 2 | Thread readability |

### Libraries That Require Approval

- `remark`, `remark-gfm`, `rehype-sanitize`, `rehype-react`, `rehype-stringify` pre-approved.
- No `marked` (weaker sanitization story).
- No `tiptap` or `slate` — Markdown is the source of truth; WYSIWYG is out.
- No `meilisearch` or `typesense` — tsvector is enough for MVP.

### Performance Constraints

| Metric | Target | On miss |
|---|---|---|
| Feed (20 posts) | < 250ms p95 | Log warning |
| Post detail (50 replies) | < 300ms p95 | Log warning |
| Search | < 400ms p95 for 10k posts | Log warning |
| Upvote round-trip | < 150ms p95 | Log warning |
| Hot score recompute on read | < 100ms overhead | Log warning |

### Rate Limits

- Posts: 30 per day per user. Enforced via `LmsClient.checkLimits` with
  `action='create_post'`.
- Replies: 200 per day per user. Enforced via `LmsClient`.
- Upvotes: 60 per minute per user (burst cap). Enforced in service layer.
- Tag creation: 20 tags per community (MVP ceiling; configurable later).

---

## Voting Integrity

- Votes stored in `forum_votes` with a unique constraint on
  `(user_id, target_type, target_id)` — `target_type` is `'post'` or `'reply'`.
- The denormalized `upvote_count` on posts and replies is updated in the
  same transaction as the insert/delete on `forum_votes`.
- If the denormalized count drifts (detected by a read-time sanity check
  in development), log and continue. Periodic reconciliation is a future build.

---

## Security Constraints (Forum-Specific)

- Markdown rendered server-side only. Client never receives raw user HTML.
- `rehype-sanitize` with the default safe schema plus an explicit allowlist
  for `<a>` with `http(s)://` + `mailto:` only.
- `<script>`, `<style>`, `<iframe>`, `on*` attributes always stripped.
- Mention parser matches `@` followed by valid platform_user_id pattern;
  does not execute string-matched arbitrary text.
- Rate limiting enforced at two layers:
  - Daily caps via `LmsClient.checkLimits`.
  - Per-minute bursts in-process (simple Redis counter).
- A user cannot vote on their own post or reply (self-vote is rejected
  with `FORUM_SELF_VOTE`).

---

## Moderation Semantics

- A hidden reply is returned to non-authors as a placeholder row with
  `content = null`, `is_hidden = true`, `hidden_at`, `hidden_by_user_id`.
- The original content remains in the DB for moderator review and for
  the author to see their own message.
- A locked post rejects new replies with `FORUM_POST_LOCKED` but allows
  upvotes and existing reply edits within their own edit windows.
- A pinned post sorts before all others in every feed within its
  community, regardless of sort order.

---

## Edit Windows

- Post: 15 minutes from `created_at`. After that, `PATCH` returns
  `FORUM_EDIT_WINDOW_EXPIRED`.
- Reply: 15 minutes from `created_at`. Same rule.
- The window is configurable per community by the `OWNER` (stored on a
  `forum_settings` row; default 15min). Not enforced beyond server-side check.

---

## Things Claude Must ALWAYS Do (Forum-Specific)

- Sanitize rendered Markdown with `rehype-sanitize` — no exceptions.
- Parse and persist `mentions` on post/reply save; emit one
  `forum.mention` event per mentioned user.
- Update denormalized counts (`upvote_count`, `reply_count`) in the same
  DB transaction as the source mutation.
- Use cursor pagination on every list endpoint. No offset.
- Index posts and replies on `(created_at, id)` and on the tsvector search
  column; index votes on `(user_id, target_id)`.
- Enforce that the acting user is a member of the community (JWT validates;
  schema resolution confirms).
- Return 404 (not 403) for cross-community resource access to avoid
  leaking existence of IDs.

## Things Claude Must NEVER Do (Forum-Specific)

- Never render raw HTML from a post or reply body in any UI.
- Never allow a user to vote on their own content.
- Never bypass the Markdown sanitizer ("trust me, this template is safe"
  is not a thing).
- Never include full reply content in moderation events — reference by
  ID only, to keep the event bus free of user-authored prose.
- Never allow mentions to resolve across communities.
- Never hard-delete a post or reply. Soft-delete is mandatory.
- Never let a non-moderator trigger pin, lock, or hide operations.

---

## Quality Gate Thresholds (Forum-Specific)

| Check | Threshold | On fail |
|---|---|---|
| HTML-injection test in post body | 0 executions | Block ship |
| Self-vote test | Rejected with `FORUM_SELF_VOTE` | Block ship |
| Double-vote test (same user, same target) | Second accepted gracefully (idempotent) | Block ship |
| Locked-post reply test | Rejected with `FORUM_POST_LOCKED` | Block ship |
| Cross-community isolation test | 0 leaks | Block ship |
| Hot-sort correctness test | Ordering matches formula for seed data | Block ship |
| Search respects community boundary | 0 results from other communities | Block ship |
</content>