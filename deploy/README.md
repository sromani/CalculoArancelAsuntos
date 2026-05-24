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

## HTTPS con dominio

1. Apuntá el DNS `A` de tu dominio a la IP del VPS.
2. En `.env`: `DOMAIN=app.tudominio.com` y `ACME_EMAIL=tu@email.com`
3. En `Caddyfile`: comentá el bloque `:80` y descomentá el bloque `{$DOMAIN}`.
4. `FRONTEND_ORIGIN=https://app.tudominio.com`
5. `docker compose up -d`

## Actualizar después de un `git pull`

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
