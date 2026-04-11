"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import {
  construirEstadoCivilPersistido,
  CODIGOS_ESTADO_CIVIL,
  ETIQUETA_ESTADO_CIVIL,
  ETIQUETA_TIPO_DOCUMENTO_CLIENTE,
  ETIQUETA_TIPO_PERSONA_CLIENTE,
  ETIQUETA_TIPO_SOCIAL_CLIENTE,
  etiquetaTipoDocumentoCliente,
  fechaIsoADateInput,
  mensajeValidacionDocumentoCliente,
  normalizarNombrePersona,
  normalizarDocumentoCliente,
  parseDomicilioClientePersistido,
  parseEstadoCivilDetallado,
  TIPOS_DOCUMENTO_CLIENTE,
  TIPOS_PERSONA_CLIENTE,
  TIPOS_SOCIAL_CLIENTE,
  type TipoDocumentoCliente,
  type TipoPersonaCliente,
  type TipoSocialCliente,
} from "@/lib/validaciones";
import {
  estudioAlertInfo,
  estudioBtnPrimario,
  estudioBtnSecundario,
  estudioFormShell,
  estudioLinkBack,
  estudioSectionRule,
  estudioSectionTitle,
} from "@/lib/estudio-estilos";

type ClienteCiExistente = {
  id: string;
  nombre: string;
  tipoDocumento: string;
  tipoPersona: string;
  documento: string;
  fechaNacimiento: string | Date | null;
  estadoCivil: string | null;
  contacto: string | null;
  telefono: string | null;
  email: string | null;
  domicilio: string | null;
  tipoSocial?: string | null;
};

type Props = {
  /** Si se indica, el formulario carga el cliente y guarda con PATCH. */
  clienteId?: string;
  onClienteCreado?: () => void;
  onClienteActualizado?: () => void;
  /** Listado / alta / edición: layout tipo «Asuntos y Clientes» (panel + `.form` + botones). */
  legacyLayout?: boolean;
};

function parsearNombreCompleto(valor: string): { apellidos: string; nombres: string } {
  const limpio = String(valor ?? "").trim();
  if (!limpio) return { apellidos: "", nombres: "" };
  const coma = limpio.indexOf(",");
  if (coma >= 0) {
    return {
      apellidos: limpio.slice(0, coma).trim(),
      nombres: limpio.slice(coma + 1).trim(),
    };
  }
  const partes = limpio.split(/\s+/);
  if (partes.length === 1) return { apellidos: partes[0], nombres: "" };
  return { apellidos: partes.slice(0, 1).join(" "), nombres: partes.slice(1).join(" ") };
}

function aplicarClienteAlFormulario(
  data: ClienteCiExistente & { domicilio?: string | null; tipoSocial?: string | null },
  setters: {
    setTipoDocumento: (v: TipoDocumentoCliente) => void;
    setTipoPersona: (v: TipoPersonaCliente) => void;
    setDocumento: (v: string) => void;
    setRazonSocial: (v: string) => void;
    setTipoSocial: (v: TipoSocialCliente | "") => void;
    setApellidos: (v: string) => void;
    setNombres: (v: string) => void;
    setFechaNacimiento: (v: string) => void;
    setEstadoCivil: (v: string) => void;
    setNupcias: (v: string) => void;
    setConyuge: (v: string) => void;
    setContacto: (v: string) => void;
    setTelefono: (v: string) => void;
    setEmail: (v: string) => void;
    setDomicilioCalle: (v: string) => void;
    setDomicilioNumero: (v: string) => void;
    setDomicilioApto: (v: string) => void;
    setDomicilioCiudad: (v: string) => void;
    setDomicilioDepartamento: (v: string) => void;
    setDomicilioPais: (v: string) => void;
    setDomicilioAclaraciones: (v: string) => void;
  },
) {
  setters.setTipoDocumento(data.tipoDocumento as TipoDocumentoCliente);
  setters.setTipoPersona(data.tipoPersona as TipoPersonaCliente);
  setters.setDocumento(data.documento ?? "");
  if (data.tipoPersona === "JURIDICA") {
    setters.setRazonSocial(data.nombre ?? "");
    setters.setTipoSocial(
      data.tipoSocial && (TIPOS_SOCIAL_CLIENTE as readonly string[]).includes(data.tipoSocial)
        ? (data.tipoSocial as TipoSocialCliente)
        : "",
    );
    setters.setApellidos("");
    setters.setNombres("");
  } else {
    const nombrePartes = parsearNombreCompleto(data.nombre ?? "");
    setters.setApellidos(nombrePartes.apellidos);
    setters.setNombres(nombrePartes.nombres);
    setters.setRazonSocial("");
    setters.setTipoSocial("");
  }
  setters.setFechaNacimiento(fechaIsoADateInput(data.fechaNacimiento));
  const ec = data.estadoCivil ? parseEstadoCivilDetallado(data.estadoCivil) : null;
  setters.setEstadoCivil(ec?.codigo ?? "");
  setters.setNupcias(ec?.nupcias ? String(ec.nupcias) : "1");
  setters.setConyuge(ec?.conyuge ?? "");
  setters.setContacto(data.contacto ?? "");
  setters.setTelefono(data.telefono ?? "");
  setters.setEmail(data.email ?? "");
  const dom = parseDomicilioClientePersistido(data.domicilio ?? null);
  setters.setDomicilioCalle(dom.calle);
  setters.setDomicilioNumero(dom.numero);
  setters.setDomicilioApto(dom.apto);
  setters.setDomicilioCiudad(dom.ciudad);
  setters.setDomicilioDepartamento(dom.departamento);
  setters.setDomicilioPais(dom.pais);
  setters.setDomicilioAclaraciones(dom.aclaraciones);
}

export function FormularioCliente({
  clienteId,
  onClienteCreado,
  onClienteActualizado,
  legacyLayout = false,
}: Props) {
  const router = useRouter();
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumentoCliente>("CI");
  const [tipoPersona, setTipoPersona] = useState<TipoPersonaCliente>("FISICA");
  const [documento, setDocumento] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [nombres, setNombres] = useState("");
  /** Persona jurídica: una sola razón social. */
  const [razonSocial, setRazonSocial] = useState("");
  const [tipoSocial, setTipoSocial] = useState<TipoSocialCliente | "">("");
  const [contacto, setContacto] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [domicilioCalle, setDomicilioCalle] = useState("");
  const [domicilioNumero, setDomicilioNumero] = useState("");
  const [domicilioApto, setDomicilioApto] = useState("");
  const [domicilioCiudad, setDomicilioCiudad] = useState("");
  const [domicilioDepartamento, setDomicilioDepartamento] = useState("");
  const [domicilioPais, setDomicilioPais] = useState("");
  const [domicilioAclaraciones, setDomicilioAclaraciones] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [estadoCivil, setEstadoCivil] = useState("");
  const [nupcias, setNupcias] = useState("1");
  const [conyuge, setConyuge] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [ciExistente, setCiExistente] = useState<ClienteCiExistente | null>(null);
  const [buscandoCi, setBuscandoCi] = useState(false);
  /** Hubo autocompletado desde el servidor; si luego la CI no existe, se limpian esos campos. */
  const huboAutocompletadoRef = useRef(false);
  const [cargandoCliente, setCargandoCliente] = useState(Boolean(clienteId));
  const [errorCarga, setErrorCarga] = useState<string | null>(null);

  const esEdicion = Boolean(clienteId);

  useEffect(() => {
    if (!clienteId) {
      setCargandoCliente(false);
      setErrorCarga(null);
      return;
    }
    const ac = new AbortController();
    setCargandoCliente(true);
    setErrorCarga(null);
    void (async () => {
      try {
        const r = await fetch(`/api/clientes/${clienteId}`, { signal: ac.signal });
        const data = (await r.json()) as ClienteCiExistente & { error?: string };
        if (ac.signal.aborted) return;
        if (!r.ok) {
          setErrorCarga(data?.error ?? "No se pudo cargar el cliente.");
          setCargandoCliente(false);
          return;
        }
        aplicarClienteAlFormulario(
          data,
          {
            setTipoDocumento,
            setTipoPersona,
            setDocumento,
            setRazonSocial,
            setTipoSocial,
            setApellidos,
            setNombres,
            setFechaNacimiento,
            setEstadoCivil,
            setNupcias,
            setConyuge,
            setContacto,
            setTelefono,
            setEmail,
            setDomicilioCalle,
            setDomicilioNumero,
            setDomicilioApto,
            setDomicilioCiudad,
            setDomicilioDepartamento,
            setDomicilioPais,
            setDomicilioAclaraciones,
          },
        );
        setCiExistente(null);
        huboAutocompletadoRef.current = false;
        setMensaje("");
      } catch {
        if (!ac.signal.aborted) {
          setErrorCarga("Error de conexion.");
        }
      } finally {
        if (!ac.signal.aborted) {
          setCargandoCliente(false);
        }
      }
    })();
    return () => ac.abort();
  }, [clienteId]);

  const documentoNormalizado =
    tipoDocumento === "CI" ? normalizarDocumentoCliente("CI", documento) : "";

  function nombreCompletoParaGuardar(): string {
    if (tipoPersona === "JURIDICA") {
      return normalizarNombrePersona(razonSocial);
    }
    return `${normalizarNombrePersona(apellidos)}, ${normalizarNombrePersona(nombres)}`.trim();
  }

  function domicilioParaGuardar(): string | null {
    const piezas = [
      domicilioCalle ? `Calle: ${domicilioCalle.trim()}` : "",
      domicilioNumero ? `N°: ${domicilioNumero.trim()}` : "",
      domicilioApto ? `Apto: ${domicilioApto.trim()}` : "",
      domicilioCiudad ? `Ciudad: ${domicilioCiudad.trim()}` : "",
      domicilioDepartamento ? `Departamento: ${domicilioDepartamento.trim()}` : "",
      domicilioPais ? `Pais: ${domicilioPais.trim()}` : "",
      domicilioAclaraciones ? `Aclaraciones: ${domicilioAclaraciones.trim()}` : "",
    ].filter(Boolean);
    return piezas.length > 0 ? piezas.join(" | ") : null;
  }

  function validarDocumento(): string | null {
    return mensajeValidacionDocumentoCliente(tipoDocumento, documento);
  }

  useEffect(() => {
    if (clienteId) {
      setCiExistente(null);
      setBuscandoCi(false);
      return;
    }
    if (tipoDocumento !== "CI") {
      setCiExistente(null);
      setBuscandoCi(false);
      huboAutocompletadoRef.current = false;
      return;
    }

    const err = mensajeValidacionDocumentoCliente("CI", documento);
    if (err) {
      setCiExistente(null);
      setBuscandoCi(false);
      return;
    }

    const ac = new AbortController();
    setBuscandoCi(true);
    const t = window.setTimeout(() => {
      void (async () => {
        try {
          const r = await fetch(
            `/api/clientes/por-documento?tipoDocumento=CI&documento=${encodeURIComponent(documento)}`,
            { signal: ac.signal },
          );
          const data = (await r.json()) as {
            encontrado?: boolean;
            cliente?: ClienteCiExistente;
          };
          if (ac.signal.aborted) {
            return;
          }
          if (!r.ok) {
            setCiExistente(null);
            return;
          }
          if (data.encontrado && data.cliente) {
            huboAutocompletadoRef.current = true;
            setCiExistente(data.cliente);
            aplicarClienteAlFormulario(data.cliente, {
              setTipoDocumento,
              setTipoPersona,
              setDocumento,
              setRazonSocial,
              setTipoSocial,
              setApellidos,
              setNombres,
              setFechaNacimiento,
              setEstadoCivil,
              setNupcias,
              setConyuge,
              setContacto,
              setTelefono,
              setEmail,
              setDomicilioCalle,
              setDomicilioNumero,
              setDomicilioApto,
              setDomicilioCiudad,
              setDomicilioDepartamento,
              setDomicilioPais,
              setDomicilioAclaraciones,
            });
            setMensaje("");
          } else {
            setCiExistente(null);
            if (huboAutocompletadoRef.current) {
              huboAutocompletadoRef.current = false;
              setApellidos("");
              setNombres("");
              setRazonSocial("");
              setTipoSocial("");
              setFechaNacimiento("");
              setEstadoCivil("");
              setNupcias("1");
              setConyuge("");
              setContacto("");
              setTelefono("");
              setEmail("");
              setDomicilioCalle("");
              setDomicilioNumero("");
              setDomicilioApto("");
              setDomicilioCiudad("");
              setDomicilioDepartamento("");
              setDomicilioPais("");
              setDomicilioAclaraciones("");
              setTipoPersona("FISICA");
            }
          }
        } catch {
          if (!ac.signal.aborted) {
            setCiExistente(null);
          }
        } finally {
          if (!ac.signal.aborted) {
            setBuscandoCi(false);
          }
        }
      })();
    }, 480);

    return () => {
      ac.abort();
      window.clearTimeout(t);
    };
  }, [clienteId, tipoDocumento, documento]);

  useEffect(() => {
    if (tipoPersona === "JURIDICA" && tipoDocumento === "CI") {
      setTipoDocumento("RUT");
      setCiExistente(null);
      huboAutocompletadoRef.current = false;
    }
    if (tipoPersona === "JURIDICA") {
      setFechaNacimiento("");
      setEstadoCivil("");
      setNupcias("1");
      setConyuge("");
    }
  }, [tipoPersona, tipoDocumento]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const errorDocumento = validarDocumento();
    if (errorDocumento) {
      setMensaje(errorDocumento);
      return;
    }

    if (!esEdicion && tipoDocumento === "CI" && ciExistente) {
      setMensaje(
        "Esta CI ya esta registrada en el sistema. Los datos se completaron solos; no podes dar de alta el mismo cliente otra vez.",
      );
      return;
    }

    if (tipoPersona === "JURIDICA") {
      if (!razonSocial.trim()) {
        setMensaje("El nombre o razon social es obligatorio.");
        return;
      }
    } else {
      if (!apellidos.trim()) {
        setMensaje("Los apellidos son obligatorios.");
        return;
      }
      if (!nombres.trim()) {
        setMensaje("Los nombres son obligatorios.");
        return;
      }
    }

    const payload = {
      tipoDocumento,
      tipoPersona,
      documento: normalizarDocumentoCliente(tipoDocumento, documento),
      nombre: nombreCompletoParaGuardar(),
      fechaNacimiento: tipoPersona === "FISICA" ? fechaNacimiento || null : null,
      estadoCivil:
        tipoPersona === "FISICA"
          ? construirEstadoCivilPersistido(
              estadoCivil || null,
              nupcias.trim() ? Number(nupcias) : null,
              conyuge.trim() || null,
            )
          : null,
      contacto: contacto.trim() || null,
      telefono: telefono.trim() || null,
      email: email.trim() || null,
      domicilio: domicilioParaGuardar(),
      tipoSocial: tipoPersona === "JURIDICA" && tipoSocial ? tipoSocial : null,
    };

    setGuardando(true);
    try {
      const response = esEdicion
        ? await fetch(`/api/clientes/${clienteId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/clientes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });
      const data = await response.json();

      if (!response.ok) {
        setMensaje(data?.error ?? "No se pudo guardar el cliente.");
        return;
      }

      if (esEdicion) {
        setMensaje(`Cambios guardados para "${data.nombre}".`);
        onClienteActualizado?.();
      } else {
        setMensaje(`Cliente "${data.nombre}" guardado correctamente.`);
        setDocumento("");
        setApellidos("");
        setNombres("");
        setRazonSocial("");
        setTipoSocial("");
        setContacto("");
        setTelefono("");
        setEmail("");
        setDomicilioCalle("");
        setDomicilioNumero("");
        setDomicilioApto("");
        setDomicilioCiudad("");
        setDomicilioDepartamento("");
        setDomicilioPais("");
        setDomicilioAclaraciones("");
        setFechaNacimiento("");
        setEstadoCivil("");
        setNupcias("1");
        setConyuge("");
        setCiExistente(null);
        huboAutocompletadoRef.current = false;
        onClienteCreado?.();
      }
    } catch {
      setMensaje("Error de conexion con el servidor.");
    } finally {
      setGuardando(false);
    }
  }

  async function handleEliminarCliente() {
    if (!clienteId) return;
    const nombreEtiqueta =
      tipoPersona === "JURIDICA"
        ? razonSocial.trim()
        : `${apellidos.trim()} ${nombres.trim()}`.trim() || documento.trim() || "este cliente";
    const ok = window.confirm(
      `¿Eliminar a "${nombreEtiqueta}"?\n\nSolo se puede si no tiene asuntos en trámite ni historial. Si el sistema lo rechaza, aparecerá el motivo.`,
    );
    if (!ok) return;
    setEliminando(true);
    setMensaje("");
    try {
      const r = await fetch(`/api/clientes/${clienteId}`, { method: "DELETE" });
      const data = (await r.json().catch(() => ({}))) as { error?: string };
      if (!r.ok) {
        setMensaje(data?.error ?? "No se pudo eliminar.");
        return;
      }
      router.push("/estudio/clientes");
      router.refresh();
    } catch {
      setMensaje("Error de conexión al eliminar.");
    } finally {
      setEliminando(false);
    }
  }

  const altaBloqueadaPorCi = !esEdicion && tipoDocumento === "CI" && ciExistente !== null;

  const useLegacyLayout = Boolean(legacyLayout);
  const sectionRuleClass = useLegacyLayout ? "form-stack-section" : estudioSectionRule;

  const hintDocumento =
    documento.trim() !== "" ? mensajeValidacionDocumentoCliente(tipoDocumento, documento) : null;

  if (esEdicion && cargandoCliente) {
    return (
      <div
        className={
          useLegacyLayout
            ? "flex min-h-[12rem] flex-col items-center justify-center gap-3 text-center"
            : `${estudioFormShell} flex min-h-[12rem] flex-col items-center justify-center gap-3 text-center`
        }
      >
        <span
          className="size-8 shrink-0 animate-spin rounded-full border-2 border-neutral-200 border-t-emerald-600"
          aria-hidden
        />
        <p className={useLegacyLayout ? "muted" : "text-sm text-neutral-600"}>Cargando datos del cliente…</p>
      </div>
    );
  }

  if (esEdicion && errorCarga) {
    return (
      <div className={useLegacyLayout ? "space-y-4 text-left" : `${estudioFormShell} space-y-4 text-left`}>
        <p className={useLegacyLayout ? "error" : "text-sm font-medium text-red-800"}>{errorCarga}</p>
        <Link
          href="/estudio/clientes"
          className={useLegacyLayout ? "btn btn-secondary inline-flex" : estudioLinkBack}
        >
          <span aria-hidden>←</span>
          Volver a clientes
        </Link>
      </div>
    );
  }

  return (
    <form
      className={useLegacyLayout ? "form text-left" : `${estudioFormShell} space-y-0 text-left`}
      onSubmit={onSubmit}
    >
      {esEdicion && !useLegacyLayout ? (
        <div className="mb-8 space-y-3">
          <Link href="/estudio/clientes" className={estudioLinkBack}>
            <span aria-hidden>←</span>
            Clientes
          </Link>
          <h2 className={estudioSectionTitle}>Editar cliente</h2>
          <p className="text-sm leading-relaxed text-neutral-600">
            Mismos campos que en el alta. Los cambios quedan registrados en el directorio.
          </p>
        </div>
      ) : null}
      {esEdicion && useLegacyLayout ? (
        <p className="muted mb-6 max-w-2xl text-sm">
          Mismos campos que en el alta. Los cambios quedan registrados en el directorio.
        </p>
      ) : null}
      <div className="mb-6">
        <h2 className={estudioSectionTitle}>Identificación</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-600">
          {esEdicion
            ? "Tipo de persona y documento. Podés corregir datos si hace falta."
            : "Tipo de persona y documento. Con CI válida, el sistema puede autocompletar datos si el cliente ya existe."}
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">Tipo de persona</span>
          <select
            className="input-app"
            value={tipoPersona}
            onChange={(e) => setTipoPersona(e.target.value as TipoPersonaCliente)}
            disabled={altaBloqueadaPorCi}
          >
            {TIPOS_PERSONA_CLIENTE.map((t) => (
              <option key={t} value={t}>
                {ETIQUETA_TIPO_PERSONA_CLIENTE[t]}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">Tipo de documento</span>
          <select
            className="input-app"
            value={tipoDocumento}
            onChange={(e) => {
              setTipoDocumento(e.target.value as TipoDocumentoCliente);
              setCiExistente(null);
              huboAutocompletadoRef.current = false;
            }}
          >
            {TIPOS_DOCUMENTO_CLIENTE.map((t) => (
              <option key={t} value={t}>
                {ETIQUETA_TIPO_DOCUMENTO_CLIENTE[t]}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 md:col-span-2">
          <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">Número de documento</span>
          <input
            className="input-app"
            placeholder={
              tipoDocumento === "RUT"
                ? "12 digitos"
                : tipoDocumento === "CI"
                  ? "CI uruguaya"
                  : tipoDocumento === "DNI"
                    ? "6 a 10 digitos"
                    : tipoDocumento === "PASAPORTE"
                      ? "Letras y numeros (5 a 20)"
                      : "Documento extranjero / no estandar"
            }
            value={documento}
            onChange={(e) => {
              const v = e.target.value;
              if (tipoDocumento === "RUT") {
                setDocumento(v.replace(/\D/g, "").slice(0, 12));
              } else {
                setDocumento(v);
              }
            }}
          />
          {hintDocumento ? (
            <p className="text-xs text-red-600" role="alert">
              {hintDocumento}
            </p>
          ) : null}
          {tipoDocumento === "CI" && buscandoCi ? (
            <p className="text-xs text-[var(--verde-subtitulo)]/80">Comprobando si la CI ya existe...</p>
          ) : null}
        </label>
      </div>

      {altaBloqueadaPorCi ? (
        <div className="mt-6 rounded-md bg-amber-50 px-4 py-3 text-sm text-amber-950 ring-1 ring-amber-200/60">
          <p className="font-semibold">Esta CI ya esta registrada</p>
          <p className="mt-1 text-amber-900/90">
            Se completaron los datos del cliente existente (documento normalizado:{" "}
            <span className="font-mono">{documentoNormalizado}</span>
            {ciExistente.tipoDocumento !== "CI" ? (
              <>
                {" "}
                — en el sistema figura como{" "}
                <strong>{etiquetaTipoDocumentoCliente(ciExistente.tipoDocumento)}</strong>
              </>
            ) : null}
            ). No se puede repetir el alta con el mismo numero.
          </p>
          <p className="mt-2">
            <Link href="/estudio/clientes" className="font-medium text-amber-900 underline">
              Ir a clientes
            </Link>
          </p>
        </div>
      ) : null}

      <div className={sectionRuleClass}>
        <h2 className={estudioSectionTitle}>Datos del cliente y domicilio</h2>
        <p className="mt-2 max-w-2xl text-sm text-neutral-600">
          Completá nombres o razón social, domicilio y vías de contacto.
        </p>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
        {tipoPersona === "JURIDICA" ? (
          <>
            <label className="space-y-2 md:col-span-2">
              <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                Nombre o razón social *
              </span>
              <input
                className="input-app"
                value={razonSocial}
                onChange={(e) => setRazonSocial(e.target.value)}
                onBlur={() => setRazonSocial((v) => normalizarNombrePersona(v))}
                disabled={altaBloqueadaPorCi}
              />
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">Tipo social</span>
              <select
                className="input-app"
                value={tipoSocial}
                onChange={(e) => setTipoSocial(e.target.value as TipoSocialCliente | "")}
                disabled={altaBloqueadaPorCi}
              >
                <option value="">Seleccionar…</option>
                {TIPOS_SOCIAL_CLIENTE.map((t) => (
                  <option key={t} value={t}>
                    {ETIQUETA_TIPO_SOCIAL_CLIENTE[t]}
                  </option>
                ))}
              </select>
            </label>
          </>
        ) : (
          <>
            <label className="space-y-2">
              <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">Apellidos *</span>
              <input
                className="input-app"
                value={apellidos}
                onChange={(e) => setApellidos(e.target.value)}
                onBlur={() => setApellidos((v) => normalizarNombrePersona(v))}
                disabled={altaBloqueadaPorCi}
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">Nombres *</span>
              <input
                className="input-app"
                value={nombres}
                onChange={(e) => setNombres(e.target.value)}
                onBlur={() => setNombres((v) => normalizarNombrePersona(v))}
                disabled={altaBloqueadaPorCi}
              />
            </label>
          </>
        )}
        {tipoPersona === "FISICA" ? (
          <>
            <label className="space-y-2">
              <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">Fecha de nacimiento</span>
              <input
                className="input-app"
                type="date"
                value={fechaNacimiento}
                onChange={(e) => setFechaNacimiento(e.target.value)}
                disabled={altaBloqueadaPorCi}
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">Estado civil</span>
              <select
                className="input-app"
                value={estadoCivil}
                onChange={(e) => setEstadoCivil(e.target.value)}
                disabled={altaBloqueadaPorCi}
              >
                <option value="">Seleccionar…</option>
                {CODIGOS_ESTADO_CIVIL.map((c) => (
                  <option key={c} value={c}>
                    {ETIQUETA_ESTADO_CIVIL[c]}
                  </option>
                ))}
              </select>
            </label>
            {(estadoCivil === "CASADO" || estadoCivil === "DIVORCIADO" || estadoCivil === "VIUDO") && (
              <>
                <label className="space-y-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                    Nupcias (opcional)
                  </span>
                  <input
                    className="input-app"
                    type="number"
                    min={1}
                    value={nupcias}
                    onChange={(e) => setNupcias(e.target.value)}
                    disabled={altaBloqueadaPorCi}
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                    Nombre del cónyuge (opcional)
                  </span>
                  <input
                    className="input-app"
                    value={conyuge}
                    onChange={(e) => setConyuge(e.target.value)}
                    onBlur={() => setConyuge((v) => normalizarNombrePersona(v))}
                    disabled={altaBloqueadaPorCi}
                  />
                </label>
              </>
            )}
            {estadoCivil === "UNION_CONCUBINARIA" && (
              <label className="space-y-2 md:col-span-2">
                <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                  Nombre del concubinario/a (opcional)
                </span>
                <input
                  className="input-app"
                  value={conyuge}
                  onChange={(e) => setConyuge(e.target.value)}
                  onBlur={() => setConyuge((v) => normalizarNombrePersona(v))}
                  disabled={altaBloqueadaPorCi}
                />
              </label>
            )}
          </>
        ) : null}
        <label className="space-y-2">
          <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">Calle</span>
          <input
            className="input-app"
            value={domicilioCalle}
            onChange={(e) => setDomicilioCalle(e.target.value)}
            disabled={altaBloqueadaPorCi}
          />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">No.</span>
          <input
            className="input-app"
            value={domicilioNumero}
            onChange={(e) => setDomicilioNumero(e.target.value)}
            disabled={altaBloqueadaPorCi}
          />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">Apartamento</span>
          <input
            className="input-app"
            value={domicilioApto}
            onChange={(e) => setDomicilioApto(e.target.value)}
            disabled={altaBloqueadaPorCi}
          />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">Ciudad</span>
          <input
            className="input-app"
            value={domicilioCiudad}
            onChange={(e) => setDomicilioCiudad(e.target.value)}
            disabled={altaBloqueadaPorCi}
          />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">Departamento</span>
          <input
            className="input-app"
            value={domicilioDepartamento}
            onChange={(e) => setDomicilioDepartamento(e.target.value)}
            disabled={altaBloqueadaPorCi}
          />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">País</span>
          <input
            className="input-app"
            value={domicilioPais}
            onChange={(e) => setDomicilioPais(e.target.value)}
            disabled={altaBloqueadaPorCi}
          />
        </label>
        <label className="space-y-2 md:col-span-2">
          <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">Otras aclaraciones</span>
          <input
            className="input-app"
            value={domicilioAclaraciones}
            onChange={(e) => setDomicilioAclaraciones(e.target.value)}
            disabled={altaBloqueadaPorCi}
          />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">Teléfono (opcional)</span>
          <input
            className="input-app"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            disabled={altaBloqueadaPorCi}
          />
        </label>
        <label className="space-y-2">
          <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">Email (opcional)</span>
          <input
            className="input-app"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={altaBloqueadaPorCi}
          />
        </label>
        <label className="space-y-2 md:col-span-2">
          <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">Contacto adicional (opcional)</span>
          <input
            className="input-app"
            placeholder="Ej. referencia, otro telefono"
            value={contacto}
            onChange={(e) => setContacto(e.target.value)}
            disabled={altaBloqueadaPorCi}
          />
        </label>
        </div>
      </div>

      <div
        className={
          useLegacyLayout ? "form-actions" : `${estudioSectionRule} flex flex-wrap items-center gap-3`
        }
      >
        <button
          className={useLegacyLayout ? "btn btn-primary" : estudioBtnPrimario}
          disabled={guardando || altaBloqueadaPorCi}
          type="submit"
        >
          {guardando ? "Guardando…" : esEdicion ? "Guardar cambios" : "Guardar cliente"}
        </button>
        {esEdicion ? (
          <Link href="/estudio/clientes" className={useLegacyLayout ? "btn btn-secondary" : estudioBtnSecundario}>
            Cancelar
          </Link>
        ) : useLegacyLayout ? (
          <Link href="/estudio/clientes" className="btn btn-secondary">
            Cancelar
          </Link>
        ) : null}
      </div>

      {esEdicion && clienteId ? (
        <div
          className={
            useLegacyLayout
              ? "form-stack-section mt-2 rounded-xl border border-red-200/90 bg-red-50/50 px-4 py-5 sm:px-5"
              : "mt-10 rounded-xl border border-red-200/90 bg-red-50/50 px-4 py-5 sm:px-5"
          }
        >
          <h3 className="text-sm font-semibold text-red-900">Eliminar cliente</h3>
          <p className="mt-1 text-xs leading-relaxed text-neutral-700">
            Para borrar del directorio tenés que usar esta acción aquí (no está en el listado). Solo se permite si no
            tiene asuntos en trámite ni historial; si el servidor lo rechaza, el mensaje aparece abajo.
          </p>
          <button
            type="button"
            className="mt-4 inline-flex min-h-9 items-center justify-center rounded-xl border border-red-300 bg-white px-4 text-sm font-semibold text-red-800 shadow-sm transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
            disabled={guardando || eliminando}
            onClick={() => void handleEliminarCliente()}
          >
            {eliminando ? "Eliminando…" : "Eliminar cliente"}
          </button>
        </div>
      ) : null}

      {mensaje ? (
        <p className={useLegacyLayout ? "muted mt-6 text-sm" : `mt-6 ${estudioAlertInfo}`}>{mensaje}</p>
      ) : null}
    </form>
  );
}
