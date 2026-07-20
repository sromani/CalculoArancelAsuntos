# Arquitectura — Monorepo desacoplado

## Estructura

```
/apps
  /backend              → API unificada (NestJS, puerto 4000)
  /frontend-actual      → Wrapper → escribanos/frontend (puerto 3000)
  /frontend-nuevo       → UI nueva (Next.js, puerto 3001)
/shared
  /types                → Enums, DTOs, contratos API
  /schemas              → Validación Zod compartida
  /utils                → Utilidades sin lógica de negocio duplicada
  /api-client           → Cliente HTTP tipado (auth, errores, interceptors)
/escribanos
  /frontend             → Código legacy del frontend actual (migración gradual)
  /backend              → API Nest legacy (deprecado → usar apps/backend)
```

## Puertos de desarrollo

| Servicio           | URL                      |
|--------------------|--------------------------|
| Frontend actual    | http://localhost:3000    |
| Frontend nuevo     | http://localhost:3001    |
| Backend API        | http://localhost:4000    |

```bash
# Los tres servicios a la vez
npm run dev:escribanos

# Por separado
npm run dev:frontend-actual
npm run dev:frontend-nuevo
npm run dev:backend
```

## Backend como fuente de verdad

`apps/backend` concentra:

- **Auth sitio** — JWT (`/api/v1/auth/*`) — usuarios tabla `users`
- **Auth estudio** — JWT sesión estudio (`AUTH_SECRET`) — Bearer en rutas `/api/v1/estudio/*`
- **Gastos** — primer módulo migrado desde Next API routes
- **Health** — `/api/v1/health`

Pendiente de migrar al backend (sigue en `escribanos/frontend`):

- Cálculos de arancel / montepíos (`lib/arancel/`)
- Presupuestos, notificaciones, asuntos, clientes
- Generación PDF, workflows, exportaciones

## Comunicación frontend ↔ backend

- **Sin imports directos** de lógica de negocio entre apps.
- Frontends usan `@shared/api-client` o proxy BFF temporal.
- Frontend actual mantiene `/nest-api/*` como proxy a `BACKEND_API_URL` (default `http://127.0.0.1:4000/api/v1`).

Variables:

| Variable | Uso |
|----------|-----|
| `BACKEND_API_URL` | Proxy Next → backend (server-side) |
| `NEXT_PUBLIC_API_URL` | Cliente directo (frontend nuevo) |
| `DATABASE_URL` | BD usuarios sitio |
| `ESTUDIO_DATABASE_URL` | BD estudio (Prisma) |
| `JWT_SECRET` | Tokens sitio |
| `AUTH_SECRET` | Tokens sesión estudio |

## Migración gradual

1. **Fase actual** — Backend unificado + shared packages + frontend nuevo scaffold.
2. **Siguiente** — Mover módulo presupuestos y arancel al backend.
3. **Luego** — Sustituir Next API routes por llamadas al api-client en frontend actual.
4. **Final** — Mover `escribanos/frontend` → `apps/frontend-actual` y retirar `escribanos/backend`.

## Prisma estudio

El schema de estudio se sincroniza desde `escribanos/frontend/prisma/schema.prisma`:

```bash
npm run prisma:generate -w backend-api
```

Genera clientes en `apps/backend/generated/prisma-auth` y `prisma-estudio`.
