# Event Catalog

> Every domain event this module publishes or subscribes to.
> Events flow through Redis pub/sub on `skep:events:<communityCode>`.
> Adding or renaming an event requires updating this catalog and bumping
> the consumer contract version in `packages/shared/`.

**Module:** SKEP **AI Tutor** — event prefix `tutor.*`.

**Status:** DRAFT — envelope frozen, AI Tutor event list below.

---

## 1. Envelope (fixed — SKEP platform contract)

```ts
interface PlatformEvent<TPayload = unknown> {
  eventId: string;          // UUID v4, server-generated
  eventType: string;        // "<module>.<entity>.<action>"
  communityCode: string;    // "COM96179941"
  actorUserId: string | null;
  occurredAt: string;       // ISO-8601
  payload: TPayload;
  correlationId: string;    // = requestId that caused the event
}
```

Publishing rules:
- One event per state-changing operation that another module could care about.
- Heavy work offloaded to BullMQ — handlers under 100ms.
- Handlers must be idempotent (events may be delivered more than once).
- Handlers must not throw — catch and log.

---

## 2. Event Type Naming

Format: `<module>.<entity>.<action>` — all lowercase, dot-separated.

| Pattern | Meaning |
|---|---|
| `platform.community.onboarded` | Platform-emitted — new community provisioned in this module |
| `chat.message.sent` | Chat-owned — message was sent |
| `forum.post.upvoted` | Forum-owned — post received upvote |
| `tutor.session.ended` | Tutor-owned — session completed |
| `cmp.campaign.scheduled` | Campaigns-owned — campaign queued |

Subscribers can pattern-match with `*`: e.g. `chat.*`.

---

## 3. Channels

```
skep:events:<communityCode>         ← one channel per community
```

Publishers: `PUBLISH skep:events:COM96179941 <envelope-json>`.
Subscribers: `PSUBSCRIBE skep:events:*` — filter `eventType` in the subscriber.

---

## 4. Events Published by AI Tutor

| Event type | Emitted when | Payload | Likely consumers |
|---|---|---|---|
| `tutor.session.started` | `SessionsService.create()` success | `{ sessionId, topic }` | Campaigns (welcome msg), analytics |
| `tutor.session.ended` | Session transitions to `ended` (explicit, or idle-sweep) | `{ sessionId, messageCount, tokenCount, durationMs }` | Campaigns (follow-up), analytics |
| `tutor.session.deleted` | Soft-delete of session | `{ sessionId }` | Analytics |
| `tutor.message.sent` | User prompt persisted (WS or REST) | `{ sessionId, messageId, bodyPreview }` | Campaigns (activity digest) |
| `tutor.message.answered` | AI completion persisted | `{ sessionId, messageId, tokenCount, model }` | Analytics, billing aggregation |
| `tutor.settings.updated` | OWNER/ADMIN updated settings | `{ changedFields: [...] }` | Audit log |

**Hackathon minimum met:** AI Tutor emits **6 domain events** — well above the 3-event floor in `SKEP-INTEGRATION.md §Hackathon DoD`.

---

## 5. Events Subscribed by AI Tutor

| Event type | Source | Why we care | Handler |
|---|---|---|---|
| `platform.community.onboarded` | Platform | Confirm schema + settings row provisioned | Log + ensure `tutor_settings` singleton exists |
| `platform.community.suspended` | Platform | Stop accepting writes for community | Mark registry `status=suspended`; reject new sessions |
| `platform.community.archived` | Platform | Read-only mode | Mark `archived`; allow transcript reads only |

AI Tutor does **not** subscribe to other modules' events today — it is purely a producer toward Campaigns.

---

## 6. Example Payloads

### `tutor.session.started`

```json
{
  "eventId": "a8f3-...",
  "eventType": "tutor.session.started",
  "communityCode": "COM96179941",
  "actorUserId": "usr-1234",
  "occurredAt": "2026-04-18T10:15:00.000Z",
  "payload": {
    "sessionId": "sess-7821",
    "topic": "Calculus — limits"
  },
  "correlationId": "req-7f1e2b4a"
}
```

### `tutor.message.sent`

```json
{
  "eventId": "b2c4-...",
  "eventType": "tutor.message.sent",
  "communityCode": "COM96179941",
  "actorUserId": "usr-1234",
  "occurredAt": "2026-04-18T10:15:30.000Z",
  "payload": {
    "sessionId": "sess-7821",
    "messageId": "msg-9001",
    "bodyPreview": "What is a limit?"
  },
  "correlationId": "req-7f1e2b4a"
}
```

> `bodyPreview` is truncated to 140 chars. **Never** include the full prompt or completion in the event — bodies may contain PII and subscribers shouldn't need them.

### `tutor.message.answered`

```json
{
  "eventId": "c9d0-...",
  "eventType": "tutor.message.answered",
  "communityCode": "COM96179941",
  "actorUserId": "usr-1234",
  "occurredAt": "2026-04-18T10:15:35.000Z",
  "payload": {
    "sessionId": "sess-7821",
    "messageId": "msg-9002",
    "tokenCount": 287,
    "model": "claude-opus-4-7"
  },
  "correlationId": "req-7f1e2b4a"
}
```

### `tutor.session.ended`

```json
{
  "eventId": "d1e2-...",
  "eventType": "tutor.session.ended",
  "communityCode": "COM96179941",
  "actorUserId": "usr-1234",
  "occurredAt": "2026-04-18T10:45:00.000Z",
  "payload": {
    "sessionId": "sess-7821",
    "messageCount": 24,
    "tokenCount": 3187,
    "durationMs": 1800000
  },
  "correlationId": "req-7f1e2b4a"
}
```

---

## 7. The Campaigns Rule

Only the **Campaigns & Notifications** module sends push/email/SMS.
Every other module emits domain events; Campaigns subscribes and decides
what to deliver. **Do not** call notification APIs directly from any
non-Campaigns module.

---

## 8. PII in Events — Rules

| Allowed | Disallowed |
|---|---|
| Entity IDs (UUIDs, slugs) | Full email addresses |
| Truncated previews (≤ 140 chars, no PII expected) | Full message bodies containing PII |
| Role names | Plaintext passwords, tokens, secrets |
| Numeric counts / timestamps | Full phone numbers |

When in doubt: **emit the ID, let the subscriber fetch what it needs via its own queries** (or via a direct DB read — not via cross-module HTTP).

---

## 9. Testing

Required per `SKEP-DELTA.md §Additional Quality Gates`:

- **Publish → subscribe round trip:** publish an event from a producer,
  assert a subscribed handler receives it and processes idempotently on
  duplicate delivery.
- **Correlation propagation:** trace a `correlationId` from a request
  through the emitted event back into a subscriber log line.
- **Tenant scoping:** publish on `COM_A`'s channel, ensure `COM_B`
  subscribers do **not** receive it.
