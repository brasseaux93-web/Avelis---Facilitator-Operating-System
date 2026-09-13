#!/bin/sh
# Apply Drizzle SQL migrations then start the API.
set -eu

echo "[entrypoint] waiting for database..."
i=0
until npx --yes tsx scripts/wait-for-db.mjs 2>/dev/null; do
  i=$((i + 1))
  if [ "$i" -gt 60 ]; then
    echo "[entrypoint] database not ready"
    exit 1
  fi
  sleep 1
done

echo "[entrypoint] applying migrations..."
if command -v npx >/dev/null 2>&1 && [ -f drizzle.config.ts ]; then
  if npx drizzle-kit migrate 2>/dev/null; then
    echo "[entrypoint] drizzle-kit migrate ok"
  else
    echo "[entrypoint] drizzle-kit migrate unavailable; applying SQL files directly"
    for f in drizzle/*.sql; do
      [ -f "$f" ] || continue
      echo "[entrypoint] apply $f"
      npx --yes tsx scripts/apply-sql.mjs "$f"
    done
  fi
fi

echo "[entrypoint] starting API"
exec npx tsx src/server/index.ts
