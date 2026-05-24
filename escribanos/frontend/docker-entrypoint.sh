#!/bin/sh
set -e
if [ -n "${DATABASE_URL:-}" ]; then
  npx prisma migrate deploy --schema ./prisma/schema.prisma
fi
exec "$@"
