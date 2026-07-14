# Architecture Analysis

## Components

### Hub App (`blonskyi.dev`)
Single Next.js 15 service that owns auth, the project directory UI, and the shared auth API.
Runs in Docker on the VPS, connected to PostgreSQL via the `shared` Docker network.
Served behind Coolify (Caddy reverse proxy) with Cloudflare CDN in front.

### Auth Layer (`/api/auth/*`)
Auth.js v5 handles Google OAuth and issues JWT cookies on `.blonskyi.dev`.
The `/api/auth/validate` endpoint is the single integration point for all subdomain apps —
they call it to check whether the current user is allowed to access a given project slug.

### Subdomain Apps (`*.blonskyi.dev`)
Independent services in their own repositories. Each joins the `shared` Docker network,
sets `API_URL=https://blonskyi.dev`, and uses shared middleware to validate the `.blonskyi.dev` cookie
via the hub's validate endpoint. No auth logic lives in subdomain apps themselves.

### PostgreSQL (existing)
Shared database already running on the VPS in Docker. All services connect via the `shared` network.
The hub owns the `users`, `projects`, `project_access`, and `sessions` tables.

### Coolify
Self-hosted PaaS managing the Docker containers, Caddy reverse proxy, and Let's Encrypt SSL.
Receives deploy webhooks from GitHub Actions and performs zero-downtime container restarts.

### Cloudflare CDN
Sits in front of the VPS. Handles DNS, DDoS protection, and SSL edge termination.
SSL mode: Full — Cloudflare terminates TLS at the edge, Caddy handles the internal connection.

---

## Risks

### Hub is a single point of failure for subdomain auth
All subdomain apps call `blonskyi.dev/api/auth/validate` on every protected request.
If the hub is down, all subdomains deny access to all users.
*Mitigation:* acceptable for a personal project at this scale. Future option: short-lived local JWT cache per subdomain.

### AUTH_SECRET synchronisation
The JWT secret must be identical across the hub and every subdomain app.
Rotating it invalidates all active sessions across all services simultaneously.
*Mitigation:* document clearly; only rotate when a secret is compromised, not on a schedule.

### Coolify migration disruption
Moving the existing `sqlpanel.blonskyi.dev` Docker setup into Coolify requires a planned
downtime window. The existing setup may have manual config not captured in files.
*Mitigation:* schedule migration during low-traffic period; test Coolify routing before cutover.

### Cloudflare SSL mode mismatch
If Cloudflare SSL mode is changed from Full to Flexible, internal Caddy certs stop being
validated and the site may break silently.
*Mitigation:* document in `docs/onboarding.md` and `CLAUDE.local.md`; do not change without understanding the impact.

---

## Improvements

### Short-lived validate response cache per subdomain
Caching the `{ allowed }` response in memory for 30–60 seconds per subdomain would reduce
hub API calls and eliminate the single-point-of-failure risk for brief hub outages.

### Extract `api.blonskyi.dev` when API surface grows
Currently the API lives inside the hub Next.js app. When shared APIs expand beyond auth
(notifications, file storage, etc.), extract to a dedicated service and update `API_URL` per subdomain.

### Session revocation via refresh token invalidation
Currently a stolen JWT is valid until its 24h expiry. Adding a `revoked_at` check on the
`sessions` table during validate calls would enable instant revocation at the cost of one extra DB read.
