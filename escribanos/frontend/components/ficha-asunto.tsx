"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  type PuestoCatalogo,
  ETIQUETA_PUESTO,
} from "@/lib/profesional-equipo-catalogo";
import { estudioSpinnerLg } from "@/lib/estudio-estilos";
import { EstudioButton, EstudioLinkButton } from "@/components/ui/estudio-button";
import { EstudioListaBuscableSelect } from "@/components/estudio-lista-buscable-select";

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

/** Valor para input type="date" cuando la fecha es opcional (sin valor = cadena vacía). */
function fechaIsoADateInputOptional(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
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
  const [guardandoMov, setGuardandoMov] = useState(false);
  const [profesionalesCat, setProfesionalesCat] = useState<ProfesionalItem[]>([]);
  const [sociosCat, setSociosCat] = useState<SocioItem[]>([]);
  const [reaSocioId, setReaSocioId] = useState("");
  const [reaProfId, setReaProfId] = useState("");
  const [reaCol1, setReaCol1] = useState("");
  const [reaCol2, setReaCol2] = useState("");
  const [reaCont, setReaCont] = useState("");
  const [reaAlerta, setReaAlerta] = useState("");
  const [reaNota, setReaNota] = useState("Actualizacion de equipo o alerta del asunto.");
  const [cargandoReaCat, setCargandoReaCat] = useState(false);

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
      setReaAlerta(fechaIsoADateInputOptional(ficha.fechaAlertaVencimiento));

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
    if (asunto?.estado !== "EN_TRAMITE" || !puedeMovimiento(rol)) {
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
  }, [asunto?.estado, rol, asunto?.id]);

  const seguimientosOrdenados = useMemo(() => {
    if (!asunto) return [];
    return [...asunto.seguimientos].sort(
      (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime(),
    );
  }, [asunto]);

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
      const body = { descripcion: movTexto.trim() };
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

  const opcionesSocio = useMemo(
    () => sociosCat.map((s) => ({ value: s.id, label: s.nombre })),
    [sociosCat],
  );
  const opcionesLegalACargo = useMemo(
    () =>
      legalACargo.map((p) => ({
        value: p.id,
        label: `${p.nombre} (${ETIQUETA_PUESTO[p.puesto as PuestoCatalogo] ?? p.puesto})`,
      })),
    [legalACargo],
  );
  const opcionesColaborador1 = useMemo(
    () => elegiblesCol1.map((p) => ({ value: p.id, label: p.nombre })),
    [elegiblesCol1],
  );
  const opcionesColaborador2 = useMemo(
    () => elegiblesCol2.map((p) => ({ value: p.id, label: p.nombre })),
    [elegiblesCol2],
  );
  const opcionesContador = useMemo(
    () => contadoresLista.map((p) => ({ value: p.id, label: p.nombre })),
    [contadoresLista],
  );

  async function guardarDescripcionYEstado(e: React.FormEvent) {
    e.preventDefault();
    if (!asunto) return;

    const puedeEditarDescripcion = puedeMovimiento(rol);
    const enTramiteLocal = asunto.estado === "EN_TRAMITE";
    const puedeEditarEquipoYAlerta = enTramiteLocal && puedeEditarDescripcion;

    const prevDesc = (descripcionSinMarcador(asunto.descripcion) ?? "").trim();
    const nextDesc = descEdit.trim();
    const descCambio = puedeEditarDescripcion && nextDesc !== prevDesc;
    const estadoCambio = estadoEdit !== asunto.estado;

    const alertActualStr = fechaIsoADateInputOptional(asunto.fechaAlertaVencimiento);
    const alertNuevaStr = reaAlerta.trim();
    const alertCambio = alertNuevaStr !== alertActualStr;

    const equipoCambio =
      (reaSocioId || "") !== (asunto.socioReferente?.id ?? "") ||
      (reaProfId || "") !== (asunto.profesionalACargo?.id ?? "") ||
      (reaCol1 || "") !== (asunto.colaboradorACargo?.id ?? "") ||
      (reaCol2 || "") !== (asunto.colaboradorACargo2?.id ?? "") ||
      (reaCont || "") !== (asunto.contadorReferente?.id ?? "");

    const equipoOAlertaCambio = puedeEditarEquipoYAlerta && (equipoCambio || alertCambio);

    if (!descCambio && !estadoCambio && !equipoOAlertaCambio) {
      setMensaje("No hay cambios para guardar.");
      return;
    }

    setGuardandoFicha(true);
    setMensaje("");
    try {
      if (equipoOAlertaCambio) {
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
            fechaAlertaVencimiento: alertNuevaStr === "" ? null : alertNuevaStr,
            notaSeguimiento: reaNota.trim() || "Actualizacion de equipo o alerta del asunto.",
          }),
        });
        const data = await response.json();
        if (!response.ok) {
          setMensaje(data?.error ?? "No se pudo guardar equipo o alerta.");
          return;
        }
      }

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
        <EstudioLinkButton href="/estudio/asuntos" variant="secondary" className="mt-6">
          Volver al listado
        </EstudioLinkButton>
      </div>
    );
  }

  const enTramite = asunto.estado === "EN_TRAMITE";
  const puedeEditarDescripcion = puedeMovimiento(rol);
  const editarEquipoEnFicha = enTramite && puedeEditarDescripcion;
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
        <p className="mt-2 flex flex-wrap gap-3 text-sm">
          <Link href={`/estudio/gastos?asuntoId=${asunto.id}`} className="text-emerald-800 underline">
            Gastos del asunto
          </Link>
          <Link
            href={`/estudio/presupuestos/nuevo?clienteId=${asunto.cliente.id}&asuntoId=${asunto.id}`}
            className="text-emerald-800 underline"
          >
            Nuevo presupuesto
          </Link>
        </p>
        {mostrarTarjetaEditable && descripcionLectura && !puedeEditarDescripcion ? (
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

      {mensaje ? (
        <p className="rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-950 ring-1 ring-amber-200/50">{mensaje}</p>
      ) : null}

      {mostrarTarjetaEditable ? (
        <form className={`${editableShell}`} onSubmit={(ev) => void guardarDescripcionYEstado(ev)}>
          <div>
            <h2 className="text-base font-bold text-emerald-900">Datos del expediente</h2>
            <p className="mt-1 text-xs leading-relaxed text-emerald-900/75">
              Arriba tenés el mismo resumen del expediente que en asuntos finalizados. Desde aquí podés editar
              descripción y estado; en trámite también equipo y alerta. La fecha de inicio y las fechas del historial
              no se modifican.
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

          {editarEquipoEnFicha ? (
            <div className="space-y-3 rounded-xl border border-emerald-200/60 bg-emerald-50/40 p-4">
              <h3 className="text-sm font-bold text-emerald-900">Equipo y alerta de vencimiento</h3>
              {cargandoReaCat ? (
                <p className="text-xs text-emerald-900/80">Cargando catálogos…</p>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  <EstudioListaBuscableSelect
                    id="ficha-asunto-socio"
                    label="Socio referente (opcional)"
                    opciones={opcionesSocio}
                    value={reaSocioId}
                    onChange={setReaSocioId}
                  />
                  <EstudioListaBuscableSelect
                    id="ficha-asunto-legal"
                    label="Profesional a cargo (opcional)"
                    opciones={opcionesLegalACargo}
                    value={reaProfId}
                    onChange={setReaProfId}
                  />
                  <EstudioListaBuscableSelect
                    id="ficha-asunto-col1"
                    label="Colaborador 1 (opcional)"
                    opciones={opcionesColaborador1}
                    value={reaCol1}
                    onChange={setReaCol1}
                    vacioLabel="—"
                    placeholder="Escribí para filtrar colaboradores…"
                  />
                  <EstudioListaBuscableSelect
                    id="ficha-asunto-col2"
                    label="Colaborador 2 (opcional)"
                    opciones={opcionesColaborador2}
                    value={reaCol2}
                    onChange={setReaCol2}
                    vacioLabel="—"
                    placeholder="Escribí para filtrar colaboradores…"
                  />
                  <div className="md:col-span-2">
                    <EstudioListaBuscableSelect
                      id="ficha-asunto-contador"
                      label="Contador referente (opcional)"
                      opciones={opcionesContador}
                      value={reaCont}
                      onChange={setReaCont}
                      vacioLabel="—"
                      placeholder="Escribí para filtrar contadores…"
                    />
                  </div>
                  <label className="space-y-1 md:col-span-2">
                    <span className="text-xs font-semibold text-emerald-900">Alerta de vencimiento (opcional)</span>
                    <input
                      className="input-app max-w-xs"
                      type="date"
                      value={reaAlerta}
                      onChange={(e) => setReaAlerta(e.target.value)}
                    />
                    <span className="block text-[0.7rem] text-emerald-900/70">
                      No puede ser anterior a la fecha de inicio del asunto.
                    </span>
                  </label>
                  <label className="space-y-1 md:col-span-2">
                    <span className="text-xs font-semibold text-emerald-900">Nota en historial (al guardar equipo o alerta)</span>
                    <input
                      className="input-app"
                      value={reaNota}
                      onChange={(e) => setReaNota(e.target.value)}
                      placeholder="Texto del movimiento registrado en el historial"
                    />
                  </label>
                </div>
              )}
            </div>
          ) : null}

          <EstudioButton type="submit" variant="primary" disabled={guardandoFicha}>
            {guardandoFicha ? "Guardando…" : "Guardar cambios"}
          </EstudioButton>
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
          <p className="text-xs text-[var(--gris-texto)]">
            La fecha y hora del movimiento son las del momento en que lo registrás (no se puede editar).
          </p>
          <EstudioButton variant="primary" type="submit" disabled={guardandoMov}>
            {guardandoMov ? "Guardando…" : "Registrar movimiento"}
          </EstudioButton>
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
