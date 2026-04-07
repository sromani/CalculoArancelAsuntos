"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { datosPorCapitulo } from "@/lib/arancel/data";

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

export function FormularioAsunto() {
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
      <p className="flex items-center gap-3 text-sm text-neutral-500">
        <span
          className="inline-block size-4 shrink-0 animate-spin rounded-full border-2 border-neutral-200 border-t-[var(--verde-principal)]"
          aria-hidden
        />
        Cargando catálogos…
      </p>
    );
  }

  return (
    <form className="space-y-8 rounded-lg bg-white p-6 sm:p-8" onSubmit={onSubmit}>
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">Cliente</span>
          {clienteElegido ? (
            <div className="flex flex-wrap items-center gap-2 rounded-md bg-[rgba(0,166,81,0.06)] px-3 py-2 text-sm text-neutral-800">
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
                  className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-lg bg-white py-1 text-sm shadow-lg shadow-black/10 ring-1 ring-black/[0.08]"
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

      <div className="space-y-3 border-t border-neutral-100 pt-8">
        <label className="space-y-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">Asunto (catálogo)</span>
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

      <label className="space-y-1.5">
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

      <label className="space-y-1.5">
        <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">Descripción (opcional)</span>
        <textarea
          className="input-app min-h-20 resize-y"
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />
      </label>

      <div className="grid gap-5 md:grid-cols-2">
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

      <div className="border-t border-neutral-100 pt-8">
        <button
          className="btn-primary w-full min-h-[3rem] rounded-[10px] border-2 border-transparent px-8 py-3 text-base font-semibold shadow-md shadow-[rgba(0,166,81,0.15)] transition hover:shadow-lg hover:shadow-[rgba(0,166,81,0.2)] disabled:opacity-50 sm:w-auto"
          disabled={guardando}
          type="submit"
        >
          {guardando ? "Guardando..." : "Crear asunto"}
        </button>
      </div>

      {mensaje ? (
        <p className="rounded-md bg-neutral-50 px-4 py-3 text-sm text-neutral-800 ring-1 ring-black/[0.06]">{mensaje}</p>
      ) : null}
    </form>
  );
}
