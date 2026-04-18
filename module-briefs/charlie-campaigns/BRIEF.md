# Product Brief — SKEP Campaigns & Notifications

## Product Name

SKEP Campaigns & Notifications

## One-Line Description

The notification fabric for the SKEP platform — every other module's events
become user-visible notifications here, plus outbound campaigns (email, in-app,
push) that community owners send on purpose.

## The Problem

Every SKEP module generates events that members should know about — a new
chat message, an upvote on their forum post, a meeting reminder, an
assignment from the AI tutor. Today, each module would have to build its
own notification pipeline. That means:

- Five inconsistent delivery implementations.
- Notifications duplicated across channels (user gets an email AND a push
  AND an in-app dot for the same thing).
- No central place for a user to manage preferences ("email me about X, don't push Y").
- No way for community owners to send targeted campaigns (onboarding email
  sequences, event announcements, re-engagement blasts).

## The Solution

A single module that:

1. **Listens to every domain event** published by every other SKEP module
   on the shared Redis bus.
2. **Applies per-user preferences** to decide what becomes a notification
   and via which channel (in-app, email, push, SMS).
3. **Delivers** through the appropriate provider (Resend for email, web
   push for browser, SMS via a provider TBD, in-app via WebSocket).
4. **Tracks** deliveries, opens, and clicks — so the platform and owners
   know what's working.
5. **Supports campaigns**: owner-authored messages sent to a segment of
   members (all members, role-based, tag-based).

This is the **only** module allowed to send notifications. Every other
module emits events and trusts Campaigns to handle delivery.

## Target Users

### Primary User (notification recipient)

Every SKEP user. They see an in-app notification bell, receive emails
based on their preferences, and get push notifications if they opt in.

### Secondary User (campaign author)

Community `OWNER`s and `ADMIN`s. They author campaigns — email blasts,
push announcements — target segments, and measure performance.

## Goals for This Build

1. **Subscribe to the event bus** and convert at least 3 event types from
   each of the other 4 modules into notifications. (So: 12+ event types
   from Chat, Website, Tutor, Forum, plus Meetup — deliver in-app.)
2. **User preferences UI** — each user toggles channels per event category.
3. **Email delivery actually works** — at least one real email arrives in
   an inbox during the demo (Resend sandbox is fine).
4. **Three domain events published**: `notification.delivered`,
   `notification.read`, `campaign.sent`.
5. **Owner can create and send a campaign** to a community segment.

## What This Is NOT

- **Not a source of truth for user events.** Source modules own their
  events; Campaigns only relays.
- **Not a marketing automation platform.** No multi-step drip sequences
  in v1 (one-shot campaigns only).
- **Not a CRM.** No contact list management separate from SKEP members.
- **Not an SMS marketing provider.** SMS is a channel we deliver through,
  not a product we sell.
- **Not a notification center for anonymous users.** Must be a SKEP member.

## Competitive Context

### Alternatives users (community owners) use today

- Mailchimp + manual member export
- ConvertKit, Beehiiv
- Slack announcements + separate email
- Discord @everyone

### Why users will choose this instead

- Segments auto-sync with live SKEP membership (no CSV imports).
- Every SKEP action is a potential trigger without extra setup.
- Users have one preference center for all platform communications.
- Cheaper than paying a separate ESP for a small list.

## Goals for This Build

(Restated for clarity; same as above.)

1. Event-bus → notification conversion working for 12+ event types.
2. User preference UI functional.
3. Real email delivered end-to-end.
4. Required domain events emitted.
5. Owner-authored campaign sends to a live segment.

## Timeline

- MVP target date: **Hackathon T+72h**
- Key milestones:
  - T+6h: Auth + tenancy smoke-tested; event bus subscribe working
  - T+18h: In-app notifications from Chat module viewable in UI
  - T+36h: Email delivery wired to Resend sandbox
  - T+54h: Campaign authoring + send working end-to-end
  - T+72h: Demo

## Business Model

Bundled with existing SKEP tiers. Limits per tier:

- Number of campaign sends per month
- Total notifications delivered per month
- Custom template support (enterprise only)

Enforced via `LmsClient.checkLimits` before sends.

---

## Figma

Figma: *(to be provided — placeholder references acceptable)*

## Obsidian / Notes

N/A.

## Reference Products

- **Linear's notification center** — design bar for the in-app inbox
- **Intercom** — feel of per-user preference UI
- **Slack's notification preferences** — granularity model
- **Resend's email UX** — reference for delivery dashboards
</content>