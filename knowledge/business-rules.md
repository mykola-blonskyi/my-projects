# Business Rules

## Rule 1: Owner Access

A user with `role = 'owner'` has unrestricted access to all projects.
Owner identity is determined by matching `email` against the `OWNER_EMAIL` environment variable
at login time (role is set/confirmed on every login, not just first login).

No `project_access` rows are needed for the owner.

---

## Rule 2: Guest Access (Whitelist)

Any user with `role = 'user'` can only access projects for which a `project_access` row exists
with their `user_id` and the target `project_id`.

Access is managed by the owner via `/[locale]/settings/access` (only reachable by the owner —
see Rule 7). Only users with `status = 'approved'` appear there; a user must be approved
site-wide before the owner can grant them access to specific projects.

---

## Rule 3: Unauthenticated Access Denied

All routes on `blonskyi.dev` and all subdomain apps are protected by default.
An unauthenticated request (no valid JWT cookie on `.blonskyi.dev`) is redirected to
`blonskyi.dev/[locale]/login`.

The only public route is `/[locale]/login` itself.

---

## Rule 4: Cross-Subdomain Auth Validation

Subdomain apps do not validate the JWT locally. They call `{API_URL}/api/auth/validate`
with the JWT from the `.blonskyi.dev` cookie. The hub is the single source of truth for
session validity and project access.

A `{ allowed: false }` response redirects the user to `blonskyi.dev/login`.

---

## Rule 5: User Preference Persistence

When a user changes their locale or theme, the preference is saved to the `users` table immediately
via a server action. On next login (any device), the hub reads the saved preferences and
redirects to the correct locale URL with the correct theme applied.

---

## Rule 6: Google OAuth Only

Authentication is exclusively via Google OAuth. There are no passwords, magic links,
email codes, or other auth methods. Only Google accounts are accepted.

---

## Rule 7: Site-Wide Approval Gate

Every non-owner user has a `status`: `'pending'` (default on first sign-in), `'approved'`, or
`'blocked'`. Google sign-in itself always succeeds regardless of `status` (rejecting sign-in for
a brand-new user would prevent their `users` row from ever being created, since Auth.js's
`signIn` callback runs before the adapter creates the row — see ADR-018). Instead, every request
is gated afterward: a user whose current `status` is not `'approved'` is redirected to the
Awaiting Approval page for any route.

`status` is checked against the database on every request, not cached in the JWT — a user the
owner blocks is locked out on their very next request, not just their next login (see ADR-018
for why this diverges from the JWT-only middleware check used for authentication itself).

The owner (`role = 'owner'`) is never subject to this check.

Only the owner can view or change any user's `status`, via `/[locale]/settings/users`.
