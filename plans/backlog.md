# Future Work

## High Priority

- [ ] Migrate `sqlpanel.blonskyi.dev` existing Docker setup into Coolify
- [ ] Build first subdomain app using the boilerplate template (`todo.blonskyi.dev`)
- [ ] Admin UI — simple page (owner-only) to manage project access without touching DB directly

---

## Medium Priority

- [ ] Extract `api.blonskyi.dev` as a separate service when API surface grows
- [ ] Add more subdomain projects (fitness.blonskyi.dev, etc.)
- [ ] User profile page — edit display name, avatar override
- [ ] Project cards with custom icons/logos (not just emoji)
- [ ] `notify.blonskyi.dev` or shared notification system across all subdomains

---

## Low Priority

- [ ] Analytics — simple page view tracking per project (privacy-preserving, self-hosted)
- [ ] Dark mode system preference detection on first visit (before user preference is set)
- [ ] PWA support for hub (installable on mobile)
- [ ] More themes beyond light/dark/rose
- [ ] Rate limiting on `/api/auth/validate` to prevent abuse
