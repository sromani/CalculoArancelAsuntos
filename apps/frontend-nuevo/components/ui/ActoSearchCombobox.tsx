"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";

export type ActoComboboxOption = { value: string; label: string };

function normalizarBusqueda(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .trim();
}

/** Cada palabra del texto debe aparecer en el nombre (orden libre), sin distinguir mayúsculas ni tildes. */
export function coincideActoBusqueda(label: string, queryRaw: string): boolean {
  const q = normalizarBusqueda(queryRaw);
  if (!q) return true;
  const haystack = normalizarBusqueda(label);
  const tokens = q.split(/\s+/).filter(Boolean);
  return tokens.every((t) => haystack.includes(t));
}

export default function ActoSearchCombobox({
  label,
  name,
  options,
  value,
  onChange,
  placeholder = "Escribí para buscar por palabras…",
  required = false,
}: {
  label: string;
  name: string;
  options: ActoComboboxOption[];
  value: string;
  onChange: (nextKey: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  const listId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);

  const selectedLabel = useMemo(
    () => options.find((o) => o.value === value)?.label ?? "",
    [options, value],
  );

  const [inputText, setInputText] = useState(selectedLabel);

  useEffect(() => {
    setInputText(selectedLabel);
  }, [selectedLabel]);

  const filtered = useMemo(
    () => options.filter((o) => coincideActoBusqueda(o.label, inputText)),
    [options, inputText],
  );

  const showList = open && filtered.length > 0;

  const pick = useCallback(
    (v: string) => {
      onChange(v);
      const lab = options.find((o) => o.value === v)?.label ?? "";
      setInputText(lab);
      setOpen(false);
      setHighlight(0);
    },
    [onChange, options],
  );

  useEffect(() => {
    if (highlight >= filtered.length) {
      setHighlight(Math.max(0, filtered.length - 1));
    }
  }, [filtered.length, highlight]);

  const closeAndRevert = useCallback(() => {
    setOpen(false);
    setInputText(selectedLabel);
    setHighlight(0);
  }, [selectedLabel]);

  return (
    <div className="form-field combobox-acto-wrap" ref={containerRef}>
      <label htmlFor={`${name}-input`}>
        {label} {required ? <span className="required">*</span> : null}
      </label>
      <input type="hidden" name={name} value={value} readOnly aria-hidden />
      <input
        ref={inputRef}
        id={`${name}-input`}
        type="search"
        enterKeyHint="search"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList ? `${listId}-opt-${highlight}` : undefined}
        className="input-app combobox-acto-input"
        value={inputText}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        onChange={(e) => {
          const t = e.target.value;
          setInputText(t);
          setOpen(true);
          setHighlight(0);
          if (!t.trim()) {
            onChange("");
          }
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          requestAnimationFrame(() => {
            if (!containerRef.current?.contains(document.activeElement)) {
              closeAndRevert();
            }
          });
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            closeAndRevert();
            inputRef.current?.blur();
            return;
          }
          if (e.key === "ArrowDown") {
            e.preventDefault();
            if (!open) setOpen(true);
            setHighlight((h) => (filtered.length ? (h + 1) % filtered.length : 0));
            return;
          }
          if (e.key === "ArrowUp") {
            e.preventDefault();
            if (!open) setOpen(true);
            setHighlight((h) =>
              filtered.length ? (h - 1 + filtered.length) % filtered.length : 0,
            );
            return;
          }
          if (e.key === "Enter" && open && filtered.length > 0) {
            e.preventDefault();
            const o = filtered[highlight];
            if (o) pick(o.value);
          }
        }}
      />
      {showList ? (
        <ul
          id={listId}
          role="listbox"
          className="combobox-acto-list"
          aria-label={label}
        >
          {filtered.map((o, i) => (
            <li
              key={o.value}
              id={`${listId}-opt-${i}`}
              role="option"
              aria-selected={i === highlight}
              className={`combobox-acto-option${i === highlight ? " combobox-acto-option--active" : ""}`}
              onMouseDown={(ev) => ev.preventDefault()}
              onMouseEnter={() => setHighlight(i)}
              onClick={() => pick(o.value)}
            >
              {o.label}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
