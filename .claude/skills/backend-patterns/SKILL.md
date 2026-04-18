---
name: backend-patterns
version: 1.0.0
category: backend
stack:
  - nestjs
  - express
severity: soft
triggers:
  - "NestJS"
  - "backend"
  - "API"
  - "service"
  - "controller"
  - "TypeORM"
  - "database"
description: >
  Use before writing any NestJS or Express backend code. Enforces module
  structure, DTO patterns, service/controller separation, TypeORM repository
  pattern, and error handling conventions. Prevents the most common backend
  anti-patterns that cause maintenance debt.
---

# Backend Patterns

**Controllers route. Services work. Repositories store. Never mix.**

---

## NestJS Module Structure

```
src/
  {domain}/
    dto/
      create-{domain}.dto.ts
      update-{domain}.dto.ts
      {domain}-response.dto.ts
    entities/
      {domain}.entity.ts
    {domain}.controller.ts
    {domain}.service.ts
    {domain}.module.ts
    {domain}.service.spec.ts
```

Every domain is a self-contained module. Cross-domain access goes through
exported services — never through direct entity access or cross-module queries.

---

## Controller Pattern

```ts
// Controllers ONLY: routing, auth guards, input validation, response shaping
// Never: business logic, DB queries, complex conditionals

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<UserResponseDto> {
    return this.usersService.findById(id, user)
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateUserDto,
    @CurrentUser() user: User,
  ): Promise<UserResponseDto> {
    return this.usersService.create(dto, user)
  }
}
```

---

## Service Pattern

```ts
// Services: ALL business logic, authorization checks, orchestration
// Never: HTTP concerns, response shaping for wire, direct repo calls from other services

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly repo: Repository<UserEntity>,
  ) {}

  async findById(id: string, requestingUser: User): Promise<UserResponseDto> {
    // Authorization check in service, not controller
    if (requestingUser.id !== id && !requestingUser.isAdmin) {
      throw new ForbiddenException()
    }

    const user = await this.repo.findOne({ where: { id } })
    if (!user) throw new NotFoundException(`User ${id} not found`)

    return UserResponseDto.from(user)
  }
}
```

---

## DTO Pattern

```ts
// All request bodies validated with class-validator
// All response bodies shaped with response DTOs (never expose entities directly)

// Request DTO
export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string
}

// Response DTO (hides sensitive fields)
export class UserResponseDto {
  id: string
  email: string
  name: string
  createdAt: Date

  static from(entity: UserEntity): UserResponseDto {
    return {
      id: entity.id,
      email: entity.email,
      name: entity.name,
      createdAt: entity.createdAt,
    }
  }
}
// password, passwordHash, refreshTokenHash → never in response DTO
```

---

## TypeORM Entity Pattern

```ts
@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  email: string

  @Column()
  @Exclude() // exclude from class-transformer serialization
  passwordHash: string

  @Column({ nullable: true })
  @Exclude()
  refreshTokenHash: string | null

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @DeleteDateColumn() // soft delete
  deletedAt: Date | null

  @OneToMany(() => PostEntity, post => post.user)
  posts: PostEntity[]
}
```

---

## Pagination Pattern

```ts
// ALWAYS cursor-based. Never offset.
// Offset pagination causes drift on live data.

export interface PaginationParams {
  cursor?: string  // last item's createdAt + id (base64 encoded)
  limit: number    // max 100
}

export interface PaginatedResult<T> {
  items: T[]
  nextCursor: string | null
  hasMore: boolean
}

async findMany(params: PaginationParams): Promise<PaginatedResult<UserResponseDto>> {
  const limit = Math.min(params.limit, 100)

  const qb = this.repo.createQueryBuilder('user')
    .orderBy('user.createdAt', 'DESC')
    .addOrderBy('user.id', 'DESC')
    .take(limit + 1)  // take one extra to determine hasMore

  if (params.cursor) {
    const { createdAt, id } = decodeCursor(params.cursor)
    qb.where('(user.createdAt, user.id) < (:createdAt, :id)', { createdAt, id })
  }

  const items = await qb.getMany()
  const hasMore = items.length > limit
  if (hasMore) items.pop()

  return {
    items: items.map(UserResponseDto.from),
    nextCursor: hasMore ? encodeCursor(items[items.length - 1]) : null,
    hasMore,
  }
}
```

---

## Error Handling Pattern

```ts
// Standard error classes (NestJS built-in)
throw new NotFoundException(`User ${id} not found`)
throw new BadRequestException('Email already in use')
throw new ForbiddenException()
throw new UnauthorizedException()
throw new ConflictException('Resource already exists')

// Custom business errors extend HttpException
export class InsufficientCreditsException extends HttpException {
  constructor() {
    super({ code: 'INSUFFICIENT_CREDITS', message: 'Not enough credits' }, HttpStatus.PAYMENT_REQUIRED)
  }
}

// Global exception filter for consistent error shape
// { code, message, statusCode } — never expose stack traces
```

---

## Self-Audit Block

```yaml
backend_audit:
  skill: backend-patterns
  controller_routes_only: true
  service_has_business_logic: true
  dtos_validated_with_class_validator: true
  response_dtos_hide_sensitive_fields: true
  entities_not_returned_directly: true
  pagination_is_cursor_based: true
  no_n_plus_one_queries: true
  errors_use_http_exception: true
  overall: pass | fail
```
