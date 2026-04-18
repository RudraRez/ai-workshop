# Backend — AI Tutor Module

> NestJS 11 microservice on port **5094**, base path **`/api/v1/tutor`**,
> table prefix **`tutor_`**, WebSocket namespace **`/tutor`**.
> Owned by the **Backend Dev** agent. See `doc/ARCHITECTURE.md` for system
> context and `doc/API-CONTRACT.md` for the exposed surface.

---

## 1. Module Identity

| Attribute | Value |
|---|---|
| Module name | `tutor` |
| Port | `5094` |
| Base URL (dev) | `http://localhost:5094` |
| HTTP prefix | `/api/v1/tutor` |
| WS namespace | `/tutor` |
| Table prefix | `tutor_` |
| Error code prefix | `TUTOR_*` |
| Event prefix | `tutor.*` |

These values are **locked** by the SKEP platform contract. Changing any of them requires a platform-wide coordination.

---

## 2. Directory Layout

```
apps/backend/src/
├── main.ts                       # bootstrap, validation pipe, cors, request id
├── app.module.ts                 # PlatformCoreModule.forRoot({...}) + feature modules
├── modules/
│   ├── me/
│   │   ├── me.module.ts
│   │   ├── controllers/me.controller.ts
│   │   └── dto/me-response.dto.ts
│   ├── sessions/
│   │   ├── sessions.module.ts
│   │   ├── controllers/sessions.controller.ts
│   │   ├── services/sessions.service.ts
│   │   ├── dto/{create,update,response}-*.dto.ts
│   │   └── migrations/001_init_tutor_sessions.sql
│   ├── messages/
│   │   ├── messages.module.ts
│   │   ├── controllers/messages.controller.ts
│   │   ├── services/messages.service.ts
│   │   ├── services/ai-provider.service.ts    # AI completion adapter
│   │   ├── dto/
│   │   └── migrations/001_init_tutor_messages.sql
│   ├── transcripts/
│   │   ├── transcripts.module.ts
│   │   ├── controllers/transcripts.controller.ts
│   │   ├── services/transcripts.service.ts
│   │   └── migrations/001_init_tutor_transcripts.sql
│   ├── settings/
│   │   ├── settings.module.ts
│   │   ├── controllers/settings.controller.ts
│   │   ├── services/settings.service.ts
│   │   └── migrations/001_init_tutor_settings.sql
│   └── tutor-gateway/
│       ├── tutor-gateway.module.ts
│       └── gateway/tutor.gateway.ts           # Socket.IO /tutor namespace
└── config/
    └── env.ts                    # zod-validated env schema
```

Every feature module follows the exact shape described in `project/SKEP-DELTA.md §Module Layout`.

---

## 3. `app.module.ts` — Canonical Wiring

```ts
import { Module } from '@nestjs/common';
import { PlatformCoreModule } from '@skep/platform-core';
import { MeModule } from './modules/me/me.module';
import { SessionsModule } from './modules/sessions/sessions.module';
import { MessagesModule } from './modules/messages/messages.module';
import { TranscriptsModule } from './modules/transcripts/transcripts.module';
import { SettingsModule } from './modules/settings/settings.module';
import { TutorGatewayModule } from './modules/tutor-gateway/tutor-gateway.module';

@Module({
  imports: [
    PlatformCoreModule.forRoot({
      moduleName: 'tutor',
      tablePrefix: 'tutor_',
      migrations: [
        // collected by a loader from modules/*/migrations/*.sql
      ],
      eventTypes: {
        published: [
          'tutor.session.started',
          'tutor.session.ended',
          'tutor.session.deleted',
          'tutor.message.sent',
          'tutor.message.answered',
          'tutor.settings.updated',
        ],
        subscribed: [
          'platform.community.onboarded',
          'platform.community.suspended',
          'platform.community.archived',
        ],
      },
    }),
    MeModule,
    SessionsModule,
    MessagesModule,
    TranscriptsModule,
    SettingsModule,
    TutorGatewayModule,
  ],
})
export class AppModule {}
```

No local JWT strategies. No manual exception filters. No local response wrapping. `platform-core` owns all of that globally.

---

## 4. Controller Canonical Shape

```ts
@Controller('api/v1/tutor/sessions')
export class SessionsController {
  constructor(private readonly sessions: SessionsService) {}

  @Post()
  @Roles(['OWNER', 'ADMIN', 'MEMBER'])
  async create(
    @CurrentUser() user: AuthenticatedUser,
    @TenantSchema() schema: string,
    @Body() dto: CreateSessionDto,
  ) {
    return this.sessions.create(schema, user.communityCode, user.userId, dto);
  }

  @Get()
  @Roles(['OWNER', 'ADMIN', 'MEMBER'])
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @TenantSchema() schema: string,
    @Query() q: ListSessionsQuery,
  ) {
    return this.sessions.list(schema, user.userId, q);
  }
}
```

What's absent is intentional (from `SKEP-DELTA.md`):
- No JWT parsing — `JwtAuthGuard` runs globally.
- No role if-statements — `RolesGuard` runs globally.
- No schema lookups — `@TenantSchema()` resolves from JWT.
- No response wrapping — `ResponseEnvelopeInterceptor` wraps globally.
- No try/catch — `HttpExceptionFilter` catches and formats.

---

## 5. Service Canonical Shape

```ts
@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);

  constructor(
    private readonly tq: TenantQueryService,
    private readonly eventBus: EventBusService,
    @Inject(LMS_CLIENT) private readonly lms: LmsClient,
  ) {}

  async create(schema: string, communityCode: string, userId: string, dto: CreateSessionDto) {
    const check = await this.lms.checkLimits({
      communityCode, module: 'tutor', action: 'session.create',
    });
    if (!check.allowed) throw new ForbiddenException(check.reason);

    const [row] = await this.tq.forSchema(schema).query(
      `INSERT INTO tutor_sessions (topic, created_by) VALUES ($1, $2) RETURNING *`,
      [dto.topic, userId],
    );

    await this.lms.reportUsage({
      communityCode, module: 'tutor', metric: 'sessions.started', value: 1,
    });

    await this.eventBus.publish({
      eventType: 'tutor.session.started',
      communityCode,
      actorUserId: userId,
      payload: { sessionId: row.id, topic: row.topic },
    });

    return row;
  }
}
```

Order is load-bearing: **limits → write → usage → event**. Document any deviation in the task log.

---

## 6. DTO Conventions

```ts
// dto/create-session.dto.ts
import { IsString, MaxLength, IsOptional } from 'class-validator';

export class CreateSessionDto {
  @IsString() @MaxLength(200)
  topic!: string;

  @IsOptional() @IsString() @MaxLength(2000)
  context?: string;
}
```

- `class-validator` on inbound DTOs.
- Never return a DB entity directly — always map through a response DTO (`CONSTRAINTS.md`).
- Response DTOs drop `deleted_at` and any internal fields.
- Zod schemas for the same shapes live in `packages/shared/` for FE consumption.

---

## 7. Migrations

```
modules/<feature>/migrations/
├── 001_init_tutor_<entity>.sql
└── 002_<action>_tutor_<entity>.sql
```

Header required:

```sql
-- Module: tutor
-- Version: 001
-- Depends: (none)
-- Description: Initial tutor_sessions table
```

Rules:
- Idempotent (`CREATE TABLE IF NOT EXISTS`).
- No `public.*` references except `gen_random_uuid()`.
- Run by `SchemaManagerService` inside each community schema.

---

## 8. WebSocket Gateway

```ts
@WebSocketGateway({ namespace: '/tutor', cors: true })
@UseGuards(WsJwtGuard)                           // from platform-core
export class TutorGateway implements OnGatewayConnection {
  constructor(private readonly messages: MessagesService) {}

  handleConnection(client: Socket) {
    const user = client.data.user as AuthenticatedUser;
    client.join(`community:${user.communityCode}`);
  }

  @SubscribeMessage('tutor:ask')
  async onAsk(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { sessionId: string; prompt: string; requestId: string },
  ) {
    const user = client.data.user as AuthenticatedUser;
    // stream tokens with this.server.to(...).emit('tutor:token', ...)
    // final answer with this.server.to(...).emit('tutor:answer', ...)
  }
}
```

- Handshake auth via `WsJwtGuard` — never parse token manually.
- Every socket auto-joins `community:<code>`.
- Streaming tokens fan out through Redis pub/sub so multiple backend
  instances can serve any given client.

---

## 9. AI Provider Adapter

```
modules/messages/services/ai-provider.service.ts
```

- Interface `AiProvider { stream(prompt, opts): AsyncIterable<Token> }`.
- Concrete class chosen by env: `AI_PROVIDER=anthropic|openai|azure`.
- Adapter owns retries (exponential backoff, 3 tries), timeouts (30s hard), and token accounting.
- Usage reported to `LmsClient.reportUsage({ metric: 'tokens.consumed', value: N })` on completion.
- Prompts and completions stored in `tutor_messages`; generated transcript row in `tutor_transcripts` on session end.

**Open decision:** provider choice blocks Phase 2. Default to Anthropic Claude for hackathon unless product says otherwise.

---

## 10. Config & Env

`config/env.ts` — zod-validated schema. App refuses to start if any required var is missing.

```ts
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  MODULE_NAME: z.literal('tutor'),
  MODULE_PORT: z.coerce.number().int().default(5094),

  SKEP_JWT_SECRET: z.string().min(32),
  SKEP_JWT_ISSUER: z.string().default('skep-api'),

  DATABASE_URL: z.string().url(),
  DATABASE_POOL_SIZE: z.coerce.number().int().default(20),

  REDIS_URL: z.string().url(),

  ONBOARDING_WEBHOOK_SECRET: z.string().min(32),

  LMS_MODE: z.enum(['mock', 'http']).default('mock'),
  LMS_BASE_URL: z.string().url().optional(),

  AI_PROVIDER: z.enum(['anthropic', 'openai', 'azure']),
  AI_PROVIDER_API_KEY: z.string().min(10),
  AI_MODEL: z.string().default('claude-opus-4-7'),

  CORS_ORIGINS: z.string(),   // comma-separated
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
});
```

`.env.example` lists every key above with a sample value and a comment.

---

## 11. Testing

- **Unit:** mock `TenantQueryService`, `EventBusService`; use real `MockLmsClient`.
- **Integration:** use `createTestJwt({ communityCode, roles })` from `@skep/platform-core/testing`.
- **Tenant isolation (mandatory):** insert in `COM_A`, assert user in `COM_B` cannot read.
- **AI provider:** stub the adapter with a deterministic token stream in tests.
- **WebSocket:** spin up the gateway in a test, connect a Socket.IO client with a test JWT, assert event ordering.

Run: `pnpm --filter backend test` and `pnpm --filter backend test:e2e`.

---

## 12. Logging Rules

- `private readonly logger = new Logger(ServiceName.name);`
- Log: action, entity id, `communityCode`, `userId`, outcome.
- **Never log:** JWTs, `SKEP_JWT_SECRET`, `AI_PROVIDER_API_KEY`, raw prompts or completions that may contain PII, full emails/phones.
- Log levels: `debug` dev only, `log` expected events, `warn` recoverable, `error` unhandled.

---

## 13. Common Pitfalls to Avoid

| Don't | Do instead |
|---|---|
| `pool.query(...)` directly | `this.tq.forSchema(schema).query(...)` |
| Parse JWT manually | Rely on `JwtAuthGuard` + `@CurrentUser()` |
| `DELETE FROM tutor_sessions` | `UPDATE tutor_sessions SET deleted_at = NOW()` |
| Join across schemas | Refactor — the requirement is wrong |
| `jwt.sign(...)` anywhere | **Never.** Only main SKEP issues tokens. |
| Call `/api/v1/chat/...` from tutor | Publish an event; Chat or Campaigns subscribes |
| Send push/email from tutor | Emit a domain event; Campaigns handles delivery |
| Hardcode `'MEMBER'` in an if | Use `@Roles(['MEMBER'])` |

---

## 14. Definition of Done (per-task, from CLAUDE.md)

- [ ] Code compiles with zero TS errors.
- [ ] Tests written and passing; coverage meets thresholds.
- [ ] Skill self-audit emitted `overall: pass`.
- [ ] Log file moved to `DONE`.
- [ ] Conventional commit message.
- [ ] No `TODO`/`FIXME`/`HACK` without linked log entry.
