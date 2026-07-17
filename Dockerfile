# syntax=docker/dockerfile:1

# ---- Base -------------------------------------------------------------------
FROM node:22-alpine AS base

# libc6-compat is required by some native Node addons on Alpine (e.g. sharp);
# python3/make/g++ are a safety net in case any dependency needs to build from
# source rather than use a prebuilt binary.
RUN apk add --no-cache libc6-compat python3 make g++

# Pin the exact pnpm major used to generate pnpm-lock.yaml (lockfileVersion 9.0)
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# ---- Dependencies (cached separately from source changes) -------------------
FROM base AS deps
COPY package.json pnpm-lock.yaml .npmrc pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# ---- Build --------------------------------------------------------------------
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# drizzle-orm/postgres-js/migrator is never imported anywhere in the app
# itself (only in our own migrate script below), so Next's standalone output
# tracing drops that submodule. Materialize the two pure-JS, zero-dependency
# packages the migration entrypoint needs, dereferencing pnpm's symlinks so
# they survive being copied into the slim runtime stage on their own.
RUN mkdir -p /app/runtime-only/node_modules/postgres /app/runtime-only/node_modules/drizzle-orm \
  && cp -rL /app/node_modules/postgres/. /app/runtime-only/node_modules/postgres/ \
  && cp -rL /app/node_modules/drizzle-orm/. /app/runtime-only/node_modules/drizzle-orm/

# ---- Runtime (lean, production-only) -----------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Next.js standalone server + its minimal traced node_modules
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
# No public/ directory exists yet. If one is added later, uncomment:
# COPY --from=builder /app/public ./public

# Drizzle migration assets: SQL files + our small runtime migration script
COPY --from=builder /app/drizzle/migrations ./drizzle/migrations
COPY --from=builder /app/drizzle/migrate.mjs ./drizzle/migrate.mjs

# Explicit prod-only packages needed by drizzle/migrate.mjs (see builder stage)
COPY --from=builder /app/runtime-only/node_modules/postgres ./node_modules/postgres
COPY --from=builder /app/runtime-only/node_modules/drizzle-orm ./node_modules/drizzle-orm

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/api/health || exit 1

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server.js"]
