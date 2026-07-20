# Despliegue en VPS Ubuntu (pruebas / staging)

Todo corre en **un solo servidor** con Docker:

| Contenedor | Rol |
|------------|-----|
| `postgres` | Base de datos (API + estudio) |
| `api` | Nest (auth, simulador) |
| `web` | Next.js (sitio + `/estudio`) |
| `caddy` | Entrada HTTP/HTTPS (puertos 80 y 443) |

No hace falta Render ni varios servidores.

## Requisitos

- Ubuntu 22.04 o 24.04
- 2 GB RAM mínimo recomendado
- Puertos **80** y **443** abiertos en el firewall del proveedor
- Repo en GitHub/GitLab (o copiá el proyecto al VPS)

## 1. Preparar el VPS

Conectate por SSH y ejecutá:

```bash
sudo bash setup-vps.sh
```

## 2. Clonar el proyecto

```bash
cd ~
git clone https://github.com/TU_USUARIO/CalculoArancelAsuntos.git
cd CalculoArancelAsuntos/deploy
```

## 3. Variables de entorno

```bash
cp .env.example .env
nano .env
```

| Variable | Ejemplo |
|----------|---------|
| `POSTGRES_PASSWORD` | Contraseña simple (sin `@` ni `%` para evitar problemas en la URL) |
| `JWT_SECRET` | Mínimo 32 caracteres aleatorios |
| `AUTH_SECRET` | Mínimo 32 caracteres (distinto o igual, pero fuerte) |
| `FRONTEND_ORIGIN` | `http://203.0.113.10` o `https://app.tudominio.com` |

`JWT_SECRET` debe ser **la misma** en `api` y `web` (el compose ya la comparte).

## 4. Levantar

```bash
docker compose up -d --build
```

La primera vez tarda varios minutos (build de Next + Nest).

## 5. Probar

- Sitio: `http://IP_DEL_VPS` (Caddy en puerto 80)
- Estudio: `http://IP_DEL_VPS/estudio`

Ver logs:

```bash
docker compose logs -f
docker compose logs -f web api
```

## HTTPS con uno o varios dominios

1. Apuntá el registro **A** de cada dominio a la IP del VPS.
2. En `.env`:

```env
DOMAINS=app.tudominio.com,www.app.tudominio.com,otro.tudominio.com
ACME_EMAIL=admin@tudominio.com
FRONTEND_ORIGIN=https://app.tudominio.com
```

3. `docker compose up -d` (Caddy pide certificados Let's Encrypt automáticamente).

Puertos **80** y **443** deben estar abiertos en el firewall del proveedor y en UFW.

## Modo rescue del proveedor

Si el VPS está en **rescue**, SSH suele usar otra clave o el disco no tiene Ubuntu instalado.

1. Entrá al panel del proveedor (Contabo, OVH, etc.).
2. **Salí del modo rescue** y **reinstalá Ubuntu 22.04 o 24.04** en el disco principal.
3. Definí la contraseña **root** (o usuario `ubuntu` + clave SSH).
4. Conectate: `ssh root@IP`
5. Ejecutá: `sudo bash bootstrap-vps.sh` (desde el repo clonado) o seguí los pasos de abajo.

## Instalación automática (VPS ya con Ubuntu)

```bash
ssh root@TU_IP
apt-get update && apt-get install -y git
git clone https://github.com/sromani/CalculoArancelAsuntos.git
cd CalculoArancelAsuntos/deploy
cp .env.example .env
nano .env
sudo bash ../deploy/bootstrap-vps.sh
```

O solo Docker + firewall:

```bash
sudo bash setup-vps.sh
```


## Actualizar después de un `git pull`

**Rebuild rápido** (usa cache; la 2.ª vez tarda mucho menos):

```bash
cd deploy
chmod +x update.sh
./update.sh          # api + web
./update.sh web      # solo front
./update.sh api      # solo API
```

Equivalente manual:

```bash
export DOCKER_BUILDKIT=1
docker compose build
docker compose up -d
```

**No uses `--no-cache`** salvo que el build falle o cambies dependencias de npm.

La **primera** build en un VPS chico puede tardar **15–25 min**. Las siguientes, si solo cambiás código: **2–8 min** (web) o **1–3 min** (api).

## Actualizar (comando largo, primera vez o cambio grande)

```bash
cd ~/CalculoArancelAsuntos
git pull
cd deploy
docker compose up -d --build
```

## Firewall (UFW)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

## Desarrollo local con Docker (opcional)

El compose de `escribanos/docker/` es viejo y solo API+Postgres. Para pruebas usá este `deploy/`.
