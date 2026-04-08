# Especificación funcional completa — Sistema Escribanos (monorepo)

Documento para **reconstruir o migrar** el sistema sin perder comportamiento. Las rutas y nombres de archivo refieren al repo `CalculoArancelAsuntos` (workspace `escribanos/frontend` y `escribanos/backend`). El workspace `contabilidad` existe en el monorepo pero **no forma parte del módulo Gestión estudio / simulador** descrito aquí salvo mención explícita.

---

## 1. Arquitectura general

- **Frontend**: Next.js (App Router), puerto **3002** (`escribanos/frontend`).
- **API cuentas**: NestJS, puerto **3001** (`escribanos/backend`).
- **Rewrite Next**: peticiones del navegador a `/nest-api/*` se reenvían a `NEST_INTERNAL_URL` (default `http://127.0.0.1:3001`) — `next.config.ts`.
- **Dos bases PostgreSQL y dos esquemas Prisma** (no mezclar):
  1. **BD del API (Nest)**: usuarios del **sitio** (`User` → tabla `users`), planes, **modelo `Calculo`** (historial de cálculos del usuario en el backend).
  2. **BD del estudio (Next)**: usuarios del **módulo estudio**, clientes, asuntos, maestros, seguimientos, auditoría (`escribanos/frontend/prisma/schema.prisma`).

### 1.1 Desarrollo

- Raíz monorepo: `npm run dev:escribanos` → Next + Nest juntos.
- Solo Next sin Nest: **login con email (Nest) falla** al llamar `/nest-api/auth/*`.

### 1.2 Variables de entorno (mínimas)

| Ámbito | Variables |
|--------|-----------|
| **Frontend** `.env.local` | `DATABASE_URL` (Postgres **estudio**), `NEST_INTERNAL_URL`, secreto(s) para JWT de sesión estudio (`AUTH_SECRET` / lo definido en `lib/session-token` y `lib/auth-constants`). |
| **Backend** `.env` | `DATABASE_URL` (Postgres **API**), `JWT_SECRET`, `PORT` (3001). |

---

## 2. Autenticación y sesión

### 2.1 Usuarios del sitio (Nest + localStorage)

- Cliente: `app/services/api.ts` → `fetch` a `/nest-api/auth/*`.
- Endpoints Nest (`auth.controller.ts`): `POST register`, `POST login`, `POST forgot-password`, `POST reset-password`, `GET me` (JWT), `POST change-password` (JWT).
- Tras login, token JWT en **localStorage** (`token`); `AuthProvider` carga usuario con `getMe`.

### 2.2 Vinculación con Gestión estudio

- `POST /api/auth/sync-estudio` (Next): header `Authorization: Bearer <JWT Nest>`.
  - Valida token contra Nest `GET /auth/me` (`lib/nest-internal-profile.ts`).
  - `ensureUsuarioEstudioPorEmail`: busca `Usuario` estudio con `usuario === email`; si no existe, **crea** uno con rol **PROFESIONAL** y hash aleatorio.
  - Setea cookies httpOnly: sesión estudio + `nest_access` (JWT Nest).
- Layout `/estudio`: si no hay usuario en contexto → redirección a `/login?next=/estudio`; luego **sync** obligatorio antes de mostrar UI.

### 2.3 Login directo módulo estudio (Prisma)

- `POST /api/auth/login` (body `usuario`, `password`): bcrypt contra `Usuario.passwordHash` en BD estudio; cookie de sesión.
- En **desarrollo**, `asegurarUsuarioAdminSiDbVacia` puede crear `admin` si no hay usuarios (`lib/bootstrap-admin.ts`, clave en `lib/auth-inicial`).

### 2.4 Logout y me

- `POST /api/auth/logout`: limpia cookies.
- `GET /api/auth/me`: valida sesión estudio (uso en actividad / layouts).

### 2.5 Cambio de contraseña (página `/estudio/cuenta`)

- `POST /api/auth/cambiar-contrasena`: body `actual`, `nueva`, `confirmar` (mín. 6 caracteres nueva).
  - Si cookie `nest_access` válida y email Nest coincide con `usuario` estudio → actualiza también vía Nest (`nestChangePassword`).
  - Si no, valida `actual` contra `passwordHash` estudio.
  - Siempre actualiza `passwordHash` en Prisma estudio al final.

### 2.6 Middleware Next (`middleware.ts`)

- Comprueba **presencia** de cookie sesión estudio o JWT Nest en cookie para rutas `/api/*` **excepto**: `login`, `sync-estudio`, `logout`, `health`, `cotizaciones-bcu`.
- **No valida firma JWT en Edge**; la API en Node usa `obtenerSesionServidor` / `requiereApiSesion`.
- `/estudio` no fuerza login en middleware (lo hace el layout cliente).

---

## 3. Roles del módulo estudio (`RolApp` — Prisma)

Definidos en `lib/roles-app.ts` (alinear cualquier réplica):

| Rol | Uso principal |
|-----|----------------|
| **ADMIN** | Todo; **reabrir** asuntos; **admin usuarios**; maestros. |
| **SOCIO** | **Finalizar** asuntos; **reasignar** equipo (individual y masiva); maestros. |
| **PROFESIONAL**, **COLABORADOR**, **USUARIO** | Registrar **movimientos** (si `puedeRegistrarMovimiento`). |
| **CONTADOR** | Reglas de lectura/edición según API (no es “solo lectura” por defecto en `esSoloLectura`). |
| **SOLO_LECTURA** | No registrar movimientos. |
| **USUARIO** (legacy) | Incluido en `puedeRegistrarMovimiento`. |

- **Maestros** (socios/profesionales CRUD): solo **ADMIN** o **SOCIO** (`requiereApiMaestrosEstudio`).
- **Finalizar** asunto: **ADMIN** o **SOCIO**.
- **Reabrir** asunto: solo **ADMIN**.
- **Reasignar equipo** (PATCH asunto o masiva): **ADMIN** o **SOCIO** (`puedeFinalizarAsunto`).

---

## 4. Modelo de datos estudio (resumen Prisma)

- **Usuario**: `usuario` (único, alineado a email en sync), `nombre`, `passwordHash`, `rol`, `activo`.
- **Cliente**: documento único, tipo documento/persona, nombre, `tipoSocial` (PJ), fechas, contacto, domicilio, etc.
- **AsuntoCatalogo**: nombre único (catálogo de tipos de asunto).
- **Socio**, **Profesional** (grupo `GrupoProfesional`, puesto `PuestoProfesional`).
- **Asunto**: `ordinal` autoincremental único, `tipo` (TODOS/NOTARIAL/LEGAL), `estado` (EN_TRAMITE/FINALIZADO), relaciones a cliente, catálogo, socio (opcional), profesional a cargo, dos colaboradores, contador; fechas inicio/fin/alerta; `ultimoMovimiento*`.
- **Seguimiento**: movimientos del expediente (`descripcion`, `fecha`, `usuarioId` opcional).
- **AuditoriaLog**: acciones (`accion`, `entidad`, `entidadId`, `detalle` JSON).

### 4.1 API Nest (usuarios sitio)

- **User**: email, password, nombre, apellido, ci, planType, calculosRealizados, reset token.
- **Calculo**: almacenamiento de cálculos del simulador/historial en backend (el **simulador en Next** hoy calcula en cliente y usa principalmente `/api/cotizaciones-bcu`; persistencia de cada simulación en Nest no es el flujo principal de la página simulador).

---

## 5. Rutas UI (páginas Next)

| Ruta | Función |
|------|---------|
| `/` | Home: Hero, Book, HowItWorks. |
| `/login`, `/restablecer-contrasena` | Auth sitio (Nest). |
| `/simulador` | Simulador arancel (sección 8). |
| `/planes`, `/sobre-nosotros` | Contenido marketing. |
| `/perfil` | Perfil (datos/límites; puede usar datos mock locales según implementación). |
| `/estudio` | Hub: acceso Clientes, Asuntos, accesos rápidos (nuevo asunto, alta cliente). |
| `/estudio/asuntos` | Lista, búsqueda, filtros avanzados, tabla/móvil. |
| `/estudio/asuntos/nuevo` | Alta asunto. |
| `/estudio/asuntos/[id]` | Ficha: datos, movimientos, finalizar/reabrir/reasignar según rol. |
| `/estudio/clientes` | Pestañas Buscar / Listado / Alta (`?tab=`). |
| `/estudio/cuenta` | Cambiar contraseña. |
| `/estudio/maestros` | Socios, profesionales, pendientes por miembro, reasignación masiva. |
| `/estudio/admin/usuarios` | ABM usuarios app (solo ADMIN). |

**Navegación estudio**: barra secundaria Panel / Asuntos / Clientes + enlace cuenta; layout protegido con shell visual alineado al sitio.

---

## 6. API Routes Next — contrato funcional

Todas las rutas bajo `/api/*` (salvo excepciones del middleware) requieren **sesión estudio** válida en servidor.

### 6.1 Asuntos

- **`GET /api/asuntos`**: query opcionales: `estado`, `tipo`, `profesionalACargoId`, `socioReferenteId`, `anioInicio`, `fechaInicioDesde/Hasta`, `fechaFinalizacionDesde/Hasta`, `q` (texto), `sinEquipo` (=1), `sinContador` (=1), `sinColaborador` (=1, mismo efecto equipo que sinEquipo en lógica actual). Respuesta: lista enriquecida para UI.
- **`POST /api/asuntos`**: crea asunto; validación de equipo (`mensajeErrorValidacionEquipoAsunto`); auditoría.
- **`GET /api/asuntos/[id]`**: detalle con relaciones y seguimientos ordenados desc.
- **`PATCH /api/asuntos/[id]`**: body `accion`:
  - **`finalizar`**: solo EN_TRAMITE; rol ADMIN/SOCIO; `fechaFinalizacion` obligatoria (ISO); crea seguimiento “Asunto finalizado.”; auditoría `ASUNTO_FINALIZAR`.
  - **`reabrir`**: solo FINALIZADO; solo ADMIN; limpia `fechaFinalizacion`; auditoría `ASUNTO_REABRIR`.
  - **`reasignar`**: solo EN_TRAMITE; ADMIN/SOCIO; campos opcionales `socioReferenteId`, `profesionalACargoId`, `colaboradorACargoId`, `colaboradorACargo2Id`, `contadorReferenteId` (null string = limpiar); validación equipo; `notaSeguimiento`; transacción seguimiento + update; auditoría `ASUNTO_REASIGNAR`.
- **`POST /api/asuntos/[id]/movimientos`**: body `descripcion`, `fecha` opcional; solo si EN_TRAMITE; roles no solo-lectura y con permiso movimiento; actualiza `ultimoMovimiento*`; auditoría `MOVIMIENTO_CREAR`.

### 6.2 Reasignación masiva

- **`POST /api/asuntos/reasignacion-masiva`**: ADMIN/SOCIO. Body: `campo` ∈ `profesionalACargoId` | `colaboradorACargoId` | `colaboradorACargo2Id` | `contadorReferenteId` | `socioReferenteId`, `desdeId`, `haciaId`. Solo asuntos **EN_TRAMITE** donde `campo === desdeId`. Valida existencia y **grupo** del profesional de reemplazo (LEGAL_A_CARGO / LEGAL_COLABORADOR / CONTADOR según campo); socio debe existir. Evita duplicar mismo profesional en dos roles del equipo. Respuesta: conteo actualizados + auditoría masiva.

### 6.3 Clientes

- **`GET /api/clientes`**: listado (orden servidor).
- **`POST /api/clientes`**: alta con validaciones de negocio.
- **`GET/PATCH/DELETE /api/clientes/[id]`**: CRUD.
- **`GET /api/clientes/por-documento`**: búsqueda por tipo+documento (para altas / duplicados).

### 6.4 Catálogo y maestros

- **`GET /api/catalogos`**: catálogos de asuntos (autenticado).
- **`GET/POST /api/socios`**, **`GET/PATCH/DELETE /api/socios/[id]`**: maestros socios (ADMIN/SOCIO).
- **`GET/POST /api/profesionales`**, **`GET/PATCH/DELETE /api/profesionales/[id]`**: maestros profesionales con grupo/puesto.
- **`GET /api/maestros/asuntos-pendientes-miembro`**: query **exactamente uno** de `profesionalId` o `socioId`; cuenta asuntos EN_TRAMITE por rol de asignación; desglose por tipo de vínculo.

### 6.5 Administración usuarios app

- **`GET/POST /api/admin/usuarios`**: lista y crea usuario estudio (solo ADMIN). POST: `usuario`, `nombre`, `password` (mín. 4), `rol`.
- **`PATCH /api/admin/usuarios/[id]`**: `nombre`, `activo`, `rol`, `password` opcional. No desactivarse a sí mismo; no quitarse rol admin a sí mismo.

### 6.6 Salud y cotizaciones

- **`GET /api/health`**: `DATABASE_URL` + ping Prisma estudio.
- **`GET /api/cotizaciones-bcu`**: cotizaciones BCU (SOAP); query `fecha`; uso en simulador; **público** respecto al middleware de cookies.

---

## 7. Auditoría

- `registrarAuditoria` en acciones: finalizar, reabrir, reasignar, movimiento crear, reasignación masiva, y otras según código en rutas POST/PATCH.

---

## 8. Simulador de arancel notarial (funcional completo)

### 8.1 Ubicación y datos

- **Página**: `app/simulador/page.tsx` (cliente, formulario extenso).
- **Capítulos** (JSON embebidos):
  - `lib/arancel/capitulo-i-data.json` → id `actos-contratos`
  - `lib/arancel/capitulo-ii-data.json` → `certificaciones`
  - `lib/arancel/capitulo-iii-data.json` → `actas-protocolizaciones`
- **`lib/arancel/data.ts`**: exporta `datosPorCapitulo`.
- **`lib/arancel/actos-simulador.ts`**: claves `capituloId|posDoc`; `listaActosSimuladorOrdenada()` — **todos los actos de los tres capítulos ordenados alfabéticamente** (es).

### 8.2 UI flujo

- Selección de acto vía **`ActoSearchCombobox`** (búsqueda por palabras).
- Si el documento tiene **`tieneSeleccionBien`**: paso adicional “Tipo de bien” (`posBien`).
- Campos dinámicos según regla: `reglaRequiereEntradaMontos`, `necesitaValoresBase`, `requiereCamposUsufructo` (`compute.ts`).
- Moneda principal (pesos, UR, UI, dólares, etc.) según `lib/arancel/conversion.ts`.
- **Usufructo / uso**: coeficientes en `lib/arancel/usufructo-coefs.json`; plazos contractual vs vitalicio; textos legales en UI.
- **FONASA** (opciones %) e **IRPF** (lista de porcentajes); leyenda de que IRPF es aproximación.
- **Fecha** para cotizaciones BCU (sincronizar honorario con tasas del día).

### 8.3 Motor de cálculo (`lib/arancel/compute.ts`)

- **`resolverClaveRegla`**: clave `posDoc` o `posDoc-posBien`.
- **`calcularValorBase`**: según `DetalleSpec` (max partes/catastral, capital social, aumento capital/precio, importe pagos periódicos con posible tope UR 500, testimonio fojas, genérico, etc.).
- **`calcularHonorario`**: según `HonorarioParsed`:
  - porcentaje sobre base;
  - UR fijo (con periodo/máx UR según regla);
  - por mil con min/max UR;
  - UR por fojas (plana + extras);
  - tipo `desconocido` con error.
- Tipos de resultado: `ur_fijo`, `porcentaje`, `monto_simple` (`ResultadoCalculo`).
- Coeficientes nuda propiedad / usufructo según años (tabla + valor real proporcional cuando aplica — ver textos y `tablaUsufructo` en reglas).

### 8.4 Conversión y líquido

- **`conversion.ts`**: `honorarioEnPrincipal`, formateos, `TasasLineas`, monedas del formulario.
- **`liquido-escribano.ts`**: desglose **factura** (IVA, etc.), **aportes Caja Notarial** (montepío, fondo gremial), **FONASA**, **IRPF**, **líquido**; funciones de desglose con/sin aportes arancel según reglas del arancel.

### 8.5 BCU

- **`GET /api/cotizaciones-bcu?fecha=YYYY-MM-DD`**: SOAP a BCU; fallback reintentando días hábiles anteriores (`lib/bcu-cotizaciones.ts`).
- Códigos: dólar billete, UI, UR (según constantes en módulo BCU).

### 8.6 Scripts de mantenimiento (package.json frontend)

- `generate:arancel`, `generate:arancel:cert`, `generate:arancel:actas`, `generate:usufructo`: regeneran datos desde scripts (`scripts/`).

### 8.7 Estilos

- Clases `.simulador-*` en `globals.css` (contenedor, formulario, desglose).

---

## 9. API Nest — resumen endpoints

- `POST /auth/register`, `POST /auth/login`, `POST /auth/forgot-password`, `POST /auth/reset-password`
- `GET /auth/me` (Bearer JWT)
- `POST /auth/change-password` (Bearer JWT)

---

## 10. Errores de base de datos (UX)

- `lib/api-db.ts`: mensajes para Prisma P1001, P1003, P2021, P2022, P2011, etc.; sugerir `npm run db:estudio:migrate` en frontend para estudio.
- `estudio-plain.css`: regla `body > main:not(.estudio-main)` para no pisar layout estudio.

---

## 11. Invariantes (no romper sin decisión explícita)

1. Dos BDs y dos clientes Prisma.
2. Login sitio depende de Nest; sync-estudio enlaza email → `Usuario` estudio.
3. Reglas de rol en API alineadas a `lib/roles-app.ts`.
4. Finalizar / reabrir / movimientos / reasignación: estados y roles estrictos.
5. Middleware no sustituye validación JWT en route handlers.
6. `/nest-api` rewrite obligatorio para mismo origen.
7. Validación de equipo en asuntos centralizada — mantener coherencia al refactorizar.

---

## 12. Cómo usar este documento

- **Reimplementación**: respetar contratos de API, estados, roles y flujos duales de auth.
- **Tests manuales mínimos**: registro/login Nest → sync → lista asuntos → ficha → movimiento → finalizar (SOCIO/ADMIN) → reabrir (ADMIN); maestros; reasignación masiva; admin usuarios; simulador con BCU en fecha válida.

---

*Última revisión alineada al código del monorepo (workspaces escribanos). Ajustar si se agregan rutas o migraciones.*
