"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type PuestoCatalogo,
  ETIQUETA_PUESTO,
} from "@/lib/profesional-equipo-catalogo";

type RolMe =
  | "ADMIN"
  | "USUARIO"
  | "SOCIO"
  | "PROFESIONAL"
  | "COLABORADOR"
  | "CONTADOR"
  | "SOLO_LECTURA";

type GrupoProfCatalogo = "DIRECCION" | "LEGAL_A_CARGO" | "LEGAL_COLABORADOR" | "CONTADOR";

type ProfesionalItem = {
  id: string;
  nombre: string;
  grupo: GrupoProfCatalogo;
  puesto: string;
};

type SocioItem = { id: string; nombre: string };

type AsuntoFicha = {
  id: string;
  ordinal: number;
  tipo: string;
  estado: string;
  descripcion: string | null;
  fechaInicio: string;
  fechaFinalizacion: string | null;
  fechaAlertaVencimiento: string | null;
  ultimoMovimientoFecha: string | null;
  ultimoMovimientoTexto: string | null;
  cliente: { id: string; nombre: string; documento: string; telefono?: string | null; email?: string | null };
  catalogo: { nombre: string };
  socioReferente: { id: string; nombre: string } | null;
  profesionalACargo: { id: string; nombre: string; puesto: string; funcion?: string | null } | null;
  colaboradorACargo: { id: string; nombre: string } | null;
  colaboradorACargo2: { id: string; nombre: string } | null;
  contadorReferente: { id: string; nombre: string } | null;
  seguimientos: {
    id: string;
    fecha: string;
    descripcion: string;
    usuarioId: string | null;
  }[];
};

function puedeFinalizar(rol: RolMe | null): boolean {
  return rol === "ADMIN" || rol === "SOCIO";
}

function puedeReabrir(rol: RolMe | null): boolean {
  return rol === "ADMIN";
}

function puedeReasignarEquipo(rol: RolMe | null): boolean {
  return rol === "ADMIN" || rol === "SOCIO";
}

function puedeMovimiento(rol: RolMe | null): boolean {
  if (!rol || rol === "SOLO_LECTURA" || rol === "CONTADOR") return false;
  return (
    rol === "ADMIN" ||
    rol === "SOCIO" ||
    rol === "PROFESIONAL" ||
    rol === "COLABORADOR" ||
    rol === "USUARIO"
  );
}

function fmtFecha(s: string | null | undefined): string {
  if (!s) return "—";
  try {
    return new Date(s).toLocaleString("es-UY", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch {
    return s;
  }
}

/** Valor inicial para inputs type="date" (zona local). */
function hoyIsoDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function FichaAsunto({ id }: { id: string }) {
  const router = useRouter();
  const [asunto, setAsunto] = useState<AsuntoFicha | null>(null);
  const [rol, setRol] = useState<RolMe | null>(null);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [movTexto, setMovTexto] = useState("");
  const [movFecha, setMovFecha] = useState(() => hoyIsoDate());
  const [guardandoMov, setGuardandoMov] = useState(false);
  const [fechaFin, setFechaFin] = useState(() => hoyIsoDate());
  const [accionando, setAccionando] = useState(false);

  const [profesionalesCat, setProfesionalesCat] = useState<ProfesionalItem[]>([]);
  const [sociosCat, setSociosCat] = useState<SocioItem[]>([]);
  const [reaSocioId, setReaSocioId] = useState("");
  const [reaProfId, setReaProfId] = useState("");
  const [reaCol1, setReaCol1] = useState("");
  const [reaCol2, setReaCol2] = useState("");
  const [reaCont, setReaCont] = useState("");
  const [reaNota, setReaNota] = useState("Reasignacion de equipo del asunto.");
  const [guardandoRea, setGuardandoRea] = useState(false);
  const [cargandoReaCat, setCargandoReaCat] = useState(false);
  /** Formulario de reasignación: no visible hasta que el usuario elija la acción. */
  const [accionReasignarAbierta, setAccionReasignarAbierta] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setMensaje("");
    try {
      const [rAsunto, rMe] = await Promise.all([
        fetch(`/api/asuntos/${id}`),
        fetch("/api/auth/me"),
      ]);
      const dataA = await rAsunto.json();
      if (!rAsunto.ok) {
        setMensaje(dataA?.error ?? "No se pudo cargar el asunto.");
        setAsunto(null);
        return;
      }
      const ficha = dataA as AsuntoFicha;
      setAsunto(ficha);
      setReaSocioId(ficha.socioReferente?.id ?? "");
      setReaProfId(ficha.profesionalACargo?.id ?? "");
      setReaCol1(ficha.colaboradorACargo?.id ?? "");
      setReaCol2(ficha.colaboradorACargo2?.id ?? "");
      setReaCont(ficha.contadorReferente?.id ?? "");

      if (rMe.ok) {
        const me = await rMe.json();
        setRol(me.rol as RolMe);
      }
    } catch {
      setMensaje("Error de conexion.");
      setAsunto(null);
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => {
    void cargar().catch(() => setCargando(false));
  }, [cargar]);

  useEffect(() => {
    setAccionReasignarAbierta(false);
  }, [id]);

  useEffect(() => {
    if (
      asunto?.estado !== "EN_TRAMITE" ||
      !puedeReasignarEquipo(rol) ||
      !accionReasignarAbierta
    ) {
      setCargandoReaCat(false);
      return;
    }
    setCargandoReaCat(true);
    void fetch("/api/catalogos")
      .then(async (r) => {
        const data = (await r.json()) as {
          profesionales?: ProfesionalItem[];
          socios?: SocioItem[];
        };
        if (!r.ok) return;
        setProfesionalesCat(data.profesionales ?? []);
        setSociosCat(data.socios ?? []);
      })
      .catch(() => undefined)
      .finally(() => setCargandoReaCat(false));
  }, [asunto?.estado, rol, id, accionReasignarAbierta]);

  /** Al abrir otra ficha, las fechas editables vuelven a hoy. */
  useEffect(() => {
    const hoy = hoyIsoDate();
    setMovFecha(hoy);
    setFechaFin(hoy);
  }, [id]);

  async function registrarMovimiento(e: React.FormEvent) {
    e.preventDefault();
    if (!movTexto.trim()) {
      setMensaje("Escribi la descripcion del movimiento.");
      return;
    }
    setGuardandoMov(true);
    setMensaje("");
    try {
      const body: { descripcion: string; fecha?: string } = { descripcion: movTexto.trim() };
      if (movFecha) body.fecha = movFecha;
      const response = await fetch(`/api/asuntos/${id}/movimientos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) {
        setMensaje(data?.error ?? "No se pudo registrar el movimiento.");
        return;
      }
      setMovTexto("");
      setMovFecha(hoyIsoDate());
      await cargar();
      router.refresh();
    } catch {
      setMensaje("Error de conexion.");
    } finally {
      setGuardandoMov(false);
    }
  }

  async function finalizar() {
    if (!fechaFin) {
      setMensaje("Indica la fecha de finalizacion.");
      return;
    }
    setAccionando(true);
    setMensaje("");
    try {
      const response = await fetch(`/api/asuntos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accion: "finalizar",
          fechaFinalizacion: fechaFin,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMensaje(data?.error ?? "No se pudo finalizar.");
        return;
      }
      setFechaFin(hoyIsoDate());
      await cargar();
      router.refresh();
    } catch {
      setMensaje("Error de conexion.");
    } finally {
      setAccionando(false);
    }
  }

  const legalACargo = useMemo(
    () => profesionalesCat.filter((p) => p.grupo === "LEGAL_A_CARGO"),
    [profesionalesCat],
  );
  const colaboradoresLegal = useMemo(
    () => profesionalesCat.filter((p) => p.grupo === "LEGAL_COLABORADOR"),
    [profesionalesCat],
  );
  const contadoresLista = useMemo(
    () => profesionalesCat.filter((p) => p.grupo === "CONTADOR"),
    [profesionalesCat],
  );
  const elegiblesCol1 = useMemo(
    () => colaboradoresLegal.filter((p) => p.id !== reaProfId),
    [colaboradoresLegal, reaProfId],
  );
  const elegiblesCol2 = useMemo(
    () => elegiblesCol1.filter((p) => !reaCol1 || p.id !== reaCol1),
    [elegiblesCol1, reaCol1],
  );

  async function reasignarEquipo(e: React.FormEvent) {
    e.preventDefault();
    setGuardandoRea(true);
    setMensaje("");
    try {
      const response = await fetch(`/api/asuntos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accion: "reasignar",
          socioReferenteId: reaSocioId.trim() === "" ? null : reaSocioId,
          profesionalACargoId: reaProfId.trim() === "" ? null : reaProfId,
          colaboradorACargoId: reaCol1.trim() === "" ? null : reaCol1,
          colaboradorACargo2Id: reaCol2.trim() === "" ? null : reaCol2,
          contadorReferenteId: reaCont.trim() === "" ? null : reaCont,
          notaSeguimiento: reaNota.trim() || "Reasignacion de equipo del asunto.",
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMensaje(data?.error ?? "No se pudo reasignar.");
        return;
      }
      setAccionReasignarAbierta(false);
      await cargar();
      router.refresh();
    } catch {
      setMensaje("Error de conexion.");
    } finally {
      setGuardandoRea(false);
    }
  }

  async function reabrir() {
    if (!window.confirm("Reabrir este asunto? Quedara EN TRAMITE.")) return;
    setAccionando(true);
    setMensaje("");
    try {
      const response = await fetch(`/api/asuntos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accion: "reabrir" }),
      });
      const data = await response.json();
      if (!response.ok) {
        setMensaje(data?.error ?? "No se pudo reabrir.");
        return;
      }
      await cargar();
      router.refresh();
    } catch {
      setMensaje("Error de conexion.");
    } finally {
      setAccionando(false);
    }
  }

  if (cargando) {
    return (
      <div className="flex min-h-[12rem] flex-col items-center justify-center gap-3 rounded-xl border border-black/[0.06] bg-white px-6 py-12 shadow-sm">
        <span
          className="inline-block size-9 animate-spin rounded-full border-2 border-neutral-200 border-t-[var(--verde-principal)]"
          aria-hidden
        />
        <p className="text-sm text-neutral-600">Cargando ficha…</p>
      </div>
    );
  }

  if (!asunto) {
    return (
      <div className="rounded-xl border border-black/[0.06] bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm text-red-800">{mensaje || "Asunto no encontrado."}</p>
        <Link
          href="/estudio/asuntos"
          className="btn-secondary mt-5 inline-flex min-h-[2.75rem] items-center justify-center px-5 text-sm"
        >
          Volver al listado
        </Link>
      </div>
    );
  }

  const enTramite = asunto.estado === "EN_TRAMITE";

  const panel =
    "rounded-xl border border-black/[0.06] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:p-8";

  return (
    <div className="max-w-4xl space-y-8 sm:space-y-10">
      <div className="flex flex-col gap-5 border-b border-neutral-100 pb-6 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-6">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/estudio/asuntos"
              className="inline-flex min-h-[2.25rem] items-center gap-1.5 rounded-lg border border-black/[0.08] bg-white px-3 py-1.5 text-sm font-medium text-[var(--verde-principal)] shadow-sm transition-colors hover:border-[rgba(0,166,81,0.35)] hover:bg-[var(--fondo-verde-muy-claro)]"
            >
              <span aria-hidden className="text-neutral-400">
                ←
              </span>
              Listado
            </Link>
            <span className="text-xs tabular-nums text-neutral-400">#{asunto.ordinal}</span>
          </div>
          <h1 className="mt-3 break-words text-2xl font-semibold tracking-tight text-[var(--verde-titulo)] sm:text-3xl">
            {asunto.catalogo.nombre}
          </h1>
          <p className="mt-2 break-words text-sm text-neutral-600">
            {asunto.cliente.nombre} · {asunto.cliente.documento}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
              enTramite
                ? "bg-[rgba(0,166,81,0.12)] text-[var(--verde-oscuro)] ring-1 ring-[rgba(0,166,81,0.2)]"
                : "bg-neutral-100 text-neutral-600 ring-1 ring-neutral-200/80"
            }`}
          >
            {enTramite ? "En trámite" : "Finalizado"}
          </span>
          <span className="text-sm text-neutral-500">
            Tipo: <span className="font-medium text-neutral-700">{asunto.tipo}</span>
          </span>
        </div>
      </div>

      {mensaje ? (
        <p className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-950 ring-1 ring-amber-200/50">{mensaje}</p>
      ) : null}

      <div className="grid gap-8 md:grid-cols-2">
        <div className={`${panel} space-y-3 text-sm`}>
          <h2 className="text-xs font-medium uppercase tracking-wide text-neutral-400">Datos</h2>
          <p>
            <span className="text-[var(--gris-texto)]/90">Inicio:</span> {fmtFecha(asunto.fechaInicio)}
          </p>
          <p>
            <span className="text-[var(--gris-texto)]/90">Alerta venc.:</span> {fmtFecha(asunto.fechaAlertaVencimiento)}
          </p>
          <p>
            <span className="text-[var(--gris-texto)]/90">Finalizacion:</span> {fmtFecha(asunto.fechaFinalizacion)}
          </p>
          <p>
            <span className="text-[var(--gris-texto)]/90">Ultimo movimiento:</span> {fmtFecha(asunto.ultimoMovimientoFecha)}
          </p>
          {asunto.ultimoMovimientoTexto ? (
            <p className="rounded-md bg-neutral-50 p-3 text-neutral-800">{asunto.ultimoMovimientoTexto}</p>
          ) : null}
          {asunto.descripcion ? (
            <p>
              <span className="text-[var(--gris-texto)]/90">Descripcion:</span> {asunto.descripcion}
            </p>
          ) : null}
        </div>

        <div className={`${panel} space-y-3 text-sm`}>
          <h2 className="text-xs font-medium uppercase tracking-wide text-neutral-400">Equipo</h2>
          <p>
            <span className="text-[var(--gris-texto)]/90">Socio referente:</span>{" "}
            {asunto.socioReferente ? (
              asunto.socioReferente.nombre
            ) : (
              <span className="text-neutral-500">Sin asignar</span>
            )}
          </p>
          <p>
            <span className="text-[var(--gris-texto)]/90">Equipo a cargo:</span>{" "}
            {asunto.profesionalACargo ? (
              <>
                {asunto.profesionalACargo.nombre}
                <span className="text-[var(--gris-texto)]">
                  {" "}
                  ({ETIQUETA_PUESTO[asunto.profesionalACargo.puesto as PuestoCatalogo] ??
                    asunto.profesionalACargo.puesto}
                  {asunto.profesionalACargo.funcion ? ` — ${asunto.profesionalACargo.funcion}` : ""})
                </span>
              </>
            ) : (
              <span className="text-neutral-500">Sin asignar</span>
            )}
          </p>
          {asunto.colaboradorACargo ? (
            <p>
              <span className="text-[var(--gris-texto)]/90">Colaborador 1:</span> {asunto.colaboradorACargo.nombre}
            </p>
          ) : null}
          {asunto.colaboradorACargo2 ? (
            <p>
              <span className="text-[var(--gris-texto)]/90">Colaborador 2:</span> {asunto.colaboradorACargo2.nombre}
            </p>
          ) : null}
          {asunto.contadorReferente ? (
            <p>
              <span className="text-[var(--gris-texto)]/90">Contador:</span> {asunto.contadorReferente.nombre}
            </p>
          ) : null}
          {enTramite && puedeReasignarEquipo(rol) && !accionReasignarAbierta ? (
            <div className="mt-4 border-t border-black/[0.07] pt-3">
              <button
                type="button"
                className="text-sm font-medium text-[var(--gris-texto)]/90 underline decoration-[rgba(0,166,81,0.35)] underline-offset-2 transition-colors hover:text-[var(--verde-titulo)] hover:decoration-[var(--verde-principal)]"
                onClick={() => setAccionReasignarAbierta(true)}
              >
                Reasignar equipo…
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {enTramite && puedeReasignarEquipo(rol) && accionReasignarAbierta && cargandoReaCat ? (
        <p className="text-sm text-[var(--gris-texto)]">Cargando catalogos para reasignar…</p>
      ) : null}

      {enTramite &&
      puedeReasignarEquipo(rol) &&
      accionReasignarAbierta &&
      !cargandoReaCat ? (
        <form className={`${panel} space-y-4`} onSubmit={(ev) => void reasignarEquipo(ev)}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h2 className="text-xs font-medium uppercase tracking-wide text-neutral-400">Reasignar equipo</h2>
            <button
              type="button"
              className="shrink-0 text-sm font-medium text-[var(--gris-texto)] underline decoration-[rgba(0,166,81,0.35)] underline-offset-2 hover:text-[var(--verde-titulo)]"
              onClick={() => setAccionReasignarAbierta(false)}
            >
              Ocultar
            </button>
          </div>
          <p className="text-sm text-[var(--gris-texto)]">
            Solo asuntos EN TRAMITE. Los cambios quedan en historial y auditoria. Ajustá solo lo que deba cambiar
            respecto del cuadro actual.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-sm font-medium text-[var(--verde-titulo)]">Socio referente (opcional)</span>
              <select
                className="input-app"
                value={reaSocioId}
                onChange={(e) => setReaSocioId(e.target.value)}
              >
                <option value="">— Sin asignar</option>
                {sociosCat.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-[var(--verde-titulo)]">Equipo a cargo (legal / notarial, opcional)</span>
              <select
                className="input-app"
                value={reaProfId}
                onChange={(e) => setReaProfId(e.target.value)}
              >
                <option value="">— Sin asignar</option>
                {legalACargo.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} ({ETIQUETA_PUESTO[p.puesto as PuestoCatalogo] ?? p.puesto})
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-[var(--verde-titulo)]">Colaborador 1 (opcional)</span>
              <select
                className="input-app"
                value={reaCol1}
                onChange={(e) => setReaCol1(e.target.value)}
              >
                <option value="">—</option>
                {elegiblesCol1.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-sm font-medium text-[var(--verde-titulo)]">Colaborador 2 (opcional)</span>
              <select
                className="input-app"
                value={reaCol2}
                onChange={(e) => setReaCol2(e.target.value)}
              >
                <option value="">—</option>
                {elegiblesCol2.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 md:col-span-2">
              <span className="text-sm font-medium text-[var(--verde-titulo)]">Contador referente (opcional)</span>
              <select className="input-app" value={reaCont} onChange={(e) => setReaCont(e.target.value)}>
                <option value="">—</option>
                {contadoresLista.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1 md:col-span-2">
              <span className="text-sm font-medium text-[var(--verde-titulo)]">Nota en historial</span>
              <input
                className="input-app"
                value={reaNota}
                onChange={(e) => setReaNota(e.target.value)}
                placeholder="Texto del movimiento registrado"
              />
            </label>
          </div>
          <button
            className="btn-secondary min-h-[2.75rem] px-5 disabled:cursor-not-allowed disabled:opacity-55"
            type="submit"
            disabled={guardandoRea}
          >
            {guardandoRea ? "Guardando…" : "Guardar reasignación"}
          </button>
        </form>
      ) : null}

      {enTramite && puedeMovimiento(rol) ? (
        <form className={`${panel} space-y-4`} onSubmit={registrarMovimiento}>
          <h2 className="text-xs font-medium uppercase tracking-wide text-neutral-400">Nuevo movimiento</h2>
          <textarea
            className="input-app min-h-24 resize-y"
            placeholder="Descripcion del movimiento"
            value={movTexto}
            onChange={(e) => setMovTexto(e.target.value)}
          />
          <label className="block space-y-1">
            <span className="text-sm font-medium text-[var(--verde-titulo)]">Fecha (por defecto hoy; podés cambiarla)</span>
            <input
              className="input-app w-full max-w-full sm:max-w-xs"
              type="date"
              value={movFecha}
              onChange={(e) => setMovFecha(e.target.value)}
            />
          </label>
          <button
            className="btn-primary min-h-[2.75rem] px-6 disabled:cursor-not-allowed disabled:opacity-55"
            type="submit"
            disabled={guardandoMov}
          >
            {guardandoMov ? "Guardando…" : "Registrar movimiento"}
          </button>
        </form>
      ) : enTramite && !puedeMovimiento(rol) ? (
        <p className="text-sm text-[var(--gris-texto)]">Tu rol no permite registrar movimientos en este asunto.</p>
      ) : null}

      {enTramite && puedeFinalizar(rol) ? (
        <div className={`${panel} flex flex-col gap-4 sm:flex-row sm:items-end`}>
          <label className="space-y-1">
            <span className="text-sm font-medium text-[var(--verde-titulo)]">Finalizar — fecha</span>
            <input className="input-app" type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
          </label>
          <button
            type="button"
            className="btn-secondary min-h-[2.75rem] px-5 disabled:cursor-not-allowed disabled:opacity-55"
            disabled={accionando}
            onClick={() => void finalizar()}
          >
            {accionando ? "…" : "Finalizar asunto"}
          </button>
        </div>
      ) : null}

      {!enTramite && puedeReabrir(rol) ? (
        <div className={panel}>
          <button
            type="button"
            className="btn-secondary min-h-[2.75rem] px-5 disabled:cursor-not-allowed disabled:opacity-55"
            disabled={accionando}
            onClick={() => void reabrir()}
          >
            {accionando ? "…" : "Reabrir asunto (solo admin)"}
          </button>
        </div>
      ) : null}

      <div className={panel}>
        <h2 className="text-xs font-medium uppercase tracking-wide text-neutral-400">Historial</h2>
        <ul className="mt-6 space-y-6 border-l border-neutral-200 pl-5">
          {asunto.seguimientos.map((s) => (
            <li key={s.id} className="relative text-sm">
              <span className="absolute -left-[21px] top-1.5 size-2 rounded-full bg-[var(--verde-principal)]/80" aria-hidden />
              <p className="text-xs text-neutral-500">{fmtFecha(s.fecha)}</p>
              <p className="mt-1 whitespace-pre-wrap text-neutral-800">{s.descripcion}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
