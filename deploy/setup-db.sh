#!/usr/bin/env bash
# Una sola vez (o tras git pull con migraciones nuevas): crea DB estudio + esquemas.
set -euo pipefail
cd "$(dirname "$0")"

if [[ ! -f .env ]]; then
  echo "Falta deploy/.env — cp .env.example .env && nano .env"
  exit 1
fi

set -a
# shellcheck disable=SC1091
source .env
set +a

USER="${POSTGRES_USER:?POSTGRES_USER en .env}"
PASS="${POSTGRES_PASSWORD:?POSTGRES_PASSWORD en .env}"
MAIN_DB="${POSTGRES_DB:?POSTGRES_DB en .env}"

echo "==> Crear base sistema_escribanos_estudio si no existe"
docker compose exec -T postgres psql -U "$USER" -d postgres <<SQL
SELECT 'CREATE DATABASE sistema_escribanos_estudio'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'sistema_escribanos_estudio')\gexec
SQL

echo "==> Esquema API (Nest)"
docker compose run --rm --no-deps --entrypoint "" api npx prisma db push --schema ./prisma/schema.prisma

echo "==> Esquema estudio (Next)"
docker compose --profile tools run --rm --no-deps migrate-web

echo "==> Estado migraciones estudio"
docker compose --profile tools run --rm --no-deps --entrypoint "" migrate-web \
  npx prisma migrate status --schema ./prisma/schema.prisma

echo "==> Tablas clave (Cliente, Asunto, Usuario)"
docker compose exec -T postgres psql -U "$USER" -d sistema_escribanos_estudio -c \
  "SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename IN ('Cliente','Asunto','Usuario','Profesional','Socio') ORDER BY 1;"

echo "==> Listo. Reiniciando api y web..."
docker compose up -d api web
docker compose ps
