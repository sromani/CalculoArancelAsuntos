"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { datosPorCapitulo } from "@/lib/arancel/data";
import {
  estudioAlertInfo,
  estudioBtnPrimario,
  estudioFormShell,
  estudioSectionRule,
  estudioSectionTitle,
  estudioSpinner,
} from "@/lib/estudio-estilos";

type TipoAsunto = "TODOS" | "NOTARIAL" | "LEGAL";

type ClienteItem = {
  id: string;
  nombre: string;
  documento: string;
};

type AsuntoItem = {
  id: string;
  nombre: string;
};

type ProfesionalItem = {
  id: string;
  nombre: string;
  grupo: string;
};

function hoyIsoDate(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

type FormularioAsuntoProps = {
  /** Mismo layout visual que «Asuntos y Clientes» (alta de asunto). */
  legacyAlta?: boolean;
};

export function FormularioAsunto({ legacyAlta = false }: FormularioAsuntoProps) {
  const router = useRouter();
  const [tipo, setTipo] = useState<TipoAsunto>("NOTARIAL");
  const [asuntos, setAsuntos] = useState<AsuntoItem[]>([]);
  const [profesionales, setProfesionales] = useState<ProfesionalItem[]>([]);
  const [clienteElegido, setClienteElegido] = useState<ClienteItem | null>(null);
  const [busquedaCliente, setBusquedaCliente] = useState("");
  const [resultadosCliente, setResultadosCliente] = useState<ClienteItem[]>([]);
  const [buscandoClientes, setBuscandoClientes] = useState(false);
  const [listaClienteAbierta, setListaClienteAbierta] = useState(false);
  const contenedorBusquedaClienteRef = useRef<HTMLDivElement>(null);

  const [asuntoSeleccionado, setAsuntoSeleccionado] = useState("");
  const [nuevoAsunto, setNuevoAsunto] = useState("");
  const [profesionalACargoTexto, setProfesionalACargoTexto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fechaInicio, setFechaInicio] = useState(hoyIsoDate);
  const [fechaAlerta, setFechaAlerta] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [cargando, setCargando] = useState(true);

  const profesionalesLegalACargo = useMemo(
    () => profesionales.filter((p) => p.grupo === "LEGAL_A_CARGO"),
    [profesionales],
  );

  const asuntosDesdeSimulador = useMemo(() => {
    const base = Object.values(datosPorCapitulo)
      .flatMap((cap) => cap.documentos.map((doc) => doc.nombre.trim()))
      .filter(Boolean);
    return Array.from(new Set(base)).sort((a, b) => a.localeCompare(b, "es"));
  }, []);

  const opcionesCatalogo = useMemo(() => {
    const actuales = asuntos.map((a) => a.nombre.trim()).filter(Boolean);
    const mezclados = Array.from(new Set([...asuntosDesdeSimulador, ...actuales]));
    return mezclados.sort((a, b) => a.localeCompare(b, "es"));
  }, [asuntos, asuntosDesdeSimulador]);

  useEffect(() => {
    async function cargarCatalogos() {
      try {
        const response = await fetch("/api/catalogos");
        const data = await response.json();
        if (!response.ok) {
          setMensaje(data?.error ?? "No se pudieron cargar los catalogos.");
          return;
        }

        const asuntosData = (data?.asuntos ?? []) as AsuntoItem[];
        const profesionalesData = (data?.profesionales ?? []) as ProfesionalItem[];
        setAsuntos(asuntosData);
        setProfesionales(profesionalesData);
        setAsuntoSeleccionado(asuntosData[0]?.nombre ?? "");
      } catch {
        setMensaje("Error al cargar catalogos.");
      } finally {
        setCargando(false);
      }
    }

    void cargarCatalogos().catch(() => {
      setMensaje("Error al cargar catalogos.");
      setCargando(false);
    });
  }, []);

  useEffect(() => {
    const q = busquedaCliente.trim();
    if (q.length < 2) {
      setResultadosCliente([]);
      setBuscandoClientes(false);
      return;
    }
    const handle = window.setTimeout(() => {
      setBuscandoClientes(true);
      void fetch(`/api/clientes?q=${encodeURIComponent(q)}`)
        .then(async (response) => {
          const data = (await response.json().catch(() => [])) as unknown;
          if (!response.ok || !Array.isArray(data)) {
            setResultadosCliente([]);
            return;
          }
          setResultadosCliente(
            data.map((row) => ({
              id: String((row as ClienteItem).id),
              nombre: String((row as ClienteItem).nombre),
              documento: String((row as ClienteItem).documento),
            })),
          );
        })
        .catch(() => setResultadosCliente([]))
        .finally(() => setBuscandoClientes(false));
    }, 320);
    return () => window.clearTimeout(handle);
  }, [busquedaCliente]);

  useEffect(() => {
    function onPointerDown(e: PointerEvent) {
      const el = contenedorBusquedaClienteRef.current;
      if (el && !el.contains(e.target as Node)) {
        setListaClienteAbierta(false);
      }
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!clienteElegido?.id) {
      setMensaje("Debes buscar y seleccionar un cliente.");
      return;
    }

    if (!asuntoSeleccionado.trim()) {
      setMensaje("Debes seleccionar un asunto del catálogo o escribir uno nuevo.");
      return;
    }

    const asuntoFinal = asuntoSeleccionado === "__OTRO__" ? nuevoAsunto.trim() : asuntoSeleccionado.trim();
    if (!asuntoFinal) {
      setMensaje("Si elegís 'Otro', escribí el nombre del asunto.");
      return;
    }

    const profesionalTexto = profesionalACargoTexto.trim();
    const profesionalMatch = profesionalesLegalACargo.find(
      (p) => p.nombre.trim().toLocaleLowerCase("es-UY") === profesionalTexto.toLocaleLowerCase("es-UY"),
    );
    const profesionalACargoId = profesionalMatch?.id ?? null;
    const profesionalLibre = profesionalTexto && !profesionalMatch ? profesionalTexto : null;
    const descripcionFinal = [
      profesionalLibre ? `[PROFESIONAL_A_CARGO_LIBRE]: ${profesionalLibre}` : "",
      descripcion.trim(),
    ]
      .filter(Boolean)
      .join("\n");

    setGuardando(true);
    try {
      const response = await fetch("/api/asuntos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo,
          clienteId: clienteElegido.id,
          asuntoNombre: asuntoFinal,
          profesionalACargoId,
          colaboradorACargoId: null,
          colaboradorACargo2Id: null,
          contadorReferenteId: null,
          socioReferenteId: null,
          descripcion: descripcionFinal || null,
          fechaInicio: fechaInicio || undefined,
          fechaAlertaVencimiento: fechaAlerta || null,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        const base = (data?.error as string) ?? "No se pudo crear el asunto.";
        const detalle =
          typeof data?.detalle === "string" && data.detalle.trim() !== "" ? `\n\n${data.detalle}` : "";
        setMensaje(`${base}${detalle}`);
        return;
      }

      router.push(`/estudio/asuntos/${data.id}`);
    } catch {
      setMensaje("Error de conexion con el servidor.");
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) {
    return (
      <p
        className={
          legacyAlta
            ? "muted flex items-center gap-2 text-sm"
            : "flex items-center gap-3 text-xs text-neutral-500"
        }
      >
        <span className={estudioSpinner} aria-hidden />
        Cargando catálogos…
      </p>
    );
  }

  return (
    <form
      className={
        legacyAlta ? "form text-left" : `${estudioFormShell} space-y-10 text-left`
      }
      onSubmit={onSubmit}
    >
      <div>
        <h2 className={estudioSectionTitle}>Cliente y tipo</h2>
        <p className="mt-2 text-xs text-neutral-600">Buscá al cliente y definí si el expediente es notarial o legal.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">Cliente</span>
          {clienteElegido ? (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[rgba(0,166,81,0.2)] bg-[rgba(0,166,81,0.06)] px-3 py-2 text-xs text-neutral-800">
              <span className="min-w-0 flex-1 font-medium">
                {clienteElegido.nombre}{" "}
                <span className="font-normal text-neutral-600">— {clienteElegido.documento}</span>
              </span>
              <button
                type="button"
                className="shrink-0 rounded-md bg-white px-2.5 py-1 text-xs font-medium text-emerald-900 shadow-sm ring-1 ring-emerald-200/60 hover:bg-emerald-100/80"
                onClick={() => {
                  setClienteElegido(null);
                  setBusquedaCliente("");
                  setResultadosCliente([]);
                  setListaClienteAbierta(false);
                }}
              >
                Cambiar
              </button>
            </div>
          ) : (
            <div ref={contenedorBusquedaClienteRef} className="relative">
              <input
                type="search"
                autoComplete="off"
                className="input-app w-full"
                placeholder="Ej. Garcia o 12345678"
                value={busquedaCliente}
                onChange={(e) => {
                  setBusquedaCliente(e.target.value);
                  setListaClienteAbierta(true);
                }}
                onFocus={() => setListaClienteAbierta(true)}
                aria-autocomplete="list"
                aria-expanded={listaClienteAbierta}
                aria-controls="lista-busqueda-clientes"
              />
              {listaClienteAbierta && busquedaCliente.trim().length >= 2 ? (
                <ul
                  id="lista-busqueda-clientes"
                  role="listbox"
                  className="absolute z-20 mt-1.5 max-h-56 w-full overflow-auto rounded-xl border border-neutral-200/80 bg-white py-1 text-xs shadow-[0_12px_40px_-12px_rgba(15,23,42,0.2)]"
                >
                  {buscandoClientes ? (
                    <li className="px-3 py-2 text-[var(--gris-texto)]">Buscando...</li>
                  ) : resultadosCliente.length === 0 ? (
                    <li className="px-3 py-2 text-[var(--gris-texto)]">Sin resultados.</li>
                  ) : (
                    resultadosCliente.map((c) => (
                      <li key={c.id} role="option">
                        <button
                          type="button"
                          className="flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left hover:bg-[var(--fondo-verde-muy-claro)]"
                          onClick={() => {
                            setClienteElegido(c);
                            setBusquedaCliente("");
                            setResultadosCliente([]);
                            setListaClienteAbierta(false);
                          }}
                        >
                          <span className="font-medium text-neutral-900">{c.nombre}</span>
                          <span className="text-xs text-[var(--gris-texto)]/90">{c.documento}</span>
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              ) : null}
            </div>
          )}
          <p className="text-xs text-[var(--gris-texto)]/80">
            Buscá por nombre o documento (minimo 2 caracteres). La lista puede ser muy grande.
          </p>
        </div>

        <label className="space-y-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">Tipo de asunto</span>
          <select
            className="input-app"
            value={tipo}
            onChange={(e) => setTipo(e.target.value as TipoAsunto)}
          >
            <option value="TODOS">Todos</option>
            <option value="NOTARIAL">Notarial</option>
            <option value="LEGAL">Legal</option>
          </select>
        </label>
      </div>

      <div
        className={
          legacyAlta ? "form-stack-section space-y-4" : `${estudioSectionRule} space-y-4`
        }
      >
        <h2 className={estudioSectionTitle}>Asunto del catálogo</h2>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">Selección</span>
          <select
            className="input-app"
            value={asuntoSeleccionado}
            onChange={(e) => {
              setAsuntoSeleccionado(e.target.value);
              setMensaje("");
            }}
          >
            <option value="">Seleccionar…</option>
            {opcionesCatalogo.map((nombre) => (
              <option key={nombre} value={nombre}>
                {nombre}
              </option>
            ))}
            <option value="__OTRO__">OTRO (escribir manualmente)</option>
          </select>
        </label>

        {asuntoSeleccionado === "__OTRO__" ? (
          <input
            className="input-app"
            placeholder="Escribir otro asunto"
            value={nuevoAsunto}
            onChange={(e) => setNuevoAsunto(e.target.value)}
          />
        ) : null}
      </div>

      <label className="block space-y-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          Profesional a cargo (opcional)
        </span>
        <input
          className="input-app"
          list="profesionales-a-cargo"
          value={profesionalACargoTexto}
          onChange={(e) => setProfesionalACargoTexto(e.target.value)}
          placeholder="Escribí el nombre del profesional"
        />
        <datalist id="profesionales-a-cargo">
          {profesionalesLegalACargo.map((p) => (
            <option key={p.id} value={p.nombre} />
          ))}
        </datalist>
      </label>

      <label className="block space-y-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">Descripción (opcional)</span>
        <textarea
          className="input-app min-h-20 resize-y"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />
      </label>

      <div className={legacyAlta ? "form-stack-section space-y-3" : "space-y-3"}>
        <h2 className={estudioSectionTitle}>Fechas</h2>
        <div className="grid gap-6 md:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">Fecha de inicio</span>
          <input
            className="input-app"
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">Alerta vencimiento (opcional)</span>
          <input
            className="input-app"
            type="date"
            value={fechaAlerta}
            onChange={(e) => setFechaAlerta(e.target.value)}
          />
        </label>
        </div>
      </div>

      <div
        className={
          legacyAlta ? "form-actions" : `${estudioSectionRule} flex flex-wrap gap-3`
        }
      >
        <button
          className={legacyAlta ? "btn btn-primary" : estudioBtnPrimario}
          disabled={guardando}
          type="submit"
        >
          {guardando ? "Guardando…" : "Guardar asunto"}
        </button>
        {legacyAlta ? (
          <Link href="/estudio/asuntos" className="btn btn-secondary">
            Cancelar
          </Link>
        ) : null}
      </div>

      {mensaje ? (
        <p className={legacyAlta ? "error" : estudioAlertInfo}>{mensaje}</p>
      ) : null}
    </form>
  );
}
