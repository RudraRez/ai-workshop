# Data Model

> PostgreSQL schema design. Schema-per-community isolation with a single
> shared registry in `public`. Soft-delete everywhere.

**Module:** SKEP **AI Tutor** — table prefix `tutor_`.

**Status:** DRAFT — shared tables fixed, AI Tutor feature tables below.

---

## 1. Physical Layout

```
PostgreSQL cluster
│
├─ public                                  ← shared across all communities
│  ├─ schema_registry                      ← enabled communities + metadata
│  └─ schema_migrations_global             ← platform-core migrations ledger
│
├─ com96179941                             ← one schema per community
│  ├─ <module>_<entity>  (×N)              ← module-owned tables
│  └─ schema_migrations  (per-schema ledger)
│
├─ com42318709
│  └─ ...
│
└─ com<N>
   └─ ...
```

Schema name rule: `community_code` lowercased, `[a-z0-9_]` only, truncated to 63 chars.
Validated against the regex `^[a-z0-9_]{1,63}$` before any interpolation.

---

## 2. Shared Schema (`public`)

### `public.schema_registry`

```sql
CREATE TABLE public.schema_registry (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  community_code VARCHAR(50)  NOT NULL UNIQUE,
  org_id         UUID         NOT NULL,
  schema_name    VARCHAR(63)  NOT NULL,
  display_name   VARCHAR(255),
  status         VARCHAR(20)  NOT NULL DEFAULT 'active',   -- active | suspended | archived
  metadata       JSONB        NOT NULL DEFAULT '{}'::jsonb,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX schema_registry_status_idx
  ON public.schema_registry (status)
  WHERE status = 'active';
```

**Access rule:** only `SchemaManagerService` reads/writes this table.
Business code never touches `public.schema_registry` directly.

### `public.schema_migrations_global`

Tracks platform-core migrations (not feature migrations — those run per-schema).

```sql
CREATE TABLE public.schema_migrations_global (
  version     VARCHAR(64) PRIMARY KEY,
  applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  checksum    CHAR(64) NOT NULL
);
```

---

## 3. Per-Community Schema Template

Every community schema contains:

```sql
CREATE TABLE "<schema>".schema_migrations (
  version     VARCHAR(64) PRIMARY KEY,
  applied_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  checksum    CHAR(64) NOT NULL
);
```

Plus all module-owned tables (see §4).

---

## 4. Module Table Prefixes (from SKEP-INTEGRATION §Database Conventions)

| Module | Prefix | Typical tables |
|---|---|---|
| Chat | `chat_` | `chat_rooms`, `chat_messages`, `chat_memberships` |
| Website Builder | `web_` | `web_sites`, `web_pages`, `web_blocks` |
| Campaigns | `cmp_` / `notif_` | `cmp_campaigns`, `notif_deliveries`, `notif_preferences` |
| AI Tutor | `tutor_` | `tutor_sessions`, `tutor_messages`, `tutor_transcripts` |
| Forum | `forum_` | `forum_threads`, `forum_posts`, `forum_replies`, `forum_votes` |

---

## 5. AI Tutor Tables

### 5.1 `tutor_sessions`

```sql
CREATE TABLE IF NOT EXISTS tutor_sessions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic          VARCHAR(200) NOT NULL,
  context        TEXT,
  status         VARCHAR(20) NOT NULL DEFAULT 'active',   -- active | ended
  created_by     UUID NOT NULL,                           -- JWT.sub
  lesson_id      UUID,                                    -- optional: lesson the user is watching
  lesson_title   VARCHAR(300),                            -- denormalized for display
  message_count  INTEGER NOT NULL DEFAULT 0,
  ended_at       TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at     TIMESTAMPTZ
);

-- MEMBER-scoped list (owned sessions, newest first)
CREATE INDEX tutor_sessions_owner_created_idx
  ON tutor_sessions (created_by, created_at DESC)
  WHERE deleted_at IS NULL;

-- ADMIN/OWNER community-wide list
CREATE INDEX tutor_sessions_active_idx
  ON tutor_sessions (status, created_at DESC)
  WHERE deleted_at IS NULL;
```

### 5.2 `tutor_messages`

```sql
CREATE TABLE IF NOT EXISTS tutor_messages (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id     UUID NOT NULL REFERENCES tutor_sessions(id),
  role           VARCHAR(20) NOT NULL,                    -- user | assistant
  body           TEXT NOT NULL,
  token_count    INTEGER NOT NULL DEFAULT 0,
  request_id     UUID,                                    -- correlation w/ tutor:ask
  model          VARCHAR(80),                             -- which AI model answered
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at     TIMESTAMPTZ
);

CREATE INDEX tutor_messages_session_created_idx
  ON tutor_messages (session_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX tutor_messages_request_id_idx
  ON tutor_messages (request_id)
  WHERE request_id IS NOT NULL;
```

### 5.3 `tutor_transcripts`

```sql
CREATE TABLE IF NOT EXISTS tutor_transcripts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id     UUID NOT NULL UNIQUE REFERENCES tutor_sessions(id),
  content        TEXT NOT NULL,                           -- full formatted transcript
  message_count  INTEGER NOT NULL,
  token_count    INTEGER NOT NULL,
  generated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  storage_ref    TEXT,                                    -- optional: R2 key if offloaded
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

> Transcripts are generated on session end. If `LENGTH(content) > 100_000`,
> the content is stored in R2 and `storage_ref` is populated while `content`
> holds a short preview. See open decision in `PLAN.md`.

### 5.4 `tutor_settings`

One row per community schema — community-level AI Tutor configuration.

```sql
CREATE TABLE IF NOT EXISTS tutor_settings (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  default_model            VARCHAR(80) NOT NULL DEFAULT 'claude-opus-4-7',
  system_prompt            TEXT NOT NULL DEFAULT 'You are a patient, accurate tutor.',
  max_tokens_per_answer    INTEGER NOT NULL DEFAULT 2048,
  member_daily_message_cap INTEGER NOT NULL DEFAULT 50,
  moderation_enabled       BOOLEAN NOT NULL DEFAULT TRUE,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Exactly one row enforced by partial unique index on a constant
CREATE UNIQUE INDEX tutor_settings_singleton_idx
  ON tutor_settings ((true));
```

### 5.5 `tutor_lessons` (Course mirror)

Read-mostly mirror populated by subscribing to `platform.course.lesson.*` events from SKEP main. This module never calls the course owner directly.

```sql
CREATE TABLE IF NOT EXISTS tutor_lessons (
  id             UUID PRIMARY KEY,                        -- comes from source; not gen_random_uuid
  course_id      UUID NOT NULL,
  title          VARCHAR(300) NOT NULL,
  summary        TEXT,
  content        TEXT NOT NULL,                           -- full lesson text used as input for AI / TTS
  content_hash   CHAR(64) NOT NULL,                       -- sha256; invalidates caches
  duration_sec   INTEGER NOT NULL DEFAULT 0,
  source_updated_at  TIMESTAMPTZ NOT NULL,                -- upstream updatedAt
  mirrored_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),  -- when we copied it in
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at     TIMESTAMPTZ
);

CREATE INDEX tutor_lessons_course_idx
  ON tutor_lessons (course_id, source_updated_at DESC)
  WHERE deleted_at IS NULL;
```

### 5.6 `tutor_studio_jobs` (polymorphic job tracker)

Single job table for every Studio generator (present and future). Type-specific output lives in sibling tables.

```sql
CREATE TABLE IF NOT EXISTS tutor_studio_jobs (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type           VARCHAR(40) NOT NULL,                    -- 'audio-overview' | 'flashcards' | <future>
  lesson_id      UUID NOT NULL REFERENCES tutor_lessons(id),
  requested_by   UUID NOT NULL,
  status         VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending | running | completed | failed
  progress       REAL NOT NULL DEFAULT 0,                 -- 0..1
  input          JSONB NOT NULL DEFAULT '{}'::jsonb,      -- generator-specific params
  output_ref     UUID,                                    -- FK resolved by type
  idempotency_key VARCHAR(80),                            -- unique per (requested_by, type) window
  error_code     VARCHAR(80),
  error_message  TEXT,
  started_at     TIMESTAMPTZ,
  completed_at   TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at     TIMESTAMPTZ
);

CREATE INDEX tutor_studio_jobs_user_created_idx
  ON tutor_studio_jobs (requested_by, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX tutor_studio_jobs_lesson_type_idx
  ON tutor_studio_jobs (lesson_id, type, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX tutor_studio_jobs_idem_idx
  ON tutor_studio_jobs (requested_by, type, idempotency_key)
  WHERE idempotency_key IS NOT NULL AND deleted_at IS NULL;
```

### 5.7 `tutor_audio_overviews`

```sql
CREATE TABLE IF NOT EXISTS tutor_audio_overviews (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id         UUID NOT NULL UNIQUE REFERENCES tutor_studio_jobs(id),
  lesson_id      UUID NOT NULL REFERENCES tutor_lessons(id),
  language       VARCHAR(10) NOT NULL,                    -- en-IN | hi-IN | bn-IN | gu-IN | kn-IN | ml-IN | mr-IN | pa-IN | ta-IN | te-IN
  voice_style    VARCHAR(20) NOT NULL DEFAULT 'narrator', -- narrator | conversational | friendly
  storage_key    TEXT NOT NULL,                           -- R2 object key; we sign URLs on read
  transcript     TEXT NOT NULL,                           -- the narration script actually rendered
  duration_sec   INTEGER NOT NULL,
  size_bytes     BIGINT NOT NULL,
  tts_provider   VARCHAR(40) NOT NULL,                    -- azure-speech | elevenlabs | polly | google-tts
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at     TIMESTAMPTZ
);

CREATE INDEX tutor_audio_lesson_lang_idx
  ON tutor_audio_overviews (lesson_id, language, created_at DESC)
  WHERE deleted_at IS NULL;
```

### 5.8 `tutor_flashcard_decks` + `tutor_flashcards`

```sql
CREATE TABLE IF NOT EXISTS tutor_flashcard_decks (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id         UUID NOT NULL UNIQUE REFERENCES tutor_studio_jobs(id),
  lesson_id      UUID NOT NULL REFERENCES tutor_lessons(id),
  title          VARCHAR(300) NOT NULL,
  difficulty     VARCHAR(20) NOT NULL,                    -- easy | medium | hard | mixed
  card_count     INTEGER NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at     TIMESTAMPTZ
);

CREATE INDEX tutor_flashcard_decks_lesson_idx
  ON tutor_flashcard_decks (lesson_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE TABLE IF NOT EXISTS tutor_flashcards (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id        UUID NOT NULL REFERENCES tutor_flashcard_decks(id),
  position       INTEGER NOT NULL,                        -- ordinal within deck
  front          VARCHAR(500) NOT NULL,
  back           TEXT NOT NULL,
  hint           VARCHAR(500),
  tags           TEXT[] NOT NULL DEFAULT '{}',
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at     TIMESTAMPTZ
);

CREATE INDEX tutor_flashcards_deck_position_idx
  ON tutor_flashcards (deck_id, position)
  WHERE deleted_at IS NULL;
```

### 5.9 `tutor_usage_daily` (per-day counters)

Powers the `GET /me/usage` badge (`12/20 left`). Single row per (user, date).

```sql
CREATE TABLE IF NOT EXISTS tutor_usage_daily (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL,
  day                   DATE NOT NULL,                    -- UTC day boundary
  tutor_messages_used   INTEGER NOT NULL DEFAULT 0,
  studio_audio_used     INTEGER NOT NULL DEFAULT 0,
  studio_flashcards_used INTEGER NOT NULL DEFAULT 0,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, day)
);

CREATE INDEX tutor_usage_daily_day_idx
  ON tutor_usage_daily (day);
```

Limits (`limit` side of the counter) come from `tutor_settings`, so admins can tune caps without a migration.

### 5.10 `tutor_settings` — extension

Extends §5.4 — the settings row carries Studio caps too:

```sql
ALTER TABLE tutor_settings
  ADD COLUMN IF NOT EXISTS member_daily_audio_cap      INTEGER NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS member_daily_flashcards_cap INTEGER NOT NULL DEFAULT 10;
```

### 5.11 Relationship Diagram

```
tutor_settings        (singleton per schema)
tutor_usage_daily     (one row per user per day)

tutor_lessons ──────┬─∞── tutor_sessions ──1─┬─∞── tutor_messages
                    │                        └─1─── tutor_transcripts
                    │
                    └─∞── tutor_studio_jobs ──1──1── tutor_audio_overviews
                                             └──1──1── tutor_flashcard_decks ──1─∞── tutor_flashcards
```

All foreign keys stay within the same schema. No cross-schema references.

---

## 6. Column Conventions (mandatory)

Every table:

| Column | Type | Rule |
|---|---|---|
| `id` | `UUID` | PK, default `gen_random_uuid()` |
| `created_at` | `TIMESTAMPTZ` | Not null, default `NOW()` |
| `updated_at` | `TIMESTAMPTZ` | Not null, default `NOW()`, touched on every update |
| `deleted_at` | `TIMESTAMPTZ` | Nullable; non-null == soft-deleted. **Never hard delete.** |

Foreign keys stay inside the **same schema**. Never reference `public.*`
from feature tables except for ephemeral use of `gen_random_uuid()`.

---

## 7. Indexing Rules

- Active-row indexes always include `WHERE deleted_at IS NULL`.
- Index the columns you filter/sort by — not every FK gets an index automatically.
- Composite indexes: order matters; most-selective column first.
- Unique constraints are indexes — don't double-index.

---

## 8. Migration Conventions (from SKEP-DELTA)

```
modules/<feature>/migrations/
├── 001_init_<entity>.sql
├── 002_<action>_<entity>.sql
└── 003_...
```

- Filename: `NNN_<action>_<entity>.sql`, zero-padded, monotonic.
- Header block: module name, version, depends, description.
- Idempotent: wrap creates in `IF NOT EXISTS`.
- **No cross-schema references** (no `public.*` except `gen_random_uuid()`).
- One DDL statement per migration where practical.
- Applied inside every community schema by `SchemaManagerService` during:
  - Onboarding (new community).
  - Platform boot (sweep for missing migrations across existing communities).

---

## 9. Tenant Query Pattern

Only via `TenantQueryService`:

```ts
const rows = await this.tq.forSchema(schema).query(
  `SELECT id, name FROM chat_rooms WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT $1`,
  [limit],
);
```

Under the hood:

```sql
-- On connection checkout:
SET search_path TO "com96179941", public;

-- Your query runs with schema resolution scoped to that schema.

-- On release:
RESET search_path;
```

**Never** interpolate a schema name without:
1. Looking it up in `schema_registry`.
2. Regex-checking `^[a-z0-9_]{1,63}$`.

---

## 10. Soft-Delete Query Pattern

```sql
-- Read (active only)
SELECT * FROM chat_rooms WHERE deleted_at IS NULL;

-- Delete
UPDATE chat_rooms SET deleted_at = NOW() WHERE id = $1 AND deleted_at IS NULL;

-- Restore (if needed)
UPDATE chat_rooms SET deleted_at = NULL, updated_at = NOW() WHERE id = $1;
```

Never `DELETE FROM` tenant tables. Ever.

---

## 11. Data Retention

| Class | Policy |
|---|---|
| Active tenant data | Retained while community `status = active`. |
| Soft-deleted rows | Retained 90 days, then purged by nightly job (future). |
| Audit logs | Retained 1 year minimum. |
| PII | Hashed or minimized where possible. Never logged. |

---

## 12. Seeding (dev only)

For local development:

```
infra/seed/
├── communities.sql       # Inserts 5 sample communities into schema_registry
├── <module>-seed.sql     # Per-module: sample rows inside each community schema
└── seed.ts               # Orchestrator: runs migrations + applies seed SQL
```

Invoked via `make seed` or `pnpm --filter backend seed`.

---

## 13. Open Data Questions

- [ ] Transcript offload threshold — proposing 100KB content → R2. Confirm.
- [ ] Full-text search over messages/transcripts: Postgres `tsvector` sufficient, or defer?
- [ ] Attachments in chat turns (images for multimodal prompts) — if yes, add `tutor_attachments` table with R2 refs only.
- [ ] Cross-community aggregate reporting needed? (likely no — SKEP does this at platform level.)
