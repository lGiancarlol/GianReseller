"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import ResellerForm from "./ResellerForm";
import CreditModal from "./CreditModal";

interface Reseller {
  id: string;
  name: string;
  username: string;
  email: string | null;
  discordId: string | null;
  telegramId: string | null;
  status: "ACTIVE" | "INACTIVE";
  credits: number;
  createdAt: string;
  _count: { requests: number; movements: number };
}

const MOVEMENT_LABELS: Record<string, string> = {
  LOAD: "Carga",
  DEDUCTION: "Descuento",
  PURCHASE: "Compra",
  REFUND: "Reembolso",
};

export default function ResellersClient() {
  const [resellers, setResellers] = useState<Reseller[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Reseller | null>(null);
  const [creditsTarget, setCreditsTarget] = useState<Reseller | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchResellers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    const res = await fetch(`/api/resellers?${params}`);
    const data = await res.json();
    setResellers(data);
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => { fetchResellers(); }, [fetchResellers]);

  async function deleteReseller(r: Reseller) {
    if (!confirm(`¿Eliminar reseller "${r.name}"? Esta acción no se puede deshacer.`)) return;
    await fetch(`/api/resellers/${r.id}`, { method: "DELETE" });
    fetchResellers();
  }

  const totalCredits = resellers.reduce((s, r) => s + r.credits, 0);
  const activeCount = resellers.filter((r) => r.status === "ACTIVE").length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700 }}>Resellers</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: 2 }}>
            {resellers.length} resellers — {activeCount} activos — {totalCredits.toFixed(2)} créditos totales
          </p>
        </div>
        <Button onClick={() => setShowForm(true)}>+ Nuevo Reseller</Button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: "1.25rem" }}>
        <input
          placeholder="Buscar por nombre o usuario..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            flex: 1,
            background: "var(--panel)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: "0.5rem 0.75rem",
            color: "var(--text)",
            fontSize: "0.875rem",
            outline: "none",
          }}
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{
            background: "var(--panel)",
            border: "1px solid var(--border)",
            borderRadius: 6,
            padding: "0.5rem 0.75rem",
            color: "var(--text)",
            fontSize: "0.875rem",
            outline: "none",
            cursor: "pointer",
          }}
        >
          <option value="">Todos</option>
          <option value="ACTIVE">Activos</option>
          <option value="INACTIVE">Inactivos</option>
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
              {["Reseller", "Contacto", "Estado", "Créditos", "Solicitudes", "Creado", ""].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "0.75rem 1rem",
                    textAlign: "left",
                    fontSize: "0.72rem",
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
            ) : resellers.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                  No hay resellers
                </td>
              </tr>
            ) : (
              resellers.map((r) => (
                <tr
                  key={r.id}
                  style={{ borderBottom: "1px solid var(--border)", transition: "background 0.1s" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <td style={{ padding: "0.85rem 1rem" }}>
                    <Link
                      href={`/dashboard/resellers/${r.id}`}
                      style={{ fontWeight: 600, fontSize: "0.875rem", color: "var(--text)", textDecoration: "none" }}
                    >
                      {r.name}
                    </Link>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 1 }}>@{r.username}</p>
                  </td>
                  <td style={{ padding: "0.85rem 1rem" }}>
                    <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>{r.email ?? "—"}</p>
                    {r.telegramId && (
                      <p style={{ fontSize: "0.72rem", color: "var(--text-muted)" }}>TG: {r.telegramId}</p>
                    )}
                  </td>
                  <td style={{ padding: "0.85rem 1rem" }}>
                    <Badge variant={r.status === "ACTIVE" ? "active" : "inactive"}>
                      {r.status === "ACTIVE" ? "Activo" : "Inactivo"}
                    </Badge>
                  </td>
                  <td style={{ padding: "0.85rem 1rem", fontWeight: 700, fontSize: "0.95rem" }}>
                    {r.credits.toFixed(2)}
                  </td>
                  <td style={{ padding: "0.85rem 1rem", color: "var(--text-muted)", fontSize: "0.85rem" }}>
                    {r._count.requests}
                  </td>
                  <td style={{ padding: "0.85rem 1rem", color: "var(--text-muted)", fontSize: "0.78rem" }}>
                    {new Date(r.createdAt).toLocaleDateString("es")}
                  </td>
                  <td style={{ padding: "0.85rem 1rem" }}>
                    <div style={{ display: "flex", gap: 6 }}>
                      <Button size="sm" variant="ghost" onClick={() => setCreditsTarget(r)}>
                        Créditos
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => setEditing(r)}>
                        Editar
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => deleteReseller(r)}>
                        Eliminar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {(showForm || editing) && (
        <ResellerForm
          initial={editing ?? undefined}
          onClose={() => { setShowForm(false); setEditing(null); }}
          onSaved={fetchResellers}
        />
      )}

      {creditsTarget && (
        <CreditModal
          reseller={creditsTarget}
          onClose={() => setCreditsTarget(null)}
          onSaved={fetchResellers}
        />
      )}
    </div>
  );
}
