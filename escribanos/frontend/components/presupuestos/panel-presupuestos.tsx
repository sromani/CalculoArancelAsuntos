"use client";

import { useEffect, useState } from "react";
import { EstudioLinkButton } from "@/components/ui/estudio-button";
import { ListaPresupuestos } from "@/components/presupuestos/editor-presupuesto";
import { usePresupuestos } from "@/components/presupuestos/use-presupuestos";
import { GastosToastProvider, useGastosToast } from "@/components/gastos/gastos-toast";
import { cn } from "@/lib/cn";
import { estudioTw } from "@/lib/estudio-tw";

function PanelPresupuestosInner() {
  const { toast } = useGastosToast();
  const { lista, cargando, error, recargar, duplicar } = usePresupuestos();

  return (
    <div className={cn("w-full min-w-0 text-left", estudioTw.listStackY)}>
      <div className="panel overflow-hidden">
        <div className={cn("page-toolbar page-toolbar-wide pt-6", estudioTw.cardPadX)}>
          <div>
            <h1 className="page-title">Presupuestos</h1>
            <p className="mt-1 text-sm text-neutral-600">Honorarios + gastos del trámite para el cliente.</p>
          </div>
          <EstudioLinkButton href="/estudio/presupuestos/nuevo" variant="listNuevo">
            Nuevo presupuesto
          </EstudioLinkButton>
        </div>
        <div className={cn("px-4 pb-8 sm:px-6 lg:px-8", estudioTw.listBodySection)}>
          {error ? <p className="mb-4 text-sm text-rose-700">{error}</p> : null}
          <ListaPresupuestos
            lista={lista}
            cargando={cargando}
            onDuplicar={(id) => {
              void (async () => {
                try {
                  await duplicar(id);
                  toast("Presupuesto duplicado.", "ok");
                  await recargar();
                } catch (e) {
                  toast(e instanceof Error ? e.message : "Error", "error");
                }
              })();
            }}
          />
        </div>
      </div>
    </div>
  );
}

export function PanelPresupuestos() {
  return (
    <GastosToastProvider>
      <PanelPresupuestosInner />
    </GastosToastProvider>
  );
}
