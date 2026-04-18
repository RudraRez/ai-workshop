# `doc/` — AI Tutor Design & Contract Index

> This folder is the **single source of design truth** for this build.
> `project/` holds the product inputs (brief, requirements, constraints).
> `doc/` holds the derived design artifacts produced from those inputs.
>
> Read these in order before writing any code.

**Module:** SKEP **AI Tutor** — port `5094`, base path `/api/v1/tutor`, table prefix `tutor_`, WS namespace `/tutor`.

---

## Status

| File | Owner | Status | Depends on |
|---|---|---|---|
| [PLAN.md](./PLAN.md) | Architect | DRAFT — awaiting filled BRIEF/REQUIREMENTS | `project/BRIEF.md`, `project/REQUIREMENTS.md` |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Architect | DRAFT | `TECH-STACK.md`, `SKEP-INTEGRATION.md` |
| [API-CONTRACT.md](./API-CONTRACT.md) | Architect + Backend | DRAFT | `SKEP-INTEGRATION.md`, `SKEP-DELTA.md` |
| [DATA-MODEL.md](./DATA-MODEL.md) | Backend | DRAFT | `SKEP-INTEGRATION.md` |
| [EVENT-CATALOG.md](./EVENT-CATALOG.md) | Architect | DRAFT | `SKEP-INTEGRATION.md` |
| [MANIFEST.yaml](./MANIFEST.yaml) | Architect | DRAFT | PLAN.md |
| [backend/README.md](./backend/README.md) | Backend Dev | DRAFT | ARCHITECTURE, API-CONTRACT |
| [frontend/README.md](./frontend/README.md) | Frontend Dev | DRAFT | ARCHITECTURE, API-CONTRACT, DESIGN-SYSTEM |

---

## Reading Order (new contributor)

1. `project/SKEP-INTEGRATION.md` — the non-negotiable platform contract
2. `project/TECH-STACK.md` — what we build with
3. `doc/ARCHITECTURE.md` — how the pieces fit
4. `doc/API-CONTRACT.md` — the REST + WebSocket surface
5. `doc/DATA-MODEL.md` — the DB schema
6. `doc/EVENT-CATALOG.md` — the events this module emits/consumes
7. `doc/PLAN.md` — the build plan, phase by phase
8. `doc/backend/` or `doc/frontend/` — role-specific guides

---

## Open Questions (block planning until resolved)

These gate design choices. Module identity is locked to **AI Tutor**. Product specifics still open:

- [ ] **Product name + one-line description** — `project/BRIEF.md` is empty.
- [ ] **Must-have feature list** — `project/REQUIREMENTS.md` is empty (treated as: sessions + chat + transcripts + settings, per `doc/MANIFEST.yaml`).
- [ ] **AI provider choice** — Anthropic Claude | OpenAI | Azure OpenAI. Blocks Phase 2 & 4.
- [ ] **Rate limits / quotas** — per-user message cap in free tier.
- [ ] **Content moderation** — moderate user prompts before forwarding to AI?
- [ ] **Transcript storage policy** — in DB vs. object storage for long transcripts.
- [ ] **Figma link** — required for UI fidelity.
- [ ] **MVP deadline** — drives phase cut lines.

---

## Conventions for This Folder

- All files are Markdown except `MANIFEST.yaml`.
- No generated/derived files here — those belong in `logs/` or `apps/*/dist/`.
- Every diagram is ASCII or Mermaid (renders on GitHub, versions cleanly).
- Every contract file starts with a **Status** table so readers know what's frozen vs WIP.
