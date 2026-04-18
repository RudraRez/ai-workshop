# SKEP-Specific Constraint & Convention Additions

> This file extends `CONSTRAINTS.md` and `CONVENTIONS.md` with rules that apply
> to every SKEP module build. The generic files remain untouched so the
> Launchpad boilerplate stays reusable for non-SKEP projects.
>
> `/plan` reads this alongside the generic files. Where this file conflicts
> with the generic files, **this file wins**. Where it conflicts with
> `SKEP-INTEGRATION.md`, that file wins.

---

## Additional Constraints (add to CONSTRAINTS.md rules)

### Things Claude Must ALWAYS Do (SKEP-specific)

- Import auth primitives from `@skep/platform-core` — never reimplement them.
- Apply `@Roles([...])` to every controller method. Endpoints with no role
  restriction must use `@Public()` explicitly (not just omit `@Roles`).
- Validate `community_code` exists in `schema_registry` before any tenant query.
- Use soft delete (`UPDATE ... SET deleted_at = NOW()`) — never `DELETE FROM`.
- Prefix every module-owned table with the module prefix from
  `SKEP-INTEGRATION.md` (`chat_`, `forum_`, etc.).
- Publish a domain event on every state-changing operation that another
  module could plausibly care about.
- Propagate `correlationId` from the request into every emitted event.
- Report usage to `LmsClient.reportUsage()` for any billable action.

### Things Claude Must NEVER Do (SKEP-specific)

- Issue a JWT from this module. The main SKEP platform is the only issuer.
- Query across community schemas in a single SQL statement.
- Call another SKEP module's REST API. Use the event bus.
- Send a push notification, email, or SMS from any module other than Campaigns.
- Hard-delete tenant data.
- Interpolate a schema name into raw SQL without the
  `^[a-z0-9_]{1,63}$` regex check first.
- Use `WidthType.PERCENTAGE`, `WebSocketGateway` without `WsJwtGuard`, or
  `@Controller()` without the `JwtAuthGuard` applied globally.
- Access `public.schema_registry` directly from business logic — use
  `SchemaManagerService`.
- Put anything except `schema_registry` and platform-core internals in the
  `public` schema.

### Additional Quality Gates

| Check | Threshold | On fail |
|---|---|---|
| Tenant isolation test (reads across 2 schemas) | 0 leaks | Block ship |
| JWT validation test (invalid/expired/wrong-issuer) | All rejected | Block ship |
| RBAC test (each role gets expected response) | All pass | Block ship |
| Event bus test (publish → subscribe round trip) | Events received | Block ship |

---

## Additional Conventions (add to CONVENTIONS.md rules)

### Module Layout

Inside `apps/api/src/` each feature module follows this shape:

```
modules/<feature>/
├── <feature>.module.ts          # NestJS module
├── controllers/
│   └── <feature>.controller.ts  # REST endpoints
├── services/
│   └── <feature>.service.ts     # Business logic
├── gateway/                     # Optional — WebSocket handlers
│   └── <feature>.gateway.ts
├── dto/
│   ├── create-<feature>.dto.ts
│   ├── update-<feature>.dto.ts
│   └── <feature>-response.dto.ts
└── migrations/
    └── 001_init_<feature>.sql   # Applied inside every community schema
```

### Controller Shape (mandatory)

```typescript
@Controller('api/v1/<module-path>')
export class FeatureController {
  constructor(private readonly feature: FeatureService) {}

  @Get()
  @Roles(['OWNER', 'ADMIN', 'MEMBER'])
  async list(
    @CurrentUser() user: AuthenticatedUser,
    @TenantSchema() schema: string,
  ) {
    return this.feature.list(schema, user.userId);
  }
}
```

What's absent is intentional:

- No JWT parsing (`JwtAuthGuard` runs globally via `APP_GUARD`).
- No role if-statements (`RolesGuard` runs globally).
- No schema lookups (`@TenantSchema()` resolves from the JWT).
- No response wrapping (`ResponseEnvelopeInterceptor` runs globally).
- No try/catch (`HttpExceptionFilter` catches and formats).

### Service Shape (mandatory)

```typescript
@Injectable()
export class FeatureService {
  constructor(
    private readonly tq: TenantQueryService,
    private readonly eventBus: EventBusService,
    @Inject(LMS_CLIENT) private readonly lms: LmsClient,
  ) {}

  async create(schema: string, communityCode: string, userId: string, dto: CreateDto) {
    // 1. Check LMS limits
    const check = await this.lms.checkLimits({
      communityCode, module: 'feature', action: 'create',
    });
    if (!check.allowed) throw new ForbiddenException(check.reason);

    // 2. Tenant-scoped write
    const [row] = await this.tq.forSchema(schema).query(
      `INSERT INTO feature_entities (...) VALUES (...) RETURNING ...`,
      [...],
    );

    // 3. Report usage
    await this.lms.reportUsage({
      communityCode, module: 'feature', metric: 'created', value: 1,
    });

    // 4. Emit domain event
    await this.eventBus.publish({
      eventType: 'feature.entity.created',
      communityCode,
      actorUserId: userId,
      payload: { entityId: row.id },
    });

    return row;
  }
}
```

### Migration File Convention

- Filename: `NNN_<action>_<entity>.sql` (e.g. `001_init_chat_rooms.sql`).
- First migration always ends with `_init_<entity>`.
- Header comment block stating: module name, version, depends, description.
- Idempotent — wrap table creation in `IF NOT EXISTS`.
- No cross-schema references (no `public.*` except `gen_random_uuid()`).

### Error Code Naming

- `SCREAMING_SNAKE_CASE`.
- Module-specific codes prefixed with module: `CHAT_ROOM_NOT_FOUND`,
  `FORUM_POST_LOCKED`, `TUTOR_QUOTA_EXCEEDED`.
- Shared codes unprefixed: `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`,
  `BAD_REQUEST`, `VALIDATION_FAILED`, `COMMUNITY_NOT_ENABLED`,
  `UNKNOWN_SCHEMA`, `INTERNAL_ERROR`.

### Import Ordering (extend generic TypeScript rules)

1. `reflect-metadata` (when needed, first line of `main.ts`).
2. Node built-ins.
3. NestJS framework packages.
4. Third-party packages.
5. `@skep/platform-core` imports.
6. Internal module imports (relative).
7. Type-only imports last.

### Logging

- Use the `Logger` from `@nestjs/common` with a class-scoped instance:
  `private readonly logger = new Logger(FeatureService.name);`
- `logger.debug` for development traces, `logger.log` for expected events,
  `logger.warn` for recoverable anomalies, `logger.error` for unhandled errors.
- Never log: JWTs, the `SKEP_JWT_SECRET`, password fields, full email or
  phone values, request bodies containing PII.
- Always log: action taken, affected entity ID, `communityCode`, `userId`,
  decision outcome (allowed/denied/error).

### Testing

- Unit tests mock `TenantQueryService` and `EventBusService`.
- Use the real `MockLmsClient` — it's already a test double with inspection helpers.
- Integration tests use `createTestJwt({ communityCode, roles })` from
  `@skep/platform-core/testing`.
- Isolation test is mandatory: create two test communities, create data in
  community A, assert user in community B cannot read it.
</content>