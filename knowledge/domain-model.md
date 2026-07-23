# Domain Model

## Entities

### User

**Responsibilities:**
- Represents an authenticated person (authenticated via Google OAuth)
- Holds identity, preferences (locale, theme), and role

**Fields:**
- `id` — UUID, primary key
- `email` — unique, from Google profile
- `name` — from Google profile
- `image` — avatar URL from Google profile
- `role` — `'owner'` | `'user'` (owner bypasses all access checks)
- `status` — `'pending'` | `'approved'` | `'blocked'` (site-wide access gate, distinct from
  per-project `ProjectAccess`; see Business Rule 7). Owner rows are always effectively approved —
  `status` is not consulted for `role = 'owner'`. New non-owner users default to `'pending'`
- `locale` — `'en'` | `'ru'` | `'uk'` | `'es'` (user's preferred language)
- `theme` — `'light'` | `'dark'` | `'theme-rose'` (user's preferred color scheme; the value is
  `'theme-rose'`, not `'rose'` — it doubles as the CSS class name applied to `<html>`)
- `created_at` — timestamp

**Relationships:**
- Has many `ProjectAccess` entries (projects they can access)
- Has many `Session` entries (Auth.js refresh tokens)

---

### Project

**Responsibilities:**
- Represents a pet project hosted on a subdomain
- Displayed on the hub's project list page

**Fields:**
- `id` — UUID, primary key
- `slug` — unique short identifier, matches subdomain (e.g., `'todo'`, `'sqlpanel'`)
- `name` — display name (e.g., `'SQL Panel'`)
- `url` — full subdomain URL (e.g., `'https://sqlpanel.blonskyi.dev'`)
- `description` — short description shown on project card
- `icon` — emoji or icon identifier
- `order` — display order on the project list page
- `created_at` — timestamp

**Relationships:**
- Has many `ProjectAccess` entries (users granted access)

---

### ProjectAccess

**Responsibilities:**
- Join table granting a specific user access to a specific project
- Not needed for owner-role users (they have access to all projects)

**Fields:**
- `user_id` — FK → User
- `project_id` — FK → Project
- `granted_at` — timestamp

**Relationships:**
- Belongs to `User`
- Belongs to `Project`

---

### Session

**Responsibilities:**
- Managed by Auth.js Drizzle adapter
- Stores refresh tokens for JWT renewal
- Enables future session revocation

**Fields:**
- Managed by Auth.js (see Auth.js Drizzle adapter schema)

**Relationships:**
- Belongs to `User`
