"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  CODIGOS_ESTADO_CIVIL,
  ETIQUETA_ESTADO_CIVIL,
  ETIQUETA_TIPO_DOCUMENTO_CLIENTE,
  ETIQUETA_TIPO_PERSONA_CLIENTE,
  etiquetaTipoDocumentoCliente,
  fechaIsoADateInput,
  mensajeValidacionDocumentoCliente,
  normalizarNombrePersona,
  normalizarDocumentoCliente,
  TIPOS_DOCUMENTO_CLIENTE,
  TIPOS_PERSONA_CLIENTE,
  type TipoDocumentoCliente,
  type TipoPersonaCliente,
} from "@/lib/validaciones";

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
};

type Props = {
  onClienteCreado?: () => void;
};

export function FormularioCliente({ onClienteCreado }: Props) {
  const [tipoDocumento, setTipoDocumento] = useState<TipoDocumentoCliente>("CI");
  const [tipoPersona, setTipoPersona] = useState<TipoPersonaCliente>("FISICA");
  const [documento, setDocumento] = useState("");
  const [nombre, setNombre] = useState("");
  const [contacto, setContacto] = useState("");
  const [telefono, setTelefono] = useState("");
  const [email, setEmail] = useState("");
  const [domicilio, setDomicilio] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [estadoCivil, setEstadoCivil] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [ciExistente, setCiExistente] = useState<ClienteCiExistente | null>(null);
  const [buscandoCi, setBuscandoCi] = useState(false);
  /** Hubo autocompletado desde el servidor; si luego la CI no existe, se limpian esos campos. */
  const huboAutocompletadoRef = useRef(false);

  const documentoNormalizado =
    tipoDocumento === "CI" ? normalizarDocumentoCliente("CI", documento) : "";

  function validarDocumento(): string | null {
    return mensajeValidacionDocumentoCliente(tipoDocumento, documento);
  }

  useEffect(() => {
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
            setTipoPersona(data.cliente.tipoPersona as TipoPersonaCliente);
            setNombre(data.cliente.nombre);
            setFechaNacimiento(fechaIsoADateInput(data.cliente.fechaNacimiento));
            setEstadoCivil(data.cliente.estadoCivil ?? "");
            setContacto(data.cliente.contacto ?? "");
            setTelefono(data.cliente.telefono ?? "");
            setEmail(data.cliente.email ?? "");
            setDomicilio(data.cliente.domicilio ?? "");
            setMensaje("");
          } else {
            setCiExistente(null);
            if (huboAutocompletadoRef.current) {
              huboAutocompletadoRef.current = false;
              setNombre("");
              setFechaNacimiento("");
              setEstadoCivil("");
              setContacto("");
              setTelefono("");
              setEmail("");
              setDomicilio("");
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
  }, [tipoDocumento, documento]);

  useEffect(() => {
    if (tipoPersona === "JURIDICA" && tipoDocumento === "CI") {
      setTipoDocumento("RUT");
      setCiExistente(null);
      huboAutocompletadoRef.current = false;
    }
    if (tipoPersona === "JURIDICA") {
      setFechaNacimiento("");
      setEstadoCivil("");
    }
  }, [tipoPersona, tipoDocumento]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const errorDocumento = validarDocumento();
    if (errorDocumento) {
      setMensaje(errorDocumento);
      return;
    }

    if (tipoDocumento === "CI" && ciExistente) {
      setMensaje(
        "Esta CI ya esta registrada en el sistema. Los datos se completaron solos; no podes dar de alta el mismo cliente otra vez.",
      );
      return;
    }

    if (!nombre.trim()) {
      setMensaje("El nombre es obligatorio.");
      return;
    }

    setGuardando(true);
    try {
      const response = await fetch("/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipoDocumento,
          tipoPersona,
          documento: normalizarDocumentoCliente(tipoDocumento, documento),
          nombre,
          fechaNacimiento: tipoPersona === "FISICA" ? fechaNacimiento || null : null,
          estadoCivil: tipoPersona === "FISICA" && estadoCivil ? estadoCivil : null,
          contacto: contacto.trim() || null,
          telefono: telefono.trim() || null,
          email: email.trim() || null,
          domicilio: domicilio.trim() || null,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setMensaje(data?.error ?? "No se pudo guardar el cliente.");
        return;
      }

      setMensaje(`Cliente "${data.nombre}" guardado correctamente.`);
      setDocumento("");
      setNombre("");
      setContacto("");
      setTelefono("");
      setEmail("");
      setDomicilio("");
      setFechaNacimiento("");
      setEstadoCivil("");
      setCiExistente(null);
      huboAutocompletadoRef.current = false;
      onClienteCreado?.();
    } catch {
      setMensaje("Error de conexion con el servidor.");
    } finally {
      setGuardando(false);
    }
  }

  const altaBloqueadaPorCi = tipoDocumento === "CI" && ciExistente !== null;

  return (
    <form className="rounded-lg border border-black/[0.06] bg-white p-6 shadow-[0_1px_2px_rgba(0,0,0,0.04)] sm:p-8" onSubmit={onSubmit}>
      <div>
        <h2 className="text-xs font-medium uppercase tracking-wide text-neutral-400">Alta</h2>
        <p className="mt-2 text-sm text-neutral-600">
          Apellidos y nombres o razón social, documento, domicilio y contacto.
        </p>
      </div>

      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <label className="space-y-1.5">
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

        <label className="space-y-1.5">
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

        <label className="space-y-1.5 md:col-span-2">
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
            onChange={(e) => setDocumento(e.target.value)}
          />
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
              Ir al directorio de clientes
            </Link>
          </p>
        </div>
      ) : null}

      <div className="mt-8 grid gap-5 border-t border-neutral-100 pt-8 md:grid-cols-2">
        <label className="space-y-1.5 md:col-span-2">
          <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            {tipoPersona === "FISICA" ? "Apellidos y nombres" : "Razón social"}
          </span>
          <input
            className="input-app"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            onBlur={() => setNombre((v) => normalizarNombrePersona(v))}
            disabled={altaBloqueadaPorCi}
          />
        </label>
        {tipoPersona === "FISICA" ? (
          <>
            <label className="space-y-1.5">
              <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">Fecha de nacimiento</span>
              <input
                className="input-app"
                type="date"
                value={fechaNacimiento}
                onChange={(e) => setFechaNacimiento(e.target.value)}
                disabled={altaBloqueadaPorCi}
              />
            </label>
            <label className="space-y-1.5">
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
          </>
        ) : null}
        <label className="space-y-1.5 md:col-span-2">
          <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">Domicilio</span>
          <input
            className="input-app"
            value={domicilio}
            onChange={(e) => setDomicilio(e.target.value)}
            disabled={altaBloqueadaPorCi}
            placeholder="Calle, numero, ciudad, departamento…"
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">Teléfono (opcional)</span>
          <input
            className="input-app"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            disabled={altaBloqueadaPorCi}
          />
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-neutral-500">Email (opcional)</span>
          <input
            className="input-app"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={altaBloqueadaPorCi}
          />
        </label>
        <label className="space-y-1.5 md:col-span-2">
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

      <div className="mt-8 border-t border-neutral-100 pt-8">
        <button
          className="btn-primary min-h-[3rem] w-full rounded-[10px] border-2 border-transparent px-8 py-3 text-base font-semibold shadow-md shadow-[rgba(0,166,81,0.15)] transition hover:shadow-lg hover:shadow-[rgba(0,166,81,0.2)] disabled:opacity-50 sm:w-auto sm:min-w-[12rem]"
          disabled={guardando || altaBloqueadaPorCi}
          type="submit"
        >
          {guardando ? "Guardando..." : "Guardar cliente"}
        </button>
      </div>

      {mensaje ? (
        <p className="mt-6 rounded-md bg-neutral-50 px-4 py-3 text-sm text-neutral-800 ring-1 ring-black/[0.06]">{mensaje}</p>
      ) : null}
    </form>
  );
}
