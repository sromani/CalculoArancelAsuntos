#!/usr/bin/env bash
# Rebuild rápido (usa cache de Docker). NO uses --no-cache salvo que falle el build.
set -euo pipefail
cd "$(dirname "$0")"

export DOCKER_BUILDKIT=1
export COMPOSE_DOCKER_CLI_BUILD=1

SERVICE="${1:-}"

if [[ -n "$SERVICE" ]]; then
  echo "==> Build solo: $SERVICE"
  docker compose build "$SERVICE"
  docker compose up -d "$SERVICE"
else
  echo "==> Build incremental (api + web)"
  docker compose build
  docker compose up -d
fi

docker compose ps
