# Product Brief — SKEP Forum

## Product Name

SKEP Forum

## One-Line Description

Threaded asynchronous discussions for SKEP communities — posts, nested
replies, upvotes, tags, and moderation tools — the long-form complement
to Chat's real-time conversation.

## The Problem

SKEP communities need a place for discussions that outlive the moment:
product ideas, how-to questions, debates, member-contributed guides,
announcements. Chat is wrong for this because:

- Messages scroll past and die.
- No structure — you can't find the answer to "how did you set up X?"
  from six weeks ago.
- No social-proof signal (upvotes) to surface what's useful.
- No tagging / categorization.

Community owners end up sending members off-platform — to Discourse,
Circle, Reddit — which fragments the community and kills attribution.

## The Solution

A forum native to SKEP with:

1. **Posts and nested replies** (up to 2 levels of nesting; third-level
   replies flatten to level 2 — keeps threads readable).
2. **Upvotes** on posts and replies, with tie-breaking sorting.
3. **Tags** (community-configurable, required on post).
4. **Feeds** — Hot, New, Top (today / this week / all time).
5. **Moderation tools** — pin post, lock thread, hide reply, tag removal.
6. **Mention notifications** — `@username` emits an event that Campaigns
   turns into a notification.
7. **Search** — simple Postgres full-text search across posts in the caller's
   community only.

## Target Users

### Primary User

SKEP community members who want to start or follow longer conversations.

### Secondary User

`MODERATOR`s and `ADMIN`s who keep the forum healthy. Community `OWNER`s
who shape the forum's structure (tags, categories).

## Goals for This Build

1. **A member can create a post, receive a reply, and upvote it** end-to-end.
2. **Feed sorting (Hot)** works correctly — uses a time-decay + upvote
   algorithm that visibly changes ordering as activity happens.
3. **Moderation works** — a `MODERATOR` can hide a reply, and the reply
   shows as hidden to non-authors.
4. **Three domain events published**: `forum.post.created`,
   `forum.reply.added`, `forum.post.upvoted`.
5. **Search finds posts by content** within a community.

## What This Is NOT

- **Not a wiki.** Posts are immutable-ish (edit window, not continuous editing).
- **Not Reddit.** Communities are closed; no cross-community feeds.
- **Not a Stack Overflow clone.** No accepted-answer semantics — upvotes
  are the signal.
- **Not a chat room.** Deliberately threaded and slow.
- **Not a file-sharing platform.** Images in posts are fine; bulk file
  drop is out of scope.
- **Not a multi-community aggregator.** Strict tenant isolation.

## Competitive Context

### Alternatives users use today

- Discourse (self-hosted or hosted)
- Circle
- Discord forum channels
- Reddit private subreddits
- Slack channels (wrong tool but used anyway)

### Why users will choose this instead

- Zero setup — activates instantly when SKEP enables the module.
- Members pre-populated from SKEP membership — no invite flow.
- Single identity across chat, forum, tutor, website — no username
  collision games.
- Notifications go through the shared Campaigns module with user-respected
  preferences.
- Costs less than a paid Circle seat per member.

## Timeline

- MVP target date: **Hackathon T+72h**
- Key milestones:
  - T+6h: Auth + tenancy smoke-tested
  - T+18h: Create post + create reply + list posts working
  - T+36h: Upvotes + Hot/New/Top sorting working
  - T+54h: Mentions + search + moderation actions
  - T+72h: Demo

## Business Model

Bundled with all SKEP tiers. Limits per tier (posts per day, replies per
day, storage for attachments) enforced via `LmsClient.checkLimits`.

---

## Figma

Figma: *(to be provided — placeholder references acceptable)*

## Obsidian / Notes

N/A.

## Reference Products

- **Lobste.rs** — UI density target; calm design
- **Hacker News** — Hot algorithm reference
- **Discourse** — feature-set sanity check
- **Reddit old.reddit.com** — threaded reply UX reference
</content>