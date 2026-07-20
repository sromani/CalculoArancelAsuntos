"use client";

import { useEffect, useState } from "react";
import type { ClienteRow } from "@shared/types";
import { api } from "@/lib/api";
import { fmtFecha } from "@/lib/format";
import { Modal } from "@/components/ui/modal";

const emptyForm = {
  nombre: "",
  documento: "",
  email: "",
  telefono: "",
  domicilio: "",
};

export default function ClientesPage() {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<ClienteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    void api.listarClientes(q ? { q } : undefined).then((res) => {
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

  function abrirNuevo() {
    setEditId(null);
    setForm(emptyForm);
    setModalOpen(true);
  }

  function abrirEditar(c: ClienteRow) {
    setEditId(c.id);
    setForm({
      nombre: c.nombre,
      documento: c.documento,
      email: c.email ?? "",
      telefono: c.telefono ?? "",
      domicilio: c.domicilio ?? "",
    });
    setModalOpen(true);
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      nombre: form.nombre,
      documento: form.documento,
      email: form.email || undefined,
      telefono: form.telefono || undefined,
      domicilio: form.domicilio || undefined,
      tipoDocumento: "CI",
      tipoPersona: "FISICA",
    };
    const res = editId
      ? await api.actualizarCliente(editId, payload)
      : await api.crearCliente(payload);
    setSaving(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setModalOpen(false);
    load();
  }

  async function eliminar(id: string) {
    if (!confirm("¿Eliminar este cliente?")) return;
    const res = await api.eliminarCliente(id);
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
          <h1 className="text-2xl font-semibold tracking-tight">Clientes</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">{items.length} registros</p>
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
          <p className="p-6 text-sm text-[var(--muted)]">No hay clientes.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Documento</th>
                  <th>Contacto</th>
                  <th>Alta</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((c) => (
                  <tr key={c.id}>
                    <td className="font-medium">{c.nombre}</td>
                    <td className="text-[var(--muted)]">{c.documento}</td>
                    <td className="text-[var(--muted)]">{c.email ?? c.telefono ?? "—"}</td>
                    <td className="text-[var(--muted)]">{fmtFecha(c.createdAt)}</td>
                    <td className="text-right whitespace-nowrap">
                      <button type="button" onClick={() => abrirEditar(c)} className="text-sm text-[var(--accent)] hover:underline">
                        Editar
                      </button>
                      <button type="button" onClick={() => eliminar(c.id)} className="ml-3 text-sm text-[var(--danger)] hover:underline">
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

      <Modal open={modalOpen} title={editId ? "Editar cliente" : "Nuevo cliente"} onClose={() => setModalOpen(false)}>
        <form onSubmit={guardar} className="space-y-4">
          <label className="block text-sm">
            Apellido, Nombre
            <input
              required
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              className="input mt-1"
              placeholder="García, Juan"
            />
          </label>
          <label className="block text-sm">
            Documento (CI)
            <input
              required
              value={form.documento}
              onChange={(e) => setForm({ ...form, documento: e.target.value })}
              className="input mt-1"
            />
          </label>
          <label className="block text-sm">
            Email
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input mt-1" />
          </label>
          <label className="block text-sm">
            Teléfono
            <input value={form.telefono} onChange={(e) => setForm({ ...form, telefono: e.target.value })} className="input mt-1" />
          </label>
          <label className="block text-sm">
            Domicilio
            <input value={form.domicilio} onChange={(e) => setForm({ ...form, domicilio: e.target.value })} className="input mt-1" />
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
