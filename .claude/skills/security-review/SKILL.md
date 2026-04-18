---
name: security-review
version: 1.0.0
category: security
stack:
  - always
severity: hard
triggers:
  - "auth"
  - "authentication"
  - "authorization"
  - "payment"
  - "stripe"
  - "data mutation"
  - "user data"
  - "file upload"
  - "before shipping"
description: >
  Use before any auth, payment, data mutation, or file I/O implementation,
  and at the quality gate before shipping. OWASP Top 10 checklist enforced.
  Critical findings block handoff. This runs in addition to adversarial-review,
  not instead of it.
---

# Security Review

**Security is not a feature you add at the end. It is a constraint you build within.**

---

## OWASP Top 10 Checklist

### A01 — Broken Access Control
```
□ Every endpoint protected at middleware level (not just route guards)
□ userId always from JWT/session — never from request body or query params
□ Resource access verified: user can only read/modify their own data
□ Admin routes require admin role check — not just authentication
□ CORS configured with explicit allowed origins (no wildcard in production)
□ Directory traversal prevented on any file path input
```

### A02 — Cryptographic Failures
```
□ Passwords hashed with bcrypt (cost factor ≥ 12) — never MD5/SHA1
□ JWT secret is cryptographically random, min 32 chars, from env var
□ Sensitive data encrypted at rest (PII, payment info)
□ HTTPS enforced — no HTTP in production
□ No secrets in code, logs, error messages, or git history
□ Refresh tokens stored as hashed values (not plaintext)
```

### A03 — Injection
```
□ No raw SQL — all queries through TypeORM QueryBuilder or repository
□ All user inputs validated via DTO + class-validator before use
□ File uploads validated: type, size, filename sanitization
□ No eval(), Function(), dynamic require() with user input
□ Template literals with user input escaped in email/HTML templates
```

### A04 — Insecure Design
```
□ Sensitive operations require re-authentication (password change, deletion)
□ Rate limiting on: login, register, password reset, OTP endpoints
□ Account lockout after N failed login attempts
□ Password reset tokens expire (max 15 minutes)
□ Sensitive error details not exposed in API responses
```

### A05 — Security Misconfiguration
```
□ No default credentials in any configuration
□ Stack traces not exposed in production error responses
□ Unnecessary endpoints disabled (debug routes, admin panels in dev only)
□ Security headers set: HSTS, X-Frame-Options, X-Content-Type-Options, CSP
□ Dependencies scanned for known vulnerabilities (npm audit)
```

### A06 — Vulnerable and Outdated Components
```
□ npm audit run — no critical/high vulnerabilities
□ All production dependencies have defined versions (no *)
□ Node.js version matches .nvmrc / engines field in package.json
□ TypeScript version compatible with all major deps
```

### A07 — Identification and Authentication Failures
```
□ JWT tokens validated on every request (signature + expiry)
□ Refresh token rotation: old token invalidated on use
□ Session invalidated on logout (token blacklist or short expiry)
□ Password requirements enforced (min length, complexity)
□ Multi-factor authentication supported (if in requirements)
```

### A08 — Software and Data Integrity Failures
```
□ Webhook signatures verified (Stripe signature, GitHub signature)
□ File uploads scanned / type verified by content, not extension
□ Dependency integrity: package-lock.json or pnpm-lock.yaml committed
□ No untrusted data deserialized without schema validation
```

### A09 — Security Logging and Monitoring Failures
```
□ Auth events logged: login, logout, failed attempts, password changes
□ Admin actions logged with user ID and timestamp
□ Errors logged with context (no sensitive data in logs)
□ Log aggregation configured for production
□ Alerts set for: unusual login patterns, mass data access
```

### A10 — Server-Side Request Forgery
```
□ External URL inputs validated against allowlist
□ Internal network requests not possible via user-supplied URLs
□ Metadata endpoints blocked in cloud environments
```

---

## NestJS Security Checklist

```ts
// Guards on every protected route
@UseGuards(JwtAuthGuard)  // method or controller level

// Global validation pipe
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,           // strip unknown properties
  forbidNonWhitelisted: true, // throw on unknown properties
  transform: true,
}))

// Helmet for security headers
app.use(helmet())

// Rate limiting
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }))

// CORS
app.enableCors({ origin: process.env.FRONTEND_URL, credentials: true })
```

---

## Self-Audit Block

```yaml
security_audit:
  skill: security-review
  scope: <what was reviewed>
  owasp_checks:
    broken_access_control: pass | fail | n/a
    cryptographic_failures: pass | fail | n/a
    injection: pass | fail | n/a
    insecure_design: pass | fail | n/a
    security_misconfiguration: pass | fail | n/a
    vulnerable_components: pass | fail | n/a
    auth_failures: pass | fail | n/a
    integrity_failures: pass | fail | n/a
    logging_monitoring: pass | fail | n/a
    ssrf: pass | fail | n/a
  critical_findings: []
  high_findings: []
  overall: pass | fail
  blocked: false
```

---

## Composition Rules

```
REQUIRES:   (none)
SUGGESTS:   adversarial-review (run both — they catch different things)
            tdd-workflow        (write tests for security edge cases)
CONFLICTS:  (none)

Run this AND adversarial-review before every quality gate.
```
