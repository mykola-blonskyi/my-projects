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
then triggers Coolify deploy webhook. Coolify manages Traefik (reverse proxy) and SSL (Let's Encrypt).

### Alternatives Considered
- GitHub Actions + SSH deploy script — simpler but requires manual SSL, subdomain config, no dashboard
- Portainer — Docker management UI but no built-in CI/CD or reverse proxy
- Dokku — Heroku-like, more opinionated, git-push model

### Consequences
- Existing `sqlpanel.blonskyi.dev` (Postgres + pgAdmin) Docker setup must be migrated into Coolify
  (one-time) — done 2026-07-17: replaced with a Coolify project running Postgres + CloudBeaver at
  `db.blonskyi.dev`. See ADR-009 for the resulting network change.
- Cloudflare SSL mode must be set to Full (not Flexible) since Traefik issues internal certs
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

---

## ADR-008: Vitest integration tests against a real test PostgreSQL, auth boundary mocked

Date: 2026-07-15

Status: Accepted

### Context
Need integration coverage for `/api/auth/validate`, the preference server actions, and the
project list data layer. Google OAuth itself can't be driven in a test run, but the DB-backed
authorization logic (owner bypass, `project_access` lookups) is exactly what needs verifying —
mocking the database would defeat the purpose.

### Decision
Vitest runs against a real PostgreSQL instance started via `docker-compose.test.yml`
(`pnpm test` handles `up --wait` / `down` via `pretest`/`posttest`). Only the `auth()` wrapper
from `@/features/auth/lib/auth` is mocked per test to stand in for a verified session — everything
downstream of that boundary (`validateProjectAccess`, Drizzle queries, server actions) hits the
real test database. Each test truncates the relevant tables in `afterEach`. Test files run with
`fileParallelism: false` since they share one Postgres instance and interleaved truncates/inserts
across files caused cross-test data races.

### Alternatives Considered
- Mocking the DB layer — rejected, defeats the purpose of an integration suite
- Driving real Google OAuth in CI — impractical/flaky, no test IdP available
- Per-file/per-worker test databases — more isolation but adds real setup complexity; not
  justified at this project's scale, so sequential execution was chosen instead

### Consequences
- Tests require Docker locally and in CI to run `pnpm test`
- Adding more integration test files keeps the suite correct only if they continue to clean up
  their own DB state in `afterEach`, since execution is sequential but state is shared
- `auth()` mocking means the tests don't cover NextAuth's own JWT verification — that's Auth.js's
  responsibility, not this application's

---

## ADR-009: Hub connects to PostgreSQL over Coolify's built-in `coolify` network

Date: 2026-07-17

Status: Accepted

### Context
ADR-005 and the original architecture docs assumed a hand-created `db_network` shared by all
services. That network was based on the pre-Coolify hand-run stack (`postgres` + `pgadmin` at
`/home/mykola/infra/db` on the VPS). That stack has since been decommissioned: Postgres and
CloudBeaver (replacing pgAdmin, served at `db.blonskyi.dev`) now run as Coolify-managed resources
in their own project, on a Coolify-generated project network plus Coolify's instance-wide
`coolify` network. The `db_network` referenced in `docker-compose.yml` and the docs no longer
exists on the VPS.

### Decision
The hub service joins the `coolify` network (external, already present — every Coolify-managed
container is attached to it) instead of a manually created `db_network`. Postgres already has the
Docker DNS alias `postgres` on that network, so `DATABASE_URL` uses `postgres` as the host.
A dedicated `hub_app` role and `hub` database were created on the existing Postgres instance
(least-privilege, isolated from other tenants of that database server) rather than reusing the
admin role or the shared `app` database.

### Alternatives Considered
- Manually `docker network create db_network` and `docker network connect` it to the Postgres
  container — matches the original plan, but Coolify doesn't track that network, so if Coolify
  ever recreates the Postgres container (upgrade, resource re-provision), the manual attachment is
  silently lost until reconnected by hand
- Reusing the admin `mykola` role / `app` database for the hub — rejected, no isolation between
  the hub app and other future consumers of the same Postgres instance

### Consequences
- `docker-compose.yml` and `docs/architecture.md` reference `coolify` instead of `db_network`
- Any future service that needs direct Postgres access should also join the `coolify` network
  rather than reintroducing a bespoke network
- If a second Postgres instance is ever added to this VPS, its alias must not collide with
  `postgres` on the `coolify` network — pick a distinct Coolify resource name

---

## ADR-010: `AUTH_URL` hardcoded — `trustHost` alone doesn't cover the token exchange

Date: 2026-07-17

Status: Accepted

### Context
After first deploying to Coolify, Google sign-in failed at the callback step with a generic
`invalid_request` / "doesn't comply with Google's OAuth 2.0 policy" error from Google's token
endpoint. `AUTH_TRUST_HOST=true` and `trustHost: true` were both set, and the *initial*
authorization redirect to Google correctly used `https://blonskyi.dev`. Client ID/secret, scopes,
redirect URI registration, and PKCE were all verified correct by direct testing (manual token
requests against Google's real endpoint, and temporarily logging the raw outbound request/response
— see git history for `src/features/auth/lib/auth.ts` around this date, since removed).

The raw logged request revealed the actual cause: the token-exchange step (separate code path from
the authorization redirect) reconstructed its own `redirect_uri` as `https://0.0.0.0:3000/...` —
the container's raw `HOSTNAME:PORT` — instead of the Traefik-forwarded public host. Since this
didn't match the `redirect_uri` used in the authorization request, Google rejected the token
exchange. `trustHost` only fixed host detection for the outbound sign-in redirect, not this second
code path — a real inconsistency in `next-auth@5.0.0-beta.31`.

### Decision
Hardcode `AUTH_URL=https://blonskyi.dev/api/auth` in `docker-compose.yml` (same pattern as
`API_URL` — a fixed public constant, not a per-deploy secret). This gives Auth.js an explicit
canonical URL for every internal construction site, removing any reliance on header-based
detection being consistently applied across the library's code paths.

### Alternatives Considered
- Relying solely on `AUTH_TRUST_HOST` / `trustHost: true` — insufficient, per the above
- Disabling PKCE (`checks: ['state']`) — tested to rule out PKCE as the cause; it wasn't, and this
  would have been a real security regression (loses protection against auth code interception), so
  it was reverted immediately after the test

### Consequences
- If `next-auth` is upgraded past beta and this is confirmed fixed upstream, `AUTH_URL` can likely
  be removed — but there's no cost to leaving it, so no urgency
- Any future subdomain app hitting the same "callback redirects to an internal host" symptom should
  check this first before re-diagnosing from scratch
- Turned out to have a real side effect on every non-auth request too — see ADR-011

---

## ADR-011: Read session in middleware via `getToken()`, not the `auth()` wrapper

Date: 2026-07-19

Status: Accepted

### Context
After ADR-010, production started returning Cloudflare "Error 1000: DNS points to prohibited IP"
on every page load, first noticed blocking issue #1's closure. Extensive live debugging (DNS
records, Cloudflare dashboard config, browser/device/network isolation — see `reports/` history
for this date) ruled out DNS, Load Balancing, Origin Rules, Workers routes, and client-side
caching: the error was live and reproducible from a bare `curl` on a completely fresh connection.

Reproduced reliably offline by building the actual production Docker image locally and driving it
directly (bypassing Traefik/Cloudflare entirely). Root cause, confirmed by reading
`next-auth@5.0.0-beta.31` source: `reqWithEnvURL()` (`node_modules/next-auth/lib/env.js`)
unconditionally rewrites the request's origin to `AUTH_URL`'s origin, and this runs inside
`handleAuth()` — the function backing *every* call style of the `auth()` export, including
`export default auth((req) => {...})` as used in `middleware.ts`. So every request that passed
through the middleware saw an `AUTH_URL`-poisoned `request.url`, regardless of whether it was an
actual auth route. `next-intl`'s `createIntlMiddleware` internally performs a `NextResponse.rewrite()`
on every request (to pass the resolved locale to Server Components); in any production-mode Next.js
server (confirmed for both `next start` and `output: 'standalone'`), resolving a rewrite whose
target is an absolute URL means Next.js makes a real outbound HTTPS request to that URL instead of
resolving it internally. With the origin poisoned to `https://blonskyi.dev`, that request round-tripped
through Cloudflare from the origin's own IP and was blocked as a loop.

`next-intl` was not the defect — it was a correct, ordinary `rewrite()` call that became
collateral damage from `request.url` no longer reflecting the real request.

The only way to check auth in middleware without triggering `reqWithEnvURL` turned out to be
`getToken()` from `next-auth/jwt` (re-exported from `@auth/core/jwt`): it reads the session cookie
directly from `req.headers` and never touches `req.url`. The alternative — calling `auth()` with no
arguments, as done in Server Components — was considered and rejected: that code path depends on
`headers()` from `next/headers`, which reads an AsyncLocalStorage-backed request store that Next.js
only establishes during App Router rendering/route handlers, not during `middleware.ts` execution.

### Decision
Rewrite `middleware.ts` as a plain Next.js middleware function (no `auth()` wrapper). Use
`getToken({ req, secret: process.env.AUTH_SECRET, cookieName: 'authjs.session-token', secureCookie })`
in place of `req.auth` for the authenticated/unauthenticated check — matching the custom session
cookie name configured in `auth.ts`. `AUTH_URL`/`AUTH_TRUST_HOST` are left untouched: the actual
`/api/auth/[...nextauth]` route handlers still need them for the OAuth token exchange (ADR-010),
and that code path is entirely separate from middleware.

### Alternatives Considered
- Removing `AUTH_URL` — fixes Error 1000, but directly reintroduces ADR-010's bug (confirmed by
  reproducing the token-exchange call locally with `AUTH_URL` unset: `redirect_uri` fell back to
  raw `HOSTNAME:PORT` again, and even the *initial* authorization redirect was affected this time,
  not just the token exchange)
- Calling `auth()` with zero arguments inside middleware — mechanically incompatible with the
  middleware execution context (see Context); not pursued once traced to the `next/headers`
  dependency
- Removing or restructuring `next-intl`'s middleware-based locale routing — would have worked
  around the symptom, but next-intl was never the defect; not warranted for what was fundamentally
  an Auth.js request-mutation bug

### Consequences
- Any future middleware logic needing session data beyond a boolean check must decode it from the
  `getToken()` payload directly (it returns the raw JWT claims, not the enriched `Session` object
  from the `session()` callback) — currently only presence/absence is checked, so this hasn't come
  up
- If `next-auth` is upgraded past beta and ADR-010's `AUTH_URL` requirement is later removed, this
  `getToken()`-based middleware can stay as-is; it doesn't depend on `AUTH_URL` either way
- `docs/TODO.md`'s "likely edge cache/propagation" note for the Error 1000 blocker was wrong; this
  entry is the actual root cause going forward
