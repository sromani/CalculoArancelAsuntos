"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type PuestoCatalogo,
  ETIQUETA_PUESTO,
} from "@/lib/profesional-equipo-catalogo";
import { estudioSpinnerLg } from "@/lib/estudio-estilos";

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

function profesionalLibreDesdeDescripcion(descripcion: string | null | undefined): string | null {
  const s = String(descripcion ?? "");
  const m = s.match(/\[PROFESIONAL_A_CARGO_LIBRE\]:\s*(.+)/i);
  return m?.[1]?.trim() || null;
}

function descripcionSinMarcador(descripcion: string | null | undefined): string | null {
  const s = String(descripcion ?? "");
  const limpio = s
    .replace(/\[PROFESIONAL_A_CARGO_LIBRE\]:\s*.+(?:\r?\n)?/i, "")
    .trim();
  return limpio.length > 0 ? limpio : null;
}

/** Valor inicial para inputs type="date" (zona local). */
function hoyIsoDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fechaAsuntoADateInput(iso: string | null | undefined): string {
  if (!iso) return hoyIsoDate();
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return hoyIsoDate();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function etiquetaTipoAsunto(tipo: string): string {
  switch (tipo) {
    case "NOTARIAL":
      return "Notarial";
    case "LEGAL":
      return "Legal";
    case "TODOS":
      return "Todos";
    default:
      return tipo;
  }
}

const editableShell =
  "panel-alta space-y-4 border-2 border-emerald-300/70 bg-white shadow-[0_6px_28px_-10px_rgba(5,150,105,0.35)] ring-1 ring-emerald-500/15";

export function FichaAsunto({ id }: { id: string }) {
  const router = useRouter();
  const [asunto, setAsunto] = useState<AsuntoFicha | null>(null);
  const [rol, setRol] = useState<RolMe | null>(null);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState("");
  const [movTexto, setMovTexto] = useState("");
  const [movFecha, setMovFecha] = useState(() => hoyIsoDate());
  const [guardandoMov, setGuardandoMov] = useState(false);
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

  const [descEdit, setDescEdit] = useState("");
  const [estadoEdit, setEstadoEdit] = useState<"EN_TRAMITE" | "FINALIZADO">("EN_TRAMITE");
  const [fechaCierreEstado, setFechaCierreEstado] = useState(() => hoyIsoDate());
  const [guardandoFicha, setGuardandoFicha] = useState(false);

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

  const seguimientosOrdenados = useMemo(() => {
    if (!asunto) return [];
    return [...asunto.seguimientos].sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
    );
  }, [asunto]);

  /** Al abrir otra ficha, las fechas editables vuelven a hoy. */
  useEffect(() => {
    setMovFecha(hoyIsoDate());
  }, [id]);

  useEffect(() => {
    if (!asunto) return;
    setDescEdit(descripcionSinMarcador(asunto.descripcion) ?? "");
    setEstadoEdit(asunto.estado === "FINALIZADO" ? "FINALIZADO" : "EN_TRAMITE");
    setFechaCierreEstado(
      asunto.estado === "FINALIZADO" && asunto.fechaFinalizacion
        ? fechaAsuntoADateInput(asunto.fechaFinalizacion)
        : hoyIsoDate(),
    );
  }, [asunto?.id, asunto?.descripcion, asunto?.estado, asunto?.fechaFinalizacion]);

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

  async function guardarDescripcionYEstado(e: React.FormEvent) {
    e.preventDefault();
    if (!asunto) return;

    const puedeEditarDescripcion = puedeMovimiento(rol);

    const prevDesc = (descripcionSinMarcador(asunto.descripcion) ?? "").trim();
    const nextDesc = descEdit.trim();
    const descCambio = puedeEditarDescripcion && nextDesc !== prevDesc;
    const estadoCambio = estadoEdit !== asunto.estado;

    if (!descCambio && !estadoCambio) {
      setMensaje("No hay cambios para guardar.");
      return;
    }

    setGuardandoFicha(true);
    setMensaje("");
    try {
      if (descCambio) {
        const r = await fetch(`/api/asuntos/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accion: "actualizarDescripcion", descripcion: nextDesc }),
        });
        const data = await r.json();
        if (!r.ok) {
          setMensaje(data?.error ?? "No se pudo guardar la descripción.");
          return;
        }
      }

      if (estadoCambio) {
        if (estadoEdit === "FINALIZADO") {
          if (!fechaCierreEstado) {
            setMensaje("Indicá la fecha de finalización.");
            return;
          }
          const r = await fetch(`/api/asuntos/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              accion: "finalizar",
              fechaFinalizacion: fechaCierreEstado,
            }),
          });
          const data = await r.json();
          if (!r.ok) {
            setMensaje(data?.error ?? "No se pudo finalizar.");
            return;
          }
        } else {
          if (!window.confirm("¿Reabrir este asunto? Quedará EN TRÁMITE.")) {
            setGuardandoFicha(false);
            return;
          }
          const r = await fetch(`/api/asuntos/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ accion: "reabrir" }),
          });
          const data = await r.json();
          if (!r.ok) {
            setMensaje(data?.error ?? "No se pudo reabrir.");
            return;
          }
        }
      }

      await cargar();
      router.refresh();
    } catch {
      setMensaje("Error de conexión.");
    } finally {
      setGuardandoFicha(false);
    }
  }

  if (cargando) {
    return (
      <div className="panel-alta flex min-h-[14rem] flex-col items-center justify-center gap-4 py-14">
        <span className={estudioSpinnerLg} aria-hidden />
        <p className="muted">Cargando ficha…</p>
      </div>
    );
  }

  if (!asunto) {
    return (
      <div className="panel-alta">
        <p className="error">{mensaje || "Asunto no encontrado."}</p>
        <Link href="/estudio/asuntos" className="btn btn-secondary mt-6 inline-flex">
          Volver al listado
        </Link>
      </div>
    );
  }

  const enTramite = asunto.estado === "EN_TRAMITE";
  const puedeEditarDescripcion = puedeMovimiento(rol);
  /** Descripción solo según rol; el estado (combo) está disponible para cualquier usuario con sesión. */
  const mostrarTarjetaEditable = true;
  const mostrarFechaCierre =
    estadoEdit === "FINALIZADO" && asunto.estado === "EN_TRAMITE";

  const descripcionLectura = descripcionSinMarcador(asunto.descripcion);

  return (
    <div className="w-full space-y-6 text-left sm:space-y-8">
      <div className="panel-alta">
        <p className="muted mt-0">
          <Link href="/estudio/asuntos">← Asuntos</Link>
          {" · "}
          <Link href={`/estudio/clientes/${asunto.cliente.id}/editar`}>{asunto.cliente.nombre}</Link>
        </p>
        <div className="section-head asunto-title-row">
          <h1 className="page-title">
            Asunto #{asunto.ordinal}{" "}
            <span className={`badge ${enTramite ? "warn" : "ok"}`}>
              {enTramite ? "En trámite" : "Finalizado"}
            </span>
          </h1>
        </div>
        <p className="muted">
          {asunto.catalogo.nombre} · {etiquetaTipoAsunto(asunto.tipo)}
        </p>
        {mostrarTarjetaEditable && descripcionLectura ? (
          <p className="mt-2 text-[0.95rem] leading-relaxed text-[var(--ac-text)]">{descripcionLectura}</p>
        ) : null}
        <dl className="dl-grid mt-4">
          <dt>Inicio</dt>
          <dd>{fmtFecha(asunto.fechaInicio)}</dd>
          <dt>Finalización</dt>
          <dd>{fmtFecha(asunto.fechaFinalizacion)}</dd>
          <dt>Alerta venc.</dt>
          <dd>{fmtFecha(asunto.fechaAlertaVencimiento)}</dd>
          <dt>Último movimiento</dt>
          <dd>
            {fmtFecha(asunto.ultimoMovimientoFecha)}
            {asunto.ultimoMovimientoTexto ? (
              <>
                <br />
                <span className="muted">{asunto.ultimoMovimientoTexto}</span>
              </>
            ) : null}
          </dd>
          <dt>Socio referente</dt>
          <dd>{asunto.socioReferente?.nombre?.trim() ? asunto.socioReferente.nombre : "—"}</dd>
          <dt>Profesional a cargo</dt>
          <dd>
            {asunto.profesionalACargo ? (
              <>
                {asunto.profesionalACargo.nombre}
                <span className="muted">
                  {" "}
                  (
                  {ETIQUETA_PUESTO[asunto.profesionalACargo.puesto as PuestoCatalogo] ??
                    asunto.profesionalACargo.puesto}
                  {asunto.profesionalACargo.funcion ? ` — ${asunto.profesionalACargo.funcion}` : ""})
                </span>
              </>
            ) : (
              <span className="muted">{profesionalLibreDesdeDescripcion(asunto.descripcion) ?? "—"}</span>
            )}
          </dd>
          <dt>Colaboradores</dt>
          <dd>
            {[asunto.colaboradorACargo?.nombre, asunto.colaboradorACargo2?.nombre].filter(Boolean).join(" · ") || "—"}
          </dd>
          <dt>Contador</dt>
          <dd>{asunto.contadorReferente?.nombre?.trim() ? asunto.contadorReferente.nombre : "—"}</dd>
          {!puedeEditarDescripcion ? (
            <>
              <dt>Descripción</dt>
              <dd className="whitespace-pre-wrap">{descripcionLectura || "—"}</dd>
            </>
          ) : null}
        </dl>
      </div>

      {enTramite && puedeReasignarEquipo(rol) && !accionReasignarAbierta ? (
        <div className="panel-alta">
          <button
            type="button"
            className="text-sm font-semibold text-[var(--ac-accent)] underline decoration-[var(--ac-accent)]/35 underline-offset-2 transition hover:text-[var(--ac-accent-hover)]"
            onClick={() => setAccionReasignarAbierta(true)}
          >
            Reasignar equipo…
          </button>
        </div>
      ) : null}

      {mensaje ? (
        <p className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-950 ring-1 ring-amber-200/50">{mensaje}</p>
      ) : null}

      {mostrarTarjetaEditable ? (
        <form className={`${editableShell}`} onSubmit={(ev) => void guardarDescripcionYEstado(ev)}>
          <div>
            <h2 className="text-base font-bold text-emerald-900">Descripción y estado</h2>
            <p className="mt-1 text-xs leading-relaxed text-emerald-900/75">
              Los campos editables están en este recuadro. El resto del expediente es solo referencia.
            </p>
          </div>

          <label className="block space-y-2">
            <span className="text-xs font-semibold text-emerald-900">Descripción</span>
            <textarea
              className="input-app min-h-[7rem] resize-y disabled:cursor-not-allowed disabled:bg-neutral-100 disabled:text-neutral-500"
              value={descEdit}
              onChange={(e) => setDescEdit(e.target.value)}
              disabled={!puedeEditarDescripcion}
              placeholder={puedeEditarDescripcion ? "Texto libre del asunto…" : "Tu rol no permite editar la descripción."}
            />
          </label>

          <div className="space-y-3 rounded-xl border border-emerald-200/60 bg-emerald-50/40 p-4">
            <label className="block space-y-2">
              <span className="text-xs font-semibold text-emerald-900">Estado del expediente</span>
              <select
                className="input-app font-medium text-neutral-900"
                value={estadoEdit}
                onChange={(e) => setEstadoEdit(e.target.value as "EN_TRAMITE" | "FINALIZADO")}
                aria-label="Estado del expediente"
              >
                <option value="EN_TRAMITE">En trámite</option>
                <option value="FINALIZADO">Finalizado</option>
              </select>
            </label>
            {mostrarFechaCierre ? (
              <label className="block space-y-2">
                <span className="text-xs font-semibold text-emerald-900">Fecha de finalización</span>
                <input
                  className="input-app max-w-xs"
                  type="date"
                  value={fechaCierreEstado}
                  onChange={(e) => setFechaCierreEstado(e.target.value)}
                />
              </label>
            ) : null}
          </div>

          <button type="submit" className="btn btn-primary" disabled={guardandoFicha}>
            {guardandoFicha ? "Guardando…" : "Guardar cambios"}
          </button>
        </form>
      ) : null}

      {enTramite && puedeReasignarEquipo(rol) && accionReasignarAbierta && cargandoReaCat ? (
        <p className="muted text-sm">Cargando catalogos para reasignar…</p>
      ) : null}

      {enTramite &&
      puedeReasignarEquipo(rol) &&
      accionReasignarAbierta &&
      !cargandoReaCat ? (
        <form className="panel-alta form space-y-4" onSubmit={(ev) => void reasignarEquipo(ev)}>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h2 className="page-title-sub">Reasignar equipo</h2>
            <button
              type="button"
              className="shrink-0 text-sm font-medium text-[var(--gris-texto)] underline decoration-[rgba(0,166,81,0.35)] underline-offset-2 hover:text-[var(--verde-titulo)]"
              onClick={() => setAccionReasignarAbierta(false)}
            >
              Ocultar
            </button>
          </div>
          <p className="muted text-sm">
            Solo asuntos EN TRAMITE. Los cambios quedan en historial y auditoria. Ajustá solo lo que deba cambiar
            respecto del cuadro actual.
          </p>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-xs font-medium text-[var(--verde-titulo)]">Socio referente (opcional)</span>
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
              <span className="text-xs font-medium text-[var(--verde-titulo)]">Equipo a cargo (legal / notarial, opcional)</span>
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
              <span className="text-xs font-medium text-[var(--verde-titulo)]">Colaborador 1 (opcional)</span>
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
              <span className="text-xs font-medium text-[var(--verde-titulo)]">Colaborador 2 (opcional)</span>
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
              <span className="text-xs font-medium text-[var(--verde-titulo)]">Contador referente (opcional)</span>
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
              <span className="text-xs font-medium text-[var(--verde-titulo)]">Nota en historial</span>
              <input
                className="input-app"
                value={reaNota}
                onChange={(e) => setReaNota(e.target.value)}
                placeholder="Texto del movimiento registrado"
              />
            </label>
          </div>
          <button className="btn btn-primary" type="submit" disabled={guardandoRea}>
            {guardandoRea ? "Guardando…" : "Guardar reasignación"}
          </button>
        </form>
      ) : null}

      {enTramite && puedeMovimiento(rol) ? (
        <form className="panel-alta form space-y-4" onSubmit={registrarMovimiento}>
          <h2 className="page-title-sub">Nuevo movimiento</h2>
          <textarea
            className="input-app min-h-24 resize-y"
            placeholder="Descripcion del movimiento"
            value={movTexto}
            onChange={(e) => setMovTexto(e.target.value)}
          />
          <label className="block space-y-1">
            <span className="text-xs font-medium text-[var(--verde-titulo)]">Fecha (por defecto hoy; podés cambiarla)</span>
            <input
              className="input-app w-full max-w-full sm:max-w-xs"
              type="date"
              value={movFecha}
              onChange={(e) => setMovFecha(e.target.value)}
            />
          </label>
          <button className="btn btn-primary" type="submit" disabled={guardandoMov}>
            {guardandoMov ? "Guardando…" : "Registrar movimiento"}
          </button>
        </form>
      ) : enTramite && !puedeMovimiento(rol) ? (
        <p className="muted text-sm">Tu rol no permite registrar movimientos en este asunto.</p>
      ) : null}

      <div className="panel-alta">
        <h2 className="page-title-sub">Seguimientos</h2>
        {seguimientosOrdenados.length === 0 ? (
          <p className="muted mt-2">Sin movimientos registrados.</p>
        ) : (
          <ul className="timeline">
            {seguimientosOrdenados.map((s) => (
              <li key={s.id}>
                <strong>{fmtFecha(s.fecha)}</strong>
                <div className="whitespace-pre-wrap">{s.descripcion}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
