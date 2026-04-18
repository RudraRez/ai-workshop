# Tech Debt Log

> Append-only. Never delete entries.
> Format: ## [#N] YYYY-MM-DD — {Title}
>
> Every entry must include:
> - What the shortcut was
> - Why it was taken (time, scope, complexity)
> - The risk it introduces
> - The suggested fix path
> - Who logged it

---

<!-- Entries will be written here during the build -->
<!-- Example:

## [#1] 2025-01-20 — Offset pagination on admin user list

**Shortcut:** Used offset pagination on the admin /users endpoint
**Why:** Admin user list is low-traffic, cursor implementation would add 2h
**Risk:** Will drift if users are bulk-deleted while paginating
**Fix:** Switch to cursor pagination before > 10k users
**Logged by:** Backend Dev during task 2.3
-->
