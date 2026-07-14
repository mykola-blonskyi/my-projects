# Dependency Analysis

## Internal Dependencies

### `src/features/auth` → `src/shared/lib/db`
Auth.js config and session helpers import the Drizzle client to read/write `users` and `sessions`.

### `src/features/projects` → `src/shared/lib/db`
Project list queries import the Drizzle client to read `projects` and `project_access`.

### `src/features/preferences` → `src/features/auth`
Preference server actions read the current session (user ID) before updating `users.locale` / `users.theme`.

### `src/app/[locale]` → `src/features/*`
Pages and layouts import from feature modules only — no direct DB or auth calls in `src/app/`.

### `middleware.ts` → `src/features/auth`
Route protection middleware imports session validation helpers from the auth feature.

---

## External Dependencies

### Auth.js v5 (`next-auth`)
Google OAuth provider + Drizzle adapter. Signs and verifies JWTs.
Risk: major version upgrades have historically been breaking. Pin to a minor version.

### Drizzle ORM + `postgres` driver
Schema management, migrations, and query builder.
Risk: low — Drizzle is stable and the API surface used here is small.

### `next-intl`
URL-based i18n routing and translation loading for Next.js App Router.
Risk: low — well maintained, designed specifically for this use case.

### `next-themes`
Theme class management on `<html>` element with cookie persistence.
Risk: low — minimal dependency, easily replaceable.

### shadcn UI (copy-pasted components)
Not a runtime npm dependency — components are copied into `src/shared/ui/`.
Risk: none at runtime. Upstream changes require manual re-copy.

### Google OAuth API
External identity provider. Requires `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
The callback URL (`https://blonskyi.dev/api/auth/callback/google`) must be registered in
Google Cloud Console. Risk: Google can change OAuth behaviour or deprecate APIs.

### Coolify (self-hosted)
Manages container lifecycle, reverse proxy, and SSL on the VPS.
Risk: Coolify updates may change configuration format. Pin Coolify version on the VPS.

### Cloudflare CDN
DNS, DDoS protection, SSL edge termination.
Risk: Cloudflare configuration changes (SSL mode, cache rules, firewall) can break the app
silently from the VPS perspective. Changes should be tested before applying to production.

### GitHub Actions + GHCR
CI/CD pipeline and Docker image registry.
Risk: low — GitHub-managed, no self-hosting burden.

### PostgreSQL (existing, self-hosted)
Core data store. Already running on VPS in Docker.
Risk: no automated backups configured yet. Single point of data loss.

---

## Dependency Risks

### No PostgreSQL backup strategy
The existing PostgreSQL instance has no documented backup. All user data, project access grants,
and sessions would be lost if the VPS disk fails.
*Priority:* high — set up automated pg_dump to an offsite location before going live.

### Single VPS = single point of failure
All services (hub, PostgreSQL, Coolify, subdomain apps) run on one machine.
*Priority:* acceptable for personal projects. No mitigation needed at this scale.

### `AUTH_SECRET` has no rotation strategy
There is no documented process for rotating the JWT secret across all services simultaneously.
*Priority:* medium — document a runbook before adding more subdomain apps.
