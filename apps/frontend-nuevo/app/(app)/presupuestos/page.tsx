"use client";

import { useEffect, useState } from "react";
import type { ClienteRow, PresupuestoRow } from "@shared/types";
import { ESTADOS_PRESUPUESTO, ETIQUETA_ESTADO_PRESUPUESTO } from "@shared/types";
import { api } from "@/lib/api";
import { claseEstadoPresupuesto, etiquetaEstadoPresupuesto, fmtFecha, fmtMoney } from "@/lib/format";
import { Modal } from "@/components/ui/modal";

type PresupuestoForm = {
  clienteId: string;
  titulo: string;
  estado: string;
  honorarioArancel: number;
  honorarioACobrar: number;
  totalPresupuesto: number;
  notas: string;
};

const emptyForm = (): PresupuestoForm => ({
  clienteId: "",
  titulo: "",
  estado: "BORRADOR",
  honorarioArancel: 0,
  honorarioACobrar: 0,
  totalPresupuesto: 0,
  notas: "",
});

export default function PresupuestosPage() {
  const [items, setItems] = useState<PresupuestoRow[]>([]);
  const [clientes, setClientes] = useState<ClienteRow[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<PresupuestoForm>(emptyForm());
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    void api.listarPresupuestos(q ? { q } : undefined).then((res) => {
      setLoading(false);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setError(null);
      setItems(res.data);
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

  useEffect(() => {
    const raw = sessionStorage.getItem("presupuesto_desde_simulador");
    if (!raw) return;
    try {
      const d = JSON.parse(raw) as {
        honorarioArancel: number;
        honorarioACobrar: number;
        fonasaPct: number;
        irpfPct: number;
        actoDescripcion?: string;
      };
      setEditId(null);
      setForm({
        clienteId: "",
        titulo: d.actoDescripcion ?? "",
        estado: "BORRADOR",
        honorarioArancel: d.honorarioArancel,
        honorarioACobrar: d.honorarioACobrar,
        totalPresupuesto: d.honorarioACobrar,
        notas: `FONASA ${d.fonasaPct}% · IRPF ${d.irpfPct}%`,
      });
      setModalOpen(true);
      sessionStorage.removeItem("presupuesto_desde_simulador");
    } catch {
      /* ignore */
    }
  }, []);

  function abrirNuevo() {
    setEditId(null);
    setForm(emptyForm());
    setModalOpen(true);
  }

  function abrirEditar(p: PresupuestoRow) {
    setEditId(p.id);
    setForm({
      clienteId: p.clienteId,
      titulo: p.titulo ?? "",
      estado: p.estado,
      honorarioArancel: p.honorarioArancel,
      honorarioACobrar: p.honorarioACobrar,
      totalPresupuesto: p.totalPresupuesto,
      notas: p.notas ?? "",
    });
    setModalOpen(true);
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.clienteId) {
      setError("Seleccioná un cliente.");
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      clienteId: form.clienteId,
      titulo: form.titulo || undefined,
      estado: form.estado,
      honorarioArancel: form.honorarioArancel,
      honorarioACobrar: form.honorarioACobrar,
      totalPresupuesto: form.totalPresupuesto || form.honorarioACobrar,
      notas: form.notas || undefined,
    };
    const res = editId ? await api.actualizarPresupuesto(editId, payload) : await api.crearPresupuesto(payload);
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setModalOpen(false);
    load();
  }

  async function eliminar(id: string) {
    if (!confirm("¿Eliminar este presupuesto?")) return;
    const res = await api.eliminarPresupuesto(id);
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
          <h1 className="text-2xl font-semibold tracking-tight">Presupuestos</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">{items.length} registros</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            type="search"
            placeholder="Buscar cliente o título…"
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
          <p className="p-6 text-sm text-[var(--muted)]">No hay presupuestos.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nº</th>
                  <th>Cliente</th>
                  <th>Título</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id}>
                    <td className="font-medium text-[var(--accent-hover)]">#{p.numero}</td>
                    <td>{p.cliente.nombre}</td>
                    <td className="text-[var(--muted)]">{p.titulo ?? "—"}</td>
                    <td className="font-medium">{fmtMoney(p.totalPresupuesto)}</td>
                    <td>
                      <span className={`badge ${claseEstadoPresupuesto(p.estado)}`}>
                        {etiquetaEstadoPresupuesto(p.estado)}
                      </span>
                    </td>
                    <td className="text-[var(--muted)]">{fmtFecha(p.createdAt)}</td>
                    <td className="text-right whitespace-nowrap">
                      <button type="button" onClick={() => abrirEditar(p)} className="text-sm text-[var(--accent)] hover:underline">
                        Editar
                      </button>
                      <button type="button" onClick={() => eliminar(p.id)} className="ml-3 text-sm text-[var(--danger)] hover:underline">
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

      <Modal open={modalOpen} title={editId ? "Editar presupuesto" : "Nuevo presupuesto"} onClose={() => setModalOpen(false)}>
        <form onSubmit={guardar} className="space-y-4">
          <label className="block text-sm">
            Cliente
            <select
              required
              disabled={!!editId}
              value={form.clienteId}
              onChange={(e) => setForm({ ...form, clienteId: e.target.value })}
              className="input mt-1"
            >
              <option value="">— Seleccionar —</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            Título
            <input value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} className="input mt-1" />
          </label>
          <label className="block text-sm">
            Estado
            <select value={form.estado} onChange={(e) => setForm({ ...form, estado: e.target.value })} className="input mt-1">
              {ESTADOS_PRESUPUESTO.map((s) => (
                <option key={s} value={s}>
                  {ETIQUETA_ESTADO_PRESUPUESTO[s]}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              Honorario arancel
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.honorarioArancel}
                onChange={(e) => setForm({ ...form, honorarioArancel: Number(e.target.value) })}
                className="input mt-1"
              />
            </label>
            <label className="block text-sm">
              Honorario a cobrar
              <input
                type="number"
                min={0}
                step="0.01"
                value={form.honorarioACobrar}
                onChange={(e) => setForm({ ...form, honorarioACobrar: Number(e.target.value) })}
                className="input mt-1"
              />
            </label>
          </div>
          <label className="block text-sm">
            Total presupuesto
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.totalPresupuesto}
              onChange={(e) => setForm({ ...form, totalPresupuesto: Number(e.target.value) })}
              className="input mt-1"
            />
          </label>
          <label className="block text-sm">
            Notas
            <textarea value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} className="input mt-1 min-h-[72px]" />
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
