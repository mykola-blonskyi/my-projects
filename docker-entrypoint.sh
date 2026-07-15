#!/bin/sh
set -e

echo "Running Drizzle migrations..."
node drizzle/migrate.mjs

echo "Starting Next.js server..."
exec "$@"
