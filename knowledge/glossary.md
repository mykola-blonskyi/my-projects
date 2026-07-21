# Glossary

## Terms

### Hub

The main application at `blonskyi.dev`. Handles login, displays the project directory,
and provides the auth API used by all subdomain apps.

### Subdomain App

Any pet project hosted at a `*.blonskyi.dev` subdomain (e.g., `todo.blonskyi.dev`).
Each lives in its own repository and connects to the hub for authentication.

### Owner

The user whose `email` matches the `OWNER_EMAIL` environment variable.
Has `role = 'owner'` and unrestricted access to all projects. Always Mykola.

### Project Access

An explicit database grant allowing a non-owner user to view and use a specific subdomain project.
Stored in the `project_access` table as a `(user_id, project_id)` pair.

### User Status

A site-wide gate on a user's `users.status` field, separate from Project Access. One of
`'pending'` (default for new non-owner sign-ins, never yet reviewed), `'approved'` (may use the
site; still needs Project Access grants to see any specific project), or `'blocked'`
(explicitly revoked, whether or not they were previously approved). Not consulted for the owner.

### Awaiting Approval Page

The page a `'pending'` or `'blocked'` user is redirected to for every route. Static, no
interactivity — analogous to how `/login` is the one public route for unauthenticated users.

### JWT (JSON Web Token)

The signed token issued by Auth.js after Google login. Stored in an HTTP-only cookie on
`.blonskyi.dev`. Contains `userId`, `email`, `role`, `locale`, `theme`. Expires in 24 hours.

### Shared Cookie

The `.blonskyi.dev`-domain cookie that carries the JWT. Because of the leading dot,
all subdomains (`todo.blonskyi.dev`, `sqlpanel.blonskyi.dev`, etc.) can read it,
enabling single sign-on without re-authentication.

### Coolify

Self-hosted PaaS running on the VPS. Manages Docker containers, reverse proxy (Caddy),
automatic SSL certificates, and deployment webhooks from GitHub Actions.

### Shared Network

The Docker network named `shared` that all VPS services join. Allows the hub and
subdomain apps to reach the PostgreSQL instance without exposing it to the internet.

### API_URL

Environment variable set per service pointing to the hub's base URL (`https://blonskyi.dev`).
Used by subdomain apps to call `/api/auth/validate` without hardcoding the host.

### Rose Theme

The third color theme (alongside light and dark) — a soft pink/rose palette
defined via CSS variable overrides under the `theme-rose` class.

### Locale

The user's preferred display language. One of: `en` (English), `ru` (Russian),
`uk` (Ukrainian), `es` (Spanish). Reflected in the URL prefix (`/en/`, `/ru/`, etc.)
and stored in the `users` table for cross-device consistency.
