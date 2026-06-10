"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import StatCard from "@/components/ui/StatCard";
import ResellerForm from "./ResellerForm";
import CreditModal from "./CreditModal";

interface Movement {
  id: string;
  type: string;
  amount: number;
  balanceAfter: number;
  note: string | null;
  createdAt: string;
}

interface ResellerDetail {
  id: string;
  name: string;
  username: string;
  email: string | null;
  discordId: string | null;
  telegramId: string | null;
  status: "ACTIVE" | "INACTIVE";
  credits: number;
  createdAt: string;
  movements: Movement[];
  _count: { requests: number };
}

const MOVEMENT_LABELS: Record<string, string> = {
  LOAD: "Carga",
  DEDUCTION: "Descuento",
  PURCHASE: "Compra",
  REFUND: "Reembolso",
};

const MOVEMENT_COLORS: Record<string, string> = {
  LOAD: "#22c55e",
  REFUND: "#22c55e",
  DEDUCTION: "var(--primary-hover)",
  PURCHASE: "var(--primary-hover)",
};

export default function ResellerDetailClient({ reseller: initial }: { reseller: ResellerDetail }) {
  const router = useRouter();
  const [reseller, setReseller] = useState(initial);
  const [showEdit, setShowEdit] = useState(false);
  const [showCredits, setShowCredits] = useState(false);

  async function refresh() {
    const res = await fetch(`/api/resellers/${reseller.id}`);
    const data = await res.json();
    setReseller(data);
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h1 style={{ fontSize: "1.25rem", fontWeight: 700 }}>{reseller.name}</h1>
            <Badge variant={reseller.status === "ACTIVE" ? "active" : "inactive"}>
              {reseller.status === "ACTIVE" ? "Activo" : "Inactivo"}
            </Badge>
          </div>
          <p style={{ color: "var(--text-muted)", fontSize: "0.8rem", marginTop: 4 }}>
            @{reseller.username}
            {reseller.email && ` · ${reseller.email}`}
            {reseller.telegramId && ` · TG: ${reseller.telegramId}`}
            {reseller.discordId && ` · DC: ${reseller.discordId}`}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="ghost" size="sm" onClick={() => router.back()}>Volver</Button>
          <Button variant="secondary" size="sm" onClick={() => setShowEdit(true)}>Editar</Button>
          <Button size="sm" onClick={() => setShowCredits(true)}>Gestionar créditos</Button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: "1.5rem" }}>
        <StatCard label="Créditos disponibles" value={reseller.credits.toFixed(2)} />
        <StatCard label="Solicitudes generadas" value={reseller._count.requests} />
        <StatCard label="Movimientos" value={reseller.movements.length} />
      </div>

      <div
        style={{
          background: "var(--panel)",
          border: "1px solid var(--border)",
          borderRadius: 8,
          overflow: "hidden",
        }}
      >
        <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid var(--border)" }}>
          <h2 style={{ fontSize: "0.9rem", fontWeight: 600 }}>Historial de movimientos</h2>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              {["Tipo", "Monto", "Saldo resultante", "Nota", "Fecha"].map((h) => (
                <th
                  key={h}
                  style={{
                    padding: "0.65rem 1rem",
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
            {reseller.movements.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                  Sin movimientos registrados
                </td>
              </tr>
            ) : (
              reseller.movements.map((m) => {
                const isDebit = m.type === "DEDUCTION" || m.type === "PURCHASE";
                return (
                  <tr key={m.id} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <span
                        style={{
                          fontSize: "0.78rem",
                          fontWeight: 500,
                          color: MOVEMENT_COLORS[m.type] ?? "var(--text)",
                        }}
                      >
                        {MOVEMENT_LABELS[m.type] ?? m.type}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: "0.75rem 1rem",
                        fontWeight: 700,
                        color: MOVEMENT_COLORS[m.type] ?? "var(--text)",
                      }}
                    >
                      {isDebit ? "-" : "+"}{m.amount.toFixed(2)}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.85rem" }}>
                      {m.balanceAfter.toFixed(2)}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                      {m.note ?? "—"}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", fontSize: "0.78rem", color: "var(--text-muted)" }}>
                      {new Date(m.createdAt).toLocaleString("es")}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showEdit && (
        <ResellerForm
          initial={reseller}
          onClose={() => setShowEdit(false)}
          onSaved={refresh}
        />
      )}

      {showCredits && (
        <CreditModal
          reseller={reseller}
          onClose={() => setShowCredits(false)}
          onSaved={refresh}
        />
      )}
    </div>
  );
}
