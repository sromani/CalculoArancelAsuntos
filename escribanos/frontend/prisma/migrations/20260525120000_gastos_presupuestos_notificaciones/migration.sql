-- Drop legacy gastos notariales
DROP TABLE IF EXISTS "GastoNotarial";

DROP TYPE IF EXISTS "EstadoGastoNotarial";
DROP TYPE IF EXISTS "MetodoPagoGasto";

-- Enums
CREATE TYPE "CategoriaGasto" AS ENUM ('REGISTRO', 'TRIBUTOS', 'CERTIFICACIONES', 'CORREO', 'ARCHIVO', 'GESTIONES', 'OTROS');
CREATE TYPE "EstadoGasto" AS ENUM ('PENDIENTE', 'PAGO_REALIZADO', 'VENCIDO');
CREATE TYPE "EstadoPresupuesto" AS ENUM ('BORRADOR', 'EMITIDO', 'ACEPTADO', 'RECHAZADO', 'ANULADO');
CREATE TYPE "TipoNotificacion" AS ENUM ('GASTO_VENCIMIENTO', 'GASTO_PROXIMO_VENCER', 'ASUNTO_VENCIMIENTO', 'PRESUPUESTO_PENDIENTE', 'PAGO_PENDIENTE');

-- Catálogo de gastos frecuentes
CREATE TABLE "GastoCatalogoItem" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoria" "CategoriaGasto" NOT NULL,
    "oficinaPublica" TEXT,
    "descripcion" TEXT,
    "importeSugerido" DOUBLE PRECISION,
    "moneda" "MonedaGasto" NOT NULL DEFAULT 'PESOS',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GastoCatalogoItem_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GastoCatalogoItem_activo_orden_idx" ON "GastoCatalogoItem"("activo", "orden");

-- Gastos por trámite/asunto
CREATE TABLE "Gasto" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "categoria" "CategoriaGasto" NOT NULL,
    "oficinaPublica" TEXT,
    "descripcion" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL,
    "fechaVencimiento" TIMESTAMP(3),
    "importe" DOUBLE PRECISION NOT NULL,
    "moneda" "MonedaGasto" NOT NULL DEFAULT 'PESOS',
    "estado" "EstadoGasto" NOT NULL DEFAULT 'PENDIENTE',
    "observaciones" TEXT,
    "comprobantePath" TEXT,
    "catalogoItemId" TEXT,
    "clienteId" TEXT,
    "asuntoId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Gasto_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Gasto_fecha_idx" ON "Gasto"("fecha");
CREATE INDEX "Gasto_fechaVencimiento_idx" ON "Gasto"("fechaVencimiento");
CREATE INDEX "Gasto_estado_idx" ON "Gasto"("estado");
CREATE INDEX "Gasto_clienteId_idx" ON "Gasto"("clienteId");
CREATE INDEX "Gasto_asuntoId_idx" ON "Gasto"("asuntoId");
CREATE INDEX "Gasto_categoria_idx" ON "Gasto"("categoria");

ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_catalogoItemId_fkey" FOREIGN KEY ("catalogoItemId") REFERENCES "GastoCatalogoItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_asuntoId_fkey" FOREIGN KEY ("asuntoId") REFERENCES "Asunto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Presupuestos notariales
CREATE TABLE "PresupuestoNotarial" (
    "id" TEXT NOT NULL,
    "numero" SERIAL NOT NULL,
    "clienteId" TEXT NOT NULL,
    "asuntoId" TEXT,
    "estado" "EstadoPresupuesto" NOT NULL DEFAULT 'BORRADOR',
    "titulo" TEXT,
    "actoCapituloId" TEXT,
    "actoPosDoc" INTEGER,
    "actoPosBien" INTEGER,
    "actoDescripcion" TEXT,
    "actoSnapshot" JSONB,
    "monedaHonorario" TEXT NOT NULL DEFAULT 'UYU',
    "honorarioArancel" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "honorarioACobrar" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fonasaPct" DOUBLE PRECISION NOT NULL DEFAULT 6,
    "irpfPct" DOUBLE PRECISION NOT NULL DEFAULT 15,
    "desgloseArancel" JSONB,
    "desglosePresupuesto" JSONB,
    "totalGastos" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "totalPresupuesto" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "fechaCotizacion" TIMESTAMP(3),
    "cotizacionesSnapshot" JSONB,
    "notas" TEXT,
    "duplicadoDeId" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PresupuestoNotarial_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PresupuestoNotarial_numero_key" ON "PresupuestoNotarial"("numero");
CREATE INDEX "PresupuestoNotarial_clienteId_idx" ON "PresupuestoNotarial"("clienteId");
CREATE INDEX "PresupuestoNotarial_asuntoId_idx" ON "PresupuestoNotarial"("asuntoId");
CREATE INDEX "PresupuestoNotarial_estado_idx" ON "PresupuestoNotarial"("estado");
CREATE INDEX "PresupuestoNotarial_createdAt_idx" ON "PresupuestoNotarial"("createdAt");

ALTER TABLE "PresupuestoNotarial" ADD CONSTRAINT "PresupuestoNotarial_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "PresupuestoNotarial" ADD CONSTRAINT "PresupuestoNotarial_asuntoId_fkey" FOREIGN KEY ("asuntoId") REFERENCES "Asunto"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PresupuestoNotarial" ADD CONSTRAINT "PresupuestoNotarial_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Líneas de gastos en presupuesto
CREATE TABLE "PresupuestoGastoLinea" (
    "id" TEXT NOT NULL,
    "presupuestoId" TEXT NOT NULL,
    "gastoId" TEXT NOT NULL,
    "importe" DOUBLE PRECISION NOT NULL,
    "moneda" "MonedaGasto" NOT NULL,
    "incluido" BOOLEAN NOT NULL DEFAULT true,
    "orden" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PresupuestoGastoLinea_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PresupuestoGastoLinea_presupuestoId_gastoId_key" ON "PresupuestoGastoLinea"("presupuestoId", "gastoId");
CREATE INDEX "PresupuestoGastoLinea_presupuestoId_idx" ON "PresupuestoGastoLinea"("presupuestoId");

ALTER TABLE "PresupuestoGastoLinea" ADD CONSTRAINT "PresupuestoGastoLinea_presupuestoId_fkey" FOREIGN KEY ("presupuestoId") REFERENCES "PresupuestoNotarial"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PresupuestoGastoLinea" ADD CONSTRAINT "PresupuestoGastoLinea_gastoId_fkey" FOREIGN KEY ("gastoId") REFERENCES "Gasto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Historial de presupuestos
CREATE TABLE "PresupuestoHistorial" (
    "id" TEXT NOT NULL,
    "presupuestoId" TEXT NOT NULL,
    "usuarioId" TEXT,
    "accion" TEXT NOT NULL,
    "detalle" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PresupuestoHistorial_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PresupuestoHistorial_presupuestoId_createdAt_idx" ON "PresupuestoHistorial"("presupuestoId", "createdAt");

ALTER TABLE "PresupuestoHistorial" ADD CONSTRAINT "PresupuestoHistorial_presupuestoId_fkey" FOREIGN KEY ("presupuestoId") REFERENCES "PresupuestoNotarial"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PresupuestoHistorial" ADD CONSTRAINT "PresupuestoHistorial_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Notificaciones
CREATE TABLE "Notificacion" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT,
    "tipo" "TipoNotificacion" NOT NULL,
    "titulo" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "enlace" TEXT,
    "leida" BOOLEAN NOT NULL DEFAULT false,
    "entidad" TEXT,
    "entidadId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notificacion_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Notificacion_usuarioId_leida_createdAt_idx" ON "Notificacion"("usuarioId", "leida", "createdAt");
CREATE INDEX "Notificacion_entidad_entidadId_idx" ON "Notificacion"("entidad", "entidadId");

ALTER TABLE "Notificacion" ADD CONSTRAINT "Notificacion_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;
