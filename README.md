# blonskyi.dev Hub

Personal project hub at [blonskyi.dev](https://blonskyi.dev) — Google login, project directory, and shared authentication across all `*.blonskyi.dev` subdomains.

## What it does

- **Single sign-on** — one Google login grants access across all subdomain projects
- **Project directory** — responsive grid of project cards, each linking to its subdomain
- **Per-project access control** — owner sees all; other users need an explicit whitelist entry
- **Preference persistence** — locale and theme saved per user, consistent across devices
- **Subdomain auth API** — `/api/auth/validate` lets any subdomain app check session + access

## Tech stack

- **Next.js 15** — App Router, server components, server actions
- **Auth.js v5** — Google OAuth, JWT sessions, Drizzle adapter
- **Drizzle ORM** — PostgreSQL schema, migrations, type-safe queries
- **shadcn/ui + Tailwind CSS** — component library and styling
- **next-intl** — URL-based i18n (`/en/`, `/ru/`, `/uk/`, `/es/`)
- **next-themes** — light / dark / rose theme switching

## Local development

### Prerequisites

- Node.js 22+
- pnpm
- PostgreSQL (local instance or Docker)

### Setup

```bash
git clone https://github.com/mykola-blonskyi/my-projects.git
cd my-projects

cp .env.example .env.local
# Edit .env.local — see environment variables below

pnpm install
pnpm db:migrate   # apply database migrations
pnpm db:seed      # seed initial projects
pnpm dev          # http://localhost:3000
```

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `AUTH_SECRET` | Yes | Secret for JWT signing — must match across all subdomain apps |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Yes | Google OAuth client secret |
| `OWNER_EMAIL` | Yes | Your Google email — automatically granted owner access to all projects |
| `API_URL` | Yes | Base URL of this hub (e.g., `https://blonskyi.dev`) |

### Available commands

```bash
pnpm dev            # development server
pnpm build          # production build
pnpm start          # serve production build
pnpm lint           # ESLint
pnpm db:generate    # generate Drizzle migration from schema changes
pnpm db:migrate     # apply migrations
pnpm db:seed        # seed initial projects
pnpm db:studio      # Drizzle Studio (local DB UI)
```

### Local auth limitation

The session cookie is scoped to `.blonskyi.dev`, which does not resolve on `localhost`. For local testing of the login flow, add entries to `/etc/hosts`:

```
127.0.0.1  hub.blonskyi.dev
```

Then register `http://hub.blonskyi.dev:3000` as an OAuth redirect URI in Google Cloud Console.

## Deployment

Fully automated via Coolify on a personal VPS:

1. Merge PR to `main`
2. GitHub Actions: lint → type-check → build Docker image → push to GHCR
3. GitHub Actions triggers Coolify deploy webhook
4. Coolify pulls new image, zero-downtime container restart

Manual deploy (emergency only):

```bash
ssh vps
docker pull ghcr.io/mykola-blonskyi/my-projects:latest
docker compose up -d
```

## Architecture

See [docs/architecture.md](docs/architecture.md) for the full system overview, data flow diagrams, security model, and deployment configuration.

## Adding a new subdomain project

See [boilerplates/subdomain-app.md](boilerplates/subdomain-app.md) for the complete pattern — required env vars, middleware template, and checklist.

The short version:

1. Register the project slug in the hub database (`projects` table)
2. Grant user access if needed (`project_access` table), or rely on owner role
3. Copy the middleware pattern from `boilerplates/subdomain-app.md` into your new project
4. Set `API_URL=https://blonskyi.dev`, `AUTH_SECRET=<same secret>`, `COOKIE_DOMAIN=.blonskyi.dev`
5. Deploy the new subdomain via Coolify on the same Docker network

## Project structure

```
src/
  app/              # Next.js App Router pages and API routes
    [locale]/       # Locale-prefixed pages (login, home, ...)
    api/auth/       # Auth.js handlers + /validate endpoint
  features/         # Feature modules (auth, preferences, projects)
  shared/           # Shared utilities, UI components, types
drizzle/            # DB schema, migrations, seed
docs/               # Architecture, decisions, onboarding
knowledge/          # Domain model, business rules, glossary
boilerplates/       # Templates for new subdomain projects
plans/              # Active implementation plan and backlog
```
