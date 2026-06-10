"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import LicenseRequestForm from "./LicenseRequestForm";

interface LicenseRequest {
  id: string;
  status: "PENDING" | "PROCESSING" | "SUCCESS" | "FAILED";
  licenseKey: string | null;
  creditsUsed: number;
  createdAt: string;
  reseller: { id: string; name: string; username: string };
  provider: { id: string; name: string; type: string };
  product: { id: string; name: string };
}

interface Provider {
  id: string;
  name: string;
}

interface Reseller {
  id: string;
  name: string;
  username: string;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  PROCESSING: "Procesando",
  SUCCESS: "Exitosa",
  FAILED: "Fallida",
};

const STATUS_BADGE: Record<string, "active" | "inactive" | "type"> = {
  SUCCESS: "active",
  FAILED: "inactive",
  PENDING: "type",
  PROCESSING: "type",
};

export default function LicenseRequestsClient() {
  const router = useRouter();
  const [requests, setRequests] = useState<LicenseRequest[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [resellers, setResellers] = useState<Reseller[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [providerFilter, setProviderFilter] = useState("");
  const [resellerFilter, setResellerFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (providerFilter) params.set("providerId", providerFilter);
    if (resellerFilter) params.set("resellerId", resellerFilter);
    const res = await fetch(`/api/license-requests?${params}`);
    setRequests(await res.json());
    setLoading(false);
  }, [statusFilter, providerFilter, resellerFilter]);

  useEffect(() => {
    fetchRequests();
    Promise.all([
      fetch("/api/providers").then((r) => r.json()),
      fetch("/api/resellers").then((r) => r.json()),
    ]).then(([p, r]) => { setProviders(p); setResellers(r); });
  }, [fetchRequests]);

  const successCount = requests.filter((r) => r.status === "SUCCESS").length;
  const failedCount = requests.filter((r) => r.status === "FAILED").length;

  const selectStyle = {
    background: "var(--panel)",
    border: "1px solid var(--border)",
    borderRadius: 6,
    padding: "0.5rem 0.75rem",
    color: "var(--text)",
    fontSize: "0.875rem",
    outline: "none",
    cursor: "pointer",
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700 }}>License Requests</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: 2 }}>
            {requests.length} solicitudes — {successCount} exitosas — {failedCount} fallidas
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>+ Nueva solicitud</Button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: "1.25rem", flexWrap: "wrap" }}>
        <select style={selectStyle} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="PENDING">Pendiente</option>
          <option value="PROCESSING">Procesando</option>
          <option value="SUCCESS">Exitosa</option>
          <option value="FAILED">Fallida</option>
        </select>
        <select style={selectStyle} value={providerFilter} onChange={(e) => setProviderFilter(e.target.value)}>
          <option value="">Todos los providers</option>
          {providers.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <select style={selectStyle} value={resellerFilter} onChange={(e) => setResellerFilter(e.target.value)}>
          <option value="">Todos los resellers</option>
          {resellers.map((r) => <option key={r.id} value={r.id}>{r.name} (@{r.username})</option>)}
        </select>
      </div>

      <div
        style={{
          background: "var(--panel)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Fecha", "Reseller", "Provider / Producto", "Estado", "Créditos", "License Key", ""].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "0.75rem 1rem",
                    textAlign: "left",
                    fontSize: "0.7rem",
                    color: "var(--text-muted)",
                    fontWeight: 500,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
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
                <td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                  Cargando...
                </td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                  No hay solicitudes
                </td>
              </tr>
            ) : (
              requests.map((r) => (
                <tr
                  key={r.id}
                  style={{ borderBottom: "1px solid var(--border)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "0.8rem 1rem", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                    {new Date(r.createdAt).toLocaleString("es")}
                  </td>
                  <td style={{ padding: "0.8rem 1rem" }}>
                    <p style={{ fontSize: "0.85rem", fontWeight: 600 }}>{r.reseller.name}</p>
                    <p style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>@{r.reseller.username}</p>
                  </td>
                  <td style={{ padding: "0.8rem 1rem" }}>
                    <p style={{ fontSize: "0.85rem" }}>{r.provider.name}</p>
                    <p style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>{r.product.name}</p>
                  </td>
                  <td style={{ padding: "0.8rem 1rem" }}>
                    <Badge variant={STATUS_BADGE[r.status]}>
                      {STATUS_LABELS[r.status]}
                    </Badge>
                  </td>
                  <td style={{ padding: "0.8rem 1rem", fontSize: "0.85rem", fontWeight: 600 }}>
                    {r.creditsUsed.toFixed(2)}
                  </td>
                  <td style={{ padding: "0.8rem 1rem" }}>
                    {r.licenseKey ? (
                      <code
                        style={{
                          fontSize: "0.75rem",
                          background: "rgba(193,18,31,0.08)",
                          border: "1px solid rgba(193,18,31,0.2)",
                          borderRadius: 4,
                          padding: "2px 7px",
                          color: "var(--primary-hover)",
                          fontFamily: "monospace",
                        }}
                      >
                        {r.licenseKey}
                      </code>
                    ) : (
                      <span style={{ color: "var(--text-muted)", fontSize: "0.78rem" }}>—</span>
                    )}
                  </td>
                  <td style={{ padding: "0.8rem 1rem" }}>
                    <Button size="sm" variant="ghost" onClick={() => router.push(`/dashboard/license-requests/${r.id}`)}>
                      Ver
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <LicenseRequestForm
          onClose={() => setShowForm(false)}
          onCreated={(id) => {
            router.push(`/dashboard/license-requests/${id}`);
            fetchRequests();
          }}
        />
      )}
    </div>
  );
}
