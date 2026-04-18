# API Contract — MVP

> Scope: the three endpoints wired into the current backend — **Chat**, **Flashcards**, **Audio Overview**.
> This contract is the live, implemented surface. The fuller SKEP-platform contract lives in
> [`API-CONTRACT.md`](./API-CONTRACT.md) and will replace this file once the platform-core
> package (JWT, tenancy, events, LMS) is wired in.

---

## Base

| Attribute | Value |
|---|---|
| Base URL (dev) | `http://localhost:3001` |
| Versioned prefix | `/api/v1/tutor` |
| Auth (MVP) | None — public. JWT gate is added in Phase 1 (see [`PLAN.md`](./PLAN.md)). |
| Content type | `application/json; charset=utf-8` |
| CORS | `CORS_ORIGINS` env var (default `http://localhost:3000`) |
| Static files | `/uploads/audio/<id>.mp3` served publicly while MVP. |

## Envelope

Every response uses the same shape. The client MUST parse it; the frontend has a typed helper (`unwrap`) that does this.

```jsonc
// Success
{
  "success": true,
  "data": { /* endpoint-specific */ },
  "meta": { "requestId": "uuid", "timestamp": "ISO-8601" }
}

// Error
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Human message",
    "details": { /* optional */ }
  },
  "meta": { "requestId": "uuid", "timestamp": "ISO-8601" }
}
```

Common error codes in this build: `VALIDATION_FAILED`, `NOT_FOUND`, `TUTOR_AI_PROVIDER_UNAVAILABLE`, `TUTOR_STUDIO_TTS_UNAVAILABLE`, `TUTOR_STUDIO_INVALID_OUTPUT`, `INTERNAL_ERROR`.

---

## 1. Chat — `POST /api/v1/tutor/chat`

Sends a prompt to Gemini with lesson-aware system instructions + conversation history. Returns a single assistant answer (non-streaming in MVP).

### Request

```jsonc
{
  "prompt": "What is an AI agent?",                      // required, 1–8000 chars
  "lessonId": "lesson-0421",                             // optional
  "lessonTitle": "Claude Code: Build Your First AI Agent", // optional, for system prompt
  "lessonContext": "Full or summarised lesson text...",  // optional, up to 20k chars
  "history": [                                           // optional, up to 40 turns
    { "role": "user",      "body": "..." },
    { "role": "assistant", "body": "..." }
  ]
}
```

### Response — `200 OK`

```jsonc
{
  "success": true,
  "data": {
    "messageId": "uuid",
    "role": "assistant",
    "body": "Answer text here (≤ ~180 words, Socratic tone).",
    "createdAt": "2026-04-18T10:15:30.000Z",
    "model": "gemini"
  },
  "meta": { "requestId": "...", "timestamp": "..." }
}
```

### Errors

| Status | `error.code` | When |
|---|---|---|
| 400 | `VALIDATION_FAILED` | Body fails `class-validator` checks (prompt missing, too long, history malformed). |
| 503 | `TUTOR_AI_PROVIDER_UNAVAILABLE` | `GOOGLE_API_KEY` missing, quota exhausted, upstream Gemini failure. |

---

## 2. Flashcards — `POST /api/v1/tutor/flashcards`

Generates a structured flashcard deck from a lesson via Gemini with `responseMimeType: application/json`. Output is validated and stored in-memory.

### Request

```jsonc
{
  "lessonId": "lesson-0421",                                  // required
  "lessonTitle": "Claude Code: Build Your First AI Agent",    // required
  "lessonContext": "Lesson text for better cards...",         // optional, up to 20k chars
  "count": 10,                                                // optional, 3–30, default 10
  "difficulty": "mixed"                                       // optional: easy | medium | hard | mixed (default: mixed)
}
```

### Response — `201 Created`

```jsonc
{
  "success": true,
  "data": {
    "id": "deck-uuid",
    "lessonId": "lesson-0421",
    "title": "Claude Code: Build Your First AI Agent — 10 flashcards",
    "difficulty": "mixed",
    "cardCount": 10,
    "cards": [
      {
        "id": "card-uuid",
        "front": "What is an AI agent?",
        "back": "An agent is a system that uses a language model to plan and take actions...",
        "hint": "Think of tool-calling vs. a single-shot chat.",
        "tags": ["agents", "claude-code"]
      }
    ],
    "createdAt": "2026-04-18T10:15:30.000Z"
  },
  "meta": { "requestId": "...", "timestamp": "..." }
}
```

### `GET /api/v1/tutor/flashcards?lessonId=...`

Lists previously generated decks, optionally filtered by `lessonId`. MVP keeps them in memory so this resets when the server restarts.

### `GET /api/v1/tutor/flashcards/:id`

Returns one deck. `404` with `TUTOR_FLASHCARD_DECK_NOT_FOUND` if missing.

### Errors

| Status | `error.code` | When |
|---|---|---|
| 400 | `VALIDATION_FAILED` | DTO violations. |
| 502 | `TUTOR_STUDIO_INVALID_OUTPUT` | Gemini returned JSON but it had zero valid cards. |
| 503 | `TUTOR_AI_PROVIDER_UNAVAILABLE` | Key / quota / network failure on Gemini. |

---

## 3. Audio Overview — `POST /api/v1/tutor/audio-overviews`

Two-stage pipeline:
1. Gemini writes a narration script in the chosen language (150–220 words, plain text, no markup).
2. Google Cloud Text-to-Speech renders the script to MP3 with a language-specific Wavenet voice.

The MP3 is saved to `UPLOAD_DIR/audio/<id>.mp3` and exposed at `/uploads/audio/<id>.mp3`.

### Request

```jsonc
{
  "lessonId": "lesson-0421",                                  // required
  "lessonTitle": "Claude Code: Build Your First AI Agent",    // required
  "lessonContext": "Optional lesson text to ground narration.",
  "language": "hi-IN",                                        // required — see table
  "voiceStyle": "narrator"                                    // optional: narrator | conversational | friendly
}
```

### Supported languages

| Code | Language | TTS voice |
|---|---|---|
| `en-IN` | English (India) | `en-IN-Wavenet-A` |
| `hi-IN` | Hindi | `hi-IN-Wavenet-A` |
| `ta-IN` | Tamil | `ta-IN-Wavenet-A` |
| `te-IN` | Telugu | `te-IN-Standard-A` |
| `bn-IN` | Bengali | `bn-IN-Wavenet-A` |
| `gu-IN` | Gujarati | `gu-IN-Wavenet-A` |
| `kn-IN` | Kannada | `kn-IN-Wavenet-A` |
| `ml-IN` | Malayalam | `ml-IN-Wavenet-A` |
| `mr-IN` | Marathi | `mr-IN-Wavenet-A` |
| `pa-IN` | Punjabi | `pa-IN-Wavenet-A` |

### Response — `201 Created`

```jsonc
{
  "success": true,
  "data": {
    "id": "audio-uuid",
    "lessonId": "lesson-0421",
    "language": "hi-IN",
    "voiceStyle": "narrator",
    "title": "Audio Overview · Hindi",
    "transcript": "(the full narration script in Hindi)",
    "audioUrl": "/uploads/audio/audio-uuid.mp3",
    "durationSec": 127,
    "sizeBytes": 204832,
    "createdAt": "2026-04-18T10:15:30.000Z"
  },
  "meta": { "requestId": "...", "timestamp": "..." }
}
```

Playback: prepend the backend base URL, e.g. `http://localhost:3001/uploads/audio/audio-uuid.mp3`.

### `GET /api/v1/tutor/audio-overviews?lessonId=...`

Lists previously generated overviews (optionally filtered).

### `GET /api/v1/tutor/audio-overviews/:id`

Returns one overview. `404` with `TUTOR_AUDIO_OVERVIEW_NOT_FOUND` if missing.

### Errors

| Status | `error.code` | When |
|---|---|---|
| 400 | `VALIDATION_FAILED` | Missing language / lessonId, unsupported language. |
| 503 | `TUTOR_AI_PROVIDER_UNAVAILABLE` | Script generation failed. |
| 503 | `TUTOR_STUDIO_TTS_UNAVAILABLE` | Google TTS call failed (quota, auth, network). |

---

## Configuration

Set these on the backend:

```
GOOGLE_API_KEY=...             # REQUIRED — rotate any key shared in chat/logs/commits
GEMINI_MODEL=gemini-2.5-flash  # override to gemini-2.5-pro for higher quality
CORS_ORIGINS=http://localhost:3000
UPLOAD_DIR=./uploads           # where MP3s are written; served at /uploads
```

Enable both **Generative Language API** and **Cloud Text-to-Speech API** on the same GCP project that owns the key.

---

## What's NOT in this MVP contract (yet)

- JWT validation (SKEP tenant JWTs) — all endpoints currently public.
- Tenant isolation — no `community_code` scoping.
- Usage counters / rate limiting — `GET /me/usage` not wired.
- Event bus publishing — no `tutor.*` events emitted yet.
- Persistent storage — decks and overviews live in process memory and reset on restart.

These light up in Phases 0–5 from [`PLAN.md`](./PLAN.md). This contract will be superseded by [`API-CONTRACT.md`](./API-CONTRACT.md) at that point.
