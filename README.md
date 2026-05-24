# Sistema unificado

Aplicación principal: **`escribanos/frontend`** (un solo Next.js).

- **Sitio público** (diseño escribanos): inicio, simulador, planes, login/registro vía API Nest.
- **Gestión estudio** (ex sistema contabilidad / legal-notarial): rutas bajo **`/estudio`** (clientes, asuntos, maestros, admin). Tras iniciar sesión con el mismo login de escribanos, se crea una sesión técnica (cookie) para las APIs internas.

La carpeta **`contabilidad/`** quedó como referencia del proyecto original; la lógica activa está integrada en el frontend de escribanos.

| Componente | Puerto dev típico | Rol |
|------------|-------------------|-----|
| `escribanos/frontend` | **3002** | Next.js único (público + `/estudio` + APIs `/api/*`) |
| `escribanos/backend` | **3001** | Nest: auth, usuarios simulador (`users`, `calculos`) |

## Variables de entorno

1. **`escribanos/backend/.env`**: `DATABASE_URL` (Postgres usuarios/cálculos), `JWT_SECRET`.
2. **`escribanos/frontend/.env.local`**: copiá de `escribanos/frontend/.env.example`.
   - `DATABASE_URL`: Postgres del **módulo estudio** (tablas Prisma: `Usuario`, `Cliente`, `Asunto`, …).
   - **`JWT_SECRET`**: debe ser **idéntica** a la del backend Nest (valida el token al sincronizar sesión estudio).

## Instalación

En la raíz del monorepo:

```bash
npm install
```

## Desarrollo

Levantar API + front (sin la app legacy `contabilidad/`):

```bash
npm run dev:escribanos
```

O todo el monorepo (incluye `contabilidad` en 3000):

```bash
npm run dev
```

Abrir **http://localhost:3002**. Tras login, usá **Gestión estudio** en la barra o **http://localhost:3002/estudio**.

## Despliegue en VPS (Ubuntu)

Para pruebas o staging en un solo servidor: ver **[deploy/README.md](deploy/README.md)** (Docker Compose: Postgres + API + Next + Caddy).

## Flujo de auth

1. Login en `/login` → Nest devuelve JWT (guardado en `localStorage`).
2. El front llama a `POST /api/auth/sync-estudio` con `Authorization: Bearer <jwt>`.
3. Next valida el JWT, crea o enlaza un `Usuario` en la DB estudio y setea la cookie `estudio_session`.
4. Las rutas `/estudio/*` y las APIs `/api/*` usan esa cookie (igual que antes en el proyecto contabilidad).
