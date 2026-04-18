# /handoff — Agent Handoff Command

Run `/handoff` when an agent needs to formally pass work to another agent.
This creates the logged handoff contract and waits for ACK before the next
agent can start.

---

## When to Use

- Backend Dev has completed an API surface that Frontend Dev needs
- Architect has completed the system design that Backend Dev builds against
- Billing Dev needs Backend Dev to add Stripe customer ID to the User entity
- Any task crosses a file ownership boundary

## Steps

### 1. Sending Agent Writes the Handoff

Create `logs/decisions/handoff-{slug}.md` with this format:

```markdown
# Handoff: {title}

**From:** {agent}
**To:** {agent}
**Date:** {ISO timestamp}
**Triggered by:** Task {id} — {task title}
**Status:** WAITING_ACK

---

## Contract

### What was completed
{plain English summary of what was built}

### API endpoints (if applicable)
| Method | Path | Auth | Request | Response |
|---|---|---|---|---|
| POST | /api/v1/auth/login | public | `{ email, password }` | `{ user, token, refreshToken }` |

### Data contracts (if applicable)
```typescript
// Exact TypeScript shape the receiving agent should use
interface AuthResponse {
  user: { id: string; email: string; name: string; role: string }
  token: string          // JWT, 15min
  refreshToken: string   // JWT, 7d (also set as httpOnly cookie)
}
```

### Files the receiving agent may read (read-only)
- `apps/api/src/auth/dto/` — request/response shapes
- `apps/api/src/auth/entities/user.entity.ts` — User type

### Files the receiving agent must NOT touch
- Everything in `apps/api/src/` — Backend Dev ownership

### Known constraints
- {anything the receiving agent needs to know that isn't obvious}

**ACK_REQUIRED: yes**
```

### 2. Surface in Chat

After writing the file, output this in the conversation:

```
📤 HANDOFF REQUEST — {title}

From: {agent}
To:   {agent}
Log:  logs/decisions/handoff-{slug}.md

{2-sentence summary of what was handed off and what the receiving agent needs to do}

Waiting for {receiving agent} to write ACK before proceeding.
```

### 3. Receiving Agent Writes ACK

Append to the same handoff log file:

```markdown
---

## ACK

**From:** {receiving agent}
**Timestamp:** {ISO}
**Status:** ACKNOWLEDGED

### Understood
- {restate each contract point in own words — proves comprehension}

### Will NOT do
- {anything explicitly out of scope for this agent}

### Starting
- {first task this agent will begin}
```

### 4. Proceed

Only after ACK is written in the log → dispatch the receiving agent.

If no ACK is written within the same session → mark the handoff log as
`BLOCKED` and surface in `/status` output.

---

## Anti-Patterns

```
❌ Implied handoff
Frontend Dev: "I'll just look at the backend code to figure it out"
Result: Frontend Dev makes assumptions that break when backend refactors

✅ Explicit contract
Backend Dev writes endpoint shapes + error formats + type definitions
Frontend Dev writes ACK restating the contract → starts building against it
```

```
❌ Handoff without a log
Claude: "OK backend is done, starting frontend"
Result: No audit trail, no contract, next session starts from zero

✅ Every handoff has a file
logs/decisions/handoff-auth-contract.md — written, ACK'd, referenced in both agents' task logs
```
