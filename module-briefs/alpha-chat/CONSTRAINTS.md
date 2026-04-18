# Constraints — SKEP Chat Module

> This file extends `project/CONSTRAINTS.md` and `project/SKEP-DELTA.md` with
> Chat-specific limits. Where this conflicts with either, this file wins.

---

## Scope Constraints

### MVP Definition

Two users in the same SKEP community can exchange end-to-end encrypted
messages in real time over a DM or group room, with read receipts and
typing indicators. Messages persist, and scrollback works. Tenant isolation
is absolute. Three required domain events are emitted to the bus.

### Explicitly Out of Scope

- [ ] Voice messages
- [ ] Video/voice calls from within chat
- [ ] Message reactions, threads, forwards
- [ ] Full-text server-side search
- [ ] Federation to external chat protocols
- [ ] Public rooms visible across communities
- [ ] Multi-device perfect-forward-secrecy (Signal-protocol key ratchet)
- [ ] Moderation by reading plaintext server-side
- [ ] Paid sticker packs, message animations, custom themes

---

## Technical Constraints

### Chat-Specific Technical Locks

| Decision | Choice | Rationale |
|---|---|---|
| E2E encryption | `libsodium-wrappers` sealed boxes | Small, audited, good enough for v1 demo |
| Key storage on client | `IndexedDB` via a thin wrapper | localStorage leaks between tabs |
| Message IDs | UUID v7 (time-ordered) | Preserves natural order, cursor-friendly |
| Pagination | Cursor on `(created_at, id)` | Offset pagination drifts on live streams |
| Attachment storage | Cloudflare R2 via pre-signed URLs | Stack standard; bytes never touch the API server |
| Presence model | Ephemeral Redis key with TTL | Dies naturally on disconnect, no cleanup job |

### Libraries That Require Approval

- No `xmpp-js`, `matrix-js-sdk`, or any federation SDK.
- No `socket.io-redis-adapter` in MVP — single-node acceptable for demo.
- No `signal-protocol` libraries — out of scope for v1.
- `libsodium-wrappers` (~300KB gzipped) is pre-approved despite size — the
  whole feature depends on it.

### Performance Constraints

| Metric | Target | On miss |
|---|---|---|
| Room list API response | < 200ms p95 | Log warning |
| Message send → echo | < 300ms p95 | Log warning |
| Message fan-out to connected peer | < 500ms p95 | Log warning |
| Message history page (50 msgs) | < 400ms p95 | Log warning |
| WebSocket reconnect time after drop | < 2s | Log warning |

### Rate Limits

- Message sends: 60 per minute per user per room (enforced in service layer).
- Room creation: 10 per day per user (enforced via `LmsClient.checkLimits`).
- File uploads: 10 per hour per user (enforced via `LmsClient.checkLimits`).

---

## Security Constraints (Chat-Specific)

- The server **MUST NOT** log, store, cache, or process message plaintext
  in any form. Treat the `ciphertext` field as opaque bytes.
- Pre-signed S3 URLs expire in 15 minutes. No longer.
- A user's public key upload is authenticated but not encrypted on transit
  (TLS only); the key itself is public.
- A room member list is queryable only by existing members of that room —
  no "list all members by ID" endpoint.
- A DM room is queryable only by its two participants.
- Isolation test is a **blocking quality gate**: if a user in Community B
  can see even the ID of a room from Community A, ship is blocked.

---

## Data Retention

- Soft-deleted messages retained for 30 days before hard purge (hard purge
  is a future build; for hackathon, soft-delete stays forever).
- Attachments on R2 are not deleted in the hackathon (future build).
- Typing indicators, presence keys: Redis TTL 10s and 60s respectively.

---

## Things Claude Must ALWAYS Do (Chat-Specific)

- Use `@skep/platform-core` for every auth/tenancy/event primitive.
- Validate that the sender is a member of the room before persisting any
  message (service-layer check, not just frontend).
- Emit `chat.message.sent` on every successful send, **with no message
  preview content** in the event payload — only IDs. The bus is plaintext;
  the message is not.
- Store the sender's `platform_user_id` and `community_code` on every
  message row for future moderation traceability.
- Use `WsJwtGuard` on the chat gateway.

## Things Claude Must NEVER Do (Chat-Specific)

- Never store decrypted message bodies, not even transiently in memory
  caches or logs.
- Never include message preview/content in any domain event payload.
- Never trust a `senderId` or `communityCode` from the request body —
  always derive from the JWT.
- Never bypass the room-membership check "because the user obviously has
  access, they just typed in the room ID."
- Never allow a room member list to be queried by someone not in the room,
  even as an `ADMIN` of the community.
- Never implement message retrieval by chronological DB scan — always
  scope to `room_id` first.

---

## Quality Gate Thresholds (Chat-Specific Additions)

| Check | Threshold | On fail |
|---|---|---|
| Ciphertext-only test (inspect stored rows) | 100% ciphertext | Block ship |
| Room membership enforcement test | All non-members rejected | Block ship |
| Cross-community isolation test | 0 leaks | Block ship |
| Rate-limit enforcement test | 61st msg rejected | Block ship |
| Reconnect delivery test (messages during disconnect arrive on reconnect) | 100% delivery | Block ship |
</content>