"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import ProviderForm from "@/components/providers/ProviderForm";
import type { Provider, ProviderType } from "@/types/provider";

const TYPE_LABELS: Record<ProviderType, string> = {
  TELEGRAM_BOT: "Telegram Bot",
  KEYAUTH: "KeyAuth",
  REST_API: "REST API",
  CUSTOM: "Custom",
};

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Todos los tipos" },
  { value: "TELEGRAM_BOT", label: "Telegram Bot" },
  { value: "KEYAUTH", label: "KeyAuth" },
  { value: "REST_API", label: "REST API" },
  { value: "CUSTOM", label: "Custom" },
];

export default function ProvidersClient() {
  const router = useRouter();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Provider | undefined>(undefined);
  const [testResult, setTestResult] = useState<Record<string, { success: boolean; detail: string }>>({});
  const [testingId, setTestingId] = useState<string | null>(null);

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (typeFilter) params.set("type", typeFilter);
    const res = await fetch(`/api/providers?${params.toString()}`);
    const data = await res.json();
    setProviders(data);
    setLoading(false);
  }, [search, typeFilter]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  async function handleDelete(provider: Provider) {
    if (!confirm(`Eliminar provider "${provider.name}"?`)) return;
    await fetch(`/api/providers/${provider.id}`, { method: "DELETE" });
    fetchProviders();
  }

  async function handleToggleStatus(provider: Provider) {
    const newStatus = provider.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    await fetch(`/api/providers/${provider.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...provider, status: newStatus }),
    });
    fetchProviders();
  }

  async function handleTest(provider: Provider) {
    setTestingId(provider.id);
    const res = await fetch(`/api/providers/${provider.id}/test`, { method: "POST" });
    const data = await res.json();
    setTestResult((prev) => ({ ...prev, [provider.id]: data }));
    setTestingId(null);
  }

  function openCreate() {
    setEditing(undefined);
    setShowForm(true);
  }

  function openEdit(p: Provider) {
    setEditing(p);
    setShowForm(true);
  }

  const inputStyle: React.CSSProperties = {
    background: "var(--panel)",
    border: "1px solid var(--border)",
    borderRadius: 6,
    padding: "0.5rem 0.75rem",
    color: "var(--text)",
    fontSize: "0.875rem",
    outline: "none",
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>Providers</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginTop: 4 }}>
            Administra los proveedores externos de licencias
          </p>
        </div>
        <Button onClick={openCreate}>+ Nuevo Provider</Button>
      </div>

      {/* Filtros */}
      <div style={{ display: "flex", gap: "0.75rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <input
          style={{ ...inputStyle, minWidth: 220 }}
          placeholder="Buscar por nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          style={{ ...inputStyle, cursor: "pointer" }}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          {TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Tabla */}
      <div style={{ background: "var(--panel)", border: "1px solid var(--border)", borderRadius: 8, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Nombre", "Tipo", "Descripcion", "Estado", "Acciones"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "0.75rem 1rem",
                    textAlign: "left",
                    fontSize: "0.75rem",
                    color: "var(--text-muted)",
                    fontWeight: 500,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                  Cargando...
                </td>
              </tr>
            ) : providers.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                  No hay providers registrados
                </td>
              </tr>
            ) : (
              providers.map((p) => (
                <tr key={p.id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "0.75rem 1rem", fontSize: "0.875rem", fontWeight: 500 }}>
                    {p.name}
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <Badge variant="type">{TYPE_LABELS[p.type]}</Badge>
                  </td>
                  <td style={{ padding: "0.75rem 1rem", fontSize: "0.8rem", color: "var(--text-muted)", maxWidth: 200 }}>
                    {p.description || "—"}
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <Badge variant={p.status === "ACTIVE" ? "active" : "inactive"}>
                      {p.status === "ACTIVE" ? "Activo" : "Inactivo"}
                    </Badge>
                  </td>
                  <td style={{ padding: "0.75rem 1rem" }}>
                    <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                      <Button size="sm" variant="secondary" onClick={() => router.push(`/dashboard/providers/${p.id}`)}>Ver</Button>
                      <Button size="sm" variant="secondary" onClick={() => openEdit(p)}>Editar</Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleStatus(p)}
                      >
                        {p.status === "ACTIVE" ? "Desactivar" : "Activar"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={testingId === p.id}
                        onClick={() => handleTest(p)}
                      >
                        {testingId === p.id ? "Probando..." : "Probar"}
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => handleDelete(p)}>
                        Eliminar
                      </Button>
                    </div>
                    {/* Resultado de prueba */}
                    {testResult[p.id] && (
                      <p
                        style={{
                          fontSize: "0.7rem",
                          marginTop: 6,
                          color: testResult[p.id].success ? "#22c55e" : "var(--primary-hover)",
                        }}
                      >
                        {testResult[p.id].success ? "OK: " : "Error: "}
                        {testResult[p.id].detail}
                      </p>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Total */}
      {!loading && (
        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.75rem" }}>
          {providers.length} provider{providers.length !== 1 ? "s" : ""} encontrado{providers.length !== 1 ? "s" : ""}
        </p>
      )}

      {/* Modal formulario */}
      {showForm && (
        <ProviderForm
          provider={editing}
          onClose={() => setShowForm(false)}
          onSaved={fetchProviders}
        />
      )}
    </div>
  );
}
