# Requirements — SKEP Campaigns & Notifications

## Must Have — MVP (ships in this build)

### Authentication & Users

- [ ] User-facing notification endpoints (`GET`, `PATCH` on own notifications)
      require JWT, any authenticated role.
- [ ] Preference endpoints (`GET`, `PUT /preferences`) require JWT, any
      authenticated role.
- [ ] Campaign authoring endpoints require `OWNER` or `ADMIN` role.
- [ ] Campaign send endpoint requires `OWNER` role (extra guard on the
      destructive action).

### Core Feature: Event-Bus Subscriber

- [ ] On boot, subscribe to `skep:events:*` pattern on Redis.
- [ ] Map at least 12 event types (3 per other module) to notification
      specs: Chat (message.sent, room.created, user.joined), Website
      (page.published), Tutor (session.started, question.answered),
      Forum (post.created, reply.added, post.upvoted), Meetup
      (meeting.started, meeting.ending-soon, meeting.ended).
- [ ] For each event → notification, look up recipient's preferences and
      produce a notification row per selected channel.
- [ ] Idempotent on duplicate event delivery (events carry `eventId`; if
      a notification for that `eventId`+`userId`+`channel` exists, skip).

### Core Feature: In-App Notification Inbox

- [ ] `GET /api/v1/notifications` — cursor-paginated list of a user's
      notifications, newest first.
- [ ] `GET /api/v1/notifications/unread-count` — number of unread.
- [ ] `PATCH /api/v1/notifications/:id/read` — mark one as read.
- [ ] `PATCH /api/v1/notifications/read-all` — mark all as read.
- [ ] WebSocket namespace `/notifications` pushes new in-app notifications
      to a user's connected sockets in real time.

### Core Feature: Preferences

- [ ] Preference model: per user, per event category (chat, forum, tutor,
      website, meetup, platform), per channel (in_app, email, push, sms),
      a boolean.
- [ ] `GET /api/v1/notifications/preferences` — returns the grid.
- [ ] `PUT /api/v1/notifications/preferences` — updates any subset.
- [ ] Defaults: in_app ON for everything; email ON for digest-like events
      (post.created in watched threads, campaign sends); push/sms OFF.

### Core Feature: Email Delivery

- [ ] Resend integration sends real emails via the Resend API.
- [ ] Rendered email has: subject, plaintext body, HTML body (simple
      template, one CTA button, community branding).
- [ ] Bounces / complaints are logged but not acted on automatically in v1.
- [ ] All emails include an unsubscribe link (per-category opt-out).

### Core Feature: Campaigns

- [ ] `POST /api/v1/campaigns` — create a campaign draft (subject, body,
      channel, target segment).
- [ ] Target segments supported in v1: `all`, `role:<ROLE>`, `created-after:<date>`.
- [ ] `POST /api/v1/campaigns/:id/send` — resolve the segment, enqueue
      deliveries, mark campaign as `sending` → `sent`.
- [ ] `GET /api/v1/campaigns` — list campaigns for this community.
- [ ] `GET /api/v1/campaigns/:id` — detail view with delivery counts.

### Data & Storage

- [ ] Tables per community schema: `cmp_campaigns`, `cmp_campaign_deliveries`,
      `notif_notifications`, `notif_preferences`.
- [ ] `notif_notifications` has `dedupe_key` (from `eventId`+`userId`+`channel`)
      with a unique index.
- [ ] UUID PKs, timestamps, soft-delete columns as per SKEP-DELTA.

### API

- [ ] (see feature sections above for full endpoint list)

### Domain Events (emitted to Redis bus)

- [ ] `notification.delivered` — when a notification is created (for in-app)
      or successfully sent (for email/push/sms)
- [ ] `notification.read` — when a user marks a notification as read
- [ ] `campaign.sent` — when a campaign finishes dispatching to all recipients

### UI / UX

- [ ] Notification bell icon in the top nav with unread count badge.
- [ ] Click opens a dropdown/panel showing recent notifications with
      time-relative timestamps.
- [ ] Settings page at `/settings/notifications` for the preference grid.
- [ ] Campaign authoring page (OWNER/ADMIN only): subject, body rich text,
      channel selector, segment picker, "Send test to me" and "Send to segment" buttons.
- [ ] Campaign list page with sent/draft tabs and basic delivery stats.

### Observability

- [ ] Log every event-to-notification decision with: `eventType`, `userId`,
      `communityCode`, `channel`, `outcome` (delivered | skipped_preference | skipped_duplicate).
- [ ] Prometheus metrics (if metrics enabled): counters for
      `notifications_delivered_total{channel, module}`,
      `notifications_skipped_total{reason}`.

## Should Have — Include if time allows

- [ ] Web push via the browser Push API (VAPID keys, service worker).
- [ ] Digest mode: instead of one email per event, batch into a daily digest.
- [ ] Notification grouping in UI ("5 new replies on your post" instead of 5 rows).
- [ ] Per-campaign open/click tracking (pixel + tracked links).

## Could Have — Future consideration, do not build now

- [ ] SMS delivery (Twilio integration).
- [ ] Multi-step drip campaigns.
- [ ] A/B testing subject lines.
- [ ] Segment builder with boolean logic ("role is X AND joined before Y").
- [ ] Import/export subscribers (unnecessary — source is live SKEP membership).

## Won't Have — Explicitly out of scope

- [ ] Any other module sending notifications directly.
- [ ] External contact list (non-SKEP users).
- [ ] Marketing attribution / UTM dashboard.
- [ ] Landing pages for campaigns (Website Builder's job).
- [ ] Transactional password-reset emails (main SKEP platform owns auth emails).

## User Stories

- As a **forum user**, I want to get an email when someone replies to my
  post, so that I can return to the conversation.
- As a **member**, I want to turn off push notifications for chat messages
  at night, so that I don't get woken up.
- As a **community owner**, I want to send an announcement to all my
  members about an upcoming event, so that attendance is maximized.
- As a **user**, I want a single place to see all platform notifications,
  so that I'm not refreshing five modules.

## Non-Functional Requirements

### Performance

- Event bus → in-app notification visible in UI: < 2 seconds end-to-end.
- Email delivery handoff to Resend: < 5 seconds from event.
- Notification list API: < 200ms p95.
- Campaign send for 1,000 recipients: completes within 60 seconds.

### Security

- Resend API key in env only, never committed.
- Email templates strip HTML except a whitelist of safe tags.
- Unsubscribe links use signed tokens (HMAC) — not guessable IDs.
- Rate limit on user preference updates: 60 per minute per user.

### Reliability

- Event handler failures must not drop events. Retry with backoff, dead-letter
  on exhaustion. For hackathon: log + continue is acceptable.
- Resend 5xx responses should retry up to 3× with exponential backoff.

### Browser & Platform Support

- In-app UI: all browsers in the stack matrix.
- Email: renders in Gmail, Outlook 365, Apple Mail.

### Accessibility

- Notification bell: keyboard-reachable, screen-reader friendly.
- Preference grid: table with proper headers; not a color-only status.

## Acceptance Criteria

- [ ] All 7 items in `SKEP-INTEGRATION.md § Hackathon Definition of Done` pass.
- [ ] While the demo is running, triggering events in at least 3 other
      modules causes in-app notifications to appear in the bell within 2s.
- [ ] At least one real email is delivered to an inbox during demo.
- [ ] A user turning off "email for chat events" results in 0 emails on
      subsequent chat events, verified by test.
- [ ] A campaign sent to "all" recipients in a test community reaches
      every member and is visible in the delivery count.
- [ ] Three required domain events are observable on the bus.
- [ ] Cross-community isolation test passes.
</content>