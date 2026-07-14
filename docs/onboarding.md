# Onboarding

## Project Purpose

Hub application at `blonskyi.dev` — personal pet project directory with shared authentication.

- Login via Google OAuth (single sign-on across all subdomains)
- Project list showing all pet projects with links to subdomains
- Per-project access control (owner gets all; others need explicit whitelist)
- User preferences (locale, theme) persisted across devices

This repo also serves as the **project template scaffold** — the `docs/`, `knowledge/`,
`boilerplates/`, `snippets/`, and `prompts/` directories are copied into each new subdomain
project as a starting point.

---

## First Steps

1. Read `docs/architecture.md` — system overview, data flow, deployment model
2. Read `docs/decisions.md` — why key tech choices were made
3. Read `knowledge/domain-model.md` — entities and relationships
4. Read `knowledge/business-rules.md` — access control and auth rules
5. Read `plans/current.md` — what's being built right now

---

## Development Workflow

### Prerequisites
- Node.js 22+
- pnpm
- Docker + Docker Compose
- PostgreSQL (via existing shared Docker network, or local)

### Setup
```bash
cp .env.example .env.local
# fill in: DATABASE_URL, AUTH_SECRET, GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, OWNER_EMAIL

pnpm install
pnpm db:migrate      # run Drizzle migrations
pnpm db:seed         # seed initial projects
pnpm dev             # starts on http://localhost:3000
```

### Environment Variables
| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `AUTH_SECRET` | Random secret for JWT signing (shared with subdomain apps) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `OWNER_EMAIL` | Your Google email — auto-granted access to all projects |
| `API_URL` | Base URL of this hub app (e.g., `https://blonskyi.dev`) |

### Key Commands
```bash
pnpm dev              # development server
pnpm build            # production build
pnpm db:generate      # generate Drizzle migration from schema changes
pnpm db:migrate       # apply migrations
pnpm db:studio        # Drizzle Studio (local DB UI)
```

---

## Deployment Workflow

Deployments are fully automated via Coolify:

1. Merge PR to `main`
2. GitHub Actions runs: lint → type-check → build Docker image → push to GHCR
3. On success, GitHub Actions triggers Coolify deploy webhook
4. Coolify pulls new image and does a zero-downtime container restart
5. Verify at `https://blonskyi.dev`

Manual deploy (emergency): SSH into VPS → `docker pull ghcr.io/mykola-blonskyi/my-projects:latest && docker compose up -d`

---

## Important Constraints

- `AUTH_SECRET` must be **identical** across the hub and all subdomain apps — it signs the shared JWT
- Cookie domain is `.blonskyi.dev` — auth only works on subdomains of `blonskyi.dev`, not localhost
- Cloudflare SSL mode must stay on **Full** — changing to Flexible breaks internal Caddy certs
- All new subdomains must set `API_URL=https://blonskyi.dev` and use the shared auth middleware from `boilerplates/`
- Owner access is controlled by `OWNER_EMAIL` env var — change it there, not in the DB
