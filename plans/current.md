# Current Plan

## Goal

Build the `blonskyi.dev` hub application: Google login, project directory, and cross-subdomain auth API.

Spec: https://github.com/mykola-blonskyi/my-projects/issues/1

---

## Tickets (in dependency order)

| # | Title | GitHub | Blocked by |
|---|---|---|---|
| 1 | Next.js scaffold + shadcn + i18n + themes | [#2](https://github.com/mykola-blonskyi/my-projects/issues/2) | — |
| 2 | Drizzle ORM + DB schema + seed | [#3](https://github.com/mykola-blonskyi/my-projects/issues/3) | — |
| 3 | Auth.js backend (Google OAuth, JWT, Drizzle adapter) | [#4](https://github.com/mykola-blonskyi/my-projects/issues/4) | 1, 2 |
| 4 | Login page + middleware + post-login redirect | [#5](https://github.com/mykola-blonskyi/my-projects/issues/5) | 3 |
| 5 | Project list page (owner view) | [#6](https://github.com/mykola-blonskyi/my-projects/issues/6) | 4 |
| 6 | Access control filtering + empty state | [#7](https://github.com/mykola-blonskyi/my-projects/issues/7) | 5 |
| 7 | Auth validate API endpoint | [#8](https://github.com/mykola-blonskyi/my-projects/issues/8) | 3 |
| 8 | Integration test suite (Vitest + test PostgreSQL) | [#9](https://github.com/mykola-blonskyi/my-projects/issues/9) | 7 |
| 9 | Preference persistence (locale + theme saved to DB) | [#10](https://github.com/mykola-blonskyi/my-projects/issues/10) | 4 |
| 10 | Dockerfile + docker-compose (joins shared network) | [#11](https://github.com/mykola-blonskyi/my-projects/issues/11) | 6, 8, 9 |
| 11 | GitHub Actions + Coolify webhook | [#12](https://github.com/mykola-blonskyi/my-projects/issues/12) | 10 |
| 12 | Subdomain boilerplate template | [#13](https://github.com/mykola-blonskyi/my-projects/issues/13) | 7 |

---

## Dependency Graph

```
1 ──┐
    ├── 3 ── 4 ── 5 ── 6 ──┐
2 ──┘    │                  ├── 10 ── 11
         │    4 ── 9 ───────┤
         └── 7 ── 8 ────────┘
               └── 12
```

Tickets 1 and 2 can start immediately in parallel.

---

## Risks

- Migrating existing `sqlpanel.blonskyi.dev` into Coolify may cause brief downtime
- Google OAuth callback URL must be registered in Google Cloud Console before first production deploy
- `AUTH_SECRET` must stay in sync across all services — rotation requires updating all at once
- `.blonskyi.dev` cookie domain does not work on `localhost` — local dev requires a hosts file override
