# Product Brief — SKEP AI Tutor / Classroom

## Product Name

SKEP AI Tutor

## One-Line Description

An LLM-powered 1:1 tutor that helps SKEP learners work through course
content — asking Socratic questions, explaining concepts, and tracking
mastery — with every session tied back to the community's curriculum and
the platform's LMS.

## The Problem

SKEP's organization-type communities run structured learning programs
(cohorts, courses, bootcamps). Learners routinely get stuck between
scheduled sessions and have no good way to get unstuck:

- Slack channels are noisy and answer quality is uneven.
- Generic AI chatbots (ChatGPT) don't know the course material or what
  the learner has already covered.
- Scheduling a 1:1 with a human tutor takes days.
- Course designers have no visibility into what learners are struggling with
  until grades come in at the end.

## The Solution

A per-community AI tutor that:

1. Is **grounded in the course material** for that community (upload syllabus,
   reading list, sample problems).
2. Maintains **per-learner session memory** — remembers what they've
   already worked on, what they struggled with, current mastery level.
3. **Teaches Socratically** — prefers asking guiding questions to giving
   direct answers when the learner is close to understanding.
4. **Reports back to course designers** — aggregated struggle topics, time
   spent, question categories per cohort.
5. **Respects LMS limits** — turns off at configured monthly usage per learner
   (tier-based), reports usage for billing.

## Target Users

### Primary User

Learners in SKEP learning communities. Cohort participants, students,
employees in learning programs. Pain today: stuck between sessions,
poor-quality help.

### Secondary User

Course designers and community `OWNER`s. They upload materials, configure
the tutor's persona ("more challenging" vs "more patient"), and review
aggregate analytics.

## Goals for This Build

1. **A learner can start a tutor session**, ask 5 questions, and receive
   answers grounded in uploaded course material — with working citation
   back to the source.
2. **Session memory persists** — closing and reopening resumes context.
3. **At least one Socratic pattern** — the tutor sometimes asks a clarifying
   question instead of answering directly (demoable, even if simple).
4. **Three domain events published**: `tutor.session.started`,
   `tutor.question.asked`, `tutor.session.ended`.
5. **Usage reported to LMS** — per-learner question count visible in the
   mock LMS for billing enforcement.

## What This Is NOT

- **Not a replacement for instructors.** Escalation to a human is first-class,
  not an afterthought.
- **Not a general-purpose chatbot.** Refuses to answer off-topic questions;
  redirects back to course.
- **Not a grading system.** Tracks mastery for learner and designer feedback,
  but does not produce course grades.
- **Not a course authoring tool.** Materials come in as uploads; the Website
  Builder or existing SKEP modules handle authoring.
- **Not a voice tutor** in v1 (text only).
- **Not a multi-learner classroom** — one-on-one sessions only in MVP.

## Competitive Context

### Alternatives users (learners) use today

- ChatGPT / Claude.ai (not course-grounded)
- Khan Academy / Duolingo (fixed curriculum)
- Human TA office hours
- Study group Slack channels

### Why users will choose this instead

- Knows the course material — answers align with what will be tested.
- Available 24/7, unlike a human TA.
- Remembers the learner's journey — doesn't restart each session.
- Feedback loop to designers — the course improves based on real questions.

## Timeline

- MVP target date: **Hackathon T+72h**
- Key milestones:
  - T+6h: Auth + tenancy + LLM client wired
  - T+18h: Upload course material, create a session, send one turn
  - T+36h: Multi-turn session with persisted memory
  - T+54h: Citations + one Socratic pattern + designer analytics view
  - T+72h: Demo

## Business Model

Tiered, with the tutor as a premium feature.

- Free tier: 20 questions per month per learner
- Paid tier: 200 questions per month per learner
- Enterprise: unlimited + custom persona config

Enforced via `LmsClient.checkLimits` before each LLM call.

---

## Figma

Figma: *(to be provided — placeholder references acceptable)*

## Obsidian / Notes

N/A.

## Reference Products

- **Khanmigo** — grounded tutor pattern
- **Perplexity** — citation UX
- **Cursor's Composer** — multi-turn session feel
- **Notion AI** — prompt UX bar
</content>