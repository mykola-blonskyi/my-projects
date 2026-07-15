# Subdomain Application Boilerplate

Pattern for bootstrapping a new subdomain project (`*.blonskyi.dev`) with cross-subdomain authentication via the hub.

---

## How it works

Every subdomain app delegates authentication to the hub (`blonskyi.dev`).

1. The hub sets a JWT session cookie scoped to `.blonskyi.dev` after Google login.
2. The subdomain middleware reads that cookie and calls the hub's validate endpoint.
3. If the user is not authenticated or lacks access to this project, they are redirected to the hub login page.
4. On success, the validate response includes `userId`, `email`, and `role` — use these to identify the user in the subdomain.

---

## Required environment variables

```bash
# .env.example

# Hub base URL (no trailing slash)
API_URL=https://blonskyi.dev

# Must match the hub's AUTH_SECRET exactly — JWT verification fails otherwise
AUTH_SECRET=

# Shared cookie domain — must be .blonskyi.dev (dot-prefixed) for cross-subdomain sharing
COOKIE_DOMAIN=.blonskyi.dev

# The project slug registered in the hub database
PROJECT_SLUG=my-project
```

> **AUTH_SECRET constraint:** The subdomain uses the same secret to verify the JWT that the hub issued. If these values differ, all session reads will fail silently and every request will be treated as unauthenticated. Rotate both at the same time.

> **Local dev limitation:** The `.blonskyi.dev` cookie domain does not resolve on `localhost`. To test cross-subdomain auth locally, add entries to `/etc/hosts` (e.g. `127.0.0.1 hub.blonskyi.dev`) and use a local TLS proxy. Alternatively, mock the validate call in a local-only middleware branch.

---

## Middleware pattern

Place this file at `src/middleware.ts`. It intercepts every page request, reads the shared cookie, calls the hub to validate access, and redirects unauthenticated or unauthorized users.

```typescript
// src/middleware.ts
import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

const API_URL = process.env.API_URL!
const AUTH_SECRET = process.env.AUTH_SECRET!
const PROJECT_SLUG = process.env.PROJECT_SLUG!

export async function middleware(req: NextRequest) {
  // Read the JWT from the shared .blonskyi.dev cookie
  const token = await getToken({
    req,
    secret: AUTH_SECRET,
    cookieName: '__Secure-authjs.session-token', // Auth.js v5 default (HTTPS)
    // cookieName: 'authjs.session-token',        // use this on HTTP / local dev
  })

  const loginUrl = `${API_URL}/en/login`

  // No session → send to hub login
  if (!token) {
    return NextResponse.redirect(loginUrl)
  }

  // Call the hub validate endpoint
  const validateUrl = `${API_URL}/api/auth/validate?project=${PROJECT_SLUG}`
  let allowed = false

  try {
    const res = await fetch(validateUrl, {
      headers: {
        // Forward the session cookie so the hub can read the session
        cookie: req.headers.get('cookie') ?? '',
      },
      cache: 'no-store',
    })

    if (res.ok) {
      const body = await res.json()
      allowed = body.allowed === true
    }
  } catch {
    // Hub unreachable — deny access
    allowed = false
  }

  if (!allowed) {
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Run on all paths except API routes, Next.js internals, and static files
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
}
```

### Redirect target on auth failure

```
{API_URL}/[locale]/login
```

The locale segment defaults to `en`. The hub login page redirects back to the subdomain after a successful login via the `callbackUrl` query param — you can append it if needed:

```
{API_URL}/en/login?callbackUrl=https://my-project.blonskyi.dev
```

---

## Validate endpoint reference

**`GET {API_URL}/api/auth/validate?project={slug}`**

Requires a valid `.blonskyi.dev` session cookie in the request.

| Status | Body | Meaning |
|--------|------|---------|
| 200 | `{ allowed: true, userId, email, role }` | Authenticated and authorized |
| 200 | `{ allowed: false }` | Authenticated but not authorized for this project |
| 400 | `{ error: "Missing project param" }` | `project` query param omitted |
| 401 | `{ allowed: false }` | No valid session |

Access rules:
- `role === "owner"` → allowed for all projects unconditionally
- All other users → must have an explicit grant in `project_access` for the project slug

---

## Checklist for a new subdomain project

- [ ] Register the project slug in the hub database (`projects` table)
- [ ] Grant access to users in the hub database (`project_access` table), or mark user as `owner`
- [ ] Copy `.env.example` and fill in `API_URL`, `AUTH_SECRET`, `COOKIE_DOMAIN`, `PROJECT_SLUG`
- [ ] Add `src/middleware.ts` from the pattern above
- [ ] Verify `AUTH_SECRET` matches the hub's secret exactly
- [ ] Register the subdomain in Coolify and attach it to the `db_network` Docker network
- [ ] Add the subdomain to the `COOKIE_DOMAIN` allowlist in the hub's Auth.js config if needed
