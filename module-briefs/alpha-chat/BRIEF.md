# Product Brief — SKEP Chat Module

## Product Name

SKEP Chat

## One-Line Description

End-to-end encrypted messaging for SKEP communities — 1:1 DMs, group rooms,
and community-wide channels, with real-time delivery, read receipts, and
file attachments.

## The Problem

SKEP communities (cohorts, organizations, learning groups) have no in-platform
way to hold private conversations. Today they resort to WhatsApp, Discord,
or Slack — which fragments context, loses auditability inside SKEP, and
puts community-owned IP on consumer platforms.

Community owners specifically need:

- Conversations that stay inside their tenant boundary for compliance and
  moderation control.
- End-to-end encryption so even platform operators cannot read member DMs.
- Presence, typing indicators, and read receipts — the baseline people
  expect from a modern chat app.

## The Solution

A native chat module that every SKEP community gets by default. Users sign
in with their existing SKEP identity (JWT), DM anyone else in their
community, create rooms (open or invite-only), and share files. Messages
are end-to-end encrypted — the server sees ciphertext only. Every meaningful
event (message sent, room created) is emitted to the shared event bus so
other modules (Campaigns) can react without coupling.

## Target Users

### Primary User

Active members of SKEP communities — cohort participants, employees in an
organization-type community, course learners. Context: logged into SKEP on
desktop or mobile web. Pain today: split attention across SKEP + WhatsApp/Slack.

### Secondary User

Community owners and moderators. They need visibility into reported messages
(via metadata, without breaking E2E), ability to remove members from rooms,
and aggregate activity stats.

## Goals for This Build

1. **Send and receive messages in real-time** across devices with p95 delivery
   latency under 500 ms for connected recipients.
2. **E2E encryption works end-to-end** — the server stores only ciphertext
   and cannot decrypt any message body.
3. **Three domain events published** to the bus: `chat.message.sent`,
   `chat.room.created`, `chat.user.joined`.
4. **Tenant isolation verified** — a user in Community A cannot see the
   existence of a room or message in Community B, even by ID-guessing.
5. **Happy path demoable**: two users in the same community create a room,
   exchange 5 messages, and see read receipts update live.

## What This Is NOT

- **Not a replacement for video calls.** The Meetup module owns video.
  Chat shows a meeting invite card when someone shares a meeting link, but
  does not initiate video.
- **Not a notification delivery service.** Chat emits events; the Campaigns
  module decides whether to push/email.
- **Not a search engine over chat history** in this build. Full-text search
  across a community's chat history is a future build.
- **Not a federation client.** No Matrix, no XMPP, no external protocol
  interop. Pure SKEP-to-SKEP.
- **Not a voice messaging app.** Text and file attachments only in v1.

## Competitive Context

### Alternatives users use today

- WhatsApp groups named after the cohort
- Slack workspaces per community
- Discord servers
- SKEP's own Meetup module chat (ephemeral, only during meetings)

### Why users will choose this instead

- Already signed in; zero onboarding friction.
- Community-bounded — members are pre-populated, no invite links to share.
- E2E encryption stronger than Slack's and on par with Signal/WhatsApp.
- Context lives where the cohort/course lives — no tab switching.

## Timeline

- MVP target date: **Hackathon T+72h**
- Hard external deadline: **Hackathon demo session**
- Key milestones:
  - T+6h: Migrations applied, JWT auth smoke-tested
  - T+18h: First `chat.message.sent` event on the bus
  - T+36h: E2E encrypted DM working end-to-end
  - T+54h: Group rooms + read receipts + demo UI polished
  - T+72h: Demo

## Business Model

Part of SKEP's existing tiered pricing. Chat is bundled at every tier;
limits per tier (rooms per community, file attachment size, history
retention) are enforced via `LmsClient.checkLimits`.

---

## Figma

Figma: *(to be provided by organizer — placeholder references acceptable for hackathon)*

## Obsidian / Notes

N/A for hackathon.

## Reference Products

- **Signal** — encryption bar, UX for key verification
- **Slack DMs** — room/thread model, read receipts
- **Linear's inline "Ready?" indicators** — presence indicators that feel calm, not anxious
</content>