---
name: api-design
version: 1.0.0
category: backend
stack:
  - nestjs
  - express
  - always
severity: soft
triggers:
  - "designing an API"
  - "new endpoint"
  - "REST"
  - "route"
  - "endpoint"
  - "API contract"
description: >
  Use before writing any API endpoint. Enforces REST conventions, consistent
  naming, versioning, error response shapes, and the contract-first principle.
  The API contract written here becomes the handoff document for Frontend Dev.
---

# API Design

**Define the contract first. Build to the contract. Never surprise the consumer.**

---

## URL Conventions

```
Resource naming: plural nouns, kebab-case
  /users           not /user, not /getUsers, not /user_list
  /blog-posts      not /blogPosts, not /BlogPost
  /order-items     not /orderItems

Nested resources: max 2 levels deep
  /users/:id/posts        ✅
  /users/:id/posts/:id    ✅
  /users/:id/posts/:id/comments/:id   ❌ — too deep, flatten it

Actions that don't fit CRUD: use verbs as sub-resources
  POST /auth/login         not GET /login
  POST /auth/logout        not GET /logout
  POST /payments/refund    not GET /refundPayment
  POST /users/:id/archive  not PATCH /users/:id with { status: 'archived' }
```

---

## HTTP Method + Status Code Matrix

```
GET    /resources          → 200 OK + array
GET    /resources/:id      → 200 OK + object | 404 Not Found
POST   /resources          → 201 Created + created object
PATCH  /resources/:id      → 200 OK + updated object
DELETE /resources/:id      → 204 No Content (soft delete) | 200 OK + deleted object
POST   /resources/:id/action → 200 OK + result
```

---

## Request/Response Shape

```ts
// All responses: consistent envelope for lists
interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total?: number      // if counting is cheap
    nextCursor: string | null
    hasMore: boolean
  }
}

// Single resource: just the resource (no wrapper)
// ✅ → { id, email, name, createdAt }
// ❌ → { data: { id, email, name, createdAt }, success: true }

// Error response: consistent shape
interface ErrorResponse {
  code: string          // machine-readable: USER_NOT_FOUND
  message: string       // human-readable: "User with id X was not found"
  statusCode: number    // HTTP status
  details?: unknown     // validation errors, field-level errors
}
```

---

## Versioning

```
Strategy: URL path versioning
  /api/v1/users   → current stable
  /api/v2/users   → breaking change

Rules:
  - v1 is the first version (not /api/users)
  - Version only increments on BREAKING changes
  - Non-breaking additions (new fields, new endpoints) do not increment
  - v1 stays running while v2 is in beta

NestJS implementation:
  app.setGlobalPrefix('api/v1')
```

---

## Validation Rules

```ts
// All inputs validated at DTO level — never raw in service
// Use @IsOptional() for PATCH fields — never require all fields on update

// Create DTO: all required fields
export class CreatePostDto {
  @IsString() @IsNotEmpty() @MaxLength(200)
  title: string

  @IsString() @IsNotEmpty()
  content: string

  @IsUUID()
  authorId: string
}

// Update DTO: all optional (PATCH semantics)
export class UpdatePostDto {
  @IsOptional()
  @IsString() @IsNotEmpty() @MaxLength(200)
  title?: string

  @IsOptional()
  @IsString() @IsNotEmpty()
  content?: string
}
```

---

## Contract-First Handoff Format

When handing off to Frontend Dev, the API contract must include:

```markdown
## API Contract — {Domain}

### POST /api/v1/auth/login
**Auth:** none (public)
**Rate limit:** 10 req/min per IP

Request:
  Content-Type: application/json
  Body: { email: string, password: string }

Response 200:
  { user: UserDto, token: string, refreshToken: string }

Response 401:
  { code: "INVALID_CREDENTIALS", message: "Email or password is incorrect", statusCode: 401 }

Response 429:
  { code: "RATE_LIMITED", message: "Too many attempts", statusCode: 429 }

---

### GET /api/v1/users/:id
**Auth:** Bearer token required
**Auth rule:** own profile OR admin role

Response 200:
  { id, email, name, role, createdAt }

Response 403:
  { code: "FORBIDDEN", message: "Cannot access this resource", statusCode: 403 }

Response 404:
  { code: "USER_NOT_FOUND", message: "User {id} not found", statusCode: 404 }
```

---

## Self-Audit Block

```yaml
api_design_audit:
  skill: api-design
  urls_use_plural_nouns: true
  urls_use_kebab_case: true
  http_methods_correct: true
  status_codes_correct: true
  error_shape_consistent: true
  versioned_with_v1_prefix: true
  contract_written_before_implementation: true
  handoff_document_complete: true
  overall: pass | fail
```
