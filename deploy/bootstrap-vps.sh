#!/usr/bin/env bash
# Instalación completa en VPS Ubuntu (NO en modo rescue).
# Uso en el servidor: curl -fsSL ... | bash   o   sudo bash bootstrap-vps.sh
set -euo pipefail

REPO_URL="${REPO_URL:-https://github.com/sromani/CalculoArancelAsuntos.git}"
APP_DIR="${APP_DIR:-$HOME/CalculoArancelAsuntos}"

if [[ "${EUID:-}" -ne 0 ]]; then
  echo "Ejecutá con sudo o como root."
  exit 1
fi

if grep -qi rescue /etc/os-release 2>/dev/null || [[ -f /.rescue ]]; then
  echo "ERROR: El VPS parece estar en modo RESCUE."
  echo "Salí del rescue en el panel del proveedor, reinstalá Ubuntu 22.04/24.04"
  echo "y volvé a ejecutar este script con la clave root del sistema instalado."
  exit 1
fi

echo "==> Paquetes base"
apt-get update
apt-get install -y ca-certificates curl git ufw

echo "==> Docker"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi
systemctl enable docker
systemctl start docker

if id ubuntu &>/dev/null; then
  usermod -aG docker ubuntu || true
fi

echo "==> Firewall"
ufw allow OpenSSH || true
ufw allow 80/tcp || true
ufw allow 443/tcp || true
echo "y" | ufw enable || true

echo "==> Clonar / actualizar proyecto"
if [[ ! -d "$APP_DIR/.git" ]]; then
  git clone "$REPO_URL" "$APP_DIR"
else
  git -C "$APP_DIR" pull --ff-only || true
fi

cd "$APP_DIR/deploy"
if [[ ! -f .env ]]; then
  cp .env.example .env
  echo ""
  echo "IMPORTANTE: Editá deploy/.env antes de levantar:"
  echo "  nano $APP_DIR/deploy/.env"
  echo "  - POSTGRES_PASSWORD, JWT_SECRET, AUTH_SECRET"
  echo "  - FRONTEND_ORIGIN=https://tudominio.com"
  echo "  - DOMAINS=tudominio.com,www.tudominio.com"
  echo "  - ACME_EMAIL=admin@tudominio.com"
  exit 0
fi

chmod +x generate-caddyfile.sh setup-db.sh update.sh 2>/dev/null || true
export DOCKER_BUILDKIT=1
docker compose build
docker compose up -d
docker compose ps

echo ""
echo "Listo. Sitio en http://$(curl -fsS ifconfig.me 2>/dev/null || echo TU_IP)/"
echo "Logs: cd $APP_DIR/deploy && docker compose logs -f"
