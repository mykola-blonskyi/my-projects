# TODO

## Backlog

- [ ] Admin UI for managing project access (add/remove user emails per project)
- [ ] `api.blonskyi.dev` as a dedicated separate service (extract from hub when API grows)
- [ ] Notification system shared across subdomains
- [ ] User profile page (edit name, avatar)
- [ ] Project icons/logos on project cards
- [ ] Analytics dashboard (page views per project)

---

## Planned

---

## In Progress

Hub application — all 12 implementation tickets closed:
https://github.com/mykola-blonskyi/my-projects/issues/1

Deployed to Coolify, auto-deploy pipeline working end-to-end, Google OAuth login fixed. Blocked on
a Cloudflare "Error 1000: DNS points to prohibited IP" for `blonskyi.dev` on every page load — was
not DNS/edge propagation as first suspected. Root cause and fix: see ADR-011 in `docs/decisions.md`.
Fix is on branch `fix/error-1000-middleware-auth-url`, verified locally, pending PR review/merge
and a live deploy check. Once merged, deployed, and login verified live, issue #1 (spec epic) can
close.

---

## Review

- [ ]

---

## Done

- [x] Architecture planning and decision making (2026-07-13)
- [x] Tech stack selection: Next.js 15 + shadcn + Auth.js + Drizzle + Coolify
- [x] Database schema design
- [x] File structure design (feature-based)
- [x] Spec written (2026-07-13) — [issue #1](https://github.com/mykola-blonskyi/my-projects/issues/1)
- [x] 12 implementation tickets created (2026-07-13)
- [x] Migrate `sqlpanel.blonskyi.dev` existing Docker setup into Coolify — replaced with
      `db.blonskyi.dev` (Postgres + CloudBeaver) (2026-07-17)
