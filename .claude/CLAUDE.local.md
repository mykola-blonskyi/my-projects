# Local Project Instructions

## Project Context

Hub application at `blonskyi.dev` — Google OAuth login + pet project directory with
cross-subdomain auth. Built with Next.js 15 + shadcn + Tailwind + Auth.js v5 + Drizzle ORM.
Deployed via Coolify on a personal VPS behind Cloudflare CDN.

This repo also doubles as the **project template scaffold** — `docs/`, `knowledge/`,
`boilerplates/`, `snippets/`, `prompts/` are reused across all subdomain projects.

---

## Constraints

- `AUTH_SECRET` must be the same across hub and all subdomain apps — never rotate one without the others
- Cookie domain is `.blonskyi.dev` — local development requires `localhost` workaround or use staging
- Cloudflare SSL must stay on **Full** mode — Coolify/Caddy manages internal certs
- Owner access is controlled by `OWNER_EMAIL` env var, not a DB flag — update env, not DB
- Do not add third-party auth providers — Google only, by design

---

## Architecture Notes

- Feature-based structure: `src/features/{auth,projects,preferences}` + `src/shared/{ui,lib,types}`
- `src/app/` is routing-only — no business logic in layouts or pages beyond data fetching
- All subdomain apps validate auth by calling `{API_URL}/api/auth/validate` — never decode JWT locally
- `api.blonskyi.dev` is a Coolify alias to this same service — no separate codebase
- Projects are DB-seeded, managed via pgAdmin — no admin UI yet

---

## Coding Conventions

- Use server components by default; add `'use client'` only when needed (interactivity, hooks)
- Server actions for all mutations (locale/theme updates, etc.)
- Drizzle queries live in `src/features/*/lib/` — never in components or pages
- shadcn components go in `src/shared/ui/` — copy-paste from shadcn CLI, do not modify internals
- All user-facing strings must be in `messages/{locale}.json` — no hardcoded UI text
- Prefer `pnpm` over `npm` or `yarn`

---

## Deployment Notes

- CI/CD: push to `main` → GitHub Actions → GHCR → Coolify webhook → zero-downtime restart
- Docker image: `ghcr.io/mykola-blonskyi/my-projects:latest`
- Joins external Docker network `shared` to reach PostgreSQL
- Env vars managed in Coolify dashboard per service
- Migrations run as part of Docker entrypoint (not manually in production)

---

## Workflow

- Before pushing a branch or opening a PR to `main`, check the GitHub issue(s) the branch closes:
  verify each acceptance criteria checkbox against the actual code/tests, check off what's genuinely
  done, and update the issue status (comment/close) if it's stale. Don't rely on the checkboxes as
  written before the change — verify against current code each time.

---

## Known Limitations

- No session revocation today — JWT lives until 24h expiry (mitigated by short TTL)
- No admin UI — project access managed directly in DB via pgAdmin
- `api.blonskyi.dev` is not a separate service yet — hub must stay up for subdomain auth
- Local dev: `.blonskyi.dev` cookie domain doesn't work on `localhost` — use `127.0.0.1` or a local DNS override
