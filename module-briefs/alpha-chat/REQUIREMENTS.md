# Requirements — SKEP Chat Module

## Must Have — MVP (ships in this build)

### Authentication & Users

- [ ] Every REST endpoint under `/api/v1/chat` is protected by `JwtAuthGuard`
      (applied globally via `@skep/platform-core`).
- [ ] Every WebSocket connection on `/chat` namespace requires a valid JWT
      in handshake `auth.token`.
- [ ] `community_code` from JWT determines which schema is queried — never
      accepted as a request parameter.
- [ ] User's display identity in messages comes from `platformUserId` and
      `AuthenticatedUser` — never from a request body field.

### Core Feature: Direct Messages (1:1)

- [ ] A user can start a DM with any other user in the same community by
      that user's `platform_user_id`.
- [ ] Sending a DM creates a `chat_rooms` row of type `dm` on first message
      (deduplicates on the pair of user IDs).
- [ ] Messages are stored as ciphertext only. The server never sees plaintext.
- [ ] A recipient who is connected sees the message in under 500ms.
- [ ] A recipient who reconnects sees all messages they missed, in order.

### Core Feature: Group Rooms

- [ ] Any `MEMBER`+ can create a group room with a name (max 80 chars).
- [ ] Room creator is `OWNER` of the room. Additional members added by ID.
- [ ] `OWNER` can add/remove members, rename the room, archive it.
- [ ] Only members of a room can send messages to it or subscribe to its
      updates.

### Core Feature: Read Receipts + Presence

- [ ] When a user reads a message, their "last read" cursor advances and
      all other members see updated read status within 1 second.
- [ ] When a user is actively connected to the chat WebSocket, other members
      of their rooms see them as `online`.
- [ ] When a user is typing, other members of the specific room see a
      "typing..." indicator that clears after 3s of inactivity.

### Core Feature: File Attachments

- [ ] A message may include up to 1 file attachment in v1.
- [ ] Attachment metadata (filename, size, mime) is in the message; the
      actual bytes live in S3 (pre-signed upload URL issued by the module).
- [ ] Attachment max size: 10MB (enforced by LMS limits for paid tiers).

### Data & Storage

- [ ] Tables created per community schema: `chat_rooms`, `chat_room_members`,
      `chat_messages`, `chat_read_cursors`.
- [ ] All tables have UUID primary keys, `created_at`/`updated_at`, and
      nullable `deleted_at` (soft delete only).
- [ ] Messages are indexed by `(room_id, created_at DESC)` for fast scrollback.

### API

- [ ] `GET /api/v1/chat/rooms` — list rooms the caller belongs to.
- [ ] `POST /api/v1/chat/rooms` — create a group room.
- [ ] `POST /api/v1/chat/rooms/:id/members` — add a member (OWNER only).
- [ ] `DELETE /api/v1/chat/rooms/:id/members/:userId` — remove a member
      (OWNER only).
- [ ] `GET /api/v1/chat/rooms/:id/messages?cursor=...` — cursor-paginated
      message history (encrypted payloads).
- [ ] `POST /api/v1/chat/rooms/:id/messages` — send a message (ciphertext).
- [ ] `POST /api/v1/chat/dms/:userId` — open or fetch a DM with another user.
- [ ] `POST /api/v1/chat/uploads/sign` — request a pre-signed S3 URL for
      an attachment.

### WebSocket Events

- Client → Server:
  - [ ] `chat:join-room { roomId }`
  - [ ] `chat:send { roomId, ciphertext, attachment? }`
  - [ ] `chat:read { roomId, upToMessageId }`
  - [ ] `chat:typing { roomId }`
- Server → Client:
  - [ ] `chat:message { roomId, message }` (fan-out to room members)
  - [ ] `chat:read-receipt { roomId, userId, upToMessageId }`
  - [ ] `chat:typing { roomId, userId }`
  - [ ] `chat:presence { userId, status }`

### Domain Events (emitted to Redis bus)

- [ ] `chat.message.sent` — on every sent message (payload: ids only, no content)
- [ ] `chat.room.created` — on new group room creation
- [ ] `chat.user.joined` — on new member added to a room

### UI / UX

- [ ] Room list (left sidebar), message stream (main), member list (right).
- [ ] Composer with attachment picker and emoji button (emoji picker can be
      `@emoji-mart/react` or similar — any lightweight picker).
- [ ] Read-receipt dots on last message the other party has read.
- [ ] Empty state for no rooms yet: CTA "Start your first conversation".
- [ ] Loading, error, and disconnected-reconnecting states visible.

### Encryption (minimum for v1)

- [ ] Client generates a keypair per device and uploads the public key.
- [ ] When sending to a recipient, client encrypts the message body with
      the recipient's public key (libsodium sealed boxes are acceptable
      for the hackathon; proper Signal protocol is a future build).
- [ ] Server never sees plaintext. Tests verify that the DB row for a
      message contains only ciphertext.
- [ ] Key verification UI exists even if it's just showing the
      fingerprint — proves the plumbing works.

## Should Have — Include if time allows

- [ ] Message editing (updates the last-message preview; edit history hidden from others).
- [ ] Message deletion (soft-delete; UI shows "message deleted").
- [ ] Unread counts on each room in the sidebar.
- [ ] Room search by name within the community.
- [ ] Mobile-responsive layout.

## Could Have — Future consideration, do not build now

- [ ] Full-text search (requires server-side index of plaintext — breaks E2E).
- [ ] Voice messages.
- [ ] Message reactions.
- [ ] Thread replies.
- [ ] Forwarding a message to another room.
- [ ] Multi-device key sync with proper Signal protocol.

## Won't Have — Explicitly out of scope

- [ ] Federation with external chat systems (Matrix, XMPP, SMS).
- [ ] Public rooms visible across communities.
- [ ] Server-side plaintext archival or moderation content-scanning.
- [ ] Paid sticker packs.
- [ ] Video/voice calls within chat (Meetup module handles real-time AV).

## User Stories

- As a **cohort member**, I want to DM another cohort member privately, so
  that I can ask a quick question without interrupting the group.
- As a **study group lead**, I want to create a room for our study group,
  so that conversations stay scoped and searchable for that group.
- As a **privacy-conscious user**, I want to see that my messages are E2E
  encrypted, so that I trust the platform with sensitive conversations.
- As a **community admin**, I want reports from the community to flag
  specific messages, so that I can moderate without reading everyone's DMs.

## Non-Functional Requirements

### Performance

- Page load (LCP): < 2.5s
- Message send → round-trip echo on sender's client: p95 < 300ms
- Message delivery to connected recipient: p95 < 500ms
- Room list load: < 500ms for up to 50 rooms

### Security

- Authentication strategy: SKEP JWT validated by `@skep/platform-core`
- E2E encryption: libsodium sealed boxes for v1 (documented as v1 choice
  with Signal protocol tracked as future work)
- Data that must be encrypted at rest: all message bodies (already ciphertext
  at application layer; DB disk encryption is infra's concern)
- Rate limit on message send: 60 per minute per user per room

### Accessibility

- Target: WCAG 2.1 AA
- Keyboard-navigable composer and room list
- Screen-reader labels on all presence / read-receipt icons

### Browser & Platform Support

- Browsers: Chrome, Safari, Edge, Firefox (last 2 major versions)
- Mobile: responsive web only in MVP

### Availability

- Acceptable downtime: n/a for hackathon
- Backup: DB snapshot daily (infra concern)

## Acceptance Criteria

- [ ] All 7 items in `SKEP-INTEGRATION.md § Hackathon Definition of Done` pass.
- [ ] Two browser tabs logged in as users in the same community can
      exchange 5 messages in a fresh group room, with read receipts and
      typing indicators visible.
- [ ] Inspecting the `chat_messages` row in Postgres shows ciphertext,
      not plaintext.
- [ ] A user in Community A issued a valid JWT for Community B cannot
      see any chat data from Community B — verified by isolation test.
- [ ] The three required domain events are observable on the Redis bus
      via `redis-cli PSUBSCRIBE 'skep:events:*'`.
</content>