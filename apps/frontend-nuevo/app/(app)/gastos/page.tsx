"use client";

import { useEffect, useState } from "react";
import type { ClienteRow, GastoInput } from "@shared/types";
import { CATEGORIAS_GASTO, ESTADOS_GASTO, ETIQUETA_CATEGORIA, ETIQUETA_ESTADO_GASTO, ETIQUETA_MONEDA, MONEDAS_GASTO } from "@shared/types";
import type { GastoRow } from "@shared/types";
import { api } from "@/lib/api";
import { claseEstadoGasto, etiquetaCategoria, etiquetaEstadoGasto, fmtFecha, fmtMoney } from "@/lib/format";
import { Modal } from "@/components/ui/modal";

function hoyIso() {
  return new Date().toISOString().slice(0, 10);
}

const emptyForm = (): GastoInput => ({
  nombre: "",
  categoria: "OTROS",
  fecha: hoyIso(),
  importe: 0,
  moneda: "PESOS",
  estado: "PENDIENTE",
});

export default function GastosPage() {
  const [items, setItems] = useState<GastoRow[]>([]);
  const [total, setTotal] = useState(0);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<GastoInput>(emptyForm());
  const [clientes, setClientes] = useState<ClienteRow[]>([]);
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    void api.listarGastos({ q: q || undefined, pageSize: 50 }).then((res) => {
      setLoading(false);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setError(null);
      setItems(res.data.items);
      setTotal(res.data.total);
    });
  }

  useEffect(() => {
    load();
  }, [q]);

  useEffect(() => {
    void api.listarClientes().then((res) => {
      if (res.ok) setClientes(res.data);
    });
  }, []);

  function abrirNuevo() {
    setEditId(null);
    setForm(emptyForm());
    setModalOpen(true);
  }

  function abrirEditar(g: GastoRow) {
    setEditId(g.id);
    setForm({
      nombre: g.nombre,
      categoria: g.categoria,
      oficinaPublica: g.oficinaPublica,
      descripcion: g.descripcion,
      fecha: g.fecha.slice(0, 10),
      fechaVencimiento: g.fechaVencimiento?.slice(0, 10) ?? null,
      importe: g.importe,
      moneda: g.moneda,
      estado: g.estado,
      observaciones: g.observaciones,
      clienteId: g.clienteId,
      asuntoId: g.asuntoId,
    });
    setModalOpen(true);
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = editId ? await api.actualizarGasto(editId, form) : await api.crearGasto(form);
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setModalOpen(false);
    load();
  }

  async function eliminar(id: string) {
    if (!confirm("¿Eliminar este gasto?")) return;
    const res = await api.eliminarGasto(id);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    load();
  }

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Gastos</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">{total} en total</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="search"
            placeholder="Buscar…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="input max-w-xs"
          />
          <button type="button" onClick={abrirNuevo} className="btn-primary">
            + Nuevo
          </button>
        </div>
      </header>
      {error && <p className="mb-4 text-sm text-[var(--danger)]">{error}</p>}
      <div className="card overflow-hidden p-0">
        {loading ? (
          <p className="p-6 text-sm text-[var(--muted)]">Cargando…</p>
        ) : items.length === 0 ? (
          <p className="p-6 text-sm text-[var(--muted)]">No hay gastos.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Gasto</th>
                  <th>Categoría</th>
                  <th>Cliente</th>
                  <th>Importe</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((g) => (
                  <tr key={g.id}>
                    <td className="font-medium">{g.nombre}</td>
                    <td className="text-[var(--muted)]">{etiquetaCategoria(g.categoria)}</td>
                    <td className="text-[var(--muted)]">{g.cliente?.nombre ?? "—"}</td>
                    <td>{fmtMoney(g.importe, g.moneda)}</td>
                    <td>
                      <span className={`badge ${claseEstadoGasto(g.estado)}`}>{etiquetaEstadoGasto(g.estado)}</span>
                    </td>
                    <td className="text-[var(--muted)]">{fmtFecha(g.fecha)}</td>
                    <td className="text-right whitespace-nowrap">
                      <button type="button" onClick={() => abrirEditar(g)} className="text-sm text-[var(--accent)] hover:underline">
                        Editar
                      </button>
                      <button type="button" onClick={() => eliminar(g.id)} className="ml-3 text-sm text-[var(--danger)] hover:underline">
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={modalOpen} title={editId ? "Editar gasto" : "Nuevo gasto"} onClose={() => setModalOpen(false)}>
        <form onSubmit={guardar} className="max-h-[70vh] space-y-4 overflow-y-auto pr-1">
          <label className="block text-sm">
            Nombre
            <input required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className="input mt-1" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              Categoría
              <select value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value as GastoInput["categoria"] })} className="input mt-1">
                {CATEGORIAS_GASTO.map((c) => (
                  <option key={c} value={c}>
                    {ETIQUETA_CATEGORIA[c]}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Estado
              <select value={form.estado ?? "PENDIENTE"} onChange={(e) => setForm({ ...form, estado: e.target.value as GastoInput["estado"] })} className="input mt-1">
                {ESTADOS_GASTO.map((s) => (
                  <option key={s} value={s}>
                    {ETIQUETA_ESTADO_GASTO[s]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              Importe
              <input
                required
                type="number"
                min={0}
                step="0.01"
                value={form.importe}
                onChange={(e) => setForm({ ...form, importe: Number(e.target.value) })}
                className="input mt-1"
              />
            </label>
            <label className="block text-sm">
              Moneda
              <select value={form.moneda} onChange={(e) => setForm({ ...form, moneda: e.target.value as GastoInput["moneda"] })} className="input mt-1">
                {MONEDAS_GASTO.map((m) => (
                  <option key={m} value={m}>
                    {ETIQUETA_MONEDA[m]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              Fecha
              <input required type="date" value={form.fecha} onChange={(e) => setForm({ ...form, fecha: e.target.value })} className="input mt-1" />
            </label>
            <label className="block text-sm">
              Vencimiento
              <input type="date" value={form.fechaVencimiento ?? ""} onChange={(e) => setForm({ ...form, fechaVencimiento: e.target.value || null })} className="input mt-1" />
            </label>
          </div>
          <label className="block text-sm">
            Cliente (opcional)
            <select value={form.clienteId ?? ""} onChange={(e) => setForm({ ...form, clienteId: e.target.value || null })} className="input mt-1">
              <option value="">— Sin cliente —</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Observaciones
            <textarea value={form.observaciones ?? ""} onChange={(e) => setForm({ ...form, observaciones: e.target.value || null })} className="input mt-1 min-h-[72px]" />
          </label>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg px-4 py-2 text-sm text-[var(--muted)]">
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? "Guardando…" : "Guardar"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
