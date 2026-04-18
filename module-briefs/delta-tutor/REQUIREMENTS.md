# Requirements — SKEP AI Tutor

## Must Have — MVP (ships in this build)

### Authentication & Users

- [ ] Learner endpoints require JWT, any authenticated role (`MEMBER`+).
- [ ] Designer endpoints (upload materials, view analytics, configure persona)
      require `OWNER` or `ADMIN`.
- [ ] A learner can only access their own sessions. Listing or reading
      another learner's session returns 404.

### Core Feature: Material Upload & Indexing

- [ ] `POST /api/v1/tutor/materials/upload-url` returns a pre-signed R2 URL
      for a PDF, Markdown, or plain text upload. Max 10MB per file. Max
      50 files per community (v1).
- [ ] After upload, `POST /api/v1/tutor/materials/:id/index` triggers
      chunking + embedding. Embeddings stored in `tutor_material_chunks`
      with `embedding vector(1536)` using `pgvector`.
- [ ] Materials are scoped to community schema. Never cross schemas.

### Core Feature: Sessions

- [ ] `POST /api/v1/tutor/sessions` creates a session. Optional `topic` hint.
- [ ] `GET /api/v1/tutor/sessions` lists the caller's sessions.
- [ ] `GET /api/v1/tutor/sessions/:id` returns session metadata + turn count.
- [ ] `GET /api/v1/tutor/sessions/:id/turns?cursor=...` lists turns.

### Core Feature: Q&A Turn (the main loop)

- [ ] `POST /api/v1/tutor/sessions/:id/turns` with `{ question }`:
  1. Check LMS limit; reject 403 with `TUTOR_QUOTA_EXCEEDED` if out.
  2. Persist the turn (role=learner, content, tokens=null yet).
  3. Retrieve top-5 relevant material chunks via pgvector cosine similarity.
  4. Build a system prompt that: sets the tutor persona, includes retrieved
     chunks as context, references prior turns from the session (last ~8).
  5. Call the LLM. Stream the response back to the client via SSE or
     WebSocket (team's choice; document it).
  6. On completion, persist the tutor turn with content + cited
     material_chunk_ids + token usage.
  7. Report usage to `LmsClient.reportUsage` (metric: `tutor_questions`,
     value: 1; and `tutor_tokens`, value: total tokens).
  8. Emit `tutor.question.asked` event.

### Core Feature: Citations

- [ ] Every tutor response includes an array of `citations` — each is a
      `material_id` + `chunk_id` + short excerpt (≤ 200 chars) + offset.
- [ ] The UI renders citations as superscript numbers that expand to show
      the source excerpt.

### Core Feature: Socratic Mode (at least one pattern)

- [ ] When the learner's question looks like a direct factual ask about
      material the system can confirm the learner has seen (prior turns +
      material recency), the system prompt includes an instruction: "If
      the learner is close to the answer, ask a guiding question rather
      than giving it directly. If they are far off, explain directly."
- [ ] This behavior is demoable — asking the same question twice (first
      vaguely, then with context that shows the learner has been studying)
      produces different response styles.

### Core Feature: Designer Analytics

- [ ] `GET /api/v1/tutor/analytics/overview` (OWNER/ADMIN only):
      total sessions, total questions, top 10 topic clusters by volume
      (simple keyword clustering is fine for v1).
- [ ] `GET /api/v1/tutor/analytics/struggles` (OWNER/ADMIN only):
      questions where the LLM response was followed by a follow-up
      clarification within 2 minutes (heuristic for "learner didn't get it").

### Data & Storage

- [ ] Tables per community schema: `tutor_materials`, `tutor_material_chunks`
      (with `embedding vector(1536)`), `tutor_sessions`, `tutor_turns`.
- [ ] `tutor_turns` stores: `id`, `session_id`, `role` (`learner` | `tutor`),
      `content`, `citations` jsonb, `tokens_in`, `tokens_out`, `created_at`.
- [ ] `pgvector` extension enabled in every community schema at migration
      time (`CREATE EXTENSION IF NOT EXISTS vector`).

### API

- [ ] (See feature sections above.)

### WebSocket / SSE

- [ ] Streaming endpoint for Q&A turns on `/tutor` namespace (Socket.IO) or
      SSE at `POST /api/v1/tutor/sessions/:id/turns` — team chooses.
- [ ] Client receives token-by-token streaming for tutor responses.

### Domain Events (emitted to Redis bus)

- [ ] `tutor.session.started` — on session creation
- [ ] `tutor.question.asked` — on each learner turn
- [ ] `tutor.session.ended` — on explicit session close or inactivity (30min timeout)

### UI / UX

- [ ] Learner view: session list, chat-style pane for the active session,
      input composer with "Ask" button, streaming response rendering,
      citation pills.
- [ ] Designer view: materials management (upload list, reindex button)
      and analytics dashboard (two metrics cards + top-topics table).
- [ ] Quota indicator in learner view: "18 / 20 questions used this month".

## Should Have — Include if time allows

- [ ] Session summarization on close (TL;DR of what was covered).
- [ ] "Not sure? Ask a human" button that creates a notification for
      a community `MODERATOR` (via the Campaigns module event pattern).
- [ ] Persona configuration UI (dropdown: "Patient", "Challenging",
      "Socratic").

## Could Have — Future consideration, do not build now

- [ ] Voice input / output
- [ ] Multi-learner classroom sessions
- [ ] Grading / assessment integration
- [ ] Automated quiz generation from materials
- [ ] Fine-tuned / domain-specific models
- [ ] Multi-modal inputs (images of handwritten work, diagrams)

## Won't Have — Explicitly out of scope

- [ ] General-purpose ChatGPT replacement behavior (off-topic refusal mandatory)
- [ ] Jailbreak-resistant hardening beyond basic prompt engineering
- [ ] Custom model training per community
- [ ] Plagiarism detection
- [ ] Direct LMS grade writing

## User Stories

- As a **learner**, I want to ask a question about my course at midnight,
  so that I'm not blocked until the next office hours.
- As a **learner**, I want the tutor to remember what I worked on yesterday,
  so that I don't re-explain my context every session.
- As a **designer**, I want to see which topics confuse most learners,
  so that I can improve my course materials.
- As a **designer**, I want the tutor to refuse off-topic questions,
  so that it stays a learning tool, not a chatbot.

## Non-Functional Requirements

### Performance

- Time-to-first-token for a tutor response: < 2s p95.
- Total response generation (streaming completion): bounded by LLM, typically 5–15s.
- Material indexing for a 10-page PDF: < 30s.
- Analytics queries: < 500ms p95 (they operate on community-schema rows only).

### Security

- LLM API keys (Anthropic / OpenAI) in env only.
- Material upload validated: MIME check + first-bytes sniff. Max 10MB.
- No raw HTML or scripts in tutor responses rendered to the UI — render
  as Markdown with sanitizer.
- Prompt injection defense: system prompt explicitly instructs the model
  to refuse any user attempt to override instructions. Known prompt-injection
  patterns in the user input are detected and flagged (best-effort).
- A learner cannot read another learner's sessions (enforce at service
  layer, not just UI).

### Reliability

- LLM 5xx: retry once with backoff, then return `TUTOR_LLM_UNAVAILABLE`.
- If a streaming connection drops mid-response, persist what was received
  and mark the turn `partial`. The UI shows this clearly.

### Accessibility

- Target: WCAG 2.1 AA for the chat UI.
- Streaming text must be announceable by screen readers (live region).
- Keyboard navigation through citation expansion.

### Browser Support

- Chrome, Safari, Edge, Firefox (last 2 major versions).
- Mobile responsive for the chat view.

## Acceptance Criteria

- [ ] All 7 items in `SKEP-INTEGRATION.md § Hackathon Definition of Done` pass.
- [ ] A learner can: upload a PDF → create a session → ask a question →
      see a streaming response with citations pointing into the PDF.
- [ ] Closing and reopening a session restores the conversation history.
- [ ] The LMS mock shows question counts per learner per community.
- [ ] A learner in Community A cannot see any material, session, or turn
      from Community B.
- [ ] An off-topic question receives a clear "let's stay focused on the
      course" response, not a generic answer.
- [ ] The three required domain events appear on the bus.
</content>