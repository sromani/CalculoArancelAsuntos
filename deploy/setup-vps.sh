#!/usr/bin/env bash
# Ejecutar en el VPS Ubuntu (como root o con sudo): bash setup-vps.sh
set -euo pipefail

if [[ "${EUID:-}" -ne 0 ]]; then
  echo "Ejecutá con sudo: sudo bash setup-vps.sh"
  exit 1
fi

apt-get update
apt-get install -y ca-certificates curl git

if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi

systemctl enable docker
systemctl start docker

# Usuario ubuntu (SSH típico en VPS) puede usar docker sin sudo
if id ubuntu &>/dev/null; then
  usermod -aG docker ubuntu
  echo "Usuario 'ubuntu' agregado al grupo docker (cerrá sesión SSH y volvé a entrar)."
fi

echo ""
echo "Docker listo. Siguiente:"
echo "  1) Cerrá sesión SSH y volvé a entrar (para grupo docker)"
echo "  2) git clone https://github.com/sromani/CalculoArancelAsuntos.git"
echo "  3) cd CalculoArancelAsuntos/deploy && cp .env.example .env && nano .env"
echo "  4) docker compose up -d --build"
echo ""
