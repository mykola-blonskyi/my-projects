# Architecture

## Overview

Hub application at `blonskyi.dev` — the entry point for all pet projects hosted on subdomains.
Handles Google OAuth login, displays a project directory, and enforces per-project access control
shared across all subdomains via a JWT cookie on `.blonskyi.dev`.

This repository (`my-projects`) is both the hub application source and the project template
scaffold (docs/, boilerplates/, snippets/, etc.) reused across all future subdomain projects.

---

## Goals

- Single sign-on across all `*.blonskyi.dev` subdomains
- Per-project access control — owner has all access, others need explicit whitelist entry
- User preferences (locale, theme) persisted in DB — consistent across devices
- Fully self-hosted on personal VPS, no third-party SaaS dependencies
- Easy to extend — adding a new subdomain project requires minimal setup

---

## System Components

### Frontend

**Responsibilities:**
- Login page (Google OAuth button only)
- Project list page (responsive grid of project cards)
- Theme switching (light / dark / rose)
- Language switching (en / ru / uk / es)

**Stack:**
- Next.js 15, App Router, TypeScript
- shadcn UI + Tailwind CSS
- `next-themes` for theme management
- `next-intl` for i18n (URL-based: `/en/`, `/ru/`, `/uk/`, `/es/`)

**Dependencies:** Auth.js session, PostgreSQL (via Drizzle), `API_URL` env var

---

### Backend (API Routes in same Next.js app)

**Responsibilities:**
- Google OAuth callback handling (Auth.js)
- JWT issuance + refresh token management
- Session validation endpoint for subdomain apps
- User preference updates (locale, theme)
- Project listing with access filtering

**Stack:**
- Next.js API Routes (`/api/auth/[...nextauth]`, `/api/auth/validate`)
- Auth.js v5 (NextAuth) with Google provider
- Drizzle ORM + `postgres` driver

**Dependencies:** PostgreSQL

---

### Integrations

- **Google OAuth** — identity provider, used only for authentication (no Google API calls beyond profile)
- **Cloudflare CDN** — DNS proxy, SSL edge termination (SSL mode: Full), DDoS protection
- **Coolify** — self-hosted PaaS managing Docker containers, reverse proxy (Traefik), SSL certs, deployments
- **GitHub Actions → GHCR** — CI/CD: build Docker image on push to `main`, push to GitHub Container Registry, trigger Coolify webhook

---

## Data Flow

### Login Flow
```
User → blonskyi.dev → middleware (no cookie) → /[locale]/login
→ "Sign in with Google" → Auth.js → Google OAuth → callback
→ upsert user in DB → issue JWT cookie on .blonskyi.dev (24h)
→ read user locale/theme from DB → redirect to /[locale]/
```

### Protected Page Flow
```
User → blonskyi.dev/[locale]/ → middleware
→ JWT cookie present → verify signature → render project list
→ filter projects by project_access table
```

### Subdomain Auth Flow
```
User → todo.blonskyi.dev → subdomain middleware
→ read JWT from .blonskyi.dev cookie
→ POST {API_URL}/api/auth/validate
→ hub checks JWT + project_access table
→ { allowed: true/false } → serve page or redirect to blonskyi.dev/login
```

---

## Deployment

- **VPS**: Single server running Docker
- **Network**: Coolify's built-in shared network (`coolify`) — every Coolify-managed service joins it automatically, so the hub reaches PostgreSQL over Docker DNS at hostname `postgres`
- **Reverse proxy**: Coolify-managed Traefik — routes subdomains to containers, handles internal TLS
- **CDN**: Cloudflare in front — orange-cloud proxy ON, SSL mode Full
- **Registry**: GitHub Container Registry (GHCR) — `ghcr.io/mykola-blonskyi/my-projects`
- **Deploy trigger**: Coolify webhook called by GitHub Actions after successful build

### Docker Compose (hub service)
```yaml
services:
  hub:
    image: ghcr.io/mykola-blonskyi/my-projects:latest
    networks:
      - coolify
    environment:
      - DATABASE_URL
      - AUTH_SECRET
      - AUTH_TRUST_HOST
      - GOOGLE_CLIENT_ID
      - GOOGLE_CLIENT_SECRET
      - OWNER_EMAIL
      - API_URL=https://blonskyi.dev

networks:
  coolify:
    external: true
```

### Subdomain Pattern
Each subdomain app sets:
```
API_URL=https://blonskyi.dev
AUTH_SECRET=<same secret>
COOKIE_DOMAIN=.blonskyi.dev
```

---

## Security

**Authentication:**
- Google OAuth only — no passwords, no magic links
- JWT signed with `AUTH_SECRET`, stored in HTTP-only `Secure` `SameSite=Lax` cookie
- Cookie domain `.blonskyi.dev` — shared across all subdomains

**Authorization:**
- Owner email (env: `OWNER_EMAIL`) bypasses all project access checks
- All other users require an explicit row in `project_access` table
- Subdomains validate via `/api/auth/validate` — returns `allowed: true/false` per project slug

**Secrets Management:**
- All secrets via environment variables (never committed)
- Managed in Coolify environment settings per service
- `.env.example` committed with placeholder values

**Cloudflare:**
- SSL mode: Full (Traefik handles internal cert, Cloudflare handles public edge)
- Cache-Control: `no-store` on all authenticated pages
- Real IP forwarded via `CF-Connecting-IP` → `X-Real-IP`

---

## Observability

**Logging:**
- Next.js default stdout logs captured by Coolify
- Coolify dashboard shows per-service logs

**Metrics:**
- Cloudflare dashboard provides traffic/error metrics at the edge
- No application-level metrics configured (future: add if needed)

**Tracing:**
- Not configured (personal project scale doesn't warrant it)
