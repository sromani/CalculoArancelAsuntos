-- Gastos Notariales
CREATE TYPE "MonedaGasto" AS ENUM ('PESOS', 'DOLARES', 'UR', 'UI');
CREATE TYPE "EstadoGastoNotarial" AS ENUM ('PENDIENTE', 'PAGADO', 'VENCIDO');
CREATE TYPE "MetodoPagoGasto" AS ENUM ('EFECTIVO', 'TRANSFERENCIA', 'CHEQUE', 'TARJETA', 'OTRO');

CREATE TABLE "GastoNotarial" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "tipoTramite" TEXT NOT NULL,
    "descripcion" TEXT,
    "fecha" TIMESTAMP(3) NOT NULL,
    "importe" DOUBLE PRECISION NOT NULL,
    "moneda" "MonedaGasto" NOT NULL DEFAULT 'PESOS',
    "estado" "EstadoGastoNotarial" NOT NULL DEFAULT 'PENDIENTE',
    "metodoPago" "MetodoPagoGasto",
    "observaciones" TEXT,
    "numeroExpediente" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GastoNotarial_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "GastoNotarial_fecha_idx" ON "GastoNotarial"("fecha");
CREATE INDEX "GastoNotarial_estado_idx" ON "GastoNotarial"("estado");
CREATE INDEX "GastoNotarial_clienteId_idx" ON "GastoNotarial"("clienteId");
CREATE INDEX "GastoNotarial_tipoTramite_idx" ON "GastoNotarial"("tipoTramite");

ALTER TABLE "GastoNotarial" ADD CONSTRAINT "GastoNotarial_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
