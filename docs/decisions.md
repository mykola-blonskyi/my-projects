# Architecture Decisions

---

## ADR-001: Next.js 15 + shadcn UI + Tailwind CSS

Date: 2026-07-13

Status: Accepted

### Context
Needed a frontend stack for the hub app with support for SSR, responsive layout,
theme switching, and i18n. Considered Next.js + shadcn/Tailwind vs StyledComponents.

### Decision
Next.js 15 App Router + shadcn UI + Tailwind CSS.

### Alternatives Considered
- StyledComponents — CSS-in-JS, older approach, no component ecosystem, runtime overhead

### Consequences
- shadcn components are copy-pasted into the repo (no vendor lock-in)
- Tailwind utility classes for all styling
- CSS variables for theme customization

---

## ADR-002: Auth.js v5 for Google OAuth

Date: 2026-07-13

Status: Accepted

### Context
Need Google OAuth with JWT session management and Next.js App Router middleware support.

### Decision
Auth.js v5 (NextAuth) with Google provider and Drizzle adapter.

### Alternatives Considered
- Clerk — polished but third-party SaaS, free tier limits, vendor dependency
- Lucia Auth — too manual, more boilerplate than needed

### Consequences
- JWT stored in HTTP-only cookie on `.blonskyi.dev` (24h expiry)
- Refresh tokens stored in DB via Auth.js Drizzle adapter
- Owner email configured via `OWNER_EMAIL` env var, bypasses access checks

---

## ADR-003: JWT cookie on .blonskyi.dev for cross-subdomain auth

Date: 2026-07-13

Status: Accepted

### Context
Auth must be shared across all `*.blonskyi.dev` subdomains without re-login.

### Decision
HTTP-only `Secure` `SameSite=Lax` cookie set on domain `.blonskyi.dev`.
Subdomain apps validate by calling `{API_URL}/api/auth/validate`.

### Alternatives Considered
- Shared JWT secret decoded locally per subdomain — faster but no central revocation
- Server-side sessions with hub API call — considered and folded into the chosen approach

### Consequences
- Hub (`blonskyi.dev`) must be reachable for subdomain auth validation
- `API_URL` env var per subdomain app decouples the implementation from the host
- Future: if hub is extracted, only `API_URL` changes per service

---

## ADR-004: Drizzle ORM over Prisma

Date: 2026-07-13

Status: Accepted

### Context
Need an ORM to manage PostgreSQL schema and queries in a Next.js App Router context.

### Decision
Drizzle ORM with `postgres` (node-postgres) driver.

### Alternatives Considered
- Prisma — heavier, larger bundle, generates its own client; good for larger teams but overkill here
- Raw SQL — too verbose for schema management

### Consequences
- Schema defined in `drizzle/schema.ts`
- Migrations generated and run via Drizzle Kit
- Lighter bundle, SQL-like query syntax

---

## ADR-005: Coolify for self-hosted CI/CD and reverse proxy

Date: 2026-07-13

Status: Accepted

### Context
Need automated deployments from GitHub to VPS with subdomain routing and SSL.
Currently deploying manually via SSH.

### Decision
Coolify installed on VPS. GitHub Actions builds and pushes Docker image to GHCR,
then triggers Coolify deploy webhook. Coolify manages Caddy (reverse proxy) and SSL (Let's Encrypt).

### Alternatives Considered
- GitHub Actions + SSH deploy script — simpler but requires manual SSL, subdomain config, no dashboard
- Portainer — Docker management UI but no built-in CI/CD or reverse proxy
- Dokku — Heroku-like, more opinionated, git-push model

### Consequences
- Existing `sqlpanel.blonskyi.dev` Docker setup must be migrated into Coolify (one-time)
- Cloudflare SSL mode must be set to Full (not Flexible) since Caddy issues internal certs
- All future subdomains managed from Coolify dashboard

---

## ADR-006: Feature-based file structure

Date: 2026-07-13

Status: Accepted

### Context
Next.js projects default to type-based structure (components/, lib/, hooks/).
Project will grow with more features over time.

### Decision
Feature-based structure: `src/features/{auth,projects,preferences}` + `src/shared/{ui,lib,types}`.
`src/app/` contains only routing (layouts, pages, API routes).

### Alternatives Considered
- Type-based (components/, lib/) — simpler for small projects, harder to scale

### Consequences
- Each feature is self-contained and deletable
- `shared/` only contains code used by 2+ features
- New subdomain projects can copy individual feature modules

---

## ADR-007: Locale and theme stored in DB per user

Date: 2026-07-13

Status: Accepted

### Context
User preferences for language and color theme should persist across devices.
localStorage/cookies are device-local.

### Decision
`locale` and `theme` columns on `users` table. Read after login and written via server action
when user changes preference.

### Alternatives Considered
- localStorage — device-local, lost when switching devices or browsers
- Cookie only — persists across tabs but not across devices/browsers

### Consequences
- After login, server reads user's saved locale/theme and redirects to correct URL
- Theme and locale changes trigger a server action to update DB
- Slight DB write on every preference change (acceptable at this scale)
