# Constraints — SKEP Campaigns & Notifications

> Extends `project/CONSTRAINTS.md` and `project/SKEP-DELTA.md`.
> Where this conflicts with either, this file wins.

---

## Scope Constraints

### MVP Definition

All other SKEP modules' events arrive on the bus, get converted to
notifications per user preferences, and land in an in-app inbox +
(optionally) email. Owners can author and send campaigns to live SKEP
segments. User preferences are respected. Tenant isolation is absolute.

### Explicitly Out of Scope

- [ ] Any other module sending notifications directly
- [ ] SMS delivery
- [ ] Multi-step drip sequences
- [ ] A/B testing
- [ ] External subscriber lists (non-SKEP members)
- [ ] Campaign landing pages
- [ ] Web push with VAPID (moved to Should-Have if time allows)
- [ ] Transactional auth emails (main SKEP platform owns these)
- [ ] Segment builder with arbitrary boolean logic

---

## Technical Constraints

### Campaigns-Specific Technical Locks

| Decision | Choice | Rationale |
|---|---|---|
| Email provider | Resend | Already in TECH-STACK |
| Background jobs | BullMQ on Redis | Already in TECH-STACK; send queue, retries |
| Idempotency key | `${eventId}:${userId}:${channel}` | Unique index on `notif_notifications.dedupe_key` |
| Template engine | Server-side React → HTML via `@react-email/render` | Clean, type-safe, matches stack |
| Unsubscribe tokens | HMAC-SHA256 of `{userId, category, communityCode}` | Unguessable, verifiable without DB lookup |
| Segment resolution | Query main SKEP members API at send-time | Live data, no stale lists |

### Libraries That Require Approval

- `@react-email/components` + `@react-email/render` pre-approved for email.
- `bullmq` already in stack.
- No `nodemailer` directly — go through Resend's SDK.
- No `@sendgrid/mail`, `mailgun.js`, `postmark` — stack chose Resend.

### Performance Constraints

| Metric | Target | On miss |
|---|---|---|
| Event received → in-app notification row created | < 500ms p95 | Log warning |
| In-app notification → delivered to open socket | < 1s p95 | Log warning |
| Preference update API | < 150ms p95 | Log warning |
| Notification list fetch (50 items) | < 200ms p95 | Log warning |
| Email enqueue → Resend API call | < 5s p95 | Log warning |
| Campaign of 1,000 recipients: total completion | < 60s | Log warning |

### Rate Limits

- Campaign sends: 10 per day per community (enforced via `LmsClient`).
- Per-user preference updates: 60 per minute.
- Per-user notification reads: no explicit limit (idempotent).

---

## Delivery Semantics

- **At-least-once delivery** is the target. Duplicates are prevented at
  the `notif_notifications` table via the unique `dedupe_key`.
- A failed email send (Resend 5xx) retries 3× with exponential backoff
  (1s, 5s, 25s). On total failure, mark the delivery `failed` and log.
  Do not retry forever — for hackathon, dead-letter is a log line.
- An event that references a non-existent user: log and skip, don't error.
- If `LmsClient.checkLimits` denies a campaign send: return 403 with
  `reason` in the error body; do not partially send.

---

## Security Constraints (Campaigns-Specific)

- Resend API key lives only in `RESEND_API_KEY` env var. Never log it.
- Email HTML bodies are rendered from server-controlled templates. Never
  interpolate user-supplied HTML. Dynamic fields (name, community, CTA URL)
  are passed as template props and HTML-escaped at render time.
- Unsubscribe links include `{token}` in a signed query param. Token is
  HMAC of `{userId, category, communityCode}` with a server-side secret,
  base64url-encoded. Verified on the unsubscribe endpoint.
- The unsubscribe endpoint is public (`@Public()`) — must be reachable
  from email clients without a JWT. It validates the HMAC and flips the
  preference bit.
- A user can only read and modify their own notifications and preferences.
  `GET /api/v1/notifications/:id` for someone else's ID returns 404 (not 403 —
  prevents existence leak).
- Campaign recipient lists are resolved server-side. Clients never specify
  a raw recipient list — only segment criteria.

---

## Things Claude Must ALWAYS Do (Campaigns-Specific)

- Subscribe to `skep:events:*` on module startup, not lazily.
- Use the shared `EventBusService` from `@skep/platform-core` — do not
  spin up a separate Redis client.
- Enforce the `dedupe_key` unique constraint with a clear error path for
  duplicates (ON CONFLICT DO NOTHING or catch + log).
- Apply user preferences before any channel fan-out.
- Respect `LMS_CLIENT.checkLimits` before any campaign send.
- Call `LMS_CLIENT.reportUsage` for every delivered notification (metric:
  `notifications_delivered`, per channel).
- Include `correlationId` from the triggering event on every resulting
  notification row.

## Things Claude Must NEVER Do (Campaigns-Specific)

- Never send a notification for an event in Community A to a user in
  Community B, even if they share a user ID in the main SKEP platform.
- Never accept a recipient list in a campaign POST body. Always resolve
  from segment criteria + JWT-derived `communityCode`.
- Never retry a send after a 4xx from Resend (the request was bad; retrying
  won't help).
- Never inline-render untrusted HTML in an email. Use React Email components.
- Never expose a notification's full payload to a user who is not the
  recipient — including admins viewing audit logs (redact or aggregate).

---

## Quality Gate Thresholds (Campaigns-Specific)

| Check | Threshold | On fail |
|---|---|---|
| Duplicate-event-delivery idempotency test | 1 notification created, 1 email sent | Block ship |
| Preference-respect test (disabled channel → 0 sends) | 100% respected | Block ship |
| Cross-community isolation test | 0 leaks | Block ship |
| Unsubscribe token tamper test (bad HMAC → 403) | 100% rejected | Block ship |
| Resend 5xx retry test | Retries 3× then logs, no crash | Block ship |
| Real-email-to-real-inbox smoke test during demo | 1 email delivered | Block ship |
</content>