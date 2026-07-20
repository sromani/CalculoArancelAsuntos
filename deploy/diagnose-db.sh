#!/usr/bin/env bash
# Diagnóstico rápido de la base del estudio en el VPS.
set -euo pipefail
cd "$(dirname "$0")"

echo "=== Contenedores ==="
docker compose ps

echo ""
echo "=== DATABASE_URL (web) ==="
docker compose exec -T web printenv DATABASE_URL | sed 's/:\/\/[^:]*:[^@]*@/:\/\/USER:***@/'

echo ""
echo "=== Health estudio ==="
curl -s http://localhost/api/health || true
echo ""

echo ""
echo "=== Bases en Postgres ==="
set -a
# shellcheck disable=SC1091
source .env
set +a
docker compose exec -T postgres psql -U "$POSTGRES_USER" -d postgres -c "\l" | grep -E "escribanos|Name" || true

echo ""
echo "=== Migraciones aplicadas ==="
docker compose exec -T postgres psql -U "$POSTGRES_USER" -d sistema_escribanos_estudio -c \
  "SELECT migration_name FROM _prisma_migrations ORDER BY finished_at;" 2>&1 || echo "(sin tabla _prisma_migrations — ejecutá ./setup-db.sh)"

echo ""
echo "=== Columnas Cliente (muestra) ==="
docker compose exec -T postgres psql -U "$POSTGRES_USER" -d sistema_escribanos_estudio -c \
  "SELECT column_name FROM information_schema.columns WHERE table_name='Cliente' ORDER BY 1;" 2>&1 | head -20

echo ""
echo "=== Últimos logs web (sync/health) ==="
docker compose logs web --tail 20 2>&1 | grep -iE "sync-estudio|prisma|error|health" || docker compose logs web --tail 10
