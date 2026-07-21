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

---

## ADR-012: Build absolute redirect URLs from `API_URL`, not the request/framework's own host detection

Date: 2026-07-20

Status: Accepted

### Context
After ADR-011 shipped, login still appeared to silently fail: the user reported staying on the
login form after a successful Google sign-in instead of landing on the projects page. Decoding the
real session cookie with the real `AUTH_SECRET` confirmed the session itself was valid and
correctly issued (right claims, not expired) — ruling out `getToken()`/ADR-011 entirely. Hitting
the real production middleware directly with that same cookie (via `curl`) also worked correctly:
a clean `200` on the target locale page.

The actual break was in `src/app/api/auth/post-login/route.ts`: hitting it directly with the valid
cookie returned `location: https://0.0.0.0:3000/uk/` — a private, unroutable address the browser
can't navigate to, which is exactly why the page appeared to just sit still. The route built its
redirect with `new URL(path, req.url)`, where `req` is the plain Web `Request` passed to an App
Router Route Handler — this is a *different* object than `NextRequest`/`nextUrl` (which middleware
uses and which does correctly resolve to the public host), and its `.url` resolved to the
container's raw `HOSTNAME:PORT` behind Traefik/Coolify instead.

The same failure class turned up in `src/features/auth/actions/logout.ts`: the Server Action calls
`signOut({ redirectTo: '/en/login' })` with a relative path, and Next.js's own Server Actions
runtime (`action-handler.js`) attempts to internally re-fetch same-origin redirect targets to
inline the resulting page (an optimization, unrelated to Auth.js) — constructing that internal
fetch URL from its own host detection, which also resolved to the container's raw address.
Confirmed live in production logs as a `TypeError: fetch failed` / `ERR_SSL_WRONG_VERSION_NUMBER`
(the internal fetch tried HTTPS against the standalone server's plain-HTTP-only port); the
malformed URL then leaked to the client via the `x-action-redirect` header.

### Decision
Wherever this app needs to build an absolute redirect URL server-side (Route Handlers, Server
Actions), use `process.env.API_URL` (`https://blonskyi.dev`, already set in `docker-compose.yml`
for exactly this purpose but previously unused in code) as the base instead of `req.url` or a
relative path handed to a framework helper. Passing an already-absolute URL to `signOut({
redirectTo })` also has the side effect of making Next.js treat the redirect as cross-origin,
skipping the same internal self-fetch optimization that was failing.

### Alternatives Considered
- Trusting `X-Forwarded-Host`/`X-Forwarded-Proto` headers directly in each call site — would work,
  but `API_URL` already exists in the environment for this exact purpose; reading it directly is
  simpler and avoids re-deriving the same value from headers in multiple places
- Fixing this generically at the framework level (e.g. `__NEXT_PRIVATE_ORIGIN`) — a community
  report for a related Next.js standalone bug (see ADR-011) noted this env var did not fix their
  case either; not pursued further given the targeted fix is small and already verified

### Consequences
- Any new Route Handler or Server Action added later that needs to build an absolute URL should
  use `API_URL`, not `req.url`/a relative path passed to a redirect helper — this is now the
  established pattern for this app running self-hosted behind Traefik/Coolify
- If `next-auth`/Next.js versions are upgraded and this host-detection inconsistency is fixed
  upstream, these call sites can stay as-is; `API_URL` remains a correct base either way

---

## ADR-013: Own `.next` by the runtime user in the Docker image

Date: 2026-07-20

Status: Accepted

### Context
After ADR-011/ADR-012 shipped and login redirects were confirmed working, production logs showed
a new error: `Failed to write image to cache ... EACCES: permission denied, mkdir
'/app/.next/cache'`. This was latent since the avatar fix (`next.config.ts`'s `images.remotePatterns`)
started actually processing external images through `/_next/image` — before that, requests failed
earlier at the hostname-allowlist check and never reached the cache-write step, so the underlying
permission problem never surfaced.

Root cause: the runtime stage `COPY`s `.next/standalone` and `.next/static` without `--chown`, so
they land owned by `root`, then `USER nextjs` switches to a non-root user before the server ever
runs. `next/image`'s optimizer creates `.next/cache` lazily at request time as whatever user the
server runs as — `nextjs`, which had no write access to the root-owned `.next` directory. Verified
directly: writing to `.next/cache` as `root` (image default before this fix) succeeds, but doing
the same as `nextjs` failed until `.next` was explicitly `chown`'d to `nextjs:nodejs`.

### Decision
Explicitly create `.next/cache` and `chown -R nextjs:nodejs .next` before copying the standalone
build in, and add `--chown=nextjs:nodejs` to the `COPY` commands that populate `.next` — matching
Next.js's own documented standalone Docker template, which does this for exactly this reason.

### Alternatives Considered
- Running the container as `root` — removes the permission mismatch entirely, but drops a
  deliberate security boundary (least-privilege runtime user) for a problem that has a small,
  correct fix
- Disabling Next.js's image optimization cache entirely (e.g. `unoptimized: true` on `next/image`)
  — sidesteps the write, but also drops the actual optimization/resizing benefit for no reason
  once the real fix is this small

### Consequences
- Any future addition to the runtime stage that copies into `.next` (or otherwise expects the
  server to write under `/app`) should carry `--chown=nextjs:nodejs` or be created after the
  `chown -R` step, or it will silently reintroduce this class of bug
- This should have been caught by the local Docker testing done for ADR-011/ADR-012 and the avatar
  fix (PR #28) — those tests ran the container the same way production does, but never exercised
  an actual external image fetch through `/_next/image` end-to-end. Future Docker-based
  verification of image-related changes should include that request explicitly

---

## ADR-014: `redirect` callback always routes to post-login, never trusts the referring URL

Date: 2026-07-21

Status: Accepted

### Context
After ADR-011/012/013 shipped, live login was still reported as "stuck on the login page" after a
successful Google sign-in. Server-side redirect logic and the image-cache permission issue were
both ruled out (confirmed via direct production testing with a synthetic session cookie). A HAR
export of a real browser attempt gave the real answer: the callback
(`/api/auth/callback/google`) redirected directly to `https://blonskyi.dev/en/login` — skipping
`/api/auth/post-login` entirely, with no `?error=` param, meaning this wasn't Auth.js reporting a
failure.

Root cause: `login/page.tsx`'s form calls `signIn('google')` with no `redirectTo`/`callbackUrl`
option, so Auth.js defaults the post-sign-in callback URL to the *referring page* - which is
always the login page itself, since that's the only place `signIn()` is called from. The old
`redirect` callback in `auth.ts` only special-cased `url === baseUrl` (root); for any other
same-origin URL (including the login page) it fell through to `if (url.startsWith(baseUrl)) return
url`, returning the login page URL as-is instead of routing through `/api/auth/post-login`. The
session cookie was set correctly - the bug was purely about *where the browser was sent next* -
so the login page itself, which doesn't check for an existing session before rendering, kept
showing the sign-in form.

### Decision
Since `signIn('google')` is only ever invoked from the login page, there's no legitimate `url`
value the `redirect` callback needs to honor - always return `${baseUrl}/api/auth/post-login`
regardless of the referrer.

### Alternatives Considered
- Special-casing the login page's URL pattern (mirroring middleware's `isLoginPage` regex) in
  addition to the `baseUrl` check — works, but adds regex-matching complexity for a callback that
  has no reason to ever *not* go through post-login given this app's actual sign-in entry points
- Passing an explicit `redirectTo` to `signIn('google')` in `login/page.tsx` instead of fixing the
  callback — would also work, but the callback is the single choke point for every sign-in entry
  point this app has or might add later, so fixing it there is more robust than fixing every call
  site

### Consequences
- If a future feature needs sign-in to land somewhere other than the projects list (e.g.
  preserving a deep link), the `redirect` callback will need to actually inspect `url` again -
  revisit this ADR before reintroducing that logic, and reproduce the exact referrer-URL scenario
  (not just root/empty cases) before trusting it
- This was likely the true original cause of "stuck on login page," predating even the Error 1000
  investigation (ADR-011/012) - those were real, independently-confirmed bugs, but this one was
  never actually exercised by the curl-based reproductions in this session, since none of them
  simulated `signIn()`'s real default callback-URL behavior from the login page

---

## ADR-015: Sign-in button returns Google's URL via `redirect: false` instead of a Server Action redirect

Date: 2026-07-21

Status: Accepted

### Context
After ADR-014 shipped, live testing confirmed the core session/redirect bug was fixed - a manual
refresh correctly landed on `/projects`. But a new client-side crash appeared mid-flow:
`Uncaught Error: An unexpected response was received from the server`, alongside a `POST
/api/auth/post-login 405 (Method Not Allowed)` in the console (that route only implements `GET`).

Root cause: `login/page.tsx`'s sign-in button was a `<form action={fn}>` Server Action calling
`signIn('google')`, which internally calls Next.js's `redirect()` to Google's external
authorization URL. Next.js's Server Actions client runtime
(`server-action-reducer.js`/`action-handler.js`) has a known rough edge handling redirects to
external origins from within a Server Action - the real browser navigation through the whole
OAuth round trip (Google → callback → post-login → projects) succeeds independently, but the
*original* Server Action's own fetch/response-handling gets confused by it, eventually surfacing
this exact error once it resolves against a stale URL.

Traced `next-auth`'s server-side `signIn()` implementation (`src/lib/actions.ts`): it already
supports `{ redirect: false }`, in which case it returns the resolved authorization URL as a
plain string instead of calling `redirect()` itself. Verified directly: invoking the new Server
Action against a real build returns a clean `200` with `Content-Type: text/x-component` and the
Google URL as plain action-result data - no `x-action-redirect` header, no redirect handling
involved at all.

### Decision
- New Server Action `signInWithGoogle()` (`src/features/auth/actions/signInWithGoogle.ts`) calls
  `signIn('google', { redirect: false })` and returns the URL string.
- New client component `GoogleSignInButton` (`src/features/auth/components/GoogleSignInButton.tsx`)
  calls it via `useTransition`, then does `window.location.href = url` itself - a plain, real
  browser navigation with no Server Actions machinery involved in the handoff at all.
- `login/page.tsx` renders `GoogleSignInButton` instead of the old inline form/Server Action.

### Alternatives Considered
- Switching to a plain HTML `<form>` POSTing directly to `/api/auth/signin/google` with a CSRF
  token (Auth.js's traditional/v4-era pattern) — works, but requires getting a valid CSRF token
  onto the page from a Server Component without an extra client-side round trip, which is more
  moving parts than needed here since `signIn()` already has a built-in escape hatch
  (`redirect: false`) for exactly this situation
- Leaving the Server Action as-is and trying to work around the crash (e.g. suppressing the
  error) — doesn't address the actual defect, and the underlying Next.js redirect-handling
  behavior for external URLs in Server Actions is the real rough edge to route around

### Consequences
- Any future OAuth-provider button (if more providers are added) should follow this same pattern -
  `signIn(provider, { redirect: false })` from a Server Action, `window.location.href` from a
  client component - rather than a plain form Server Action, to avoid reintroducing this exact bug
- This is specifically about *external* redirects from Server Actions; internal same-app redirects
  (e.g. `logout`'s `signOut`, ADR-012) don't have this problem the same way, since Next.js's
  same-origin self-fetch optimization is a separate code path with its own separate bug already
  fixed there

---

## ADR-016: `GoogleSignInButton` uses plain async/await, not `useTransition`

Date: 2026-07-21

Status: Superseded by ADR-017 - insufficient on its own, see that entry's Context

### Context
ADR-015 shipped and fixed the client-side crash for a first-time sign-in, but "log in → log out →
log in again" (in the same tab, and separately reproduced in a fresh Incognito window, ruling out
any stale browser/session-cache theory) still hit the same `POST /api/auth/post-login 405` /
"unexpected response" crash - just on the second sign-in rather than the first.

The Network panel's Initiator call stack for the failing request showed it originating from
`t.startTransition` (Next.js's internal chunk), tracing back through `onClick` in the compiled
login page bundle - i.e. `GoogleSignInButton`'s own click handler, still executing *after* landing
on `/projects`. The request initiator chain confirmed the sequence: callback → post-login →
projects → (load Next.js's Server Actions runtime chunk) → a second, unprompted POST back to
post-login. This matches a documented class of Next.js/React issue: Server Actions wrapped in
`startTransition` that trigger a real navigation (here, `window.location.href` to an external URL)
can get replayed by React/Next.js's transition machinery once it resumes on the new page -
see vercel/next.js#55805 ("Server actions running twice in combination with
useTransition/navigation") and #73536 ("Server action with redirect to external URL returns
undefined to client").

### Decision
Drop `useTransition`/`startTransition` from `GoogleSignInButton` entirely, replacing it with a
plain `async` `onClick` handler and a local `useState` for the pending/disabled state. There's no
in-app UI to keep responsive during this click - the whole point is to leave the SPA via a real
navigation - so a transition was never actually needed here, and removing it removes the API
surface that's implicated in the replay behavior.

### Alternatives Considered
- Waiting for/pinning to a Next.js or React version with this fixed upstream — both linked issues
  were open with no confirmed fix version at the time of writing; not worth blocking on
- Manually guarding against a duplicate submission (e.g. a ref-based "already submitted" flag) —
  would paper over the symptom without addressing why a transition replays a completed action;
  removing the transition is the more direct fix and was already sufficient in testing

### Consequences
- Any other button that calls a Server Action and then does a real `window.location`/external
  navigation (rather than an in-app state update) should follow this same plain-async pattern, not
  `useTransition` — reserve `useTransition` for actions whose result is consumed by the *same* page
  (e.g. `setLocale`, `setTheme`, which do stay in-app and are unaffected by this)
- Deployed and retested: the identical `POST /api/auth/post-login 405` crash still happened,
  proving this fix was insufficient - see ADR-017

---

## ADR-017: Sign-in uses a plain HTML form to `/api/auth/signin/google`, not a Server Action at all

Date: 2026-07-21

Status: Accepted

### Context
ADR-016 shipped, deployed, and was retested live - the identical crash still happened. The
Initiator call stack for the new failure still showed `t.startTransition`, but this time clearly
inside Next.js's own framework chunk (`965-...js`), *not* app code - confirming `useTransition`
was never the actual mechanism to fix. Every Server Action invocation is wrapped in an internal
`startTransition` by Next.js's own client runtime, regardless of whether the calling component
uses `useTransition` itself. The problem was never about *how* `GoogleSignInButton` called the
action - it's inherent to using a Server Action at all when its result is an external navigation:
Next.js's internal transition machinery appears to retain/replay the pending action once a
*different* page that also uses Server Actions (here, `/projects`, via `logout`/`setLocale`/
`setTheme`) loads the same shared framework chunk.

Given the bug lives inside Next.js's own Server Actions runtime rather than anything reachable
from application code, no combination of `redirect: false`, avoiding `useTransition`, or similar
app-level adjustments can fix it - the only way to route around it entirely is to not invoke a
Server Action for this interaction at all.

### Decision
`GoogleSignInButton` is now a plain `<form method="POST" action="/api/auth/signin/google">` -
Auth.js's traditional (pre-Server-Actions) sign-in endpoint. `getCsrfToken()` (from
`next-auth/react`, a plain client-side `fetch('/api/auth/csrf')` with no `SessionProvider`
dependency) populates a hidden `csrfToken` field on mount; the submit button is disabled until
that resolves. This is a real HTML form submission handled entirely by the browser - no
`fetch()`, no Server Action, no Next.js request-handling in the loop at all, so there is no
transition-machinery code path left to replay anything.

`signInWithGoogle.ts` (the `redirect: false` Server Action from ADR-015) is removed - no longer
needed now that sign-in isn't a Server Action.

### Alternatives Considered
- Everything in ADR-015/016's "Alternatives Considered" - all still apply and are now moot, since
  those were framed as alternatives *to* the Server Action approach, which turned out to be the
  actual defect
- Waiting for a Next.js/React fix upstream — as in ADR-016, no confirmed fix version at time of
  writing, and this bug appears architectural to how Server Actions + external navigation +
  shared-chunk loading interact, not a simple patch

### Consequences
- Any future OAuth-provider button should follow this same plain-form-plus-CSRF pattern, not a
  Server Action, specifically because the redirect target is external — this is now the
  established exception to "prefer Server Actions" for this app
- `logout`/`setLocale`/`setTheme` remain Server Actions and are unaffected: `setLocale`/`setTheme`
  stay in-app (no external navigation involved), and `logout`'s redirect target, while same-origin,
  goes through a different Next.js code path (the same-origin self-fetch optimization from
  ADR-012) that doesn't exhibit this specific replay behavior
- Verified end-to-end via curl against a real build: fetching `/api/auth/csrf` then POSTing to
  `/api/auth/signin/google` with the resulting token returns a clean `302` with the correct
  `redirect_uri` — a genuine plain HTTP redirect, no Server Actions artifacts of any kind

---

## ADR-018: User approval status is checked against the database on every request

Date: 2026-07-21

Status: Accepted

### Context
Designing the settings UI for approving/blocking non-owner users (Business Rule 7) surfaced two
things worth recording.

First, a real Auth.js ordering fact: the `signIn` callback runs *before* the adapter creates the
`users` row (confirmed by reading `@auth/core`'s callback handler — `handleAuthorized` runs, and
only if it doesn't reject does `handleLoginOrRegister` create the user). Rejecting sign-in for a
brand-new user via `signIn` returning `false` would mean their row is never created at all,
leaving the owner nothing to approve later. So Google sign-in must always succeed regardless of
`status`; the actual gate has to live after that, checked on every request the same place
authentication itself is already checked (middleware).

Second, and the real trade-off: middleware currently authenticates via `getToken()` (ADR-011),
decoding the JWT only, with zero database access — a deliberate choice for a fast, DB-free
middleware check. `role`/`locale`/`theme` are baked into that JWT at sign-in time and don't
refresh until the next login (up to 24h later, per `session.maxAge`). The default here would be
to treat `status` the same way and accept up to a 24h lag before a blocked user is actually locked
out. That was offered as the recommended option; it was rejected in favor of checking `status`
against the database on every request, so a blocked user is locked out on their very next
request, not their next login.

### Decision
Middleware queries the `users` table for the current `status` on every request (for authenticated
non-owner users), in addition to the existing JWT-based `getToken()` check. `role` continues to
come from the JWT unchanged — this is scoped narrowly to `status`, not a general move away from
JWT-trust for other claims.

### Alternatives Considered
- Baking `status` into the JWT like `role`/`locale`/`theme`, accepting up to ~24h lag before a
  block takes effect — keeps middleware DB-free, consistent with ADR-011, but explicitly rejected:
  for this specific gate, immediate lockout mattered more than avoiding a per-request DB call
- Rejecting sign-in outright for non-`'approved'` users — ruled out entirely, not just
  deprioritized, because of the `signIn`-runs-before-user-creation ordering above

### Consequences
- Middleware is no longer DB-free for authenticated requests — this is a deliberate, scoped
  departure from ADR-011's design goal, not an accidental regression; ADR-011 remains correct for
  why `getToken()` replaced the `auth()` wrapper, this just adds a second check alongside it
- Given this app's actual scale (a personal project with a handful of trusted users), the added
  per-request query is not expected to be a real performance concern; revisit if that changes
- If `role` or other claims ever need the same immediate-revocation treatment, extend this same
  per-request DB check rather than introducing a third, different mechanism
