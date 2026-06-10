"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Field, { fieldInput } from "@/components/ui/Field";
import type { ProviderDetail, ProviderProduct } from "@/types/provider";

const TYPE_LABELS: Record<string, string> = {
  TELEGRAM_BOT: "Telegram Bot",
  KEYAUTH: "KeyAuth",
  REST_API: "REST API",
  CUSTOM: "Custom",
};

const LOG_ACTION_COLOR: Record<string, string> = {
  PROVIDER_TEST: "#22c55e",
  PROVIDER_TEST_FAIL: "var(--primary-hover)",
  PROVIDER_ERROR: "var(--primary-hover)",
  PROVIDER_CREATED: "var(--text-muted)",
  PROVIDER_UPDATED: "var(--text-muted)",
  PROVIDER_DELETED: "var(--primary-hover)",
  PROVIDER_ACTIVATED: "#22c55e",
  PROVIDER_DEACTIVATED: "var(--text-muted)",
};

const panel: React.CSSProperties = {
  background: "var(--panel)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  padding: "1.25rem 1.5rem",
  marginBottom: "1.25rem",
};

export default function ProviderDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const [provider, setProvider] = useState<ProviderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; detail: string; latencyMs?: number } | null>(null);

  // Estado para agregar producto
  const [newProduct, setNewProduct] = useState({ name: "", externalId: "" });
  const [addingProduct, setAddingProduct] = useState(false);

  const fetchProvider = useCallback(async () => {
    const res = await fetch(`/api/providers/${id}`);
    if (!res.ok) { router.push("/dashboard/providers"); return; }
    const data = await res.json();
    setProvider(data);
    setLoading(false);
  }, [id, router]);

  useEffect(() => { fetchProvider(); }, [fetchProvider]);

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    const res = await fetch(`/api/providers/${id}/test`, { method: "POST" });
    const data = await res.json();
    setTestResult(data);
    setTesting(false);
    fetchProvider(); // recargar para actualizar lastTestedAt
  }

  async function handleAddProduct(e: React.FormEvent) {
    e.preventDefault();
    setAddingProduct(true);
    await fetch(`/api/providers/${id}/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newProduct),
    });
    setNewProduct({ name: "", externalId: "" });
    setAddingProduct(false);
    fetchProvider();
  }

  async function handleToggleProduct(product: ProviderProduct) {
    await fetch(`/api/providers/${id}/products/${product.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...product, active: !product.active }),
    });
    fetchProvider();
  }

  async function handleDeleteProduct(productId: string) {
    if (!confirm("Eliminar este producto?")) return;
    await fetch(`/api/providers/${id}/products/${productId}`, { method: "DELETE" });
    fetchProvider();
  }

  if (loading) {
    return <p style={{ color: "var(--text-muted)" }}>Cargando...</p>;
  }

  if (!provider) return null;

  return (
    <div style={{ maxWidth: 900 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <button
            onClick={() => router.push("/dashboard/providers")}
            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "0.8rem", padding: 0, marginBottom: 8 }}
          >
            &larr; Volver a Providers
          </button>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700 }}>{provider.name}</h1>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: 8, alignItems: "center" }}>
            <Badge variant="type">{TYPE_LABELS[provider.type]}</Badge>
            <Badge variant={provider.status === "ACTIVE" ? "active" : "inactive"}>
              {provider.status === "ACTIVE" ? "Activo" : "Inactivo"}
            </Badge>
          </div>
        </div>
        <Button onClick={handleTest} disabled={testing}>
          {testing ? "Probando..." : "Probar conexion"}
        </Button>
      </div>

      {/* Resultado de la prueba */}
      {testResult && (
        <div style={{
          ...panel,
          borderColor: testResult.success ? "rgba(34,197,94,0.3)" : "rgba(193,18,31,0.3)",
          background: testResult.success ? "rgba(34,197,94,0.05)" : "rgba(193,18,31,0.05)",
          marginBottom: "1.25rem",
        }}>
          <p style={{ fontWeight: 600, color: testResult.success ? "#22c55e" : "var(--primary-hover)", fontSize: "0.875rem" }}>
            {testResult.success ? "Conexion exitosa" : "Conexion fallida"}
          </p>
          <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: 4 }}>{testResult.detail}</p>
          {testResult.latencyMs && (
            <p style={{ color: "var(--text-muted)", fontSize: "0.75rem", marginTop: 4 }}>Latencia: {testResult.latencyMs}ms</p>
          )}
        </div>
      )}

      {/* Informacion general */}
      <div style={panel}>
        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "1rem", fontWeight: 500 }}>Informacion general</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Tipo</p>
            <p style={{ fontSize: "0.875rem", marginTop: 2 }}>{TYPE_LABELS[provider.type]}</p>
          </div>
          <div>
            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Estado</p>
            <p style={{ fontSize: "0.875rem", marginTop: 2 }}>{provider.status}</p>
          </div>
          <div>
            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Descripcion</p>
            <p style={{ fontSize: "0.875rem", marginTop: 2 }}>{provider.description || "—"}</p>
          </div>
          <div>
            <p style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Creado</p>
            <p style={{ fontSize: "0.875rem", marginTop: 2 }}>{new Date(provider.createdAt).toLocaleString("es")}</p>
          </div>
        </div>
      </div>

      {/* Ultima prueba de conexion */}
      <div style={panel}>
        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "1rem", fontWeight: 500 }}>Ultima prueba de conexion</p>
        {provider.lastTestedAt ? (
          <div style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Fecha</p>
              <p style={{ fontSize: "0.875rem", marginTop: 2 }}>{new Date(provider.lastTestedAt).toLocaleString("es")}</p>
            </div>
            <div>
              <p style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>Resultado</p>
              <p style={{ fontSize: "0.875rem", marginTop: 2, color: provider.lastTestOk ? "#22c55e" : "var(--primary-hover)" }}>
                {provider.lastTestOk ? "Exitosa" : "Fallida"}
              </p>
            </div>
          </div>
        ) : (
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>No se ha probado la conexion aun</p>
        )}
      </div>

      {/* Configuracion (enmascarada) */}
      {provider.config && Object.keys(provider.config).length > 0 && (
        <div style={panel}>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "1rem", fontWeight: 500 }}>Configuracion</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {Object.entries(provider.config).map(([key, val]) => (
              <div key={key} style={{ display: "flex", gap: "1rem" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", minWidth: 120 }}>{key}</span>
                <span style={{ fontSize: "0.8rem", fontFamily: "monospace", color: "var(--text)" }}>
                  {typeof val === "string" ? val : JSON.stringify(val)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Productos */}
      <div style={panel}>
        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "1rem", fontWeight: 500 }}>
          Productos ({provider.products.length})
        </p>

        {provider.products.length > 0 && (
          <div style={{ marginBottom: "1rem" }}>
            {provider.products.map((p) => (
              <div key={p.id} style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "0.6rem 0", borderBottom: "1px solid var(--border)",
              }}>
                <div>
                  <span style={{ fontSize: "0.875rem", fontWeight: 500 }}>{p.name}</span>
                  {p.externalId && (
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginLeft: 8 }}>
                      ID: {p.externalId}
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                  <Badge variant={p.active ? "active" : "inactive"}>{p.active ? "Activo" : "Inactivo"}</Badge>
                  <Button size="sm" variant="ghost" onClick={() => handleToggleProduct(p)}>
                    {p.active ? "Desactivar" : "Activar"}
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => handleDeleteProduct(p.id)}>
                    Eliminar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Formulario para agregar producto */}
        <form onSubmit={handleAddProduct} style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end" }}>
          <Field label="Nombre del producto">
            <input
              required
              style={{ ...fieldInput, minWidth: 180 }}
              value={newProduct.name}
              onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))}
              placeholder="Ej: 30 dias, Premium..."
            />
          </Field>
          <Field label="ID externo (opcional)">
            <input
              style={{ ...fieldInput, minWidth: 140 }}
              value={newProduct.externalId}
              onChange={(e) => setNewProduct((p) => ({ ...p, externalId: e.target.value }))}
              placeholder="ID en el sistema externo"
            />
          </Field>
          <Button type="submit" size="sm" disabled={addingProduct} style={{ marginBottom: 0 }}>
            {addingProduct ? "Agregando..." : "+ Agregar"}
          </Button>
        </form>
      </div>

      {/* Logs tecnicos */}
      <div style={panel}>
        <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "1rem", fontWeight: 500 }}>
          Logs tecnicos recientes ({provider.logs.length})
        </p>
        {provider.logs.length === 0 ? (
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>Sin logs registrados</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {provider.logs.map((log) => (
              <div key={log.id} style={{
                background: "var(--bg)",
                border: "1px solid var(--border)",
                borderRadius: 6,
                padding: "0.75rem 1rem",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    color: LOG_ACTION_COLOR[log.action] ?? "var(--text-muted)",
                  }}>
                    {log.action}
                  </span>
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>
                    {new Date(log.createdAt).toLocaleString("es")}
                  </span>
                </div>
                <p style={{ fontSize: "0.8rem", color: "var(--text)" }}>{log.message}</p>
                {log.metadata?.latencyMs != null && (
                  <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 2 }}>
                    Latencia: {String(log.metadata.latencyMs as number)}ms
                  </p>
                )}
                {log.metadata?.raw != null && (
                  <details style={{ marginTop: 6 }}>
                    <summary style={{ fontSize: "0.7rem", color: "var(--text-muted)", cursor: "pointer" }}>Ver respuesta raw</summary>
                    <pre style={{
                      fontSize: "0.7rem",
                      color: "var(--text-muted)",
                      marginTop: 4,
                      overflow: "auto",
                      maxHeight: 120,
                      background: "var(--bg)",
                      padding: "0.5rem",
                      borderRadius: 4,
                      border: "1px solid var(--border)",
                    }}>
                      {JSON.stringify(log.metadata.raw as object, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
