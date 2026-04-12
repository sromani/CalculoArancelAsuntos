"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type OpcionListaBuscable = { value: string; label: string };

type Props = {
  id: string;
  label: string;
  opciones: OpcionListaBuscable[];
  value: string;
  onChange: (value: string) => void;
  /** Texto de la primera opción (valor vacío). */
  vacioLabel?: string;
  placeholder?: string;
};

/**
 * Selector de catálogo con campo de texto: podés escribir para filtrar y elegir de la lista.
 */
export function EstudioListaBuscableSelect({
  id,
  label,
  opciones,
  value,
  onChange,
  vacioLabel = "— Sin asignar",
  placeholder = "Escribí para filtrar o elegí de la lista…",
}: Props) {
  const [abierto, setAbierto] = useState(false);
  const [filtro, setFiltro] = useState("");
  const contRef = useRef<HTMLDivElement>(null);
  const listId = `${id}-listbox`;

  const seleccionado = useMemo(
    () => opciones.find((o) => o.value === value),
    [opciones, value],
  );

  const textoInput = abierto ? filtro : seleccionado?.label ?? "";

  const filtradas = useMemo(() => {
    const t = filtro.trim().toLowerCase();
    if (!t) return opciones;
    return opciones.filter((o) => o.label.toLowerCase().includes(t));
  }, [opciones, filtro]);

  useEffect(() => {
    function onDocPointerDown(e: PointerEvent) {
      if (contRef.current && !contRef.current.contains(e.target as Node)) {
        setAbierto(false);
        setFiltro("");
      }
    }
    document.addEventListener("pointerdown", onDocPointerDown);
    return () => document.removeEventListener("pointerdown", onDocPointerDown);
  }, []);

  return (
    <div ref={contRef} className="relative space-y-1">
      <label htmlFor={id} className="block">
        <span className="text-xs font-semibold text-emerald-900">{label}</span>
        <input
          id={id}
          type="text"
          className="input-app mt-1 w-full"
          role="combobox"
          aria-expanded={abierto}
          aria-controls={listId}
          aria-autocomplete="list"
          autoComplete="off"
          value={textoInput}
          placeholder={!seleccionado ? placeholder : undefined}
          onFocus={() => {
            setAbierto(true);
            setFiltro(seleccionado?.label ?? "");
          }}
          onChange={(e) => {
            setAbierto(true);
            setFiltro(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              setAbierto(false);
              setFiltro("");
              (e.target as HTMLInputElement).blur();
            }
          }}
        />
      </label>
      {abierto ? (
        <ul
          id={listId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-[60] mt-0.5 max-h-52 overflow-auto rounded-lg border border-emerald-200 bg-white py-1 shadow-lg ring-1 ring-black/5"
        >
          <li role="presentation">
            <button
              type="button"
              role="option"
              className="w-full px-3 py-2 text-left text-sm text-neutral-700 hover:bg-emerald-50"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onChange("");
                setAbierto(false);
                setFiltro("");
              }}
            >
              {vacioLabel}
            </button>
          </li>
          {filtradas.map((o) => (
            <li key={o.value} role="presentation">
              <button
                type="button"
                role="option"
                className="w-full px-3 py-2 text-left text-sm text-neutral-900 hover:bg-emerald-50"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(o.value);
                  setAbierto(false);
                  setFiltro("");
                }}
              >
                {o.label}
              </button>
            </li>
          ))}
          {filtradas.length === 0 ? (
            <li className="px-3 py-2 text-sm text-neutral-500">Sin coincidencias</li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
